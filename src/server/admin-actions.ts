'use server';
import { adminAction } from './action-result';
import { PublicError } from '@/lib/errors';

import { revalidatePath } from 'next/cache';
import { changeOrderStatus } from './order-status';
import { z } from 'zod';
import { db } from '@/lib/db';
import { imageUrlSchema } from '@/lib/images';
const integer = (min = 0) => z.coerce.number().int().min(min).max(100000000);
export async function saveProduct(form: FormData) {
  return adminAction(async () => {
    const data = z
      .object({
        name: z.string().min(2).max(120),
        slug: z
          .string()
          .regex(/^[a-z0-9-]+$/)
          .max(140),
        description: z.string().min(10).max(5000),
        material: z.string().min(2).max(500),
        price: integer(1),
        brandId: z.string(),
        categoryId: z.string(),
        gender: z.enum(['men', 'women', 'unisex']),
      })
      .parse(Object.fromEntries(form));
    const oldPrice = form.get('oldPrice') ? integer(1).parse(form.get('oldPrice')) : null;
    const id = String(form.get('id') || '');
    const payload = {
      ...data,
      oldPrice,
      featured: form.get('featured') === 'on',
      isNew: form.get('isNew') === 'on',
      demo: form.get('demo') === 'on',
    };
    if (id) await db.product.update({ where: { id }, data: payload });
    else {
      const image = imageUrlSchema.parse(form.get('image'));
      await db.product.create({
        data: {
          ...payload,

          images: { create: { url: image, alt: data.name } },
          variants: {
            create: [38, 39, 40, 41, 42, 43, 44].map((size) => ({
              size,
              color: 'white',
              sku: `KX-${crypto.randomUUID()}-${size}`,
              inventory: { create: { quantity: 0 } },
            })),
          },
        },
      });
    }
    revalidatePath('/admin');
    revalidatePath('/catalog');
    revalidatePath('/');
  });
}
export async function archiveProduct(form: FormData) {
  return adminAction(async () => {
    await db.product.update({
      where: { id: String(form.get('id')) },
      data: { archived: form.get('archived') !== 'true' },
    });
    revalidatePath('/admin');
    revalidatePath('/catalog');
    revalidatePath('/');
  });
}
export async function saveVariant(form: FormData) {
  return adminAction(async () => {
    const data = z
      .object({
        id: z.string(),
        sku: z.string().min(2).max(100),
        size: integer(20).refine((x) => x <= 55),
        color: z.string().min(1).max(30),
        colorHex: z.string().regex(/^#[a-fA-F0-9]{6}$/),
        quantity: integer(),
        expectedQuantity: integer(),
      })
      .parse(Object.fromEntries(form));
    await db.$transaction(async (tx) => {
      await tx.productVariant.update({
        where: { id: data.id },
        data: { sku: data.sku, size: data.size, color: data.color, colorHex: data.colorHex },
      });
      const changed = await tx.inventory.updateMany({
        where: { variantId: data.id, quantity: data.expectedQuantity },
        data: { quantity: data.quantity },
      });
      if (changed.count !== 1)
        throw new PublicError(
          'Остаток изменился после открытия формы. Обновите страницу и повторите.',
        );
    });
    revalidatePath('/admin');
    revalidatePath('/catalog');
  });
}
export async function addVariant(form: FormData) {
  return adminAction(async () => {
    const data = z
      .object({
        productId: z.string(),
        sku: z.string().min(2).max(100),
        size: integer(20).refine((x) => x <= 55),
        color: z.string().min(1).max(30),
        colorHex: z.string().regex(/^#[a-fA-F0-9]{6}$/),
        quantity: integer(),
      })
      .parse(Object.fromEntries(form));
    const { quantity, ...variant } = data;
    await db.productVariant.create({ data: { ...variant, inventory: { create: { quantity } } } });
    revalidatePath('/admin');
  });
}
export async function updateOrder(form: FormData) {
  return adminAction(async (admin) => {
    const id = z.string().parse(form.get('id'));
    const status = z
      .enum(['NEW', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
      .parse(form.get('status'));
    await changeOrderStatus(id, status, admin.id);
    revalidatePath('/admin');
    revalidatePath('/order/' + id);
    revalidatePath('/account');
  });
}
export async function saveCoupon(form: FormData) {
  return adminAction(async () => {
    const { code, percent, minSubtotal } = z
      .object({
        code: z.string().regex(/^[A-Z0-9_-]{2,40}$/),
        percent: z.coerce.number().int().min(1).max(80),
        minSubtotal: integer(),
      })
      .parse(Object.fromEntries(form));
    await db.coupon.upsert({
      where: { code },
      update: { percent, minSubtotal, active: form.get('active') === 'on' },
      create: { code, percent, minSubtotal, active: form.get('active') === 'on' },
    });
    revalidatePath('/admin');
  });
}
export async function saveSetting(form: FormData) {
  return adminAction(async () => {
    const key = z
      .enum(['heroTitle', 'heroImage', 'lifestyleImage', 'contactEmail', 'contactPhone'])
      .parse(form.get('key'));
    const value = z.string().min(1).max(300).parse(form.get('value'));
    if (key === 'heroImage' || key === 'lifestyleImage') imageUrlSchema.parse(value);
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/info');
  });
}
export async function saveTaxonomy(form: FormData) {
  return adminAction(async () => {
    const data = z
      .object({
        name: z.string().min(2).max(80),
        slug: z
          .string()
          .regex(/^[a-z0-9-]+$/)
          .max(80),
      })
      .parse(Object.fromEntries(form));
    if (form.get('kind') === 'brand')
      await db.brand.upsert({
        where: { slug: data.slug },
        update: { name: data.name },
        create: data,
      });
    else
      await db.category.upsert({
        where: { slug: data.slug },
        update: { name: data.name },
        create: data,
      });
    revalidatePath('/admin');
  });
}
export async function addImage(form: FormData) {
  return adminAction(async () => {
    const data = z
      .object({
        productId: z.string(),
        url: imageUrlSchema,
        alt: z.string().min(2).max(200),
        position: integer(),
      })
      .parse(Object.fromEntries(form));
    await db.productImage.create({ data });
    revalidatePath('/admin');
  });
}
export async function saveTranslation(form: FormData) {
  return adminAction(async () => {
    const data = z
      .object({
        productId: z.string(),
        locale: z.enum(['en', 'uz']),
        name: z.string().min(2).max(120),
        description: z.string().min(10).max(5000),
        material: z.string().min(2).max(500),
      })
      .parse(Object.fromEntries(form));
    await db.productTranslation.upsert({
      where: { productId_locale: { productId: data.productId, locale: data.locale } },
      update: data,
      create: data,
    });
    revalidatePath('/admin');
    revalidatePath('/catalog');
    revalidatePath('/');
  });
}
export async function deleteImage(form: FormData) {
  return adminAction(async () => {
    await db.$transaction(
      async (tx) => {
        const image = await tx.productImage.findUniqueOrThrow({
          where: { id: String(form.get('id')) },
        });
        const count = await tx.productImage.count({ where: { productId: image.productId } });
        if (count <= 1) throw new PublicError('У товара должно остаться хотя бы одно изображение');
        await tx.productImage.delete({ where: { id: image.id } });
      },
      { isolationLevel: 'Serializable' },
    );
    revalidatePath('/admin');
  });
}
