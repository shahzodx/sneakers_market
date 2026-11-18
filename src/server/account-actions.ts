'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
export async function updateProfile(form: FormData) {
  const u = await currentUser();
  if (!u) throw new Error('Войдите в аккаунт');
  const data = z
    .object({ name: z.string().trim().min(2).max(80), phone: z.string().max(30) })
    .parse(Object.fromEntries(form));
  await db.user.update({ where: { id: u.id }, data });
  revalidatePath('/account');
}
export async function saveAddress(form: FormData) {
  const u = await currentUser();
  if (!u) throw new Error('Войдите в аккаунт');
  const data = z
    .object({
      label: z.string().min(1).max(40),
      region: z.string().min(2).max(80),
      city: z.string().min(2).max(80),
      street: z.string().min(8).max(250),
    })
    .parse(Object.fromEntries(form));
  await db.address.create({ data: { ...data, userId: u.id } });
  revalidatePath('/account');
}
export async function deleteAddress(form: FormData) {
  const u = await currentUser();
  if (!u) throw new Error('Войдите в аккаунт');
  await db.address.deleteMany({ where: { id: String(form.get('id')), userId: u.id } });
  revalidatePath('/account');
}
