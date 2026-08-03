import { test, expect } from '@playwright/test'
import { attachConsoleCollector, bootGame } from './helpers'

/**
 * GLB hull pipeline resilience.
 *
 * The point of these tests is the *fallback* contract: a hero model that is
 * missing or corrupt must degrade to the procedural hull for that ship without
 * taking down the R3F canvas.
 */
test.describe('Ship GLB pipeline', () => {
  test('hero models are fetched during the loading screen', async ({ page }) => {
    const requested = new Set<string>()
    page.on('request', (r) => {
      if (r.url().includes('/models/') && r.url().endsWith('.glb')) requested.add(r.url())
    })

    await bootGame(page)

    const files = [...requested].map((u) => u.split('/').pop())
    expect(files).toEqual(
      expect.arrayContaining([
        'cruise_liner.glb',
        'container_vessel.glb',
        'oil_tanker.glb',
        'fireboat.glb',
        'lng_carrier.glb',
      ]),
    )
  })

  test('missing GLBs (404) fall back to procedural hulls', async ({ page }) => {
    const collector = attachConsoleCollector(page)
    await page.route('**/models/*.glb', (route) => route.fulfill({ status: 404, body: 'missing' }))

    const canvas = await bootGame(page)
    await expect(canvas).toBeVisible()

    collector.detach()
  })

  test('corrupt GLB payloads do not blank the harbor', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    // 200 OK with garbage bytes: passes the availability probe, fails to parse.
    await page.route('**/models/*.glb', (route) =>
      route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: 'not a glb at all' }),
    )

    const canvas = await bootGame(page)
    await expect(canvas).toBeVisible()

    const shot = await canvas.screenshot()
    expect(shot.length).toBeGreaterThan(1_000)
    expect(pageErrors, `Unexpected page errors:\n${pageErrors.join('\n')}`).toHaveLength(0)
  })
})
