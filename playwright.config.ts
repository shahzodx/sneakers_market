import { defineConfig, devices } from '@playwright/test';
import { loadTestEnvironment } from './scripts/test-environment';
loadTestEnvironment();
const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3100';
const port = new URL(baseURL).port || '3100';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'off',
    launchOptions: process.env.CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run start -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
