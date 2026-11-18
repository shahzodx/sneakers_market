import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assertOrigin, rateLimit } from '@/server/security';
import { failure } from '@/server/response';
export async function POST(request: Request) {
  try {
    await assertOrigin(request);
    await rateLimit('coupon', 30);
    const { code, items } = z
      .object({
        code: z.string().min(1).max(40),
        items: z
          .array(z.object({ variantId: z.string(), quantity: z.number().int().min(1).max(10) }))
          .min(1)
          .max(50),
      })
      .parse(await request.json());
    const variants = await db.productVariant.findMany({
      where: { id: { in: items.map((i) => i.variantId) } },
      include: { product: true },
    });
    const subtotal = items.reduce(
      (a, i) => a + (variants.find((v) => v.id === i.variantId)?.product.price || 0) * i.quantity,
      0,
    );
    const c = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!c || !c.active || (c.expiresAt && c.expiresAt < new Date()) || subtotal < c.minSubtotal)
      throw new Error('Промокод недействителен или сумма заказа слишком мала');
    return NextResponse.json({ percent: c.percent });
  } catch (e) {
    return failure(e);
  }
}
