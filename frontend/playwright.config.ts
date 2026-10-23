import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const CI = !!process.env.CI

// the same viewport/timezone matrix is applied to every spec; see e2e/timezones.spec.ts for zone-specific checks
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /timezones/ },
  ],
  // production build, so dev-only demo friends and devtools are absent
  webServer: {
    command: `npm run build-only && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // .env.production points at the real server; the suite talks to the FakeApi on this origin instead
    env: { VITE_API_URL: 'http://localhost:3000' },
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
