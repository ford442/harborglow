import { test, expect } from '@playwright/test'
import { bootToFatalOverlay } from './helpers'

/**
 * GLB hull pipeline resilience.
 *
 * Hero models are preloaded during the loading screen (before the WebGPU
 * canvas boot). Canvas-dependent fallback shots are deferred with WebGL restore.
 */
test.describe('Ship GLB pipeline', () => {
  test('hero models are fetched during the loading screen', async ({ page }) => {
    const requested = new Set<string>()
    page.on('request', (r) => {
      if (r.url().includes('/models/') && r.url().endsWith('.glb')) requested.add(r.url())
    })

    await bootToFatalOverlay(page)

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

  test.skip('missing GLBs (404) fall back to procedural hulls', () => {
    // Needs a live WebGPU canvas — deferred with WebGL restore.
  })

  test.skip('corrupt GLB payloads do not blank the harbor', () => {
    // Needs a live WebGPU canvas — deferred with WebGL restore.
  })
})
