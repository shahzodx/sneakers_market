import { getTranslator } from '@/i18n/server';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Check, Package, ArrowUpRight } from 'lucide-react';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { money, statuses } from '@/lib/utils';
import { Button } from '@/components/ui/button';
export const metadata = { title: 'Заказ', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const tx = await getTranslator();

  const { id } = await params;
  const user = await currentUser(),
    token = (await cookies()).get('kixo.order.' + id)?.value;
  const o = await db.order.findUnique({
    where: { id },
    include: { items: true, payment: true, history: { orderBy: { createdAt: 'asc' } } },
  });
  if (
    !o ||
    !(user?.id === o.userId || user?.role === 'ADMIN' || (token && token === o.accessToken))
  )
    notFound();
  return (
    <div className="container section order-page">
      <div className="success-icon">
        <Check size={34} />
      </div>
      <span className="eyebrow">YOUR NEXT STEP IS ON ITS WAY.</span>
      <h1>
        {tx('Отличный выбор,')} {o.firstName}.
      </h1>
      <p>
        {tx('Заказ')} <strong>{o.number}</strong> {tx('принят. Оплата при получении.')}
        <br />
        {tx('Сохраните эту страницу, чтобы следить за статусом.')}
      </p>
      <div className="order-status">
        <Package />
        <div>
          <strong>{tx(statuses[o.status])}</strong>
          <small>
            {tx('Заказ от')} {o.createdAt.toLocaleDateString('ru-RU')}
          </small>
        </div>
      </div>
      <div className="checkout-layout">
        <div>
          <h2>{tx('Твоя пара')}</h2>
          {o.items.map((i) => (
            <div className="order-line" key={i.id}>
              <span>
                {i.name}
                <small>
                  EU {i.size} · {i.color} · {i.quantity}
                  {tx('шт.')}
                </small>
              </span>
              <strong>{money(i.price * i.quantity)}</strong>
            </div>
          ))}
          <h3>{tx('История статусов')}</h3>
          <ol className="timeline">
            {o.history.map((h) => (
              <li key={h.id}>
                <strong>{tx(statuses[h.status])}</strong>
                <span>{h.createdAt.toLocaleString('ru-RU')}</span>
              </li>
            ))}
          </ol>
        </div>
        <aside className="order-summary">
          <h2>{tx('Детали заказа')}</h2>
          <p>
            {o.firstName} {o.lastName}
            <br />
            {o.phone}
            <br />
            {o.region}, {o.city}
            <br />
            {o.address}
          </p>
          <div>
            <span>{tx('Товары')}</span>
            <span>{money(o.subtotal)}</span>
          </div>
          <div>
            <span>{tx('Скидка')}</span>
            <span>−{money(o.discount)}</span>
          </div>
          <div>
            <span>{tx('Доставка')}</span>
            <span>{money(o.delivery)}</span>
          </div>
          <div className="summary-total">
            <strong>{tx('Итого')}</strong>
            <strong>{money(o.total)}</strong>
          </div>
          <small>
            {tx('Статус оплаты:')}{' '}
            {o.payment?.status === 'PAID' ? tx('Оплачен') : tx('Ожидает оплаты при получении')}
          </small>
        </aside>
      </div>
      <Button asChild variant="outline">
        <Link href="/catalog">
          {tx('Продолжить покупки')}
          <ArrowUpRight size={17} />
        </Link>
      </Button>
      {o.demo && (
        <p className="demo-note">
          {tx('Демонстрационный заказ. Реальная доставка не выполняется.')}
        </p>
      )}
    </div>
  );
}
