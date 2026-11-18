'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Search,
  Heart,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';
import { useStore } from './providers';
import type { Locale } from '@/i18n/dictionaries';
export function Header() {
  const { t, locale, setLocale, cart, wishlist, tx } = useStore();
  const [menu, setMenu] = useState(false),
    [search, setSearch] = useState(false),
    [q, setQ] = useState('');
  const path = usePathname(),
    router = useRouter();
  const links = [
    [t.home, '/'],
    [t.catalog, '/catalog'],
    [t.new, '/catalog?new=true'],
    [t.men, '/catalog?gender=men'],
    [t.women, '/catalog?gender=women'],
  ];
  return (
    <>
      <div className="announcement">
        <span>{tx('СВОЙ СТИЛЬ. СВОЙ KIXO.')}</span>
        <span>
          {t.delivery} <ArrowUpRight size={12} />
        </span>
        <span>{tx('Бесплатно от 1 500 000 UZS')}</span>
      </div>
      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="logo" aria-label={tx('KIXO — главная')}>
            kixo<span>®</span>
          </Link>
          <nav className="desktop-nav">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className={path === href ? 'active' : ''}>
                {label}
                {href.includes('new') && <i />}
              </Link>
            ))}
          </nav>
          <div className="header-tools">
            <select
              aria-label="Language"
              value={locale}
              onChange={(e) => {
                setLocale(e.target.value as Locale);
                router.refresh();
              }}
            >
              <option value="ru">RU</option>
              <option value="uz">UZ</option>
              <option value="en">EN</option>
            </select>
            <button aria-label={t.search} onClick={() => setSearch(!search)}>
              <Search />
            </button>
            <Link href="/wishlist" aria-label={t.favorites} className="wishlist-icon">
              <Heart />
              {wishlist.length > 0 && <b>{wishlist.length}</b>}
            </Link>
            <Link href="/account" aria-label={t.account} className="account-icon">
              <UserRound />
            </Link>
            <Link href="/cart" aria-label={t.cart} className="bag-icon">
              <ShoppingBag />
              <b>{cart.reduce((a, x) => a + x.quantity, 0)}</b>
            </Link>
            <button
              className="mobile-toggle"
              onClick={() => setMenu(!menu)}
              aria-label="Menu"
              aria-expanded={menu}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {search && (
          <form
            className="search-bar container"
            onSubmit={(e) => {
              e.preventDefault();
              router.push('/catalog?q=' + encodeURIComponent(q));
              setSearch(false);
            }}
          >
            <Search />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search}
              aria-label={t.search}
            />
            <button aria-label="Search">
              <ArrowRight />
            </button>
            <button type="button" onClick={() => setSearch(false)} aria-label="Close">
              <X />
            </button>
          </form>
        )}
        {menu && (
          <nav className="mobile-nav">
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMenu(false)}>
                {label}
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
