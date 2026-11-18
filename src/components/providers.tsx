'use client';
import { createContext, useContext, useSyncExternalStore, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { Toaster, toast } from 'sonner';
import { translate } from '@/i18n/copy';
import { dictionaries, type Locale } from '@/i18n/dictionaries';
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  mutateStore,
  type CartItem,
} from '@/lib/browser-store';
type Store = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (typeof dictionaries)[Locale];
  cart: CartItem[];
  wishlist: string[];
  add: (item: CartItem) => void;
  update: (id: string, quantity: number) => void;
  clear: () => void;
  toggleWish: (id: string) => void;
  ready: boolean;
  tx: (text: string) => string;
};
const Context = createContext<Store | null>(null);
export function Providers({
  children,
  initialLocale = 'ru',
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [locale, setLang] = useState<Locale>(initialLocale);
  const { cart, wishlist, ready } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setCart = (fn: (old: CartItem[]) => CartItem[]) =>
    mutateStore((s) => ({ ...s, cart: fn(s.cart) }));
  const setWishlist = (fn: (old: string[]) => string[]) =>
    mutateStore((s) => ({ ...s, wishlist: fn(s.wishlist) }));
  const setLocale = (l: Locale) => {
    setLang(l);
    document.cookie = `kixo.locale=${l};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = l;
  };
  const add = (item: CartItem) => {
    setCart((old) => {
      const existing = old.find((x) => x.variantId === item.variantId);
      if (existing)
        return old.map((x) =>
          x.variantId === item.variantId
            ? { ...item, quantity: Math.min(x.quantity + item.quantity, item.stock, 10) }
            : x,
        );
      return [...old, item];
    });
    toast.success(
      locale === 'en'
        ? 'Added to your bag'
        : locale === 'uz'
          ? 'Savatga qo‘shildi'
          : 'Пара уже в корзине',
    );
  };
  const toggleWish = (id: string) => {
    const saved = !getSnapshot().wishlist.includes(id);
    setWishlist((old) => (saved ? [...new Set([...old, id])] : old.filter((x) => x !== id)));
    fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, saved }),
    })
      .then((r) => {
        if (!r.ok) toast.error(translate(locale, 'Не удалось сохранить'));
      })
      .catch(() => toast.error(translate(locale, 'Ошибка сети')));
  };
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <Context.Provider
          value={{
            tx: (text) => translate(locale, text),
            locale,
            setLocale,
            t: dictionaries[locale],
            cart,
            wishlist,
            add,
            update: (id, q) =>
              setCart((old) =>
                q <= 0
                  ? old.filter((x) => x.variantId !== id)
                  : old.map((x) =>
                      x.variantId === id ? { ...x, quantity: Math.min(q, x.stock, 10) } : x,
                    ),
              ),
            clear: () => setCart(() => []),
            toggleWish,
            ready,
          }}
        >
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </Context.Provider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error('Missing Store');
  return value;
}
