import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config
 *
 * - 跑 `vite preview` 起 production build、確保測到 lazy chunk + PWA service worker
 * - CI 用 1 worker、本地 fallback default
 * - 預設只跑 chromium (mobile + desktop viewport)
 */
const PORT = 4173;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'pnpm preview',
    url: `http://localhost:${PORT}/today`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
