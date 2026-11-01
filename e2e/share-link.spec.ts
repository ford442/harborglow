import { test, expect } from './helpers'
import { encodeShow, toBase64Url } from '../src/systems/share/showCodec'
import type { ShowDocument } from '../src/schemas/showDocument'

/**
 * Share links (#hgshow=...) and .hgshow files. Headless CI has no WebGPU, so
 * these cover everything up to "Click to watch": decode, splash, errors, file
 * import, and that opening a link never touches the viewer's save. Playback
 * itself is covered by the unit tests (hash acceptance) and needs a WebGPU runner.
 */

const SAVE_KEY = 'harborglow-save-v4'

const doc: ShowDocument = {
  v: 1,
  shipType: 'cruise',
  trackId: 'cruise',
  loopBeats: 8,
  cues: [
    { id: 'cruise:0', beat: 0, lengthBeats: 4, target: 'all', pattern: 'breathe', color: '#33ccff', intensity: 0.8, easing: 'step' },
    { id: 'cruise:1', beat: 4, lengthBeats: 4, target: 'all', pattern: 'strobe', color: '#ff33aa', intensity: 1, easing: 'step' },
  ],
}

test.describe('Share links', () => {
  test('a valid link opens the splash and leaves the viewer save alone', async ({ page }) => {
    const bytes = await encodeShow(doc)
    await page.addInitScript((key) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, 'sentinel-save')
    }, SAVE_KEY)

    await page.goto(`/#hgshow=${toBase64Url(bytes)}`)

    await expect(page.getByTestId('shared-show-splash')).toContainText('cruise')
    await expect(page.getByRole('button', { name: 'Click to watch' })).toBeVisible()
    // The fragment is consumed so a reload doesn't re-open the link.
    expect(new URL(page.url()).hash).toBe('')
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe('sentinel-save')

    await page.getByRole('button', { name: 'Back to menu' }).click()
    await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible()
  })

  test('a corrupted link shows an error and can return to the menu', async ({ page }) => {
    const bytes = await encodeShow(doc)
    for (let i = 8; i < bytes.length; i += 3) bytes[i] ^= 0xff

    await page.goto(`/#hgshow=${toBase64Url(bytes)}`)

    await expect(page.getByTestId('shared-show-error')).toBeVisible()
    await page.getByRole('button', { name: 'Back to menu' }).click()
    await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible()
  })

  test('a link that is not base64url shows an error', async ({ page }) => {
    await page.goto('/#hgshow=%%%not-a-show%%%')
    await expect(page.getByTestId('shared-show-error')).toBeVisible()
  })

  test('opens a .hgshow file from the main menu', async ({ page }) => {
    const bytes = await encodeShow(doc)
    await page.goto('/')
    await page.getByTestId('hgshow-file-input').setInputFiles({
      name: 'cruise.hgshow',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from(bytes),
    })
    await expect(page.getByTestId('shared-show-splash')).toContainText('cruise')
  })

  test('rejects a file that is not a show', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('hgshow-file-input').setInputFiles({
      name: 'nope.hgshow',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('definitely not a show'),
    })
    await expect(page.getByTestId('shared-show-error')).toBeVisible()
  })
})
