'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ArrowUpRight } from 'lucide-react';
import { useStore } from './providers';
import { localizeProduct } from '@/i18n/product';
import type { Product } from '@/types/product';
import { money } from '@/lib/utils';
export function ProductCard({
  product: sourceProduct,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { wishlist, toggleWish, tx, locale } = useStore();
  const p = localizeProduct(sourceProduct, locale);
  const available = p.variants.some((v) => (v.inventory?.quantity || 0) > 0);
  return (
    <article className="product-card">
      <div className="product-visual">
        <Link href={'/product/' + p.slug} aria-label={p.brand.name + ' ' + p.name}>
          <Image
            src={p.images[0]?.url || '/images/sneaker-white.jpg'}
            alt={p.images[0]?.alt || p.name}
            fill
            sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            className="product-photo"
          />
          {p.images[1] && (
            <Image
              src={p.images[1].url}
              alt={p.images[1].alt}
              fill
              sizes="25vw"
              className="product-photo alternate"
            />
          )}
          <span className="card-open">
            <ArrowUpRight size={22} />
          </span>
        </Link>
        <div className="badges">
          {p.demo && <span className="badge">DEMO</span>}
          {p.isNew && <span className="badge lime">NEW DROP</span>}
          {p.oldPrice && (
            <span className="badge">−{Math.round((1 - p.price / p.oldPrice) * 100)}%</span>
          )}
          {!available && <span className="badge">SOLD OUT</span>}
        </div>
        <button
          className={'wish-button ' + (wishlist.includes(p.id) ? 'selected' : '')}
          onClick={() => toggleWish(p.id)}
          aria-label={tx('В избранное')}
          aria-pressed={wishlist.includes(p.id)}
        >
          <Heart size={19} />
        </button>
      </div>
      <div className="product-info">
        <div className="product-meta">
          <span>{p.brand.name}</span>
          <span>
            {p.gender === 'women'
              ? tx('Женские')
              : p.gender === 'men'
                ? tx('Мужские')
                : tx('Унисекс')}{' '}
            · Lifestyle
          </span>
        </div>
        <Link href={'/product/' + p.slug}>
          <h3>{p.name}</h3>
        </Link>
        <div className="product-bottom">
          <span>
            {money(p.price)} {p.oldPrice && <del>{money(p.oldPrice)}</del>}
          </span>
          <i style={{ background: p.variants[0]?.colorHex }} />
        </div>
      </div>
    </article>
  );
}
