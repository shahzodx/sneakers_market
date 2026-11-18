'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  Truck,
  RotateCcw,
  ScanLine,
  ChevronRight,
  Asterisk,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useStore } from './providers';
import { Button } from './ui/button';
import { ProductCard } from './product-card';
import type { Product } from '@/types/product';
export function Home({
  products,
  heroTitle,
  heroImage = '/images/sneaker-white.jpg',
  lifestyleImage = '/images/sneaker-red.jpg',
}: {
  products: Product[];
  heroTitle?: string;
  heroImage?: string;
  lifestyleImage?: string;
}) {
  const { t, locale, tx } = useStore();
  const reduced = useReducedMotion();
  const [email, setEmail] = useState(''),
    [pending, setPending] = useState(false);
  const [brand, setBrand] = useState('all');
  const selected =
    brand === 'all'
      ? products.filter((p) => p.featured)
      : products.filter((p) => p.brand.name === brand);
  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const r = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success(tx('Вы подписаны. До встречи на следующем дропе!'));
      setEmail('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tx('Ошибка сети'));
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow">
            <i /> {t.eyebrow}
          </div>
          <motion.h1
            aria-label={(locale === 'ru' && heroTitle ? heroTitle : t.hero).replace(/\n/g, ' ')}
            initial={reduced ? false : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {(locale === 'ru' && heroTitle ? heroTitle : t.hero).split('\n').map((s, i) => (
              <span key={s} className={i === 1 ? 'stroke-text' : ''}>
                {s}
              </span>
            ))}
          </motion.h1>
          <p>{t.heroSub}</p>
          <Button asChild variant="accent">
            <Link href="/catalog">
              {t.collection}
              <ArrowUpRight size={20} />
            </Link>
          </Button>
          <Link href="/catalog?new=true" className="hero-secondary">
            {t.new}
            <ArrowRight size={17} />
          </Link>
          <div className="hero-caption">
            <span>01 — CURATED FOR YOUR EVERYDAY</span>
            <span>EST. 2026</span>
          </div>
        </div>
        <motion.div
          className="hero-image"
          initial={reduced ? false : { opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Image
            src={heroImage}
            alt={tx('Кроссовки в тёплом оранжевом свете')}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 800px) 100vw, 55vw"
          />
          <div className="hero-image-top">
            <span>THE EVERYDAY ICON</span>
            <ScanLine size={28} />
          </div>
          <div className="hero-product-label">
            <div>
              <small>SPOTLIGHT / 001</small>
              <strong>
                MAKE YOUR
                <br />
                NEXT MOVE.
              </strong>
            </div>
            <Link href="/catalog" aria-label={tx('Открыть коллекцию')}>
              <ArrowUpRight size={29} />
            </Link>
          </div>
          <span className="hero-vertical">NOT JUST SNEAKERS. A WAY OF LIFE.</span>
        </motion.div>
      </section>
      <div className="brand-marquee">
        <div>
          ALWAYS IN MOTION{' '}
          <span aria-hidden="true">
            <Asterisk size={24} />
          </span>{' '}
          FIND YOUR OWN PACE{' '}
          <span aria-hidden="true">
            <Asterisk size={24} />
          </span>{' '}
          EVERY STEP IS A STATEMENT{' '}
          <span aria-hidden="true">
            <Asterisk size={24} />
          </span>{' '}
          ALWAYS IN MOTION{' '}
          <span aria-hidden="true">
            <Asterisk size={24} />
          </span>
        </div>
      </div>
      <motion.section
        className="section container"
        initial={reduced ? false : { opacity: 0.6, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45 }}
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE ROTATION / 01</span>
            <h2>{t.popular}</h2>
            <p>{t.popularSub}</p>
          </div>
          <Link href="/catalog" className="text-link">
            {t.all}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="collection-tabs">
          {['all', 'Nike', 'Adidas', 'New Balance', 'Asics', 'Puma'].map((b) => (
            <button key={b} className={brand === b ? 'selected' : ''} onClick={() => setBrand(b)}>
              {b === 'all'
                ? locale === 'en'
                  ? 'All sneakers'
                  : locale === 'uz'
                    ? 'Barchasi'
                    : tx('Все кроссовки')
                : b}
            </button>
          ))}
        </div>
        <div className="product-grid">
          {selected.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </motion.section>
      <section className="brands-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE ORIGINALS / 02</span>
              <h2>{t.brands}</h2>
              <p>{t.brandSub}</p>
            </div>
            <span className="small-label">PICK YOUR SIDE ↘</span>
          </div>
          <div className="brands-grid">
            {['Nike', 'Adidas', 'New Balance', 'Asics', 'Puma'].map((b, i) => (
              <Link
                href={'/catalog?brand=' + encodeURIComponent(b)}
                key={b}
                className={'brand-logo brand-' + i}
              >
                <span>
                  {b === 'New Balance' ? (
                    <>
                      <b>NB</b>
                      <small>new balance</small>
                    </>
                  ) : b === 'Adidas' ? (
                    <>
                      <b>▰▰▰</b>
                      <small>adidas</small>
                    </>
                  ) : b === 'Nike' ? (
                    <>
                      <b className="nike-swoosh">✓</b>
                      <small>NIKE</small>
                    </>
                  ) : b === 'Asics' ? (
                    <b className="asics-type">asics</b>
                  ) : (
                    <b>
                      PUMA<span className="puma-star">✦</span>
                    </b>
                  )}
                </span>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="editorial">
          <div className="editorial-image">
            <Image
              src="/images/lifestyle.jpg"
              alt={tx('Кроссовки — деталь повседневного стиля')}
              fill
              sizes="(max-width: 700px) 100vw, 50vw"
            />
            <span>THE CITY IS YOURS.</span>
          </div>
          <div className="editorial-copy">
            <span className="eyebrow">CURATED COLLECTION / 03</span>
            <h2>
              {tx('ВНЕ ВРЕМЕНИ.')}
              <br />
              <span>{tx('В ТВОЁМ РИТМЕ.')}</span>
            </h2>
            <p>
              {tx(
                'Есть вещи, которые не выходят из моды. Чистые линии, узнаваемые силуэты и комфорт, к которому возвращаешься. Собрали классику, которая всегда к месту.',
              )}
            </p>
            <Button asChild>
              <Link href="/catalog?sort=popular">
                {tx('Открыть классику')}
                <ArrowUpRight size={19} />
              </Link>
            </Button>
            <div className="editorial-bottom">
              <span>EVERYDAY ESSENTIALS</span>
              <span>01 — 24</span>
            </div>
          </div>
        </div>
      </section>
      <section className="section container arrivals-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">JUST LANDED / 04</span>
            <h2>{t.arrivals}</h2>
            <p>{t.arrivalsSub}</p>
          </div>
          <Link href="/catalog?new=true" className="text-link">
            {t.all}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {products
            .filter((p) => p.isNew)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
      <section className="section container arrivals-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TRENDING NOW / 05</span>
            <h2>{tx('В фокусе')}</h2>
            <p>{tx('Силуэты, которые задают настроение прямо сейчас.')}</p>
          </div>
          <Link href="/catalog?sort=popular" className="text-link">
            {t.all}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {products.slice(8, 12).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section className="lifestyle-banner">
        <Image
          src={lifestyleImage}
          alt={tx('Выразительные красные кроссовки')}
          fill
          sizes="100vw"
        />
        <div className="container">
          <span className="eyebrow">BUILT FOR YOUR EVERYDAY.</span>
          <h2>
            {t.lifestyle.split('\n').map((s) => (
              <span key={s}>{s}</span>
            ))}
          </h2>
          <p>{t.lifestyleSub}</p>
          <Button asChild variant="accent">
            <Link href="/catalog">
              {t.collection}
              <ArrowUpRight size={20} />
            </Link>
          </Button>
        </div>
        <span className="lifestyle-number">KX / 026</span>
      </section>
      <section className="benefits container">
        <div>
          <Truck />
          <span>
            <strong>{t.delivery}</strong>
            <small>{tx('Бесплатно при заказе от 1 500 000 UZS')}</small>
          </span>
        </div>
        <div>
          <ScanLine />
          <span>
            <strong>{t.authentic}</strong>
            <small>{tx('Размер, посадка и стиль — всё имеет значение')}</small>
          </span>
        </div>
        <div>
          <RotateCcw />
          <span>
            <strong>{t.returns}</strong>
            <small>{tx('Если пара не подошла — поможем с возвратом')}</small>
          </span>
        </div>
      </section>
      <section className="newsletter container">
        <div>
          <span className="eyebrow">STAY IN THE LOOP</span>
          <h2>
            {t.newsletter.split('\n').map((s) => (
              <span key={s}>{s}</span>
            ))}
          </h2>
        </div>
        <div>
          <p>{t.newsSub}</p>
          <form onSubmit={subscribe}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.email}
              aria-label={t.email}
            />
            <button disabled={pending} aria-label={t.subscribe}>
              {pending ? '…' : <ArrowUpRight size={26} />}
            </button>
          </form>
          <small>
            {tx('Подписываясь, вы соглашаетесь с')}{' '}
            <Link href="/info?section=privacy">{tx('политикой конфиденциальности')}</Link>.
          </small>
        </div>
        <ChevronRight className="newsletter-mark" aria-hidden="true" />
      </section>
    </>
  );
}
