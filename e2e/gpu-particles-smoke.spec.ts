import { test, expect } from './helpers'
import { createServer, type ViteDevServer } from 'vite'
import type { GpuParticlesSmokeResult } from './fixtures/gpuParticles'

/**
 * #248 GPU particle engine on a real WebGPU device: the TSL spawn / update
 * kernels compile and run, a burst lands where it was emitted and rises,
 * the ring wraps without NaNs, particles age out, and both the particle
 * sprite draw and the depth-faded laser material (MSAA on) validate.
 *
 * Same SwiftShader setup as ocean-gpu-parity.spec: the app's boot probe
 * rejects that adapter, so this drives the engine directly. Skips when the
 * runner has no adapter. It checks correctness, not performance — the 250k
 * at 60 fps acceptance is measured by hand (docs/systems/PARTICLES.md).
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

type SmokeWindow = { runGpuParticlesSmoke: () => Promise<GpuParticlesSmokeResult> }

test.describe('GPU particles smoke', () => {
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
      const fixtureUrl = '/e2e/fixtures/gpuParticles.ts'
      const mod = await import(fixtureUrl)
      ;(window as unknown as SmokeWindow).runGpuParticlesSmoke = mod.runGpuParticlesSmoke
    })
    const hasAdapter = await page.evaluate(async () => !!(await navigator.gpu?.requestAdapter()))
    test.skip(!hasAdapter, 'no WebGPU adapter on this runner')
  })

  test('kernels run, ring wraps, particles age out, draws validate', async ({ page }) => {
    test.setTimeout(120_000)
    const r = await page.evaluate(() => (window as unknown as SmokeWindow).runGpuParticlesSmoke())
    expect(r.adapter).toBe(true)
    expect(r.deviceErrors).toEqual([])
    expect(r.aliveAfterBurst).toBe(100)
    expect(r.meanAgeAfterBurst).toBeGreaterThan(0)
    expect(r.maxY).toBeGreaterThan(10)
    expect(r.cursorWrapped).toBe(true)
    expect(r.aliveAfterWrap).toBeGreaterThan(r.capacity * 0.9)
    expect(r.aliveAfterWrap).toBeLessThanOrEqual(r.capacity)
    expect(r.allFinite).toBe(true)
    expect(r.rendered).toBe(true)
    expect(r.aliveAfterIdle).toBe(0)
  })
})
