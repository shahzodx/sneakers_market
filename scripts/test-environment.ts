import { config } from 'dotenv';
import { resolve } from 'node:path';
export function loadTestEnvironment() {
  config({ path: resolve('.env.test.local'), quiet: true });
  const raw = process.env.TEST_DATABASE_URL;
  if (!raw)
    throw new Error('TEST_DATABASE_URL is required. Tests never use the application DATABASE_URL.');
  const url = new URL(raw);
  if (
    !['localhost', '127.0.0.1', '::1', '[::1]', 'db-test'].includes(url.hostname) ||
    !url.pathname.slice(1).endsWith('_test')
  ) {
    throw new Error(
      'Destructive tests require a local PostgreSQL database whose name ends with _test.',
    );
  }
  process.env.DATABASE_URL = raw;
  process.env.NEXTAUTH_URL = process.env.TEST_BASE_URL || 'http://localhost:3100';
  process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXTAUTH_URL;
  process.env.NEXTAUTH_SECRET = 'isolated-test-secret-not-for-production-123456789';
  process.env.SEED_ADMIN_EMAIL = 'admin@kixo.test';
  process.env.SEED_ADMIN_PASSWORD = 'Isolated-Test-Admin-123!';
  process.env.APP_MODE = 'demo';
  process.env.TRUST_PROXY = 'false';
}
