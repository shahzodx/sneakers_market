import { db } from '@/lib/db';
import { productInclude } from '@/types/product';
import { Home } from '@/components/home';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const [products, settings] = await Promise.all([
    db.product.findMany({
      where: { archived: false },
      include: productInclude,
      orderBy: { popularity: 'desc' },
    }),
    db.setting.findMany({ where: { key: { in: ['heroTitle', 'heroImage', 'lifestyleImage'] } } }),
  ]);
  return (
    <Home
      products={products}
      heroTitle={settings.find((s) => s.key === 'heroTitle')?.value}
      heroImage={settings.find((s) => s.key === 'heroImage')?.value}
      lifestyleImage={settings.find((s) => s.key === 'lifestyleImage')?.value}
    />
  );
}
