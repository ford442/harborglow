import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PLAYWRIGHT_PORT ?? '4173'
const HOST = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1'

/**
 * Always exercise the WebGL2 debug renderer in headless CI/agents.
 * Query params are appended by goto('/') via baseURL.
 */
const query = 'renderer=webgl&wireframe=0'
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://${HOST}:${PORT}/?${query}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
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
