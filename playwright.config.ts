import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PLAYWRIGHT_PORT ?? '4173'
const HOST = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1'

/**
 * Headless CI has no WebGPU. Force-GL URL flags are disabled this phase;
 * tests that need a scene assert the fatal overlay instead of a GL harbor.
 */
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://${HOST}:${PORT}/`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // e2e-visual is the broad suite; one retry keeps a fully red run inside the
  // job timeout so GitHub reports "failed", not "cancelled". The boot project
  // below overrides this with zero retries.
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    launchOptions: {
      args: [
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--disable-dev-shm-usage',
      ],
    },
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
      timeout: 15_000,
    },
  },
  projects: [
    // gate-boot (a merge gate): does the production bundle evaluate at all?
    // A chunk cycle in the vendor split once left main blank-at-boot for a
    // week while every other gate stayed green. Fast and never retried.
    {
      name: 'boot',
      testMatch: /(^|[\\/])boot\.spec\.ts$/,
      timeout: 60_000,
      retries: 0,
    },
    // Unnamed so existing snapshot paths ({projectName} = '') stay valid.
    {
      testIgnore: /(^|[\\/])boot\.spec\.ts$/,
    },
  ],
  snapshotPathTemplate:
    '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `npm run preview -- --host ${HOST} --port ${PORT}`,
        url: `http://${HOST}:${PORT}/`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
