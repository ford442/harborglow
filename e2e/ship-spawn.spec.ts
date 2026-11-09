import { test, expect, attachConsoleCollector } from './helpers'
import type { Page } from '@playwright/test'

/**
 * #274: every ship type spawns after the physics world exists without crashing
 * the scene. Guards the PR #273 regression (`enabledRotations={undefined}` on a
 * fixed RigidBody → `undefined is not iterable` inside @react-three/rapier).
 *
 * The ErrorBoundary catches that throw, so it never becomes a `pageerror`: the
 * spec asserts on the `error-boundary` testid and on console errors instead.
 *
 * Needs a WebGPU adapter. Opt in with a software adapter:
 *   PLAYWRIGHT_WEBGPU=1 npx playwright test e2e/ship-spawn.spec.ts
 * The festival leg (act 2 spawns after act 1's rigs install) additionally needs
 * PLAYWRIGHT_FESTIVAL=1. Both skip in CI. `harborglowDebug.spawnShip` and
 * friends only exist with `?screenshot=1`.
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

interface ShipDebug {
  shipTypes: () => readonly string[]
  spawnShip: (type: string) => { id: string; name: string }
  shipCount: () => number
  setOperationMode: (mode: 'crane' | 'tugboat') => void
  removeShip: (id: string) => void
  startFestival: () => void
  installCurrentShipUpgrades: () => number
}

const NOT_ITERABLE = 'is not iterable'

async function bootScene(page: Page) {
  test.skip(!process.env.PLAYWRIGHT_WEBGPU, 'needs a WebGPU adapter: set PLAYWRIGHT_WEBGPU=1 (skips in CI)')
  await page.goto('/?wireframe=0&screenshot=1')
  const hasGpu = await page.evaluate(() => !!navigator.gpu)
  test.skip(!hasGpu, 'navigator.gpu is absent')

  await page.getByRole('button', { name: 'New Game' }).click()

  // harborglowDebug also exists on the fatal overlay, so wait for the canvas too.
  const outcome = await Promise.race([
    page
      .getByTestId('webgpu-fatal-overlay')
      .waitFor({ timeout: 120_000 })
      .then(() => 'fatal' as const, () => 'pending' as const),
    Promise.all([
      page.locator('canvas').first().waitFor({ timeout: 120_000 }),
      page.waitForFunction(
        () => typeof (window as unknown as { harborglowDebug?: Partial<ShipDebug> }).harborglowDebug?.spawnShip === 'function',
        null,
        { timeout: 120_000 },
      ),
    ]).then(() => 'ready' as const, () => 'pending' as const),
  ])
  test.skip(outcome === 'fatal', 'app probe rejected this adapter (WebGPU fatal overlay)')
  expect(outcome, 'neither the fatal overlay nor canvas + harborglowDebug.spawnShip appeared within 120 s').toBe('ready')
}

/** Call a `harborglowDebug` member in the page by name. */
const call = <K extends keyof ShipDebug>(page: Page, name: K, ...args: Parameters<ShipDebug[K]>) =>
  page.evaluate(
    ([n, a]) => {
      const d = (window as unknown as { harborglowDebug: Record<string, (...x: unknown[]) => unknown> }).harborglowDebug
      return d[n as string]!(...(a as unknown[]))
    },
    [name, args] as const,
  ) as Promise<Awaited<ReturnType<ShipDebug[K]>>>

const twoFrames = (page: Page) =>
  page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))

async function expectHealthy(page: Page, errors: string[], step: string) {
  await expect(page.getByTestId('error-boundary'), `ErrorBoundary fallback after ${step}`).toHaveCount(0)
  const hits = errors.filter((e) => e.includes(NOT_ITERABLE))
  expect(hits, `console errors containing "${NOT_ITERABLE}" after ${step}:\n${hits.join('\n')}`).toHaveLength(0)
}

test.describe('ship spawn after physics world exists', () => {
  test('every ship type spawns; mode switch and remove stay healthy', async ({ page }) => {
    test.setTimeout(180_000)
    const collector = attachConsoleCollector(page)
    await bootScene(page)

    const types = [...(await call(page, 'shipTypes'))]
    expect(types.length).toBeGreaterThan(0)
    let lastId = ''
    for (const type of types) {
      const before = await call(page, 'shipCount')
      lastId = (await call(page, 'spawnShip', type)).id
      await twoFrames(page)
      expect(await call(page, 'shipCount'), `ship count after spawning ${type}`).toBe(before + 1)
      await expectHealthy(page, collector.errors, `spawning ${type}`)
    }

    await call(page, 'setOperationMode', 'tugboat')
    await twoFrames(page)
    await expectHealthy(page, collector.errors, 'switching to tugboat')
    await call(page, 'setOperationMode', 'crane')
    await twoFrames(page)
    await expectHealthy(page, collector.errors, 'switching back to crane')

    const before = await call(page, 'shipCount')
    await call(page, 'removeShip', lastId)
    await twoFrames(page)
    expect(await call(page, 'shipCount')).toBe(before - 1)
    await expectHealthy(page, collector.errors, 'removing a ship')
    collector.detach()
  })

  test('festival act 2 spawns after act 1 rigs install', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_FESTIVAL, 'set PLAYWRIGHT_FESTIVAL=1 (with PLAYWRIGHT_WEBGPU=1) to run the festival leg')
    test.setTimeout(600_000)
    const collector = attachConsoleCollector(page)
    await bootScene(page)

    const start = await call(page, 'shipCount')
    await call(page, 'startFestival')
    await expect.poll(() => call(page, 'shipCount'), { timeout: 120_000 }).toBeGreaterThanOrEqual(start + 1)
    expect(await call(page, 'installCurrentShipUpgrades')).toBeGreaterThan(0)
    await expect.poll(() => call(page, 'shipCount'), { timeout: 480_000, intervals: [2_000] }).toBeGreaterThanOrEqual(start + 2)
    await expectHealthy(page, collector.errors, 'festival act 2 spawn')
    collector.detach()
  })
})
