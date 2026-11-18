import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
const db = new PrismaClient();
const images = [
  '/images/sneaker-white.jpg',
  '/images/sneaker-red.jpg',
  '/images/sneaker-blue.jpg',
  '/images/sneaker-green.jpg',
  '/images/sneaker-orange.jpg',
];
const rows: [string, string, number, string, string][] = [
  ['Nike', 'Air Max 90', 1890000, 'white', 'men'],
  ['New Balance', '9060 Sea Salt', 2450000, 'white', 'unisex'],
  ['Adidas', 'Samba OG', 1590000, 'white', 'unisex'],
  ['Nike', 'Dunk Low Retro', 1790000, 'red', 'women'],
  ['New Balance', '530 Silver', 1690000, 'white', 'unisex'],
  ['Adidas', 'Gazelle Indoor', 1490000, 'green', 'women'],
  ['Nike', 'Air Force 1 ’07', 1650000, 'white', 'men'],
  ['Nike', 'Air Jordan 1 Low', 2190000, 'red', 'men'],
  ['Asics', 'GEL-Kayano 14', 2390000, 'blue', 'unisex'],
  ['Puma', 'Palermo', 1290000, 'green', 'women'],
  ['Adidas', 'Campus 00s', 1550000, 'orange', 'men'],
  ['New Balance', '2002R', 2250000, 'white', 'unisex'],
  ['Nike', 'P-6000', 1750000, 'blue', 'men'],
  ['Asics', 'GEL-NYC', 2450000, 'green', 'unisex'],
  ['Puma', 'Suede Classic', 1190000, 'red', 'men'],
  ['Adidas', 'Handball Spezial', 1650000, 'blue', 'women'],
  ['Nike', 'Zoom Vomero 5', 2350000, 'orange', 'unisex'],
  ['New Balance', '550', 1850000, 'green', 'women'],
  ['Puma', 'RS-X', 1450000, 'orange', 'unisex'],
  ['Asics', 'GT-2160', 1950000, 'white', 'men'],
  ['Adidas', 'SL 72 RS', 1350000, 'red', 'unisex'],
  ['Nike', 'V2K Run', 1890000, 'blue', 'women'],
  ['New Balance', '1906R', 2390000, 'white', 'unisex'],
  ['Puma', 'Speedcat OG', 1590000, 'red', 'unisex'],
];
async function main() {
  const category = await db.category.upsert({
    where: { slug: 'lifestyle' },
    update: {},
    create: { slug: 'lifestyle', name: 'Lifestyle' },
  });
  for (const [index, [brandName, name, price, color, gender]] of rows.entries()) {
    const brand = await db.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName, slug: brandName.toLowerCase().replaceAll(' ', '-') },
    });
    const slug = (brandName + '-' + name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-$/, '');
    const exists = await db.product.findUnique({ where: { slug } });
    if (exists) continue;
    const image = images[index % 5];
    await db.product.create({
      data: {
        name,
        slug,
        price,
        oldPrice: index % 4 === 0 ? price + 300000 : null,
        gender,
        brandId: brand.id,
        categoryId: category.id,
        featured: index < 8,
        isNew: index % 3 === 0,
        popularity: 100 - index,
        demo: true,
        description:
          'Повседневная классика с характером. Продуманный силуэт, комфортная посадка и амортизация для твоего ритма города. Демонстрационная карточка: фотографии иллюстрируют категорию обуви, а не точную модель.',
        images: {
          create: [
            { url: image, alt: brandName + ' ' + name + ' — иллюстрация', position: 0 },
            { url: images[(index + 1) % 5], alt: 'Дополнительная иллюстрация обуви', position: 1 },
          ],
        },
        variants: {
          create: [38, 39, 40, 41, 42, 43, 44, 45].map((size) => ({
            size,
            color,
            colorHex: {
              white: '#e9e6df',
              red: '#a53c37',
              blue: '#526d8e',
              green: '#62775b',
              orange: '#d28245',
            }[color],
            sku: `KX-${index + 1}-${size}`,
            inventory: { create: { quantity: size === 45 ? 0 : 5 + (index % 4) } },
          })),
        },
      },
    });
  }
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    await db.user.upsert({
      where: { email: process.env.SEED_ADMIN_EMAIL },
      update: {},
      create: {
        email: process.env.SEED_ADMIN_EMAIL,
        name: 'KIXO Admin',
        role: 'ADMIN',
        passwordHash: await hash(process.env.SEED_ADMIN_PASSWORD, 12),
      },
    });
  }
  await db.coupon.upsert({
    where: { code: 'FIRST10' },
    update: {},
    create: { code: 'FIRST10', percent: 10, minSubtotal: 500000 },
  });
  await db.setting.upsert({
    where: { key: 'heroTitle' },
    update: {},
    create: { key: 'heroTitle', value: 'ТВОЙ РИТМ.\nТВОИ ПРАВИЛА.' },
  });
  for (const product of await db.product.findMany({ where: { demo: true } })) {
    for (const locale of ['en', 'uz'])
      await db.productTranslation.upsert({
        where: { productId_locale: { productId: product.id, locale } },
        update: {},
        create: {
          productId: product.id,
          locale,
          name: product.name,
          description:
            locale === 'en'
              ? 'An everyday classic with character. A considered silhouette, comfortable fit, and cushioning for your city pace. Demo product: photos illustrate the footwear category, not the exact model.'
              : 'Xarakterli kundalik klassika. O‘ylangan uslub, qulay moslashuv va shahar ritmingizga mos yumshoqlik. Demo mahsulot: suratlar aniq modelni emas, poyabzal turini ko‘rsatadi.',
          material:
            locale === 'en'
              ? 'Leather, textile, rubber outsole'
              : 'Charm, to‘qimachilik, rezina taglik',
        },
      });
  }
  console.log('Seed complete: 24 DEMO products, FIRST10 coupon, configured admin.');
}
main().finally(() => db.$disconnect());
