import { serializeJsonLd } from '@/lib/utils';
import { localizeProduct } from '@/i18n/product';
import { getLocale } from '@/i18n/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { productInclude } from '@/types/product';
import { ProductDetail } from '@/features/product-detail';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await db.product.findUnique({
    where: { slug },
    include: { brand: true, images: true, translations: true },
  });
  const locale = await getLocale();
  const translation = p?.translations.find((t) => t.locale === locale);
  return {
    title: p ? `${p.brand.name} ${translation?.name || p.name}` : 'Товар не найден',
    description: translation?.description || p?.description,
    openGraph: { images: p?.images.map((x) => x.url) },
  };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await db.product.findUnique({ where: { slug }, include: productInclude });
  if (!p || p.archived) notFound();
  const related = await db.product.findMany({
    where: { archived: false, id: { not: p.id } },
    include: productInclude,
    take: 4,
    orderBy: { popularity: 'desc' },
  });
  const localized = localizeProduct(p, await getLocale());
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.brand.name + ' ' + localized.name,
    description: localized.description,
    image: p.images.map(
      (i) => new URL(i.url, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').href,
    ),
    brand: { '@type': 'Brand', name: p.brand.name },
    offers: {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: 'UZS',
      availability: p.variants.some((v) => v.inventory?.quantity)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(json) }}
      />
      <ProductDetail product={p} related={related} />
    </>
  );
}
