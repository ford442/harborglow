import { test, expect } from '@playwright/test'
import { createServer, type ViteDevServer } from 'vite'
import type { OceanGpuParityResult } from './fixtures/oceanGpuParity'

/**
 * ADR 0001 Phase C buoyancy contract, on a real WebGPU device: the WGSL
 * Stockham IFFT texture must equal the CPU OceanFFTField grid that hull
 * probes read (to half-float precision), and a broken shader must latch the
 * GPU path off instead of leaving a flat ocean.
 *
 * Chromium's bundled SwiftShader Vulkan exposes a WebGPU adapter when asked
 * explicitly. The app's boot probe still rejects it (see webgpu-probe.spec),
 * which is fine: this spec drives OceanFFTCompute directly. Skips when the
 * runner has no adapter at all.
 */
test.use({
  launchOptions: {
    args: [
      '--enable-unsafe-webgpu',
      '--enable-features=Vulkan',
      '--use-vulkan=swiftshader',
      '--use-webgpu-adapter=swiftshader',
      '--disable-dev-shm-usage',
    ],
  },
})

/** Half-float step is 2^-9 m for |h| in [2, 4); leave headroom for rounding. */
const HALF_FLOAT_TOLERANCE_M = 5e-3

type ParityWindow = {
  runOceanGpuParity: (size: number, time: number, breakWgsl?: boolean) => Promise<OceanGpuParityResult>
}

test.describe('ocean FFT GPU parity', () => {
  let server: ViteDevServer

  test.beforeAll(async () => {
    server = await createServer({
      server: { host: '127.0.0.1', port: 0, strictPort: false, hmr: false },
      logLevel: 'error',
    })
    await server.listen()
  })

  test.afterAll(async () => {
    await server?.close()
  })

  test.beforeEach(async ({ page }) => {
    const base = server.resolvedUrls?.local[0]
    expect(base, 'vite dev server URL').toBeTruthy()
    // Any same-origin non-app URL: localhost is a secure context for navigator.gpu.
    await page.goto(new URL('wasm/manifest.json', base).href)
    await page.evaluate(async () => {
      // A browser URL on the Vite server, not a Node module path.
      const fixtureUrl = '/e2e/fixtures/oceanGpuParity.ts'
      const mod = await import(fixtureUrl)
      ;(window as unknown as ParityWindow).runOceanGpuParity = mod.runOceanGpuParity
    })
    const hasAdapter = await page.evaluate(async () => !!(await navigator.gpu?.requestAdapter()))
    test.skip(!hasAdapter, 'no WebGPU adapter on this runner')
  })

  for (const [size, time] of [[128, 3.7], [256, 12.25]] as const) {
    test(`WGSL displacement matches the CPU hull grid at ${size}²`, async ({ page }) => {
      const result = await page.evaluate(
        ([s, t]) => (window as unknown as ParityWindow).runOceanGpuParity(s, t),
        [size, time] as const,
      )
      expect(result.initOk).toBe(true)
      expect(result.dispatched).toBe(true)
      expect(result.deviceErrors).toEqual([])
      // Guard against a trivially flat field passing the comparison.
      expect(result.maxAbsHeight).toBeGreaterThan(0.5)
      expect(result.maxErrHeight).toBeLessThan(HALF_FLOAT_TOLERANCE_M)
      expect(result.maxErrDisp).toBeLessThan(HALF_FLOAT_TOLERANCE_M)
    })
  }

  test('invalid WGSL latches the GPU path off at init', async ({ page }) => {
    const result = await page.evaluate(() =>
      (window as unknown as ParityWindow).runOceanGpuParity(128, 1, true),
    )
    expect(result.initOk).toBe(false)
    expect(result.dispatched).toBe(false)
  })
})
