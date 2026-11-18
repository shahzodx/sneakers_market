import { getTranslator } from '@/i18n/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight, Package } from 'lucide-react';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { money, statuses } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logout } from '@/components/logout';
import { ActionForm } from '@/components/action-form';
import { updateProfile, saveAddress, deleteAddress } from '@/server/account-actions';
export const metadata = { title: 'Личный кабинет', robots: { index: false, follow: false } };
export default async function Page() {
  const tx = await getTranslator();

  const user = await currentUser();
  if (!user) redirect('/login');
  const [orders, addresses, wishes] = await Promise.all([
    db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
    db.address.findMany({ where: { userId: user.id } }),
    db.wishlist.findMany({ where: { userId: user.id }, include: { product: true } }),
  ]);
  return (
    <div className="container section account-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR PERSONAL ROTATION</span>
          <h1>
            {tx('Привет,')} {user.name}.
          </h1>
        </div>
        <Logout />
      </div>
      <div className="account-layout">
        <aside className="account-nav">
          <a href="#orders">
            {tx('Мои заказы')}
            <ArrowUpRight size={15} />
          </a>
          <a href="#profile">{tx('Профиль')}</a>
          <a href="#addresses">{tx('Адреса')}</a>
          <Link href="/wishlist">{tx('Избранное')}</Link>
          {user.role === 'ADMIN' && (
            <Link href="/admin">
              {tx('Админ-панель')}
              <ArrowUpRight size={15} />
            </Link>
          )}
        </aside>
        <div>
          <section id="orders" className="account-block">
            <h2>{tx('Мои заказы')}</h2>
            {orders.length ? (
              orders.map((o) => (
                <Link href={'/order/' + o.id} key={o.id} className="account-order">
                  <div>
                    <strong>{o.number}</strong>
                    <small>
                      {o.createdAt.toLocaleDateString('ru-RU')} · {o.items.length}
                      {tx('поз.')}
                    </small>
                  </div>
                  <span className="status-pill">{tx(statuses[o.status])}</span>
                  <strong>{money(o.total)}</strong>
                  <ArrowUpRight size={18} />
                </Link>
              ))
            ) : (
              <div className="mini-empty">
                <Package size={28} />
                <p>{tx('Первый шаг — найти свою пару.')}</p>
                <Button asChild variant="outline">
                  <Link href="/catalog">
                    {tx('В каталог')}
                    <ArrowUpRight size={16} />
                  </Link>
                </Button>
              </div>
            )}
          </section>
          <section id="profile" className="account-block">
            <h2>{tx('Профиль')}</h2>
            <ActionForm action={updateProfile} className="profile-form">
              <div className="form-grid">
                <label>
                  {tx('Имя')}
                  <input
                    name="name"
                    defaultValue={user.name}
                    required
                    minLength={2}
                    maxLength={80}
                  />
                </label>
                <label>
                  {tx('Телефон')}
                  <input name="phone" defaultValue={user.phone || ''} type="tel" maxLength={30} />
                </label>
                <label>
                  Email
                  <input value={user.email} disabled />
                </label>
              </div>
              <Button size="sm">{tx('Сохранить')}</Button>
            </ActionForm>
          </section>
          <section id="addresses" className="account-block">
            <h2>{tx('Мои адреса')}</h2>
            <div className="address-grid">
              {addresses.map((a) => (
                <div className="address-card" key={a.id}>
                  <strong>{a.label}</strong>
                  <p>
                    {a.region}, {a.city}
                    <br />
                    {a.street}
                  </p>
                  <ActionForm action={deleteAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <Button variant="ghost" size="sm">
                      {tx('Удалить')}
                    </Button>
                  </ActionForm>
                </div>
              ))}
            </div>
            <details>
              <summary>{tx('Добавить адрес +')}</summary>
              <ActionForm action={saveAddress}>
                <div className="form-grid">
                  {[
                    ['label', tx('Название'), tx('Дом')],
                    ['region', tx('Регион'), tx('Ташкент')],
                    ['city', tx('Город'), tx('Ташкент')],
                    ['street', tx('Улица, дом, квартира'), ''],
                  ].map(([name, label, value]) => (
                    <label key={name}>
                      {label}
                      <input
                        name={name}
                        defaultValue={value}
                        required
                        minLength={name === 'street' ? 8 : 2}
                        maxLength={name === 'street' ? 250 : 80}
                      />
                    </label>
                  ))}
                </div>
                <Button size="sm">{tx('Сохранить адрес')}</Button>
              </ActionForm>
            </details>
          </section>
          {wishes.length > 0 && (
            <section className="account-block">
              <h2>{tx('Сохранённые в аккаунте')}</h2>
              {wishes.map((w) => (
                <Link className="order-line" key={w.productId} href={'/product/' + w.product.slug}>
                  {w.product.name}
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
