import Link from 'next/link';
import { BarChart3, Package, Users, ShoppingBag } from 'lucide-react';
import { money, statuses } from '@/lib/utils';
import type { AdminData } from '@/types/admin';
export function AdminDashboard({ data }: { data: AdminData }) {
  const { orders, products, customers, paid } = data;
  return (
    <>
      <div className="stats-grid">
        {[
          [ShoppingBag, 'Заказы', orders.length],
          [BarChart3, 'Оплаченная выручка', money(paid._sum.amount || 0)],
          [Users, 'Клиенты', customers],
          [Package, 'Активные товары', products.filter((p) => !p.archived).length],
        ].map(([Icon, label, value]) => {
          const I = Icon as typeof Package;
          return (
            <div key={String(label)}>
              <I size={22} />
              <span>{String(label)}</span>
              <strong>{String(value)}</strong>
            </div>
          );
        })}
      </div>
      <section className="admin-panel">
        <h2>Продажи · последние 7 дней</h2>
        <div className="sales-chart">
          {Array.from({ length: 7 }, (_, i) => {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            start.setDate(start.getDate() - 6 + i);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            const total = orders
              .filter(
                (o) => o.payment?.status === 'PAID' && o.createdAt >= start && o.createdAt < end,
              )
              .reduce((a, o) => a + o.total, 0);
            const max = Math.max(...orders.map((o) => o.total), 1);
            return (
              <div key={i}>
                <span>{money(total)}</span>
                <i style={{ height: Math.max(3, Math.min(140, (total / max) * 140)) }} />
                <small>
                  {start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </small>
              </div>
            );
          })}
        </div>
      </section>
      <section className="admin-panel">
        <h2>Последние заказы</h2>
        {orders.slice(0, 6).map((o) => (
          <Link href={'/admin?tab=orders#' + o.id} className="order-line" key={o.id}>
            <strong>{o.number}</strong>
            <span>{o.firstName}</span>
            <span>{statuses[o.status]}</span>
            <strong>{money(o.total)}</strong>
          </Link>
        ))}
        {!orders.length && <p className="muted">Заказов пока нет.</p>}
      </section>
      <section className="admin-panel">
        <h2>Популярные товары по заказам</h2>
        {products
          .map((p) => ({
            p,
            count: orders
              .filter((o) => o.status !== 'CANCELLED')
              .flatMap((o) => o.items)
              .filter((i) => p.variants.some((v) => v.id === i.variantId))
              .reduce((a, i) => a + i.quantity, 0),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map(({ p, count }) => (
            <div className="order-line" key={p.id}>
              <span>
                {p.brand.name} {p.name}
              </span>
              <strong>{count} шт.</strong>
            </div>
          ))}
      </section>
    </>
  );
}
