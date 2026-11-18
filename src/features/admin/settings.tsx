import { Button } from '@/components/ui/button';
import { ActionForm } from '@/components/action-form';
import * as actions from '@/server/admin-actions';
import type { AdminData } from '@/types/admin';
export function AdminSettings({ data }: { data: AdminData }) {
  const { settings } = data;
  return (
    <section className="admin-panel">
      <h2>Витрина и настройки</h2>
      {[
        ['heroTitle', 'Заголовок главной'],
        ['heroImage', 'Изображение hero: /images/… или URL S3'],
        ['lifestyleImage', 'Изображение lifestyle-баннера: /images/… или URL S3'],
        ['contactEmail', 'Email магазина'],
        ['contactPhone', 'Телефон магазина'],
      ].map(([key, label]) => (
        <ActionForm key={key} action={actions.saveSetting}>
          <input type="hidden" name="key" value={key} />
          <label>
            {label}
            <textarea
              name="value"
              required
              maxLength={300}
              defaultValue={settings.find((s) => s.key === key)?.value || ''}
            />
          </label>
          <Button variant="outline" size="sm">
            Сохранить
          </Button>
        </ActionForm>
      ))}
      <p className="demo-note">
        Click / Payme отключены. S3 требует настройки переменных окружения. Стоимость доставки: 30
        000 UZS, бесплатно от 1 500 000 UZS.
      </p>
    </section>
  );
}
