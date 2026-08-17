import { test, expect } from '@playwright/test'
import { bootToFatalOverlay } from './helpers'

test.describe('WebGPU boot probe', () => {
  test('failed probe hard-fails with overlay JSON and no WebGL scene', async ({ page }) => {
    const overlay = await bootToFatalOverlay(page)

    await expect(overlay).toContainText('WebGPU required')

    const probe = await page.evaluate(() => {
      return (window as unknown as { webgpuProbe?: { ok: boolean; reason: string | null; browser: { brand: string } } }).webgpuProbe
    })
    expect(probe, 'window.webgpuProbe must be published').toBeTruthy()
    expect(probe?.ok).toBe(false)
    expect(probe?.browser.brand).toBeTruthy()

    await expect(page.locator('canvas[data-active-backend="webgl"]')).toHaveCount(0)
    await expect(page.locator('canvas[data-renderer="webgl"]')).toHaveCount(0)
    await expect(page.locator('canvas[data-active-backend="webgl2-fallback"]')).toHaveCount(0)
  })
})
