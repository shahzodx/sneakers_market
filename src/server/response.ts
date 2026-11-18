import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
export function failure(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message || 'Проверьте поля' },
      { status: 400 },
    );
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    console.error('Database request failed', error.name);
    return NextResponse.json(
      { error: 'Не удалось выполнить запрос. Повторите позже.' },
      { status: 500 },
    );
  }
  const message = error instanceof Error ? error.message : 'Не удалось выполнить запрос';
  const status =
    message === 'Доступ запрещён'
      ? 403
      : message === 'Войдите в аккаунт'
        ? 401
        : message.startsWith('Слишком много')
          ? 429
          : 400;
  return NextResponse.json(
    { error: message },
    { status, headers: status === 429 ? { 'Retry-After': '60' } : undefined },
  );
}
