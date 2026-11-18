'use client';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/components/providers';
import { calculateTotals } from '@/lib/validation';
type Quote = {
  totals: ReturnType<typeof calculateTotals>;
  items: { variantId: string; price: number; stock: number }[];
};
export function useCartQuote(coupon = '') {
  const { cart, ready } = useStore();
  const items = cart.map(({ variantId, quantity }) => ({ variantId, quantity }));
  return useQuery<Quote>({
    queryKey: ['cart-quote', items, coupon],
    enabled: ready && cart.length > 0,
    staleTime: 15000,
    retry: 1,
    queryFn: async () => {
      const r = await fetch('/api/cart/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, coupon }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Не удалось проверить корзину');
      return d;
    },
  });
}
