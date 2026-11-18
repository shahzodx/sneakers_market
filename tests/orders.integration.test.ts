import { loadTestEnvironment } from '../scripts/test-environment';
loadTestEnvironment();
import { describe, it, expect, afterAll } from 'vitest';
import { db } from '../src/lib/db';
import { changeOrderStatus } from '../src/server/order-status';
import { createOrder } from '../src/server/orders';
import { calculateTotals } from '../src/lib/validation';
import type { CheckoutInput } from '../src/lib/validation';
const ids: string[] = [];
const prices = new Map<string, number>();
async function fixture(quantity = 2) {
  const base = await db.product.findFirstOrThrow();
  const variant = await db.productVariant.create({
    data: {
      productId: base.id,
      sku: 'TEST-' + crypto.randomUUID(),
      size: 46,
      color: 'test-' + crypto.randomUUID(),
      inventory: { create: { quantity } },
    },
  });
  ids.push(variant.id);
  prices.set(variant.id, base.price);
  return variant;
}
function input(variantId: string): CheckoutInput {
  return {
    firstName: 'Test',
    lastName: 'Integration',
    phone: '+998901234567',
    region: 'Test',
    city: 'Test',
    address: 'Test address 123',
    payment: 'cash',
    idempotencyKey: crypto.randomUUID(),
    expectedTotal: calculateTotals(prices.get(variantId)!).total,
    items: [{ variantId, quantity: 1 }],
  };
}
afterAll(async () => {
  const orders = await db.order.findMany({
    where: { items: { some: { variantId: { in: ids } } } },
    select: { id: true },
  });
  for (const { id } of orders) {
    await db.payment.deleteMany({ where: { orderId: id } });
    await db.order.delete({ where: { id } });
  }
  await db.productVariant.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});
describe('PostgreSQL checkout transactions', () => {
  it('is idempotent and decrements once', async () => {
    const v = await fixture(),
      data = input(v.id);
    const a = await createOrder(data);
    const b = await createOrder(data);
    expect(a.id).toBe(b.id);
    expect((await db.inventory.findUniqueOrThrow({ where: { variantId: v.id } })).quantity).toBe(1);
  });
  it('rejects reuse of a key for a different order', async () => {
    const v = await fixture();
    const data = input(v.id);
    await createOrder(data);
    await expect(createOrder({ ...data, address: 'Different address 10' })).rejects.toMatchObject({
      status: 409,
    });
    expect((await db.inventory.findUniqueOrThrow({ where: { variantId: v.id } })).quantity).toBe(1);
  });
  it('rejects an unconfirmed price without decrementing inventory', async () => {
    const v = await fixture();
    await expect(createOrder({ ...input(v.id), expectedTotal: 1 })).rejects.toMatchObject({
      status: 409,
    });
    expect((await db.inventory.findUniqueOrThrow({ where: { variantId: v.id } })).quantity).toBe(2);
  });
  it('rejects more than ten pairs across duplicate lines', async () => {
    const v = await fixture(20);
    const data = input(v.id);
    data.items = [
      { variantId: v.id, quantity: 6 },
      { variantId: v.id, quantity: 5 },
    ];
    await expect(createOrder(data)).rejects.toThrow('Не более 10');
    expect((await db.inventory.findUniqueOrThrow({ where: { variantId: v.id } })).quantity).toBe(
      20,
    );
  });
  it('prevents overselling the last pair under concurrency', async () => {
    const v = await fixture(1);
    const results = await Promise.allSettled([createOrder(input(v.id)), createOrder(input(v.id))]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await db.inventory.findUniqueOrThrow({ where: { variantId: v.id } })).quantity).toBe(0);
  });
  it('returns stock exactly once on cancellation and records history', async () => {
    const v = await fixture(2);
    const o = await createOrder(input(v.id));
    await changeOrderStatus(o.id, 'CANCELLED', 'test-admin');
    await changeOrderStatus(o.id, 'CANCELLED', 'test-admin');
    expect((await db.inventory.findUniqueOrThrow({ where: { variantId: v.id } })).quantity).toBe(2);
    expect(await db.orderHistory.count({ where: { orderId: o.id, status: 'CANCELLED' } })).toBe(1);
    await expect(changeOrderStatus(o.id, 'SHIPPED', 'test-admin')).rejects.toThrow('Недопустимый');
  });
  it('marks cash payment paid only after delivery', async () => {
    const v = await fixture();
    const o = await createOrder(input(v.id));
    await changeOrderStatus(o.id, 'CONFIRMED', 'test-admin');
    await changeOrderStatus(o.id, 'SHIPPED', 'test-admin');
    expect((await db.payment.findUniqueOrThrow({ where: { orderId: o.id } })).status).toBe(
      'PENDING',
    );
    await changeOrderStatus(o.id, 'DELIVERED', 'test-admin');
    expect((await db.payment.findUniqueOrThrow({ where: { orderId: o.id } })).status).toBe('PAID');
  });
  it('does not sell demo catalog items in live mode', async () => {
    const v = await fixture();
    const previous = process.env.APP_MODE;
    process.env.APP_MODE = 'live';
    try {
      await expect(createOrder(input(v.id))).rejects.toThrow('Демонстрационный товар');
      expect((await db.inventory.findUniqueOrThrow({ where: { variantId: v.id } })).quantity).toBe(
        2,
      );
    } finally {
      process.env.APP_MODE = previous;
    }
  });
  it('rejects online payments without credentials and leaves stock intact', async () => {
    const v = await fixture();
    await expect(createOrder({ ...input(v.id), payment: 'payme' })).rejects.toThrow(
      'не подключена',
    );
    expect((await db.inventory.findUniqueOrThrow({ where: { variantId: v.id } })).quantity).toBe(2);
  });
  it('rolls back an unavailable cart', async () => {
    const a = await fixture(2),
      b = await fixture(0);
    const data = input(a.id);
    data.items.push({ variantId: b.id, quantity: 1 });
    await expect(createOrder(data)).rejects.toThrow('Нет нужного');
    expect((await db.inventory.findUniqueOrThrow({ where: { variantId: a.id } })).quantity).toBe(2);
  });
});
