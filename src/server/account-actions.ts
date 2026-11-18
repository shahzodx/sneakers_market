'use server';
import { accountAction } from './action-result';
import { PublicError } from '@/lib/errors';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
export async function updateProfile(form: FormData) {
  return accountAction(async (u) => {
    const data = z
      .object({ name: z.string().trim().min(2).max(80), phone: z.string().max(30) })
      .parse(Object.fromEntries(form));
    await db.user.update({ where: { id: u.id }, data });
    revalidatePath('/account');
  });
}
export async function saveAddress(form: FormData) {
  return accountAction(async (u) => {
    const data = z
      .object({
        label: z.string().min(1).max(40),
        region: z.string().min(2).max(80),
        city: z.string().min(2).max(80),
        street: z.string().min(8).max(250),
      })
      .parse(Object.fromEntries(form));
    if ((await db.address.count({ where: { userId: u.id } })) >= 20)
      throw new PublicError('Можно сохранить не более 20 адресов');
    await db.address.create({ data: { ...data, userId: u.id } });
    revalidatePath('/account');
  });
}
export async function deleteAddress(form: FormData) {
  return accountAction(async (u) => {
    await db.address.deleteMany({ where: { id: String(form.get('id')), userId: u.id } });
    revalidatePath('/account');
  });
}
