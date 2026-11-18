import 'dotenv/config';
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
  await expect(page.getByText(/An everyday classic with character/)).toBeVisible();
  await page.getByRole('combobox', { name: 'Language' }).selectOption('uz');
  await expect(page.getByRole('button', { name: 'Savatga qo‘shish' })).toBeVisible();
  await expect(page.getByText(/Xarakterli kundalik klassika/)).toBeVisible();
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
      headers: { Origin: 'http://localhost:3001' },
      data: {},
    });
    expect(r.ok()).toBe(false);
  } finally {
    await db.user.deleteMany({ where: { email } });
  }
});
