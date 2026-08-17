import { test } from '@playwright/test'

/**
 * Harbor pixel snapshots are deferred until WebGL/R3F restore or a WebGPU CI
 * runner. SwiftShader in this job has no WebGPU; the app hard-fails instead
 * of rendering a GL harbor. See e2e/webgpu-probe.spec.ts and docs/RENDERER.md.
 */
test.describe('Visual regression (deferred)', () => {
  test.skip(true, 'WebGL harbor baselines deferred — WebGPU required this phase (#194)')

  test('harbor overview canvas matches snapshot', async () => {
    // skipped
  })

  test('wireframe toggle (G) changes rendered pixels', async () => {
    // skipped
  })
})
