import { loadTestEnvironment } from '../../scripts/test-environment';
loadTestEnvironment();
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
test.afterAll(() => db.$disconnect());
test.afterEach(async () => {
  const orders = await db.order.findMany({
    where: { address: 'E2E fixture street, building 10' },
    include: { items: true },
  });
  for (const order of orders) {
    await db.$transaction(async (tx) => {
      if (order.status !== 'CANCELLED')
        for (const item of order.items)
          await tx.inventory.update({
            where: { variantId: item.variantId },
            data: { quantity: { increment: item.quantity } },
          });
      await tx.payment.deleteMany({ where: { orderId: order.id } });
      await tx.order.delete({ where: { id: order.id } });
    });
  }
});

test('catalog search and URL filters', async ({ page }) => {
  await page.goto('/catalog');
  await page.getByPlaceholder('Найти свою пару').fill('Samba');
  await page.getByRole('button', { name: 'Найти', exact: true }).click();
  await expect(page).toHaveURL(/q=Samba/);
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-card')).toContainText('Samba');
  await page.reload();
  await expect(page.locator('.product-card')).toHaveCount(1);
});
test('size is required; guest order persists and stock decreases', async ({ page, browser }) => {
  const v = await db.productVariant.findFirstOrThrow({
    where: { size: 42, inventory: { quantity: { gt: 0 } }, product: { slug: 'nike-air-max-90' } },
    include: { inventory: true },
  });
  const before = v.inventory!.quantity;
  await page.goto('/product/nike-air-max-90');
  await page.getByRole('button', { name: 'Добавить в корзину' }).click();
  await expect(page.getByText('Сначала выберите размер EU')).toBeVisible();
  await page.getByRole('button', { name: '42', exact: true }).click();
  await page.getByRole('button', { name: 'Добавить в корзину' }).click();
  await page.goto('/cart');
  await expect(page.locator('.cart-item')).toContainText('EU 42');
  await page.reload();
  await expect(page.locator('.cart-item')).toHaveCount(1);
  await page.getByRole('link', { name: 'Оформить заказ' }).click();
  await page.getByLabel('Имя', { exact: true }).fill('Тест');
  await page.getByLabel('Фамилия').fill('Покупатель');
  await page.getByLabel('Телефон').fill('+998901234567');
  await page.getByLabel('Адрес доставки').fill('E2E fixture street, building 10');
  await page.getByRole('button', { name: 'Подтвердить заказ' }).click();
  await expect(page).toHaveURL(/\/order\//);
  await expect(page.getByRole('heading', { name: 'Отличный выбор, Тест.' })).toBeVisible();
  const id = page.url().split('/order/')[1];
  const order = await db.order.findUniqueOrThrow({
    where: { id },
    include: { items: true, payment: true },
  });
  expect(order.items[0].size).toBe(42);
  expect(order.payment?.status).toBe('PENDING');
  expect((await db.inventory.findUniqueOrThrow({ where: { variantId: v.id } })).quantity).toBe(
    before - 1,
  );
  const stranger = await browser.newContext();
  const privatePage = await stranger.newPage();
  await privatePage.goto('/order/' + id);
  await expect(privatePage.getByRole('heading', { name: 'Эта пара ушла вперёд.' })).toBeVisible();
  await expect(privatePage.locator('.order-page')).toHaveCount(0);
  await stranger.close();
  // Clean up test order and restore stock.
  await db.$transaction([
    db.inventory.update({ where: { variantId: v.id }, data: { quantity: { increment: 1 } } }),
    db.payment.delete({ where: { orderId: id } }),
    db.order.delete({ where: { id } }),
  ]);
});
test('protected admin and order privacy', async ({ page, browser }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);
  const other = await browser.newContext();
  const p = await other.newPage();
  await p.goto('/order/nonexistent-private-id');
  // Streaming responses may have HTTP 200; assert the access-denied content.
  await expect(p.getByRole('heading', { name: 'Эта пара ушла вперёд.' })).toBeVisible();
  await expect(p.locator('.order-page')).toHaveCount(0);
  await other.close();
});
test('admin login and product edit', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(process.env.SEED_ADMIN_EMAIL!);
  await page.getByLabel('Пароль', { exact: true }).fill(process.env.SEED_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page).toHaveURL(/\/account/);
  await page.goto('/admin?tab=products');
  await page.locator('tbody tr').first().getByRole('link', { name: 'Изменить' }).click();
  await expect(page.getByRole('heading', { name: /Редактировать/ })).toBeVisible();
  await page.getByRole('button', { name: 'Сохранить товар', exact: true }).click();
  await expect(page.getByText('Изменения сохранены')).toBeVisible();
});
test('mobile layout fits 320px and navigation works', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 750 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.locator('.mobile-nav').getByRole('link', { name: 'Каталог', exact: true }).click();
  await expect(page).toHaveURL(/\/catalog/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('language switching persists and product content is localized', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('en');
  await expect(page.getByRole('heading', { name: 'YOUR PACE. YOUR RULES.' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goto('/product/nike-air-max-90');
  await expect(page.getByRole('button', { name: 'Add to bag' })).toBeVisible();
  await expect(
    page.locator('#main .product-purchase').getByText(/An everyday classic with character/),
  ).toBeVisible();
  await page.getByRole('combobox', { name: 'Language' }).selectOption('uz');
  await expect(page.getByRole('button', { name: 'Savatga qo‘shish' })).toBeVisible();
  await expect(
    page.locator('#main .product-purchase').getByText(/Xarakterli kundalik klassika/),
  ).toBeVisible();
});

test('registration, customer access, profile and saved address', async ({ page }) => {
  const email = `buyer-${crypto.randomUUID()}@example.test`;
  try {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Регистрация', exact: true }).click();
    await page.getByLabel('Имя', { exact: true }).fill('Test Buyer');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Пароль', { exact: true }).fill('TestSecurePass123!');
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();
    await expect(page).toHaveURL(/\/account/);
    await page.locator('#profile').getByLabel('Имя', { exact: true }).fill('Updated Buyer');
    await page.locator('#profile').getByRole('button', { name: 'Сохранить', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Привет, Updated Buyer.' })).toBeVisible();
    await page.getByText('Добавить адрес +', { exact: true }).click();
    await page.getByLabel('Улица, дом, квартира').fill('Test avenue, building 10');
    await page.getByRole('button', { name: 'Сохранить адрес', exact: true }).click();
    await expect(page.locator('.address-card')).toContainText('Test avenue');
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Доступ ограничен' })).toBeVisible();
    const r = await page.request.post('/api/admin/upload', {
      headers: { Origin: process.env.TEST_BASE_URL || 'http://localhost:3100' },
      data: {},
    });
    expect(r.ok()).toBe(false);
  } finally {
    await db.user.deleteMany({ where: { email } });
  }
});

async function loginAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(process.env.SEED_ADMIN_EMAIL!);
  await page.getByLabel('Пароль', { exact: true }).fill(process.env.SEED_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page).toHaveURL(/\/account/);
}

test('production HTTP boundaries, coupon, idempotency and operator catalog', async ({
  request,
}) => {
  const origin = process.env.TEST_BASE_URL || 'http://localhost:3100';
  const health = await request.get('/api/health?ready=1');
  expect(health.status()).toBe(200);
  expect(health.headers()['x-powered-by']).toBeUndefined();
  expect(health.headers()['content-security-policy']).toContain("object-src 'none'");
  const denied = await request.post('/api/orders', { data: {} });
  expect(denied.status()).toBe(403);
  const invalid = await request.post('/api/register', {
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    data: '{"secret":"not-for-response",oops',
  });
  expect(invalid.status()).toBe(400);
  expect(await invalid.text()).not.toContain('not-for-response');
  const oversized = await request.post('/api/register', {
    headers: { Origin: origin },
    data: { email: 'x'.repeat(40000) },
  });
  expect(oversized.status()).toBe(413);
  const operator = await request.get('/api/operator/catalog?query=KX-1-42');
  expect(operator.ok()).toBe(true);
  expect((await operator.json()).products[0].variants[0].sku).toBe('KX-1-42');
  const v = await db.productVariant.findUniqueOrThrow({
    where: { sku: 'KX-1-42' },
    include: { inventory: true },
  });
  const items = [{ variantId: v.id, quantity: 1 }];
  const quote = await request.post('/api/cart/quote', {
    headers: { Origin: origin },
    data: { items, coupon: 'FIRST10' },
  });
  expect(quote.ok()).toBe(true);
  const totals = (await quote.json()).totals;
  expect(totals.discount).toBeGreaterThan(0);
  const payload = {
    firstName: 'Test',
    lastName: 'API',
    phone: '+998901234567',
    region: 'Ташкент',
    city: 'Ташкент',
    address: 'E2E fixture street, building 10',
    payment: 'cash',
    coupon: 'FIRST10',
    items,
    idempotencyKey: crypto.randomUUID(),
    expectedTotal: totals.total,
  };
  const stale = await request.post('/api/orders', {
    headers: { Origin: origin },
    data: { ...payload, expectedTotal: 1 },
  });
  expect(stale.status()).toBe(409);
  const a = await request.post('/api/orders', { headers: { Origin: origin }, data: payload });
  expect(a.ok()).toBe(true);
  const first = await a.json();
  const b = await request.post('/api/orders', { headers: { Origin: origin }, data: payload });
  expect((await b.json()).id).toBe(first.id);
  const changed = await request.post('/api/orders', {
    headers: { Origin: origin },
    data: { ...payload, comment: 'changed request' },
  });
  expect(changed.status()).toBe(409);
  expect((await db.inventory.findUniqueOrThrow({ where: { variantId: v.id } })).quantity).toBe(
    v.inventory!.quantity - 1,
  );
  expect((await db.order.findUniqueOrThrow({ where: { id: first.id } })).demo).toBe(true);
});

test('admin creates product, rejects stale inventory, saves translation and images, archives', async ({
  page,
}) => {
  const slug = 'qa-fixture-' + crypto.randomUUID();
  try {
    await loginAdmin(page);
    await page.goto('/admin?tab=products&edit=new');
    const create = page
      .locator('form:visible')
      .filter({ has: page.locator('input[name=slug]') })
      .filter({ has: page.locator('textarea[name=description]') });
    await create.getByLabel('Название', { exact: true }).fill('QA Fixture');
    await create.getByLabel('Slug', { exact: true }).fill(slug);
    await create.getByLabel('Цена UZS', { exact: true }).fill('1200000');
    await create
      .getByLabel('Описание', { exact: true })
      .fill('Explicit demo product created only in the isolated test database.');
    await create.getByRole('button', { name: 'Сохранить товар', exact: true }).click();
    await expect(page.getByText('Изменения сохранены')).toBeVisible();
    const product = await db.product.findUniqueOrThrow({
      where: { slug },
      include: { variants: true },
    });
    expect(product.demo).toBe(true);
    await page.goto('/admin?tab=products&edit=' + product.id);
    let stockForm = page.locator('.variants-table form:visible').first();
    const variant = product.variants[0];
    // Identify by SKU rather than relying on an unspecified relation order.
    stockForm = page
      .locator('.variants-table form:visible')
      .filter({ has: page.locator('input[name=sku][value="' + variant.sku + '"]') });
    await db.inventory.update({ where: { variantId: variant.id }, data: { quantity: 2 } });
    await stockForm.getByLabel('Остаток', { exact: true }).fill('5');
    await stockForm.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await expect(
      page.getByText('Остаток изменился после открытия формы.', { exact: false }),
    ).toBeVisible();
    expect(
      (await db.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity,
    ).toBe(2);
    await page.reload();
    stockForm = page
      .locator('.variants-table form:visible')
      .filter({ has: page.locator('input[name=sku][value="' + variant.sku + '"]') });
    await stockForm.getByLabel('Остаток', { exact: true }).fill('5');
    await stockForm.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await expect
      .poll(
        async () =>
          (await db.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity,
      )
      .toBe(5);
    const english = page
      .locator('details:visible')
      .filter({ has: page.getByText('EN — описание и материалы', { exact: true }) });
    await english.locator('summary').click();
    await english.getByLabel('Название', { exact: true }).fill('QA English Fixture');
    await english
      .getByLabel('Описание', { exact: true })
      .fill('English description saved by the protected production server action.');
    await english.getByLabel('Материалы', { exact: true }).fill('Demo material');
    await english.getByRole('button', { name: 'Сохранить перевод' }).click();
    await expect
      .poll(
        async () =>
          await db.productTranslation.count({ where: { productId: product.id, locale: 'en' } }),
      )
      .toBe(1);
    const imageForm = page.locator('form:visible').filter({ has: page.locator('input[name=url]') });
    await imageForm.getByLabel('URL', { exact: true }).fill('/images/sneaker-red.jpg');
    await imageForm.getByRole('button', { name: 'Добавить по URL' }).click();
    await expect
      .poll(async () => await db.productImage.count({ where: { productId: product.id } }))
      .toBe(2);
    const row = page.locator('tbody tr:visible').filter({ hasText: slug });
    await row.getByRole('button', { name: 'В архив', exact: true }).click();
    await expect
      .poll(async () => (await db.product.findUniqueOrThrow({ where: { slug } })).archived)
      .toBe(true);
    await page.goto('/product/' + slug);
    await expect(page.getByRole('heading', { name: 'Эта пара ушла вперёд.' })).toBeVisible();
  } finally {
    await db.product.deleteMany({ where: { slug } });
  }
});

test('wishlist writes are idempotent and newsletter really persists', async ({ page }) => {
  const email = 'newsletter-' + crypto.randomUUID() + '@example.test';
  const origin = process.env.TEST_BASE_URL || 'http://localhost:3100';
  const product = await db.product.findUniqueOrThrow({ where: { slug: 'adidas-samba-og' } });
  try {
    await loginAdmin(page);
    for (let i = 0; i < 2; i++) {
      const r = await page.request.post('/api/wishlist', {
        headers: { Origin: origin },
        data: { productId: product.id, saved: true },
      });
      expect(r.ok()).toBe(true);
    }
    const admin = await db.user.findUniqueOrThrow({
      where: { email: process.env.SEED_ADMIN_EMAIL! },
    });
    expect(await db.wishlist.count({ where: { productId: product.id, userId: admin.id } })).toBe(1);
    await page.request.post('/api/wishlist', {
      headers: { Origin: origin },
      data: { productId: product.id, saved: false },
    });
    expect(await db.wishlist.count({ where: { productId: product.id, userId: admin.id } })).toBe(0);
    const response = await page.request.post('/api/newsletter', {
      headers: { Origin: origin },
      data: { email },
    });
    expect(response.ok()).toBe(true);
    expect(await db.subscriber.count({ where: { email } })).toBe(1);
  } finally {
    await db.subscriber.deleteMany({ where: { email } });
    const admin = await db.user.findUnique({ where: { email: process.env.SEED_ADMIN_EMAIL! } });
    if (admin) await db.wishlist.deleteMany({ where: { productId: product.id, userId: admin.id } });
  }
});

test('production images, gallery keyboard and responsive layout have no runtime errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.hero-image img')).toBeVisible();
  await expect
    .poll(async () =>
      page
        .locator('.hero-image img')
        .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.goto('/product/nike-air-max-90');
  await page.getByRole('button', { name: 'Увеличить изображение' }).click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
  for (const section of ['about', 'delivery', 'returns', 'privacy', 'sizes', 'contact']) {
    const response = await page.request.get('/info?section=' + section);
    expect(response.ok()).toBe(true);
  }
  expect(errors).toEqual([]);
});
