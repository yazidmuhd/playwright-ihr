import { defineConfig, devices } from '@playwright/test';

try {
  process.loadEnvFile?.();
} catch {
  /* .env is optional (IHR_APP_DIR) */
}

const isCI = !!process.env.CI;
const port = Number(process.env.IHR_PORT ?? 8090);

// i-HR's dialogs need a reasonably tall window; see the "laptop screen" known issue
const desktopViewport = { width: 1280, height: 1000 };

// axe checks markup, which doesn't differ between browsers: run accessibility scans in Chromium only
const chromiumOnly = /accessibility\.spec\.ts/;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 3, // i-HR runs on PHP's built-in server: more parallel browsers just queue
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: isCI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],

  // Resets the test database and starts i-HR plus the mock AI service (e2e-server/start.mjs)
  webServer: {
    command: 'node e2e-server/start.mjs',
    url: `http://127.0.0.1:${port}/up`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    stdout: 'pipe',
  },

  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry', // recording every test slows a loaded machine; retries are recorded
    navigationTimeout: 20_000,
  },

  projects: [
    // Signs the HR administrator in once and saves the session for HR tests
    { name: 'setup', testMatch: /hr\.setup\.ts/ },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: desktopViewport },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testIgnore: chromiumOnly,
      use: { ...devices['Desktop Firefox'], viewport: desktopViewport },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      testIgnore: chromiumOnly,
      use: { ...devices['Desktop Safari'], viewport: desktopViewport },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      dependencies: ['setup'],
      grep: /@smoke/,
    },
  ],
});
