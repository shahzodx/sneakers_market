import type { PrismaClient } from '@prisma/client';
const originalRu =
  'Повседневная классика с характером. Продуманный силуэт, комфортная посадка и амортизация для твоего ритма города. Демонстрационная карточка: фотографии иллюстрируют категорию обуви, а не точную модель.';
const originalEn =
  'An everyday classic with character. A considered silhouette, comfortable fit, and cushioning for your city pace. Demo product: photos illustrate the footwear category, not the exact model.';
const originalUz =
  'Xarakterli kundalik klassika. O‘ylangan uslub, qulay moslashuv va shahar ritmingizga mos yumshoqlik. Demo mahsulot: suratlar aniq modelni emas, poyabzal turini ko‘rsatadi.';
export async function enrichDemo(db: PrismaClient) {
  const products = await db.product.findMany({
    where: { demo: true },
    include: { brand: true, translations: true, variants: true },
  });
  let refreshed = 0;
  for (const p of products) {
    // Never overwrite an administrator's custom descriptions or turn real stock into demo stock.
    if (p.description !== originalRu) continue;
    const label = p.brand.name + ' ' + p.name;
    await db.$transaction(
      async (tx) => {
        await tx.product.update({
          where: { id: p.id },
          data: {
            description: `Повседневная классика с характером. ${label} — демонстрационная подборка для городского гардероба: сочетайте пару с джинсами, широкими брюками или спортивным комплектом. Выберите EU-размер по длине стопы и проверьте доступность нужного цвета. Это демо-карточка: цена, остатки и цветовые варианты тестовые; фотографии иллюстрируют обувь и не показывают точную модель.`,
            material:
              'Демо-характеристики: точный состав верха, подкладки и подошвы необходимо подтвердить перед реальной продажей.',
          },
        });
        for (const locale of ['en', 'uz']) {
          const existing = p.translations.find((t) => t.locale === locale);
          if (existing && existing.description !== (locale === 'en' ? originalEn : originalUz))
            continue;
          const description =
            locale === 'en'
              ? `An everyday classic with character. ${label} is a demo edit for your city wardrobe. Pair it with denim, relaxed trousers, or sportswear. Choose your EU size using your foot length and check the selected color's availability. Price, inventory, and color options are test data; photographs illustrate footwear rather than this exact model.`
              : `Xarakterli kundalik klassika. ${label} — shahar garderobi uchun demo tanlov. Jinsi, erkin shim yoki sport kiyimi bilan uyg‘unlashtiring. Oyoq uzunligiga qarab EU o‘lchamni tanlang va rang mavjudligini tekshiring. Narx, qoldiq va rang variantlari sinov ma’lumotlari; suratlar aniq modelni ko‘rsatmaydi.`;
          const material =
            locale === 'en'
              ? 'Demo specifications: confirm the exact upper, lining, and sole materials before real sales.'
              : 'Demo xususiyatlar: haqiqiy savdodan oldin ustki qism, astar va taglik materiallarini tasdiqlang.';
          await tx.productTranslation.upsert({
            where: { productId_locale: { productId: p.id, locale } },
            update: { description, material },
            create: { productId: p.id, locale, name: p.name, description, material },
          });
        }
        // Demonstrate color selection on one seeded model per brand, with deterministic SKUs.
        if (
          [
            'nike-air-max-90',
            'new-balance-9060-sea-salt',
            'adidas-samba-og',
            'asics-gel-kayano-14',
            'puma-palermo',
          ].includes(p.slug)
        ) {
          for (const size of [40, 42, 44]) {
            const sku = `DEMO-${p.slug}-${size}-black`;
            await tx.productVariant.upsert({
              where: { sku },
              update: {},
              create: {
                productId: p.id,
                sku,
                size,
                color: 'black',
                colorHex: '#222222',
                inventory: { create: { quantity: 3 } },
              },
            });
          }
        }
      },
      { maxWait: 30000, timeout: 60000 },
    );
    refreshed++;
  }
  console.log('Demo catalog descriptions refreshed:', refreshed);
}
