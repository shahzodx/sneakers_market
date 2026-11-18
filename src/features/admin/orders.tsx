import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ActionForm } from '@/components/action-form';
import * as actions from '@/server/admin-actions';
import { money, statuses } from '@/lib/utils';
import type { AdminData } from '@/types/admin';
export function AdminOrders({ data, status }: { data: AdminData; status?: string }) {
  const { orders } = data;
  return (
    <>
      <div className="admin-tabs">
        <Link href="/admin?tab=orders">Все ({orders.length})</Link>
        {Object.entries(statuses).map(([key, label]) => (
          <Link
            key={key}
            className={status === key ? 'selected' : ''}
            href={'/admin?tab=orders&status=' + key}
          >
            {label}
          </Link>
        ))}
      </div>
      {orders
        .filter((o) => !status || o.status === status)
        .map((o) => (
          <section className="admin-panel" key={o.id} id={o.id}>
            <div className="section-heading">
              <div>
                <h2>{o.number}</h2>
                <small>{o.createdAt.toLocaleString('ru-RU')}</small>
              </div>
              <span className="status-pill">{statuses[o.status]}</span>
            </div>
            <div className="form-grid">
              <p>
                <strong>
                  {o.firstName} {o.lastName}
                </strong>
                <br />
                {o.phone}
                <br />
                {o.region}, {o.city}, {o.address}
                <br />
                {o.comment}
              </p>
              <p>
                Оплата: {o.payment?.provider} / {o.payment?.status}
                <br />
                Сумма: <strong>{money(o.total)}</strong>
              </p>
            </div>
            {o.items.map((i) => (
              <div className="order-line" key={i.id}>
                <span>
                  {i.name} · EU {i.size} · {i.color} × {i.quantity}
                </span>
                <span>{money(i.price * i.quantity)}</span>
              </div>
            ))}
            <ActionForm action={actions.updateOrder} className="inline-form">
              <input type="hidden" name="id" value={o.id} />
              <select name="status" defaultValue={o.status}>
                {Object.entries(statuses).map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
              <Button size="sm">Изменить статус</Button>
            </ActionForm>
            <details>
              <summary>История изменений</summary>
              {o.history.map((h) => (
                <p key={h.id}>
                  {statuses[h.status]} · {h.createdAt.toLocaleString('ru-RU')} · {h.actor}
                </p>
              ))}
            </details>
          </section>
        ))}
      {!orders.length && <div className="mini-empty">Заказов пока нет.</div>}
    </>
  );
}
