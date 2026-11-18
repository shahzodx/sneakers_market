import { Checkout } from '@/features/checkout';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
export const metadata = { title: 'Оформление заказа', robots: { index: false, follow: false } };
export default async function Page() {
  const user = await currentUser();
  const addresses = user ? await db.address.findMany({ where: { userId: user.id } }) : [];
  return <Checkout addresses={addresses} profile={user} />;
}
