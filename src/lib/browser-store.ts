import { z } from 'zod';
export const cartItemSchema = z.object({
  variantId: z.string(),
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  image: z.string(),
  size: z.number().int(),
  color: z.string(),
  price: z.number().int().nonnegative(),
  quantity: z.number().int().min(1).max(10),
  stock: z.number().int().nonnegative(),
});
export type CartItem = z.infer<typeof cartItemSchema>;
type Snapshot = { cart: CartItem[]; wishlist: string[]; ready: boolean };
const empty: Snapshot = { cart: [], wishlist: [], ready: false };
let snapshot = empty;
const listeners = new Set<() => void>();
const key = 'kixo.store.v1';
function read() {
  try {
    const parsed = z
      .object({ cart: z.array(cartItemSchema), wishlist: z.array(z.string()) })
      .safeParse(JSON.parse(localStorage.getItem(key) || '{}'));
    snapshot = parsed.success
      ? { ...parsed.data, ready: true }
      : { cart: [], wishlist: [], ready: true };
  } catch {
    snapshot = { cart: [], wishlist: [], ready: true };
  }
}
function emit() {
  listeners.forEach((fn) => fn());
}
export function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!snapshot.ready) {
    read();
    emit();
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) {
      read();
      emit();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}
export function getSnapshot() {
  return snapshot;
}
export function getServerSnapshot() {
  return empty;
}
export function mutateStore(update: (previous: Snapshot) => Snapshot) {
  snapshot = update(snapshot);
  try {
    localStorage.setItem(key, JSON.stringify({ cart: snapshot.cart, wishlist: snapshot.wishlist }));
  } catch {
    /* Memory state remains usable if storage is unavailable. */
  }
  emit();
}
