import { test, expect } from './helpers'

test.describe('Main menu', () => {
  test('shows New Game button', async ({ page }) => {
    await page.goto('/?wireframe=0')
    await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible()
  })
})
