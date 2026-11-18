import { AdminDashboard } from '@/features/admin/dashboard';
import { AdminProducts } from '@/features/admin/products';
import { AdminOrders } from '@/features/admin/orders';
import { AdminCoupons } from '@/features/admin/coupons';
import { AdminSettings } from '@/features/admin/settings';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { productInclude } from '@/types/product';
import { Button } from '@/components/ui/button';
export const metadata = { title: 'Администрирование', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; edit?: string; status?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (user.role !== 'ADMIN')
    return (
      <div className="container empty-state">
        <h1>Доступ ограничен</h1>
        <p>Этот раздел доступен администратору магазина.</p>
        <Button asChild>
          <Link href="/account">В мой аккаунт</Link>
        </Button>
      </div>
    );
  const { tab = 'dashboard', edit, status } = await searchParams;
  const [products, orders, brands, categories, coupons, settings, customers, paid] =
    await Promise.all([
      db.product.findMany({ include: productInclude, orderBy: { createdAt: 'desc' } }),
      db.order.findMany({
        include: { items: true, payment: true, history: { orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.brand.findMany(),
      db.category.findMany(),
      db.coupon.findMany(),
      db.setting.findMany(),
      db.user.count({ where: { role: 'CUSTOMER' } }),
      db.payment.aggregate({
        where: { status: 'PAID', order: { demo: false } },
        _sum: { amount: true },
      }),
    ]);
  const data = { products, orders, brands, categories, coupons, settings, customers, paid };
  const tabs = [
    ['dashboard', 'Обзор'],
    ['products', 'Товары'],
    ['orders', 'Заказы'],
    ['coupons', 'Промокоды'],
    ['settings', 'Настройки'],
  ];
  return (
    <div className="container section admin-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">KIXO / CONTROL ROOM</span>
          <h1>Магазин под контролем.</h1>
        </div>
        <Link href="/" className="text-link">
          На витрину
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <nav className="admin-tabs">
        {tabs.map(([id, label]) => (
          <Link className={tab === id ? 'selected' : ''} key={id} href={'/admin?tab=' + id}>
            {label}
          </Link>
        ))}
      </nav>
      {tab === 'dashboard' && <AdminDashboard data={data} />}
      {tab === 'products' && <AdminProducts data={data} edit={edit} />}
      {tab === 'orders' && <AdminOrders data={data} status={status} />}
      {tab === 'coupons' && <AdminCoupons data={data} />}
      {tab === 'settings' && <AdminSettings data={data} />}
    </div>
  );
}
