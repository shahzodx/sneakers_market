import { readJson } from '@/server/request';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { priceCart } from '@/server/pricing';
import { assertOrigin, rateLimit } from '@/server/security';
import { failure } from '@/server/response';
export async function POST(request: Request) {
  try {
    await assertOrigin(request);
    await rateLimit('cart-quote', 90);
    const data = z
      .object({
        items: z
          .array(
            z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(10) }),
          )
          .min(1)
          .max(50),
        coupon: z.string().max(40).optional(),
      })
      .parse(await readJson(request));
    const quote = await priceCart(data.items, data.coupon);
    return NextResponse.json({
      totals: quote.totals,
      items: quote.variants.map((v) => ({
        variantId: v.id,
        price: v.product.price,
        stock: v.inventory?.quantity || 0,
      })),
    });
  } catch (e) {
    return failure(e);
  }
}
