import { expect, type Locator, type Page } from '@playwright/test'

export type ConsoleCollector = {
  errors: string[]
  detach: () => void
}

/** Collect console errors and uncaught page errors for the lifetime of a test. */
export function attachConsoleCollector(page: Page): ConsoleCollector {
  const errors: string[] = []

  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  }
  const onPageError = (err: Error) => {
    errors.push(err.message)
  }

  page.on('console', onConsole)
  page.on('pageerror', onPageError)

  return {
    errors,
    detach: () => {
      page.off('console', onConsole)
      page.off('pageerror', onPageError)
    },
  }
}

export function assertNoLevaControlsConfigErrors(errors: string[]) {
  const levaHits = errors.filter((line) => /LevaControlsConfig/i.test(line))
  expect(
    levaHits,
    `Unexpected LevaControlsConfig console errors:\n${levaHits.join('\n')}`,
  ).toHaveLength(0)
}

/** Main menu → New Game → WebGPU fatal overlay (CI SwiftShader has no WebGPU). */
export async function bootToFatalOverlay(page: Page): Promise<Locator> {
  await page.goto('/?wireframe=0&screenshot=1')
  await page.getByRole('button', { name: 'New Game' }).click()
  const overlay = page.getByTestId('webgpu-fatal-overlay')
  await expect(overlay).toBeVisible({ timeout: 90_000 })
  return overlay
}

/**
 * @deprecated Harbor canvas boot requires WebGPU. Visual harbor snapshots are
 * deferred until WebGL restore or a WebGPU CI runner. Prefer bootToFatalOverlay.
 */
export async function bootGame(page: Page): Promise<Locator> {
  return bootToFatalOverlay(page)
}

/** Count pixels that differ between two equal-size PNG buffers (rough RGBA diff). */
export function countPixelDiff(before: Buffer, after: Buffer, threshold = 24): number {
  if (before.length !== after.length) {
    throw new Error(
      `Screenshot size mismatch: ${before.length} vs ${after.length} bytes`,
    )
  }

  let diff = 0
  for (let i = 0; i < before.length; i += 4) {
    const dr = Math.abs(before[i] - after[i])
    const dg = Math.abs(before[i + 1] - after[i + 1])
    const db = Math.abs(before[i + 2] - after[i + 2])
    const da = Math.abs(before[i + 3] - after[i + 3])
    if (dr + dg + db + da > threshold) {
      diff += 1
    }
  }
  return diff
}
