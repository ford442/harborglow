import { test } from '@playwright/test'

/**
 * Harbor pixel snapshots need a WebGPU adapter; this job runs SwiftShader, where
 * the app hard-fails to the overlay (covered by e2e/webgpu-probe.spec.ts).
 *
 * Skipped by decision, not by default: docs/adr/0002-harbor-visual-review-without-gpu-ci.md
 * makes a human-reviewed WebGPU still mandatory on src/scenes/** until a GPU
 * runner lands. Capture on a real WebGPU session with
 * `window.harborglowDebug.captureCanvasPng()` (?screenshot=1).
 */
test.describe('Visual regression (WebGPU runner pending — ADR 0002)', () => {
  test.skip(
    true,
    'No WebGPU in CI: visual review is mandatory per docs/adr/0002-harbor-visual-review-without-gpu-ci.md',
  )

  test('dock + water + one lit rig still matches snapshot', async () => {
    // Unskip on a WebGPU runner: boot /?screenshot=1, await harborglowDebug.captureCanvasPng().
  })
})
