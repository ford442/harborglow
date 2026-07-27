import { test, expect } from '@playwright/test'

/**
 * v3 → v4 save migration, end to end.
 *
 * Before v4 the game kept two ledgers: `money` on the store and
 * `harborCredits` inside the serialized economy blob. A migrated save must add
 * them together into the single wallet rather than dropping either one.
 */
test('a legacy v3 save migrates both ledgers into one wallet', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(err.message))

  await page.addInitScript(() => {
    localStorage.setItem(
      'harborglow-save-v3',
      JSON.stringify({
        ships: [],
        craneUpgrades: [],
        money: 300,
        economyData: JSON.stringify({ state: { harborCredits: 450 }, upgradeLevels: [] }),
        _meta: { version: '3.0', savedAt: '2026-01-01', type: 'game' },
      }),
    )
  })

  await page.goto('/?renderer=webgl&screenshot=1')
  await page.getByRole('button', { name: 'Continue' }).click()

  const canvas = page.locator('canvas[data-renderer="webgl"]')
  await expect(canvas).toBeVisible({ timeout: 90_000 })

  // Let the debounced save write the migrated payload.
  await page.waitForTimeout(3_000)

  const raw = await page.evaluate(() => localStorage.getItem('harborglow-save-v4'))
  expect(raw, 'expected a v4 save to be written').not.toBeNull()

  const saved = JSON.parse(raw!)
  expect(saved.harborCredits).toBe(750)
  expect('money' in saved).toBe(false)
  expect(saved._meta.version).toBe('4.0')

  expect(pageErrors, `Unexpected page errors:\n${pageErrors.join('\n')}`).toHaveLength(0)
})
