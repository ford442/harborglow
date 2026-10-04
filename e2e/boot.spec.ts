import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from './helpers'

/**
 * gate-boot: proves the production bundle evaluates.
 *
 * From 2026-09-27 to 2026-10-04 main shipped a build whose vendor chunks formed
 * an import cycle: `GLTFLoader extends Loader` ran before `Loader` existed, the
 * entry threw at module evaluation, and the page stayed blank. Every merge gate
 * was green. This spec is the merge gate that would have gone red.
 *
 * Headless CI has no WebGPU, so nothing here touches the canvas or asserts the
 * audio runtime's status (it may legitimately fall back).
 */

/** Console errors that mean module evaluation order broke (TDZ, chunk cycle). */
const EVAL_ORDER_ERROR = /is not a constructor|extends value|Cannot access|before initialization/

function collectBootErrors(page: import('@playwright/test').Page) {
  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(err.stack ?? err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error' && EVAL_ORDER_ERROR.test(msg.text())) {
      consoleErrors.push(msg.text())
    }
  })
  return { pageErrors, consoleErrors }
}

test('production bundle boots to the main menu', async ({ page }) => {
  const { pageErrors, consoleErrors } = collectBootErrors(page)

  await page.goto('/')
  await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible({ timeout: 30_000 })

  const hasAudioRuntime = await page.evaluate(
    () => typeof (window as unknown as { harborglowAudioRuntime?: unknown }).harborglowAudioRuntime === 'object',
  )
  expect(hasAudioRuntime, 'window.harborglowAudioRuntime must be published by the entry graph').toBe(true)

  expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n\n')}`).toHaveLength(0)
  expect(consoleErrors, `Module-evaluation errors:\n${consoleErrors.join('\n')}`).toHaveLength(0)
})

/**
 * The menu only evaluates the entry's static graph. Lazy chunks (GameShell,
 * MainScene, vendor-3d-rapier, ...) can carry the same cycle and only blow up
 * after "New Game" on a WebGPU machine, which CI does not have. Import every
 * emitted chunk directly so each one's module evaluation is exercised here.
 */
const distAssets = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'assets')

test('every emitted JS chunk evaluates', async ({ page }) => {
  test.skip(
    !!process.env.PLAYWRIGHT_BASE_URL || !existsSync(distAssets),
    'needs the local dist/ that the preview server is serving',
  )
  const chunks = readdirSync(distAssets)
    .filter((name) => name.endsWith('.js'))
    // AudioWorklet processor code calls registerProcessor(), which only exists
    // inside an AudioWorkletGlobalScope.
    .filter((name) => !readFileSync(join(distAssets, name), 'utf8').includes('registerProcessor('))
  expect(chunks.length).toBeGreaterThan(0)

  const { pageErrors, consoleErrors } = collectBootErrors(page)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible({ timeout: 30_000 })

  const failures = await page.evaluate(async (names) => {
    const failed: string[] = []
    for (const name of names) {
      try {
        await import(/* @vite-ignore */ `./assets/${name}`)
      } catch (err) {
        failed.push(`${name}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    return failed
  }, chunks)

  expect(failures, `Chunks that failed to evaluate:\n${failures.join('\n')}`).toHaveLength(0)
  expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n\n')}`).toHaveLength(0)
  expect(consoleErrors, `Module-evaluation errors:\n${consoleErrors.join('\n')}`).toHaveLength(0)
})
