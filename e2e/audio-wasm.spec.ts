import { expect, test } from '@playwright/test'

test('shared WASM AudioWorklet initializes and publishes analysis', async ({ page }) => {
  await page.goto('/?renderer=webgl&wireframe=0')
  await expect.poll(() => page.evaluate(() => globalThis.crossOriginIsolated))
    .toBe(true)

  const wasmResponse = await page.request.get('/wasm/harborglow_audio_shared.wasm')
  expect(wasmResponse.ok()).toBe(true)
  expect(wasmResponse.headers()['content-type']).toContain('application/wasm')
  expect(await page.evaluate(async () => {
    const response = await fetch('./wasm/harborglow_audio_shared.wasm')
    return WebAssembly.validate(await response.arrayBuffer())
  })).toBe(true)

  await page.getByRole('button', { name: 'New Game' }).click()
  await expect.poll(
    () => page.evaluate(() => {
      const runtime = (window as unknown as {
        harborglowAudioRuntime?: { status: string }
      }).harborglowAudioRuntime
      return runtime?.status
    }),
    { timeout: 20_000 },
  ).toMatch(/shared-(simd|scalar)/)

  await page.evaluate(() => {
    const runtime = (window as unknown as {
      harborglowAudioRuntime: {
        trigger(note: string, duration: number, options: object): number[]
      }
    }).harborglowAudioRuntime
    runtime.trigger('A4', 0.5, { waveform: 2, velocity: 1 })
  })

  await expect.poll(
    () => page.evaluate(() => {
      const runtime = (window as unknown as {
        harborglowAudioRuntime: {
          getAnalysis(): { rms: number; waveform: Float32Array }
        }
      }).harborglowAudioRuntime
      const analysis = runtime.getAnalysis()
      return {
        rms: analysis.rms,
        nonzero: [...analysis.waveform].some((sample) => Math.abs(sample) > 1e-5),
      }
    }),
    { timeout: 10_000 },
  ).toMatchObject({ nonzero: true })
})
