import type { Prisma } from '@prisma/client';
export const productInclude = {
  translations: true,
  brand: true,
  category: true,
  images: { orderBy: { position: 'asc' as const } },
  variants: { include: { inventory: true } },
};
export type Product = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
