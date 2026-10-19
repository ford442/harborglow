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
  // A device lost to the adapter (see `render: 'canary-failed'`) surfaces as an
  // empty uncaught rejection. The spec checks page errors itself and only
  // tolerates them in that case, so adapters that can render stay strict.
  allowPageErrors: true,
  launchOptions: {
    args: [
      '--enable-unsafe-webgpu',
      '--enable-features=Vulkan',
      '--use-vulkan=swiftshader',
      '--use-webgpu-adapter=swiftshader',
      // Without ANGLE-on-SwiftShader GL, presenting to a canvas loses the WebGPU
      // device. launchOptions.args replaces the base config's args, so repeat them.
      '--use-gl=angle',
      '--use-angle=swiftshader',
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
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.stack ?? err.message))
    const r = await page.evaluate(() => (window as unknown as SmokeWindow).runGpuParticlesSmoke())
    expect(r.adapter).toBe(true)
    expect(r.aliveAfterBurst).toBe(100)
    expect(r.meanAgeAfterBurst).toBeGreaterThan(0)
    expect(r.maxY).toBeGreaterThan(10)
    expect(r.cursorWrapped).toBe(true)
    expect(r.aliveAfterWrap).toBeGreaterThan(r.capacity * 0.9)
    expect(r.aliveAfterWrap).toBeLessThanOrEqual(r.capacity)
    expect(r.allFinite).toBe(true)
    expect(r.deviceErrors).toEqual([])
    expect(r.aliveAfterIdle).toBe(0)

    // Show bindings through the real driver into the real ring (read back from the GPU).
    const { fireworks, mist } = r.bindings
    expect(fireworks.emitted).toBeGreaterThan(0)
    expect(fireworks.alive).toBe(fireworks.emitted)
    expect(fireworks.nearOrigin, 'shells burst 22 m above each funnel').toBe(fireworks.alive)
    expect(fireworks.estimate).toBe(fireworks.alive)
    expect(mist.emitted).toBeGreaterThan(0)
    expect(mist.alive).toBeGreaterThan(0)
    expect(mist.nearCannon, 'mist rises from the cannons').toBe(mist.alive)
    // Lives vary +-30% and nothing has expired yet in 1/3 s, so the estimate is exact here.
    expect(mist.estimate).toBe(mist.alive)
    if (r.render === 'canary-failed') {
      // Not a particle failure: a plain floor already lost the device (SwiftShader in current Chromium).
      test.info().annotations.push({
        type: 'note',
        description: 'adapter cannot present to a canvas; particle/laser draw not validated here',
      })
    } else {
      expect(r.render).toBe('ok')
      expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n\n')}`).toEqual([])
    }
  })
})
