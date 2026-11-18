import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { registerSchema } from '@/lib/validation';
import { assertOrigin, rateLimit } from '@/server/security';
import { failure } from '@/server/response';
export async function POST(request: Request) {
  try {
    await assertOrigin(request);
    await rateLimit('register', 5);
    const data = registerSchema.parse(await request.json());
    if (await db.user.findUnique({ where: { email: data.email } }))
      throw new Error('Этот email уже зарегистрирован');
    await db.user.create({
      data: { email: data.email, name: data.name, passwordHash: await hash(data.password, 12) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
