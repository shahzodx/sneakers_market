import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit } from '@/server/security';
import { failure } from '@/server/response';

const filters = z.object({
  query: z.string().trim().min(1).max(100),
  size: z.coerce.number().int().min(15).max(60).optional(),
  color: z.string().trim().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  try {
    const { query, size, color } = filters.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    await rateLimit('operator-catalog', 60);
    const terms = query.split(/\s+/).slice(0, 10);
    const variantFilter: Prisma.ProductVariantWhereInput = {
      size,
      color: color ? { equals: color, mode: 'insensitive' } : undefined,
    };
    const products = await db.product.findMany({
      where: {
        archived: false,
        OR: [
          { variants: { some: { ...variantFilter, sku: { equals: query, mode: 'insensitive' } } } },
          {
            AND: terms.map((term) => ({
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { brand: { name: { contains: term, mode: 'insensitive' } } },
              ],
            })),
          },
        ],
      },
      orderBy: [{ demo: 'asc' }, { popularity: 'desc' }, { slug: 'asc' }],
      take: 4,
      select: {
        name: true,
        description: true,
        price: true,
        demo: true,
        brand: { select: { name: true } },
        variants: {
          where: variantFilter,
          orderBy: [{ size: 'asc' }, { color: 'asc' }],
          select: { sku: true, size: true, color: true, inventory: { select: { quantity: true } } },
        },
      },
    });

    return Response.json(
      {
        products: products.map((product) => {
          const exactSku = product.variants.find(
            (variant) => variant.sku.toLowerCase() === query.toLowerCase(),
          );
          const variants = exactSku ? [exactSku] : product.variants.slice(0, 16);
          return {
            name: `${product.brand.name} ${product.name}`.slice(0, 200),
            description: product.description.slice(0, 800),
            price: product.price,
            currency: 'UZS',
            demo: product.demo,
            variants: variants.map((variant) => ({
              sku: variant.sku.slice(0, 100),
              size: variant.size,
              color: variant.color.slice(0, 100),
              stock: variant.inventory?.quantity ?? null,
            })),
          };
        }),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return failure(error);
  }
}
