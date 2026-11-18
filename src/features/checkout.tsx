'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpRight, LockKeyhole, Check } from 'lucide-react';
import { toast } from 'sonner';
import { checkoutSchema, calculateTotals, type CheckoutInput } from '@/lib/validation';
import { useCartQuote } from '@/hooks/use-cart-quote';
import { useStore } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { money } from '@/lib/utils';
type Address = { id: string; region: string; city: string; street: string; label: string };
export function Checkout({
  addresses = [],
  profile,
}: {
  addresses?: Address[];
  profile?: { name: string; phone: string | null } | null;
}) {
  const { cart, clear, t, ready, tx } = useStore(),
    router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    control,
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      payment: 'cash',
      region: tx('Ташкент'),
      city: tx('Ташкент'),
      firstName: profile?.name.split(' ')[0] || '',
      phone: profile?.phone || '+998',
      comment: '',
    },
  });
  const coupon = useWatch({ control, name: 'coupon' }) || '';
  const quote = useCartQuote(coupon);
  const totals =
    quote.data?.totals || calculateTotals(cart.reduce((a, x) => a + x.price * x.quantity, 0));
  useEffect(() => {
    setValue(
      'items',
      cart.map((x) => ({ variantId: x.variantId, quantity: x.quantity })),
    );
    let key = sessionStorage.getItem('kixo.checkout-key');
    if (!key) {
      key = crypto.randomUUID();
      sessionStorage.setItem('kixo.checkout-key', key);
    }
    setValue('idempotencyKey', key);
    setValue('coupon', sessionStorage.getItem('kixo.coupon') || '');
  }, [cart, setValue]);
  useEffect(() => {
    if (quote.data) setValue('expectedTotal', quote.data.totals.total);
  }, [quote.data, setValue]);
  async function submit(data: CheckoutInput) {
    setError('');
    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) {
        if (r.status === 409) {
          const key = crypto.randomUUID();
          sessionStorage.setItem('kixo.checkout-key', key);
          setValue('idempotencyKey', key);
          await quote.refetch();
        }
        throw new Error(d.error);
      }
      clear();
      sessionStorage.removeItem('kixo.checkout-key');
      sessionStorage.removeItem('kixo.coupon');
      router.push('/order/' + d.id);
      toast.success(tx('Заказ принят'));
    } catch (e) {
      setError(e instanceof Error ? e.message : tx('Ошибка сети. Попробуйте снова.'));
    }
  }
  if (ready && !cart.length)
    return (
      <div className="container empty-state">
        <h1>{tx('Корзина пуста')}</h1>
        <Button asChild>
          <Link href="/catalog">{t.continue}</Link>
        </Button>
      </div>
    );
  const fields: [keyof CheckoutInput, string, string?][] = [
    ['firstName', tx('Имя')],
    ['lastName', tx('Фамилия')],
    ['phone', tx('Телефон'), 'tel'],
    ['region', tx('Регион')],
    ['city', tx('Город')],
    ['address', tx('Адрес доставки')],
  ];
  return (
    <div className="container section">
      <span className="eyebrow">ONE STEP CLOSER.</span>
      <h1>{t.checkout}</h1>
      <form
        className="checkout-layout"
        onSubmit={handleSubmit(submit, () => setError(tx('Проверьте обязательные поля формы.')))}
      >
        <div className="checkout-form">
          <h2>{tx('01 / Контактные данные')}</h2>
          {addresses.length > 0 && (
            <label>
              {tx('Сохранённый адрес')}
              <select
                defaultValue=""
                onChange={(e) => {
                  const a = addresses.find((a) => a.id === e.target.value);
                  if (a) {
                    setValue('region', a.region);
                    setValue('city', a.city);
                    setValue('address', a.street);
                  }
                }}
              >
                <option value="">{tx('Ввести новый адрес')}</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}: {a.street}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="form-grid">
            {fields.map(([key, label, type]) => (
              <label key={key} className={key === 'address' ? 'full-width' : ''}>
                {label}
                <input
                  {...register(key)}
                  type={type || 'text'}
                  autoComplete={
                    key === 'firstName'
                      ? 'given-name'
                      : key === 'lastName'
                        ? 'family-name'
                        : key === 'phone'
                          ? 'tel'
                          : key === 'address'
                            ? 'street-address'
                            : 'off'
                  }
                  aria-invalid={!!errors[key]}
                />
                {errors[key] && (
                  <small className="field-error">{String(errors[key]?.message)}</small>
                )}
              </label>
            ))}
          </div>
          <label>
            {tx('Комментарий к заказу')}
            <textarea
              {...register('comment')}
              rows={3}
              placeholder={tx('Домофон, ориентир или удобное время')}
            />
          </label>
          <h2>{tx('02 / Способ оплаты')}</h2>
          <label className="payment-option">
            <input type="radio" value="cash" {...register('payment')} />
            <div>
              <strong>{tx('При получении')}</strong>
              <small>{tx('Наличными после проверки заказа')}</small>
            </div>
            <Check size={18} />
          </label>
          <label className="payment-option disabled">
            <input type="radio" disabled />
            <div>
              <strong>Click / Payme</strong>
              <small>{tx('Онлайн-оплата не подключена. Списание недоступно.')}</small>
            </div>
            <LockKeyhole size={18} />
          </label>
          <p className="demo-note">
            {tx(
              'Магазин работает с демо-каталогом. Созданный заказ сохраняется в базе как демонстрационный заказ.',
            )}
          </p>
        </div>
        <aside className="order-summary">
          <h2>{tx('Твой заказ')}</h2>
          {cart.map((x) => (
            <div key={x.variantId} className="checkout-mini-item">
              <span>
                {x.brand} {x.name}
                <small>
                  EU {x.size} · {x.color} · {x.quantity}
                  {tx('шт.')}
                </small>
              </span>
              <strong>
                {money(
                  (quote.data?.items.find((i) => i.variantId === x.variantId)?.price || x.price) *
                    x.quantity,
                )}
              </strong>
            </div>
          ))}
          <div>
            <span>{tx('Товары')}</span>
            <span>{money(totals.subtotal)}</span>
          </div>
          <div>
            <span>{tx('Доставка')}</span>
            <span>{totals.delivery ? money(totals.delivery) : tx('Бесплатно')}</span>
          </div>
          {totals.discount > 0 && (
            <div>
              <span>
                {tx('Скидка')}
                {coupon}
              </span>
              <span>−{money(totals.discount)}</span>
            </div>
          )}
          <div className="summary-total">
            <strong>{t.total}</strong>
            <strong>{money(totals.total)}</strong>
          </div>
          <small>
            {quote.isFetching
              ? tx('Проверяем цены и наличие…')
              : tx('Цена и наличие проверены сервером.')}
          </small>
          {quote.error && (
            <p role="alert" className="form-error">
              {quote.error.message}
            </p>
          )}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <Button
            variant="accent"
            disabled={
              isSubmitting || !cart.length || quote.isPending || quote.isFetching || !!quote.error
            }
          >
            {isSubmitting ? tx('Создаём заказ…') : tx('Подтвердить заказ')}
            <ArrowUpRight size={18} />
          </Button>
          <small>
            {tx('Оформляя заказ, вы соглашаетесь с')}{' '}
            <Link href="/info?section=privacy">{tx('политикой обработки данных')}</Link>.
          </small>
        </aside>
      </form>
    </div>
  );
}
