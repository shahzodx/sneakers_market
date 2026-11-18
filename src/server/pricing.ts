import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { calculateTotals } from '@/lib/validation';
export async function priceCart(
  items: { variantId: string; quantity: number }[],
  code?: string,
  client: Prisma.TransactionClient = db,
) {
  const quantities = new Map<string, number>();
  for (const i of items)
    quantities.set(i.variantId, (quantities.get(i.variantId) || 0) + i.quantity);
  if ([...quantities.values()].some((q) => q > 10))
    throw new Error('Не более 10 пар одного размера');
  const variants = await client.productVariant.findMany({
    where: { id: { in: [...quantities.keys()] } },
    include: {
      inventory: true,
      product: { include: { brand: true, images: { orderBy: { position: 'asc' }, take: 1 } } },
    },
  });
  if (variants.length !== quantities.size) throw new Error('Некоторые товары больше недоступны');
  let subtotal = 0;
  for (const v of variants) {
    const quantity = quantities.get(v.id)!;
    if (v.product.archived || !v.inventory || v.inventory.quantity < quantity)
      throw new Error(`Нет нужного количества: ${v.product.name}, EU ${v.size}`);
    subtotal += v.product.price * quantity;
  }
  const coupon = code
    ? await client.coupon.findUnique({ where: { code: code.toUpperCase() } })
    : null;
  if (
    code &&
    (!coupon ||
      !coupon.active ||
      (coupon.expiresAt && coupon.expiresAt < new Date()) ||
      subtotal < coupon.minSubtotal)
  )
    throw new Error('Промокод недействителен или не достигнута минимальная сумма');
  const totals = calculateTotals(subtotal, coupon?.percent || 0);
  if (!Number.isSafeInteger(totals.total) || totals.total > 2000000000)
    throw new Error('Превышена сумма заказа');
  return { quantities, variants, coupon, totals };
}
