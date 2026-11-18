import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const products = await db.product.findMany({
    where: { archived: false },
    select: { slug: true, createdAt: true },
  });
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: base + '/catalog', changeFrequency: 'daily', priority: 0.9 },
    ...products.map((p) => ({
      url: base + '/product/' + p.slug,
      lastModified: p.createdAt,
      priority: 0.7,
    })),
  ];
}
