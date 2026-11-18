import { readJson } from '@/server/request';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { assertOrigin } from '@/server/security';
import { failure } from '@/server/response';
export async function POST(request: Request) {
  try {
    await assertOrigin(request);
    const user = await currentUser();
    if (!user) return NextResponse.json({ local: true });
    const { productId, saved } = z
      .object({ productId: z.string().min(1), saved: z.boolean() })
      .parse(await readJson(request));
    const key = { userId: user.id, productId };
    if (saved)
      await db.wishlist.upsert({ where: { userId_productId: key }, update: {}, create: key });
    else await db.wishlist.deleteMany({ where: key });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
