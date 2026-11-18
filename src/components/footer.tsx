'use client';
import Link from 'next/link';
import { storeMode } from '@/lib/store-mode';
import { ArrowUpRight } from 'lucide-react';
import { useStore } from './providers';
export function Footer() {
  const { t, tx } = useStore();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Link href="/" className="logo">
              kixo<span>®</span>
            </Link>
            <p>
              {tx('Для тех, кто движется по-своему.')}
              <br />
              {tx('Ташкент, Узбекистан.')}
            </p>
            <Link href="/info?section=contact" className="text-link">
              {tx('Связаться с нами')}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div>
            <h4>{tx('Коллекция')}</h4>
            <Link href="/catalog">{t.catalog}</Link>
            <Link href="/catalog?new=true">{t.new}</Link>
            <Link href="/catalog?gender=men">{t.men}</Link>
            <Link href="/catalog?gender=women">{t.women}</Link>
          </div>
          <div>
            <h4>{tx('Помощь')}</h4>
            <Link href="/info?section=delivery">{tx('Доставка и оплата')}</Link>
            <Link href="/info?section=returns">{tx('Обмен и возврат')}</Link>
            <Link href="/info?section=sizes">{tx('Размерная сетка')}</Link>
            <Link href="/account">{tx('Мои заказы')}</Link>
          </div>
          <div>
            <h4>{tx('О KIXO')}</h4>
            <Link href="/info?section=about">{tx('Наша история')}</Link>
            <Link href="/info?section=contact">{tx('Контакты')}</Link>
            <Link href="/info?section=privacy">{tx('Конфиденциальность')}</Link>
            <span className="footer-note">UZS · Uzbekistan</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()}
            {tx('KIXO. Двигайся по-своему.')}
          </span>
          {storeMode === 'demo' && <span>{t.demo}</span>}
          <span className="payment-marks">CASH</span>
        </div>
        <div className="footer-wordmark" aria-hidden="true">
          ALWAYS IN MOTION.
        </div>
      </div>
    </footer>
  );
}
