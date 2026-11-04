import { test, expect } from './helpers'
import { createServer, type ViteDevServer } from 'vite'

/**
 * #270 end to end: in the running game, select a cruise liner → Edit show →
 * place, move and stretch a cue on one rig group → save → close the editor →
 * start the ship's show the way the upgrade flow does → the saved cue is what
 * plays on that group (and not on its neighbour).
 *
 * Needs the real app (the editor is opened from the operator cabin), so it
 * shares show-particles.spec.ts's constraints: it skips, not fails, when there
 * is no WebGPU adapter or the app's probe shows the fatal overlay (the CI
 * default). `window.harborglowDebug` only exists in screenshot mode, hence
 * `?screenshot=1`; `harborglowDebug.lightShow` is published by the editor chunk.
 *
 * Opt in to a software adapter locally:
 *   PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_WEBGPU=1 npx playwright test e2e/light-show-editor.spec.ts
 * SwiftShader renders the scene at a few fps, so the sim clock crawls; the
 * assertion therefore watches every frame in the page instead of sampling.
 * The editor's own behaviour (drags, undo, store isolation, share) is covered
 * adapter-independently by the unit tests under src/systems/lightShows/editor.
 */
if (process.env.PLAYWRIGHT_WEBGPU) {
  test.use({
    launchOptions: {
      args: [
        '--enable-unsafe-webgpu',
        '--enable-features=Vulkan',
        '--use-vulkan=swiftshader',
        '--use-webgpu-adapter=swiftshader',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--disable-dev-shm-usage',
      ],
    },
  })
}

const GPU_ERROR = /validation|wgsl|tsl|shader|pipeline|device lost|uncaptured|webgpu.*(error|fail)|compute/i

// Mirror src/systems/lightShows/editor/timelineGeometry.ts defaults: 84 px label
// gutter, 22 px ruler, 8 rows (funnel, bridge, hullStrip, gantry, mast, deck, accent, all), 32-beat loop.
const LABEL_W = 84
const RULER_H = 22
const ROWS = 8
const LOOP_BEATS = 32
const ROW = { funnel: 0, hullStrip: 2 } as const

const CUE_COLOR = '#12ab34'

interface DebugCue {
  id: string
  beat: number
  lengthBeats: number
  target: string
  color: string
}
interface LightShowDebug {
  cues(): DebugCue[] | null
  rigGroupState(shipId: string, group: string): { color: string; pattern: string; active: boolean } | null
}
type Host = { harborglowDebug?: { lightShow?: LightShowDebug } }

test.describe('light show editor', () => {
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

  test('a cue edited and saved in the editor is what the ship plays', async ({ page }) => {
    test.setTimeout(300_000)
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && GPU_ERROR.test(msg.text())) consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => pageErrors.push(err.stack ?? err.message))

    const base = server.resolvedUrls?.local[0]
    expect(base, 'vite dev server URL').toBeTruthy()
    await page.goto(new URL('?wireframe=0&screenshot=1', base).href)
    test.skip(!(await page.evaluate(() => !!navigator.gpu)), 'navigator.gpu is absent')
    await page.getByRole('button', { name: 'New Game' }).click()

    // `harborglowDebug` exists even when the probe fails, so it is not a readiness signal: the
    // renderer stamps `canvas[data-renderer="webgpu"]` only once the scene's WebGPU renderer exists.
    const outcome = await Promise.race([
      page
        .getByTestId('webgpu-fatal-overlay')
        .waitFor({ timeout: 120_000 })
        .then(() => 'fatal' as const, () => 'pending' as const),
      page
        .locator('canvas[data-renderer="webgpu"]')
        .waitFor({ state: 'attached', timeout: 120_000 })
        .then(() => 'ready' as const, () => 'pending' as const),
    ])
    test.skip(outcome === 'fatal', 'app probe rejected this adapter (WebGPU fatal overlay)')
    expect(outcome, 'neither the WebGPU fatal overlay nor a webgpu canvas appeared within 120 s: the scene did not boot').toBe('ready')

    // Spawn a liner and select it so the cabin shows its "Edit show" button.
    const shipId = await page.evaluate(async () => {
      const spawnerUrl = '/src/systems/shipSpawner.ts'
      const storeUrl = '/src/store/useGameStore.ts'
      const { ShipSpawner } = await import(spawnerUrl)
      const { useGameStore } = await import(storeUrl)
      const ship = ShipSpawner.spawnShip('cruise')
      useGameStore.getState().setCurrentShip(ship.id)
      return ship.id as string
    })

    await page.getByTestId('edit-show-button').click()
    await expect(page.getByTestId('light-show-editor')).toBeVisible({ timeout: 30_000 })
    const canvas = page.getByTestId('le-canvas')
    await expect(canvas).toBeVisible()
    const box = (await canvas.boundingBox())!
    const ppb = (box.width - LABEL_W) / LOOP_BEATS
    const rowH = (box.height - RULER_H) / ROWS
    const X = (beat: number) => box.x + LABEL_W + beat * ppb
    const Y = (row: number) => box.y + RULER_H + (row + 0.5) * rowH
    const cues = () => page.evaluate(() => (window as unknown as Host).harborglowDebug!.lightShow!.cues())

    const factoryCount = (await cues())!.length
    expect(factoryCount, 'the editor opens on a fork of the factory show').toBeGreaterThan(0)

    // Toolbar cue: strobe, our colour, 2 beats.
    await page.getByTestId('le-pattern').selectOption('strobe')
    await page.getByTestId('le-color').fill(CUE_COLOR)

    // Place on the funnel row at beat 17, move it one beat later, stretch its end to beat 21.
    await page.mouse.click(X(17.25), Y(ROW.funnel))
    const placed = (await cues())!.find((c) => c.target === 'funnel' && c.color === CUE_COLOR)
    expect(placed, 'click placed a funnel cue in the tool colour').toBeTruthy()
    expect(placed!.beat).toBe(17)

    await page.mouse.move(X(17.5), Y(ROW.funnel))
    await page.mouse.down()
    await page.mouse.move(X(18), Y(ROW.funnel), { steps: 4 })
    await page.mouse.move(X(18.5), Y(ROW.funnel), { steps: 4 })
    await page.mouse.up()
    await page.mouse.move(X(20) - 2, Y(ROW.funnel)) // right edge of the cue: beats 18–20
    await page.mouse.down()
    await page.mouse.move(X(21), Y(ROW.funnel), { steps: 4 })
    await page.mouse.up()

    const edited = (await cues())!.find((c) => c.id === placed!.id)!
    expect(edited, 'moved to 18 and stretched to end at 21').toMatchObject({ beat: 18, lengthBeats: 3, target: 'funnel' })
    expect((await cues())!.length).toBe(factoryCount + 1)

    await page.getByTestId('le-save').click()
    await expect(page.getByTestId('le-status')).toHaveText('Saved')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('light-show-editor')).toBeHidden()

    // The editor is gone and no override remains: start the show the way the upgrade flow does and
    // watch every frame for the saved cue on the funnel (and not on the hull strip).
    await page.evaluate(async (id) => {
      const lightingUrl = '/src/systems/lightingSystem.ts'
      const { lightingSystem } = await import(lightingUrl)
      if (lightingSystem.hasShowOverride()) throw new Error('editor left a show override behind')
      lightingSystem.startHarborShow(id, 'cruise')
      const w = window as unknown as Host & { __seen?: { funnel: boolean; hullAtSame: boolean } }
      w.__seen = { funnel: false, hullAtSame: false }
      const tick = () => {
        const dbg = w.harborglowDebug!.lightShow!
        const f = dbg.rigGroupState(id, 'funnel')
        if (f && f.color === '#12ab34' && f.pattern === 'strobe') {
          w.__seen!.funnel = true
          const h = dbg.rigGroupState(id, 'hullStrip')
          if (h && h.color === '#12ab34') w.__seen!.hullAtSame = true
        }
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, shipId)

    const seen = () => page.evaluate(() => (window as unknown as { __seen: { funnel: boolean; hullAtSame: boolean } }).__seen)
    const simMs = () =>
      page.evaluate(async () => {
        const url = '/src/systems/sim/SimContext.ts'
        const { simNowMs } = await import(url)
        return simNowMs() as number
      })
    const simAtStart = await simMs()
    const deadline = Date.now() + 200_000
    while (!(await seen()).funnel && Date.now() < deadline) await page.waitForTimeout(500)
    if (!(await seen()).funnel) {
      const advanced = (await simMs()) - simAtStart
      expect(
        advanced,
        `sim clock advanced ${advanced.toFixed(0)} ms: the frame loop is stalled, so beats 18–21 (9 s of sim time at 120 BPM) never came round`,
      ).toBeGreaterThan(9_000)
    }
    expect((await seen()).funnel, 'the saved funnel cue played (strobe, saved colour)').toBe(true)
    expect((await seen()).hullAtSame, 'the cue targets the funnel only; the hull strip never took its colour').toBe(false)

    expect(consoleErrors, `GPU console errors:\n${consoleErrors.join('\n')}`).toEqual([])
    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n\n')}`).toEqual([])
  })
})
