'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowUpRight, Minus, Plus, X, ArrowRight, Heart } from 'lucide-react';
import { useCartQuote } from '@/hooks/use-cart-quote';
import { useState } from 'react';
import { useStore } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { money } from '@/lib/utils';
import { calculateTotals } from '@/lib/validation';
import { toast } from 'sonner';
export function Cart() {
  const { cart, update, t, ready, tx } = useStore();
  const [coupon, setCoupon] = useState(''),
    [percent, setPercent] = useState(0);
  const quote = useCartQuote(percent > 0 ? coupon : '');
  const totals =
    quote.data?.totals ||
    calculateTotals(
      cart.reduce((a, x) => a + x.price * x.quantity, 0),
      percent,
    );
  async function apply() {
    try {
      const r = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: coupon,
          items: cart.map((x) => ({ variantId: x.variantId, quantity: x.quantity })),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setPercent(d.percent);
      sessionStorage.setItem('kixo.coupon', coupon);
      toast.success(tx('Промокод применён'));
    } catch (e) {
      setPercent(0);
      sessionStorage.removeItem('kixo.coupon');
      toast.error(e instanceof Error ? e.message : tx('Ошибка сети'));
    }
  }
  if (!ready)
    return (
      <div className="container section">
        <div className="skeleton" />
      </div>
    );
  if (!cart.length)
    return (
      <div className="empty-state container">
        <ShoppingBag size={48} />
        <span className="eyebrow">YOUR NEXT PAIR IS WAITING</span>
        <h1>{tx('Здесь скоро будет твоя пара')}</h1>
        <p>{tx('Выбери кроссовки, которые подойдут твоему ритму.')}</p>
        <Button asChild>
          <Link href="/catalog">
            {t.continue}
            <ArrowUpRight size={18} />
          </Link>
        </Button>
      </div>
    );
  return (
    <div className="container section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">GOOD CHOICES.</span>
          <h1>
            {t.cart}
            <span className="muted"> ({cart.reduce((a, x) => a + x.quantity, 0)})</span>
          </h1>
        </div>
        <Link href="/catalog" className="text-link">
          {t.continue}
          <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="checkout-layout">
        <div className="cart-items">
          {cart.map((x) => (
            <article className="cart-item" key={x.variantId}>
              <Link href={'/product/' + x.slug}>
                <Image src={x.image} alt={x.name} width={160} height={160} />
              </Link>
              <div>
                <span className="eyebrow">{x.brand}</span>
                <Link href={'/product/' + x.slug}>
                  <h3>{x.name}</h3>
                </Link>
                <p>
                  EU {x.size} · {x.color}
                </p>
                <div className="quantity">
                  <button
                    onClick={() => update(x.variantId, x.quantity - 1)}
                    aria-label={tx('Уменьшить')}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{x.quantity}</span>
                  <button
                    onClick={() => update(x.variantId, x.quantity + 1)}
                    disabled={x.quantity >= Math.min(x.stock, 10)}
                    aria-label={tx('Увеличить')}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="cart-item-right">
                <button onClick={() => update(x.variantId, 0)} aria-label={tx('Удалить')}>
                  <X size={18} />
                </button>
                <strong>
                  {money(
                    (quote.data?.items.find((i) => i.variantId === x.variantId)?.price || x.price) *
                      x.quantity,
                  )}
                </strong>
              </div>
            </article>
          ))}
        </div>
        <aside className="order-summary">
          <h2>{tx('Твой заказ')}</h2>
          {quote.error && (
            <p role="alert" className="form-error">
              {quote.error.message}
            </p>
          )}
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
              <span>{tx('Скидка')}</span>
              <span>−{money(totals.discount)}</span>
            </div>
          )}
          <form
            className="coupon-form"
            onSubmit={(e) => {
              e.preventDefault();
              apply();
            }}
          >
            <input
              placeholder={tx('Промокод')}
              value={coupon}
              onChange={(e) => {
                setCoupon(e.target.value.toUpperCase());
                setPercent(0);
                sessionStorage.removeItem('kixo.coupon');
              }}
              aria-label={tx('Промокод')}
            />
            <button aria-label={tx('Применить промокод')}>
              <ArrowRight size={20} />
            </button>
          </form>
          <div className="summary-total">
            <strong>{t.total}</strong>
            <strong>{money(totals.total)}</strong>
          </div>
          <Button asChild variant="accent">
            <Link href="/checkout">
              {t.checkout}
              <ArrowUpRight size={18} />
            </Link>
          </Button>
          <small>{tx('Цена и наличие повторно проверяются при оформлении.')}</small>
        </aside>
      </div>
    </div>
  );
}
export function Wishlist({ products }: { products: import('@/types/product').Product[] }) {
  const { wishlist, t, tx } = useStore();
  const selected = products.filter((p) => wishlist.includes(p.id));
  return (
    <div className="container section">
      <span className="eyebrow">SAVE IT FOR LATER</span>
      <h1>{t.favorites}</h1>
      {selected.length ? (
        <WishlistGrid products={selected} />
      ) : (
        <div className="empty-state">
          <Heart size={45} />
          <h2>{tx('Любимые пары — здесь')}</h2>
          <p>{tx('Нажми на сердечко в каталоге, чтобы сохранить пару.')}</p>
          <Button asChild>
            <Link href="/catalog">
              {t.catalog}
              <ArrowUpRight size={18} />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
import { ProductCard } from '@/components/product-card';
function WishlistGrid({ products }: { products: import('@/types/product').Product[] }) {
  return (
    <div className="product-grid" style={{ marginTop: 35 }}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
