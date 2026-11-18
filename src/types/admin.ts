import type { Prisma, Brand, Category, Coupon, Setting } from '@prisma/client';
import type { Product } from './product';
export type AdminOrder = Prisma.OrderGetPayload<{
  include: { items: true; payment: true; history: true };
}>;
export type AdminData = {
  products: Product[];
  orders: AdminOrder[];
  brands: Brand[];
  categories: Category[];
  coupons: Coupon[];
  settings: Setting[];
  customers: number;
  paid: { _sum: { amount: number | null } };
};
