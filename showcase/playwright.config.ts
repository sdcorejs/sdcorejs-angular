import { defineConfig, devices } from '@playwright/test';

// E2E of the Showcase in two browser zones. ISdCoreConfiguration.timeZone results must not depend on
// the zone of the machine, so every scenario runs once as a Bangkok browser and once as a UTC one.
const PORT = 4321;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'asia-bangkok', use: { ...devices['Desktop Chrome'], timezoneId: 'Asia/Bangkok' } },
    { name: 'utc', use: { ...devices['Desktop Chrome'], timezoneId: 'UTC' } },
  ],
  webServer: {
    // prestart copies the built library into the Showcase (npm run link:library).
    // why: with Vite prebundling the dev server loads @sdcorejs/angular twice (NG0912), so the
    // SD_CORE_CONFIGURATION of app.config.ts and the one SdDateTimeService injects are different tokens.
    command: `npm run start -- --port ${PORT} --prebundle=false`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 300_000,
  },
});
