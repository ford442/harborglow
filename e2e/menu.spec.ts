import { test, expect } from '@playwright/test'

test.describe('Main menu', () => {
  test('shows New Game button', async ({ page }) => {
    await page.goto('/?renderer=webgl&wireframe=0')
    await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible()
  })
})
