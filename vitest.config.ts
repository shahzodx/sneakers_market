import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { loadTestEnvironment } from './scripts/test-environment';
loadTestEnvironment();
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    testTimeout: 20000,
    env: { NODE_ENV: 'test' },
  },
});
