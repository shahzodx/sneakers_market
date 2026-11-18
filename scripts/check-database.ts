import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const configured = new URL(process.env.DATABASE_URL || '');
  const [products, variants, users, orders, tables] = await Promise.all([
    db.product.count(),
    db.productVariant.count(),
    db.user.count(),
    db.order.count(),
    db.$queryRaw<{ tablename: string; rowsecurity: boolean }[]>`
      SELECT tablename, rowsecurity FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN
      ('User', 'Product', 'Order', 'Payment', 'Address', 'Subscriber', '_prisma_migrations')
      ORDER BY tablename
    `,
  ]);
  console.log(
    JSON.stringify(
      {
        host: configured.hostname,
        database: configured.pathname.slice(1),
        counts: { products, variants, users, orders },
        privateTablesProtected: tables.length === 7 && tables.every((t) => t.rowsecurity),
      },
      null,
      2,
    ),
  );
}
main()
  .catch(() => {
    console.error(
      'Database check failed. Check DATABASE_URL and database availability. Credentials are omitted.',
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
