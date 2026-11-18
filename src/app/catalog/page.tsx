import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { productInclude } from '@/types/product';
import { Catalog } from '@/features/catalog';
export const metadata: Metadata = { title: 'Каталог кроссовок' };
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const get = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const num = (k: string) =>
    get(k) && Number.isFinite(Number(get(k))) ? Math.max(0, Math.floor(Number(get(k)))) : undefined;
  const variant: Prisma.ProductVariantWhereInput = {
    ...(num('size') ? { size: num('size') } : {}),
    ...(get('color') ? { color: get('color') } : {}),
    ...(get('stock') === 'true' ? { inventory: { quantity: { gt: 0 } } } : {}),
  };
  const where: Prisma.ProductWhereInput = {
    archived: false,
    ...(get('q')
      ? {
          OR: [
            { name: { contains: get('q'), mode: 'insensitive' } },
            { brand: { name: { contains: get('q'), mode: 'insensitive' } } },
          ],
        }
      : {}),
    ...(get('brand') ? { brand: { name: get('brand') } } : {}),
    ...(get('gender') ? { gender: { in: [get('gender'), 'unisex'] } } : {}),
    ...(get('new') === 'true' ? { isNew: true } : {}),
    price: { gte: num('min'), lte: num('max') },
    ...(Object.keys(variant).length ? { variants: { some: variant } } : {}),
  };
  const sort = get('sort');
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === 'price-asc'
      ? { price: 'asc' }
      : sort === 'price-desc'
        ? { price: 'desc' }
        : sort === 'newest'
          ? { createdAt: 'desc' }
          : { popularity: 'desc' };
  const take = Math.min(120, 12 * Math.max(1, num('page') || 1));
  const [products, total, brands, colors] = await Promise.all([
    db.product.findMany({ where, orderBy, take, include: productInclude }),
    db.product.count({ where }),
    db.brand.findMany({ orderBy: { name: 'asc' } }),
    db.productVariant.findMany({ select: { color: true }, distinct: ['color'] }),
  ]);
  return (
    <Catalog
      products={products}
      total={total}
      brands={brands.map((b) => b.name)}
      colors={colors.map((c) => c.color)}
    />
  );
}
