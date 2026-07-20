import { test, expect } from '@playwright/test'
import { bootGame, countPixelDiff } from './helpers'

test.describe('Visual regression (WebGL2 / software rasterizer)', () => {
  test('harbor overview canvas matches snapshot', async ({ page }) => {
    const canvas = await bootGame(page)
    await expect(canvas).toHaveScreenshot('harbor-overview.png', {
      maxDiffPixelRatio: 0.05,
    })
  })

  test('wireframe toggle (G) changes rendered pixels', async ({ page }) => {
    const canvas = await bootGame(page)

    const before = await canvas.screenshot()
    await page.keyboard.press('g')
    await expect(page).toHaveURL(/wireframe=1/)
    await page.waitForTimeout(750)
    const after = await canvas.screenshot()

    expect(before.equals(after)).toBe(false)

    if (before.length === after.length) {
      const diffPixels = countPixelDiff(before, after)
      const totalPixels = before.length / 4
      const diffRatio = diffPixels / totalPixels
      expect(
        diffRatio,
        `Expected wireframe overlay to change canvas pixels (diff ratio ${diffRatio.toFixed(4)})`,
      ).toBeGreaterThan(0.01)
    }
  })
})
