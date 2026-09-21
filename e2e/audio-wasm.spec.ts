import { expect, test } from '@playwright/test'

test('shared WASM AudioWorklet initializes and publishes analysis', async ({ page }) => {
  await page.goto('/?wireframe=0')
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

test('scheduled notes land on their frame in an OfflineAudioContext', async ({ page }) => {
  await page.goto('/?wireframe=0')
  await expect.poll(() => page.evaluate(() => globalThis.crossOriginIsolated))
    .toBe(true)
  await page.getByRole('button', { name: 'New Game' }).click()
  await expect.poll(
    () => page.evaluate(() => 'harborglowAudioRuntime' in window),
    { timeout: 20_000 },
  ).toBe(true)

  // 1,000 sixteenth notes at 140 BPM, all queued before rendering starts, then
  // rendered offline through the real worklet + WASM engine.
  const result = await page.evaluate(async () => {
    const SAMPLE_RATE = 48000
    const NOTES = 1000
    const framesPerStep = SAMPLE_RATE * 60 / 140 / 4
    const firstFrame = 1000.3
    const length = Math.ceil(firstFrame + NOTES * framesPerStep) + 4096
    const offline = new OfflineAudioContext(2, length, SAMPLE_RATE)
    type Runtime = {
      status: string
      init(): Promise<void>
      noteOn(note: number, options: object): number
    }
    const singleton = (window as unknown as { harborglowAudioRuntime: Runtime })
      .harborglowAudioRuntime
    const RuntimeClass = singleton.constructor as new (options: object) => Runtime
    const runtime = new RuntimeClass({ context: offline })
    await runtime.init()

    const targets: number[] = []
    for (let i = 0; i < NOTES; i++) {
      const at = (firstFrame + i * framesPerStep) / SAMPLE_RATE
      targets.push(Math.round(at * SAMPLE_RATE))
      runtime.noteOn(440, {
        at,
        waveform: 1, // square: non-zero from its first sample
        velocity: 1,
        envelope: { attack: 0.0001, decay: 0.002, sustain: 0, release: 0.001 },
      })
    }
    const rendered = (await offline.startRendering()).getChannelData(0)

    const onsets: number[] = []
    let quiet = 1000
    for (let i = 0; i < rendered.length; i++) {
      const level = Math.abs(rendered[i])
      if (level > 1e-3 && quiet >= 1000) onsets.push(i)
      quiet = level < 1e-4 ? quiet + 1 : 0
    }
    let worst = 0
    for (let i = 0; i < Math.min(onsets.length, targets.length); i++) {
      worst = Math.max(worst, Math.abs(onsets[i] - targets[i]))
    }
    return { status: runtime.status, onsets: onsets.length, worst }
  })

  expect(result.status).toMatch(/shared-(simd|scalar)/)
  expect(result.onsets).toBe(1000)
  expect(result.worst).toBeLessThanOrEqual(1)
})
