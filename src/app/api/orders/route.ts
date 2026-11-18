import { NextResponse } from 'next/server';
import { checkoutSchema } from '@/lib/validation';
import { currentUser } from '@/lib/auth';
import { createOrder } from '@/server/orders';
import { assertOrigin, rateLimit } from '@/server/security';
import { failure } from '@/server/response';
export async function POST(request: Request) {
  try {
    await assertOrigin(request);
    await rateLimit('checkout', 15);
    const input = checkoutSchema.parse(await request.json());
    const user = await currentUser();
    const order = await createOrder(input, user?.id);
    const response = NextResponse.json({ id: order.id, number: order.number });
    response.cookies.set('kixo.order.' + order.id, order.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/order/' + order.id,
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (e) {
    return failure(e);
  }
}
