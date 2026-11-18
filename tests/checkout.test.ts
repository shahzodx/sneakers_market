import { describe, it, expect } from 'vitest';
import { calculateTotals, checkoutSchema } from '../src/lib/validation';
describe('money and delivery', () => {
  it('uses integer UZS and free shipping after discount threshold', () => {
    expect(calculateTotals(1500000)).toEqual({
      subtotal: 1500000,
      discount: 0,
      delivery: 0,
      total: 1500000,
    });
    expect(calculateTotals(1500000, 10)).toEqual({
      subtotal: 1500000,
      discount: 150000,
      delivery: 30000,
      total: 1380000,
    });
  });
  it('rounds discount down without floating point money', () =>
    expect(calculateTotals(1000001, 10).discount).toBe(100000));
});
describe('checkout validation', () => {
  const input = {
    firstName: 'Test',
    lastName: 'Buyer',
    phone: '+998 90 123 45 67',
    region: 'Ташкент',
    city: 'Ташкент',
    address: 'Test street 1',
    payment: 'cash',
    idempotencyKey: crypto.randomUUID(),
    expectedTotal: 1890000,
    items: [{ variantId: 'v1', quantity: 1 }],
  };
  it('accepts guest checkout', () => expect(checkoutSchema.safeParse(input).success).toBe(true));
  it('rejects malformed phone, empty cart and quantity tampering', () => {
    expect(checkoutSchema.safeParse({ ...input, phone: '+998 90' }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...input, items: [] }).success).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...input, items: [{ variantId: 'v1', quantity: -1 }] }).success,
    ).toBe(false);
  });
});

describe('password length and JSON-LD', () => {
  it('rejects passwords beyond bcrypt 72-byte boundary', async () => {
    const { loginSchema } = await import('../src/lib/validation');
    expect(
      loginSchema.safeParse({ email: 'a@example.test', password: 'я'.repeat(40) }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: 'a@example.test', password: 'StrongPassword123!' }).success,
    ).toBe(true);
  });
  it('escapes script terminators without corrupting JSON-LD', async () => {
    const { serializeJsonLd } = await import('../src/lib/utils');
    const value = { name: '</script><script>alert(1)</script>' };
    const json = serializeJsonLd(value);
    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toEqual(value);
  });
});
