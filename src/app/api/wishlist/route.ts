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
    const { productId } = z.object({ productId: z.string().min(1) }).parse(await request.json());
    const key = { userId: user.id, productId };
    const old = await db.wishlist.findUnique({ where: { userId_productId: key } });
    if (old) await db.wishlist.delete({ where: { userId_productId: key } });
    else await db.wishlist.create({ data: key });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
