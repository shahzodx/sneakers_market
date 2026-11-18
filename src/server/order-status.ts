import { PublicError } from '@/lib/errors';
import { Prisma, type OrderStatus } from '@prisma/client';
import { db } from '@/lib/db';
export const transitions: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};
// Only call after the action/route has verified the actor's current ADMIN role.
export async function changeOrderStatus(id: string, status: OrderStatus, actorId: string) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const order = await tx.order.findUniqueOrThrow({
            where: { id },
            include: { items: true, payment: true },
          });
          if (order.status === status) return;
          if (!transitions[order.status].includes(status))
            throw new PublicError('Недопустимый переход статуса');
          if (status === 'CANCELLED')
            for (const item of order.items)
              await tx.inventory.update({
                where: { variantId: item.variantId },
                data: { quantity: { increment: item.quantity } },
              });
          if (status === 'DELIVERED' && order.payment?.provider === 'cash')
            await tx.payment.update({ where: { orderId: id }, data: { status: 'PAID' } });
          await tx.order.update({
            where: { id },
            data: { status, history: { create: { status, actor: actorId } } },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034' && attempt < 3)
        continue;
      throw e;
    }
  }
}
