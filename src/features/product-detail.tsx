'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ArrowUpRight, Truck, RotateCcw, Minus, Plus, Check, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/components/providers';
import { ImageZoom } from '@/components/image-zoom';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { money } from '@/lib/utils';
import { localizeProduct } from '@/i18n/product';
import type { Product } from '@/types/product';
export function ProductDetail({
  product: sourceProduct,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const { t, add, wishlist, toggleWish, tx, locale } = useStore();
  const p = localizeProduct(sourceProduct, locale);
  const colors = Array.from(new Set(p.variants.map((v) => v.color)));
  const [color, setColor] = useState(colors[0]),
    [size, setSize] = useState<number | null>(null),
    [qty, setQty] = useState(1),
    [photo, setPhoto] = useState(0),
    [zoom, setZoom] = useState(false);
  const variant = p.variants.find((v) => v.color === color && v.size === size),
    stock = variant?.inventory?.quantity || 0;
  function addItem() {
    if (!size) {
      toast.error(tx('Сначала выберите размер EU'));
      return;
    }
    if (!variant || stock < qty) {
      toast.error(tx('Недостаточно товара в наличии'));
      return;
    }
    add({
      variantId: variant.id,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand.name,
      image: p.images[0].url,
      size,
      color,
      price: p.price,
      quantity: qty,
      stock,
    });
  }
  return (
    <div className="container product-page">
      <div className="breadcrumb">
        <Link href="/">KIXO</Link>
        <span>/</span>
        <Link href="/catalog">{t.catalog}</Link>
        <span>/</span>
        {p.name}
      </div>
      <div className="product-detail">
        <div className="gallery">
          <button
            className="main-photo"
            onClick={() => setZoom(true)}
            aria-label={tx('Увеличить изображение')}
          >
            <Image
              src={p.images[photo]?.url || '/images/sneaker-white.jpg'}
              alt={p.images[photo]?.alt || p.name}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 800px) 100vw, 55vw"
            />
            <ZoomIn size={22} />
            {p.isNew && <span className="badge lime">NEW DROP</span>}
          </button>
          <div className="thumbnails">
            {p.images.map((im, i) => (
              <button
                key={im.id}
                className={photo === i ? 'selected' : ''}
                onClick={() => setPhoto(i)}
                aria-label={tx('Фото ') + (i + 1)}
              >
                <Image src={im.url} alt={im.alt} width={100} height={100} />
              </button>
            ))}
          </div>
        </div>
        <div className="product-purchase">
          <div className="eyebrow">{p.brand.name} / LIFESTYLE</div>
          <h1>{p.name}</h1>
          <p className="product-subtitle">
            {p.gender === 'women'
              ? tx('Женские')
              : p.gender === 'men'
                ? tx('Мужские')
                : tx('Унисекс')}{' '}
            {tx('кроссовки ·')}
            {p.category.name}
          </p>
          <div className="detail-price">
            {money(p.price)} {p.oldPrice && <del>{money(p.oldPrice)}</del>}
          </div>
          <div className="detail-field">
            <label>
              {t.color}: <strong>{color}</strong>
            </label>
            <div className="color-options">
              {colors.map((c) => (
                <button
                  key={c}
                  aria-label={c}
                  aria-pressed={c === color}
                  className={c === color ? 'selected' : ''}
                  style={{ background: p.variants.find((v) => v.color === c)?.colorHex }}
                  onClick={() => {
                    setColor(c);
                    setSize(null);
                  }}
                />
              ))}
            </div>
          </div>
          <div className="detail-field">
            <div className="size-heading">
              <label>
                {t.size} <span>EU</span>
              </label>
              <Link href="/info?section=sizes">
                {tx('Таблица размеров')}
                <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="size-options">
              {p.variants
                .filter((v) => v.color === color)
                .sort((a, b) => a.size - b.size)
                .map((v) => (
                  <button
                    key={v.id}
                    disabled={!v.inventory?.quantity}
                    className={v.size === size ? 'selected' : ''}
                    onClick={() => {
                      setSize(v.size);
                      setQty(1);
                    }}
                    aria-pressed={v.size === size}
                  >
                    {v.size}
                  </button>
                ))}
            </div>
            <small className="stock-note">
              {size ? (
                <>
                  <Check size={13} /> {stock}
                  {tx('шт. в наличии · EU')}
                  {size} · {color}
                </>
              ) : (
                tx('Выберите размер, чтобы добавить пару в корзину')
              )}
            </small>
          </div>
          <div className="purchase-actions">
            <div className="quantity">
              <button
                aria-label={tx('Уменьшить')}
                disabled={qty <= 1}
                onClick={() => setQty(qty - 1)}
              >
                <Minus size={15} />
              </button>
              <span>{qty}</span>
              <button
                aria-label={tx('Увеличить')}
                disabled={qty >= Math.min(stock || 1, 10)}
                onClick={() => setQty(qty + 1)}
              >
                <Plus size={15} />
              </button>
            </div>
            <Button onClick={addItem} disabled={!!size && !stock}>
              {t.add}
              <ArrowUpRight size={19} />
            </Button>
            <Button variant="outline" aria-label={t.favorites} onClick={() => toggleWish(p.id)}>
              <Heart size={20} fill={wishlist.includes(p.id) ? 'currentColor' : 'none'} />
            </Button>
          </div>
          <div className="product-perks">
            <span>
              <Truck size={19} />
              {tx('Доставка по Узбекистану · от 30 000 UZS')}
            </span>
            <span>
              <RotateCcw size={19} />
              {tx('14 дней на обмен и возврат')}
            </span>
          </div>
          {[
            [tx('О модели'), p.description],
            [tx('Детали и материалы'), p.material + tx(' · Размерная система EU.')],
            [
              tx('Доставка и возврат'),
              tx(
                'Ташкент: ориентировочно 1–2 дня, регионы: 2–5 дней после подтверждения. Возврат в течение 14 дней при сохранении товарного вида. Сроки и наличие подтверждает менеджер.',
              ),
            ],
          ].map(([title, text], i) => (
            <details key={title} open={i === 0}>
              <summary>
                {title}
                <Plus size={16} />
              </summary>
              <p>{text}</p>
            </details>
          ))}
          <p className="demo-note">
            {tx('Демонстрационный товар. Фотографии иллюстративные и не показывают точную модель.')}
          </p>
        </div>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">KEEP EXPLORING</span>
            <h2>{tx('Ещё немного твоего стиля')}</h2>
          </div>
          <Link href="/catalog" className="text-link">
            {t.all}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {related.map((r) => (
            <ProductCard key={r.id} product={r} />
          ))}
        </div>
      </section>
      {zoom && <ImageZoom src={p.images[photo].url} alt={p.name} onClose={() => setZoom(false)} />}
    </div>
  );
}
