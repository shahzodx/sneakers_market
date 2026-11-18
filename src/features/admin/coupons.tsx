import { Button } from '@/components/ui/button';
import { ActionForm } from '@/components/action-form';
import * as actions from '@/server/admin-actions';
import { money } from '@/lib/utils';
import type { AdminData } from '@/types/admin';
export function AdminCoupons({ data }: { data: AdminData }) {
  const { coupons } = data;
  return (
    <section className="admin-panel">
      <h2>Промокоды</h2>
      {coupons.map((c) => (
        <div className="order-line" key={c.id}>
          <strong>{c.code}</strong>
          <span>
            −{c.percent}% · от {money(c.minSubtotal)}
          </span>
          <span>{c.active ? 'Активен' : 'Выключен'}</span>
        </div>
      ))}
      <h3>Создать или обновить промокод</h3>
      <ActionForm action={actions.saveCoupon}>
        <div className="form-grid">
          <label>
            Код
            <input name="code" required pattern="[A-Z0-9_-]{2,40}" />
          </label>
          <label>
            Скидка %<input type="number" name="percent" min={1} max={80} required />
          </label>
          <label>
            Минимальная сумма
            <input type="number" name="minSubtotal" min={0} defaultValue={0} />
          </label>
        </div>
        <label className="checkbox-label">
          <input type="checkbox" name="active" defaultChecked />
          Активен
        </label>
        <Button size="sm">Сохранить</Button>
      </ActionForm>
    </section>
  );
}
