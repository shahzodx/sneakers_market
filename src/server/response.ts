import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { PublicError } from '@/lib/errors';
export function failure(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message || 'Проверьте поля' },
      { status: 400 },
    );
  if (error instanceof PublicError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status, headers: error.status === 429 ? { 'Retry-After': '60' } : undefined },
    );
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
    return NextResponse.json({ error: 'Такая запись уже существует' }, { status: 409 });
  // Never serialize raw database, storage-provider, parser or internal error messages.
  console.error(
    JSON.stringify({
      event: 'request_failed',
      type: error instanceof Error ? error.name : 'UnknownError',
    }),
  );
  return NextResponse.json(
    { error: 'Не удалось выполнить запрос. Повторите позже.' },
    { status: 500 },
  );
}
