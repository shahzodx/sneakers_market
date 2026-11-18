import { readJson } from '@/server/request';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assertOrigin, rateLimit } from '@/server/security';
import { failure } from '@/server/response';
export async function POST(request: Request) {
  try {
    await assertOrigin(request);
    await rateLimit('newsletter', 5);
    const { email } = z.object({ email: z.email().toLowerCase() }).parse(await readJson(request));
    await db.subscriber.upsert({ where: { email }, update: {}, create: { email } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
