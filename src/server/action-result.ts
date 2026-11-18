import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { PublicError } from '@/lib/errors';
import { requireAdmin, currentUser } from '@/lib/auth';
import { rateLimit } from './security';
export type ActionResult = { ok: true } | { ok: false; error: string };
async function safely(operation: () => Promise<void>): Promise<ActionResult> {
  try {
    await operation();
    return { ok: true };
  } catch (error) {
    if (error instanceof PublicError) return { ok: false, error: error.message };
    if (error instanceof ZodError)
      return {
        ok: false,
        error: 'Проверьте поля: ' + (error.issues[0]?.message || 'некорректные данные'),
      };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      return { ok: false, error: 'Такая запись или SKU уже существует' };
    console.error(
      JSON.stringify({
        event: 'action_failed',
        type: error instanceof Error ? error.name : 'UnknownError',
      }),
    );
    return { ok: false, error: 'Не удалось сохранить. Повторите позже.' };
  }
}
type Admin = Awaited<ReturnType<typeof requireAdmin>>;
export function adminAction(operation: (admin: Admin) => Promise<void>) {
  return safely(async () => {
    const admin = await requireAdmin();
    await rateLimit('admin-write:' + admin.id, 90);
    await operation(admin);
  });
}
export function accountAction(
  operation: (user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) => Promise<void>,
) {
  return safely(async () => {
    const user = await currentUser();
    if (!user) throw new PublicError('Войдите в аккаунт', 401);
    await rateLimit('account-write:' + user.id, 40);
    await operation(user);
  });
}
