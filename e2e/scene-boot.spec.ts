import { test } from '@playwright/test'

/**
 * MainScene lazy-load / LevaControlsConfig smoke is deferred until a WebGPU
 * CI runner exists. Failed probe never mounts Canvas (see e2e/webgpu-probe.spec.ts).
 */
test.describe('Scene boot', () => {
  test.skip(true, 'WebGPU-required canvas boot — scene smoke deferred with WebGL restore')

  test('New Game loads MainScene without LevaControlsConfig errors', async () => {
    // skipped
  })
})
