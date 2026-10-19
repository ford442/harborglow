import { test, expect } from './helpers'
import { createServer, type ViteDevServer } from 'vite'

/**
 * #248 end to end: boot the real app on a WebGPU adapter, start the cruise
 * factory show, and watch the show-particle counter go from idle to emitting.
 *
 * The cruise show's fireworks open at beat 24 of its 32-beat loop (12 s at
 * 120 BPM), so this waits for sim time, not a fixed sleep. Zero uncaught page
 * errors and zero WebGPU / TSL console errors are required throughout.
 *
 * Runs against a Vite dev server rather than the preview build so the page can
 * import the same module instances the app uses (`/src/...`) and start a show
 * the way the UI does: ShipSpawner.spawnShip + lightingSystem.startHarborShow.
 * There is no dedicated debug hook for that.
 *
 * Skips (not fails) when there is no WebGPU adapter, or when the app's own
 * probe sends it to the fatal overlay (the CI default: headless Chromium has no
 * adapter). `window.harborglowDebug` only exists in screenshot mode, hence
 * `?screenshot=1`.
 *
 * Opt in to a software adapter locally with `PLAYWRIGHT_WEBGPU=1`:
 *   PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_WEBGPU=1 npx playwright test e2e/show-particles.spec.ts
 * SwiftShader renders the whole scene at a few fps, so the sim clock crawls and
 * the spec can take minutes; on a real GPU it needs ~15 s. If the sim clock does
 * not advance at all the spec fails with that diagnosis rather than a bare poll
 * timeout, because "no particles" would otherwise be misread as a particle bug.
 * (The engine itself is covered adapter-independently by gpu-particles-smoke.)
 */
if (process.env.PLAYWRIGHT_WEBGPU) {
  test.use({
    launchOptions: {
      args: [
        '--enable-unsafe-webgpu',
        '--enable-features=Vulkan',
        '--use-vulkan=swiftshader',
        '--use-webgpu-adapter=swiftshader',
        // Without ANGLE-on-SwiftShader GL, presenting to a canvas loses the WebGPU device.
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--disable-dev-shm-usage',
      ],
    },
  })
}

interface ShowParticlesStats {
  budget: number
  alive: number
  emitters: number
}

/** Console errors that mean the GPU path is broken (React key warnings and the like are not). */
const GPU_ERROR = /validation|wgsl|tsl|shader|pipeline|device lost|uncaptured|webgpu.*(error|fail)|compute/i

test.describe('show particles', () => {
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

  test('cruise show emits fireworks on the GPU', async ({ page }) => {
    test.setTimeout(240_000)
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && GPU_ERROR.test(msg.text())) consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => pageErrors.push(err.stack ?? err.message))

    const base = server.resolvedUrls?.local[0]
    expect(base, 'vite dev server URL').toBeTruthy()
    await page.goto(new URL('?wireframe=0&screenshot=1', base).href)
    const hasGpu = await page.evaluate(() => !!navigator.gpu)
    test.skip(!hasGpu, 'navigator.gpu is absent')

    await page.getByRole('button', { name: 'New Game' }).click()

    // The engine publishes its counter once it has initialised; the fatal overlay means no WebGPU.
    const outcome = await Promise.race([
      page.getByTestId('webgpu-fatal-overlay').waitFor({ timeout: 120_000 }).then(() => 'fatal' as const),
      page
        .waitForFunction(() => !!(window as unknown as { harborglowDebug?: { showParticles?: unknown } }).harborglowDebug?.showParticles, null, {
          timeout: 120_000,
        })
        .then(() => 'ready' as const),
    ])
    test.skip(outcome === 'fatal', 'app probe rejected this adapter (WebGPU fatal overlay)')

    const read = () =>
      page.evaluate(
        () => (window as unknown as { harborglowDebug: { showParticles: ShowParticlesStats } }).harborglowDebug.showParticles,
      )

    const idle = await read()
    expect(idle.budget).toBeGreaterThan(0)
    expect(idle.alive).toBe(0)
    expect(idle.emitters).toBe(0)

    await page.evaluate(async () => {
      // Via variables so bundlers / knip don't try to resolve them: these are dev-server URLs.
      const spawnerUrl = '/src/systems/shipSpawner.ts'
      const lightingUrl = '/src/systems/lightingSystem.ts'
      const { ShipSpawner } = await import(spawnerUrl)
      const { lightingSystem } = await import(lightingUrl)
      const ship = ShipSpawner.spawnShip('cruise')
      lightingSystem.startHarborShow(ship.id, 'cruise')
    })

    const simMs = () =>
      page.evaluate(async () => {
        const url = '/src/systems/sim/SimContext.ts'
        const { simNowMs } = await import(url)
        return simNowMs() as number
      })
    const simAtStart = await simMs()

    // Sim time, not wall time: fireworks open at beat 24 (12 s at 120 BPM).
    const deadline = Date.now() + 150_000
    let emitters = 0
    while (emitters === 0 && Date.now() < deadline) {
      await page.waitForTimeout(500)
      emitters = (await read()).emitters
    }
    if (emitters === 0) {
      const advanced = (await simMs()) - simAtStart
      expect(
        advanced,
        `sim clock advanced ${advanced.toFixed(0)} ms in 150 s of wall time: the frame loop is stalled ` +
          `(software rendering?), so the cruise fireworks window (12 s of sim time) never opened`,
      ).toBeGreaterThan(12_000)
      expect(emitters, 'sim passed the fireworks window but no emitter went live').toBeGreaterThan(0)
    }
    await expect
      .poll(async () => (await read()).alive, { timeout: 30_000, intervals: [250] })
      .toBeGreaterThan(0)

    const live = await read()
    expect(live.alive).toBeLessThanOrEqual(live.budget)

    expect(consoleErrors, `GPU console errors:\n${consoleErrors.join('\n')}`).toEqual([])
    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n\n')}`).toEqual([])
  })
})
