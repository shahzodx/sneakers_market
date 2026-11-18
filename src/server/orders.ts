import { PublicError } from '@/lib/errors';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { type CheckoutInput } from '@/lib/validation';
import { priceCart } from './pricing';
export async function createOrder(input: CheckoutInput, userId?: string) {
  if (input.payment !== 'cash')
    throw new PublicError('Онлайн-оплата пока не подключена. Выберите оплату при получении.');
  const requestHash = createHash('sha256')
    .update(
      JSON.stringify({
        ...input,
        idempotencyKey: undefined,
        items: [...input.items].sort((a, b) => a.variantId.localeCompare(b.variantId)),
        userId: userId || null,
      }),
    )
    .digest('hex');
  // Serializability and conditional decrements prevent overselling and duplicate submissions.
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const existing = await tx.order.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
          });
          if (existing) {
            if (existing.userId && existing.userId !== userId)
              throw new PublicError('Недопустимый ключ заказа');
            if (existing.requestHash !== requestHash)
              throw new PublicError(
                'Состав заказа изменился. Проверьте сумму и повторите оформление.',
                409,
              );
            return { id: existing.id, accessToken: existing.accessToken, number: existing.number };
          }
          const { quantities, variants, coupon, totals } = await priceCart(
            input.items,
            input.coupon,
            tx,
          );
          if (input.expectedTotal !== totals.total)
            throw new PublicError(
              'Цена заказа изменилась. Проверьте обновлённую сумму и подтвердите ещё раз.',
              409,
            );
          for (const v of variants) {
            const result = await tx.inventory.updateMany({
              where: { variantId: v.id, quantity: { gte: quantities.get(v.id)! } },
              data: { quantity: { decrement: quantities.get(v.id)! } },
            });
            if (result.count !== 1) throw new PublicError('Остатки изменились. Обновите корзину.');
          }
          const order = await tx.order.create({
            data: {
              number: 'KX-' + randomBytes(5).toString('hex').toUpperCase(),
              idempotencyKey: input.idempotencyKey,
              requestHash,
              demo: process.env.APP_MODE !== 'live' || variants.some((v) => v.product.demo),
              accessToken: randomBytes(32).toString('hex'),
              userId,
              firstName: input.firstName,
              lastName: input.lastName,
              phone: input.phone,
              region: input.region,
              city: input.city,
              address: input.address,
              comment: input.comment,
              couponCode: coupon?.code,
              ...totals,
              items: {
                create: variants.map((v) => ({
                  variantId: v.id,
                  name: v.product.brand.name + ' ' + v.product.name,
                  sku: v.sku,
                  image: v.product.images[0]?.url || '/images/sneaker-white.jpg',
                  size: v.size,
                  color: v.color,
                  price: v.product.price,
                  quantity: quantities.get(v.id)!,
                })),
              },
              payment: { create: { provider: 'cash', amount: totals.total } },
              history: { create: { status: 'NEW', actor: userId || 'guest' } },
            },
            select: { id: true, accessToken: true, number: true },
          });
          return order;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2034', 'P2002'].includes(e.code) &&
        attempt < 3
      )
        continue;
      throw e;
    }
  }
  throw new PublicError('Повторите оформление');
}
