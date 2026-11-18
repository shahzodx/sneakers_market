import { z } from 'zod';
export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(10).max(128),
});
export const registerSchema = loginSchema.extend({ name: z.string().trim().min(2).max(80) });
export const checkoutSchema = z.object({
  firstName: z.string().trim().min(2, 'Минимум 2 символа').max(60),
  lastName: z.string().trim().min(2, 'Минимум 2 символа').max(60),
  phone: z
    .string()
    .regex(/^\+998[\s\d()-]{9,16}$/, 'Введите телефон +998 XX XXX XX XX')
    .refine((v) => v.replace(/\D/g, '').length === 12, 'Введите 12 цифр с кодом 998'),
  region: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(8, 'Укажите улицу, дом и квартиру').max(250),
  comment: z.string().max(1000).optional(),
  payment: z.enum(['cash', 'click', 'payme']),
  coupon: z.string().max(40).optional(),
  idempotencyKey: z.uuid(),
  items: z
    .array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(10) }))
    .min(1)
    .max(50),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export function calculateTotals(subtotal: number, percent = 0) {
  const discount = Math.floor((subtotal * percent) / 100);
  const delivery = subtotal - discount >= 1500000 ? 0 : 30000;
  return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}
