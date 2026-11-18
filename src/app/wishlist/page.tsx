import { Wishlist } from '@/features/cart';
import { db } from '@/lib/db';
import { productInclude } from '@/types/product';
export const metadata = { title: 'Избранное' };
export const dynamic = 'force-dynamic';
export default async function Page() {
  return (
    <Wishlist
      products={await db.product.findMany({ where: { archived: false }, include: productInclude })}
    />
  );
}
