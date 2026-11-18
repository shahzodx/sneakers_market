'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search, SlidersHorizontal, X, ArrowUpRight } from 'lucide-react';
import type { Product } from '@/types/product';
import { ProductCard } from '@/components/product-card';
import { useStore } from '@/components/providers';
import { Button } from '@/components/ui/button';
export function Catalog({
  products,
  total,
  brands,
  colors,
}: {
  products: Product[];
  total: number;
  brands: string[];
  colors: string[];
}) {
  const { t, tx } = useStore(),
    router = useRouter(),
    params = useSearchParams();
  const [open, setOpen] = useState(false);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    router.push('/catalog?' + next.toString(), { scroll: false });
  };
  const active = Array.from(params.entries()).filter(([k]) => !['sort', 'page'].includes(k));
  return (
    <div className="container catalog-page">
      <div className="breadcrumb">
        <Link href="/">KIXO</Link>
        <span>/</span>
        {t.catalog}
      </div>
      <div className="catalog-title">
        <div>
          <span className="eyebrow">FIND YOUR NEXT FAVORITE.</span>
          <h1>
            {params.get('new') ? t.new : t.catalog}
            <span>({total})</span>
          </h1>
        </div>
        <p>
          {tx('Каждый силуэт — новая история.')}
          <br />
          {tx('Какую расскажешь ты?')}
        </p>
      </div>
      <form
        className="catalog-search"
        onSubmit={(e) => {
          e.preventDefault();
          update('q', String(new FormData(e.currentTarget).get('q') || ''));
        }}
      >
        <Search size={19} />
        <input
          key={params.get('q')}
          name="q"
          defaultValue={params.get('q') || ''}
          placeholder={t.search}
          aria-label={t.search}
        />
        <button className="text-link">
          {tx('Найти')}
          <ArrowUpRight size={16} />
        </button>
      </form>
      <div className="catalog-toolbar">
        <button className="text-link" onClick={() => setOpen(!open)} aria-expanded={open}>
          <SlidersHorizontal size={18} />
          {t.filter}
          {active.length > 0 && <b>{active.length}</b>}
        </button>
        <span>
          {total} {t.results}
        </span>
        <select
          aria-label={t.sort}
          value={params.get('sort') || 'popular'}
          onChange={(e) => update('sort', e.target.value)}
        >
          <option value="popular">{tx('По популярности')}</option>
          <option value="newest">{tx('Сначала новые')}</option>
          <option value="price-asc">{tx('Цена: по возрастанию')}</option>
          <option value="price-desc">{tx('Цена: по убыванию')}</option>
        </select>
      </div>
      <div className={'catalog-layout ' + (open ? 'filters-open' : '')}>
        <aside className="filters">
          <div className="filter-heading">
            <h3>{t.filter}</h3>
            <button aria-label="Close" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <label>
            {t.brand}
            <select
              value={params.get('brand') || ''}
              onChange={(e) => update('brand', e.target.value)}
            >
              <option value="">{tx('Все бренды')}</option>
              {brands.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label>
            {tx('Категория')}
            <select
              value={params.get('gender') || ''}
              onChange={(e) => update('gender', e.target.value)}
            >
              <option value="">{tx('Все')}</option>
              <option value="men">{t.men}</option>
              <option value="women">{t.women}</option>
              <option value="unisex">{tx('Унисекс')}</option>
            </select>
          </label>
          <label>
            {tx('Размер EU')}
            <select
              value={params.get('size') || ''}
              onChange={(e) => update('size', e.target.value)}
            >
              <option value="">{tx('Все размеры')}</option>
              {[38, 39, 40, 41, 42, 43, 44, 45].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            {t.color}
            <select
              value={params.get('color') || ''}
              onChange={(e) => update('color', e.target.value)}
            >
              <option value="">{tx('Все цвета')}</option>
              {colors.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget),
                p = new URLSearchParams(params);
              for (const k of ['min', 'max']) {
                const v = String(data.get(k) || '');
                if (v) p.set(k, v);
                else p.delete(k);
              }
              p.delete('page');
              router.push('/catalog?' + p.toString(), { scroll: false });
            }}
          >
            <label>{t.price}, UZS</label>
            <div className="price-inputs">
              <input
                name="min"
                type="number"
                min="0"
                placeholder={t.from}
                defaultValue={params.get('min') || ''}
                aria-label={tx('Минимальная цена')}
              />
              <input
                name="max"
                type="number"
                min="0"
                placeholder={t.to}
                defaultValue={params.get('max') || ''}
                aria-label={tx('Максимальная цена')}
              />
            </div>
            <Button size="sm" variant="outline">
              {tx('Применить')}
            </Button>
          </form>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={params.get('stock') === 'true'}
              onChange={(e) => update('stock', e.target.checked ? 'true' : '')}
            />
            {t.stock}
          </label>
          <Button variant="ghost" onClick={() => router.push('/catalog')}>
            {t.reset}
            <X size={15} />
          </Button>
        </aside>
        <div className="catalog-results">
          {active.length > 0 && (
            <div className="active-filters">
              {active.map(([key, value]) => (
                <button key={key} onClick={() => update(key, '')}>
                  {key}: {value}
                  <X size={13} />
                </button>
              ))}
            </div>
          )}
          {products.length ? (
            <div className="product-grid">
              {products.map((p, index) => (
                <ProductCard key={p.id} product={p} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={40} />
              <h2>{tx('Ничего не найдено')}</h2>
              <p>{tx('Попробуйте изменить запрос или сбросить фильтры.')}</p>
              <Button onClick={() => router.push('/catalog')}>{t.reset}</Button>
            </div>
          )}
          {products.length < total && (
            <div className="load-more">
              <p>
                {products.length} / {total}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  const p = new URLSearchParams(params);
                  p.set('page', String(Number(params.get('page') || 1) + 1));
                  router.push('/catalog?' + p.toString(), { scroll: false });
                }}
              >
                {t.load}
              </Button>
            </div>
          )}
        </div>
      </div>
      <p className="demo-note">
        {t.demo}
        {tx('. Все позиции созданы для демонстрации магазина.')}
      </p>
    </div>
  );
}
