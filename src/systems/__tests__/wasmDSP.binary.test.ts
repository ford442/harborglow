import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { wasmDSP, wasmSimdSupported } from '../wasmDSP'

interface BinaryExports {
  memory: WebAssembly.Memory
  malloc(size: number): number
  free(pointer: number): void
  _initialize?(): void
  dsp_mix(a: number, b: number, t: number): number
  dsp_clamp(x: number, lo: number, hi: number): number
  dsp_remap(v: number, lo1: number, hi1: number, lo2: number, hi2: number): number
  dsp_smooth_step(t: number): number
  dsp_smoother_step(t: number): number
  dsp_sin_approx(x: number): number
  dsp_sin_full(x: number): number
  dsp_wave_height(
    x: number, z: number, time: number,
    amp: number, freq: number, speed: number, dirX: number, dirZ: number,
  ): number
  dsp_wave_height_batch(
    xs: number, zs: number, time: number,
    amp: number, freq: number, speed: number, dirX: number, dirZ: number,
    out: number, count: number,
  ): void
  dsp_audio_rms(data: number, count: number): number
  dsp_fft_r2c(input: number, outReal: number, outImag: number, log2N: number): void
  dsp_additive_block(
    output: number, count: number, frequencies: number, amplitudes: number,
    harmonics: number, sampleRate: number, phases: number,
  ): void
  dsp_convolver_create(impulse: number, length: number): number
  dsp_convolver_process(handle: number, input: number, output: number, count: number): void
  dsp_convolver_destroy(handle: number): void
  dsp_ring_required_bytes(capacity: number, itemSize: number): number
  dsp_ring_init(ring: number, capacity: number, itemSize: number): number
  dsp_ring_push(ring: number, item: number): number
  dsp_ring_pop(ring: number, item: number): number
}

async function loadReactor(fileName: string): Promise<BinaryExports> {
  const path = fileURLToPath(
    new URL(`../../../public/wasm/${fileName}`, import.meta.url))
  const result = await WebAssembly.instantiate(await readFile(path), {
    env: { emscripten_notify_memory_growth: () => {} },
  })
  const api = result.instance.exports as unknown as BinaryExports
  api._initialize?.()
  return api
}

function wasmWaveBatch(api: BinaryExports, xs: Float32Array, zs: Float32Array): Float32Array {
  const count = xs.length
  const xsPtr = api.malloc(count * 4)
  const zsPtr = api.malloc(count * 4)
  const outPtr = api.malloc(count * 4)
  new Float32Array(api.memory.buffer, xsPtr, count).set(xs)
  new Float32Array(api.memory.buffer, zsPtr, count).set(zs)
  api.dsp_wave_height_batch(xsPtr, zsPtr, 0.5, 1.2, 0.4, 0.8, 0.6, 0.8, outPtr, count)
  const out = new Float32Array(new Float32Array(api.memory.buffer, outPtr, count))
  ;[xsPtr, zsPtr, outPtr].forEach(api.free)
  return out
}

function wasmRms(api: BinaryExports, data: Float32Array): number {
  const ptr = api.malloc(data.length * 4)
  new Float32Array(api.memory.buffer, ptr, data.length).set(data)
  const rms = api.dsp_audio_rms(ptr, data.length)
  api.free(ptr)
  return rms
}

function wasmFft(api: BinaryExports, input: Float32Array, log2N: number) {
  const n = 1 << log2N
  const inPtr = api.malloc(n * 4)
  const rePtr = api.malloc(n * 4)
  const imPtr = api.malloc(n * 4)
  new Float32Array(api.memory.buffer, inPtr, n).set(input)
  api.dsp_fft_r2c(inPtr, rePtr, imPtr, log2N)
  const real = new Float32Array(new Float32Array(api.memory.buffer, rePtr, n))
  const imag = new Float32Array(new Float32Array(api.memory.buffer, imPtr, n))
  ;[inPtr, rePtr, imPtr].forEach(api.free)
  return { real, imag }
}

describe('committed harborglow_dsp.wasm', () => {
  let api: BinaryExports

  beforeAll(async () => {
    api = await loadReactor('harborglow_dsp.wasm')
  })

  it('renders a phase-continuous additive block in the real binary', () => {
    const output = api.malloc(8 * 4)
    const frequencies = api.malloc(4)
    const amplitudes = api.malloc(4)
    const phases = api.malloc(4)
    new Float32Array(api.memory.buffer, frequencies, 1)[0] = 6000
    new Float32Array(api.memory.buffer, amplitudes, 1)[0] = 1
    new Float32Array(api.memory.buffer, phases, 1)[0] = 0

    api.dsp_additive_block(
      output, 8, frequencies, amplitudes, 1, 48000, phases)
    const samples = [...new Float32Array(api.memory.buffer, output, 8)]
    samples.forEach((sample, index) => {
      expect(sample).toBeCloseTo(Math.sin(index * Math.PI / 4), 5)
    })

    ;[output, frequencies, amplitudes, phases].forEach(api.free)
  })

  it('streams convolution state in the real binary', () => {
    const impulse = api.malloc(3 * 4)
    const input = api.malloc(4 * 4)
    const output = api.malloc(4 * 4)
    new Float32Array(api.memory.buffer, impulse, 3).set([0.5, -0.25, 0.125])
    new Float32Array(api.memory.buffer, input, 4).set([1, 0, 0, 0])
    const handle = api.dsp_convolver_create(impulse, 3)
    api.dsp_convolver_process(handle, input, output, 4)
    expect([...new Float32Array(api.memory.buffer, output, 4)])
      .toEqual([0.5, -0.25, 0.125, 0])
    api.dsp_convolver_destroy(handle)
    ;[impulse, input, output].forEach(api.free)
  })

  it('maintains FIFO ordering through wraparound', () => {
    const ring = api.malloc(api.dsp_ring_required_bytes(4, 4))
    const item = api.malloc(4)
    const output = api.malloc(4)
    expect(api.dsp_ring_init(ring, 4, 4)).toBe(1)
    const itemView = new Int32Array(api.memory.buffer, item, 1)
    const outputView = new Int32Array(api.memory.buffer, output, 1)

    for (let value = 0; value < 4; value++) {
      itemView[0] = value
      expect(api.dsp_ring_push(ring, item)).toBe(1)
    }
    expect(api.dsp_ring_push(ring, item)).toBe(0)
    for (const expected of [0, 1]) {
      expect(api.dsp_ring_pop(ring, output)).toBe(1)
      expect(outputView[0]).toBe(expected)
    }
    for (const value of [4, 5]) {
      itemView[0] = value
      expect(api.dsp_ring_push(ring, item)).toBe(1)
    }
    for (const expected of [2, 3, 4, 5]) {
      expect(api.dsp_ring_pop(ring, output)).toBe(1)
      expect(outputView[0]).toBe(expected)
    }
    expect(api.dsp_ring_pop(ring, output)).toBe(0)
    ;[ring, item, output].forEach(api.free)
  })
})

describe('WASM vs TypeScript golden vectors', () => {
  let scalar: BinaryExports
  let simd: BinaryExports | null = null

  beforeAll(async () => {
    scalar = await loadReactor('harborglow_dsp.wasm')
    if (wasmSimdSupported()) {
      simd = await loadReactor('harborglow_dsp_simd.wasm')
    }
  })

  const reactors = () => {
    const list: Array<[string, BinaryExports]> = [['scalar', scalar]]
    if (simd) list.push(['simd', simd])
    return list
  }

  it('matches mix/clamp/remap/smoothstep/sin', () => {
    for (const [, api] of reactors()) {
      expect(api.dsp_mix(10, 20, 0.5)).toBeCloseTo(wasmDSP.mix(10, 20, 0.5), 6)
      expect(api.dsp_clamp(-2, 0, 1)).toBeCloseTo(wasmDSP.clamp(-2, 0, 1), 6)
      expect(api.dsp_remap(0.5, 0, 1, 0, 100)).toBeCloseTo(wasmDSP.remap(0.5, 0, 1, 0, 100), 5)
      expect(api.dsp_smooth_step(0.5)).toBeCloseTo(wasmDSP.smoothStep(0.5), 6)
      expect(api.dsp_smoother_step(0.25)).toBeCloseTo(wasmDSP.smootherStep(0.25), 5)
      expect(api.dsp_sin_approx(Math.PI / 2)).toBeCloseTo(wasmDSP.sinApprox(Math.PI / 2), 5)
      expect(api.dsp_sin_full(3)).toBeCloseTo(wasmDSP.sinFull(3), 5)
    }
  })

  it('matches waveHeight, batch, and RMS', () => {
    const xs = Float32Array.from({ length: 16 }, (_, i) => i * 0.37)
    const zs = Float32Array.from({ length: 16 }, (_, i) => i * 0.11)
    const audio = Float32Array.from({ length: 64 }, (_, i) => Math.sin(i * 0.2))
    const jsBatch = wasmDSP.waveHeightBatch(xs, zs, 0.5, 1.2, 0.4, 0.8, 0.6, 0.8)
    for (const [, api] of reactors()) {
      expect(api.dsp_wave_height(1.2, 0.4, 0.5, 1.2, 0.4, 0.8, 0.6, 0.8))
        .toBeCloseTo(wasmDSP.waveHeight(1.2, 0.4, 0.5, 1.2, 0.4, 0.8, 0.6, 0.8), 5)
      const batch = wasmWaveBatch(api, xs, zs)
      for (let i = 0; i < xs.length; i++) {
        expect(batch[i]).toBeCloseTo(jsBatch[i], 5)
      }
      expect(wasmRms(api, audio)).toBeCloseTo(wasmDSP.audioRms(audio), 5)
    }
  })

  it('matches FFT bins within 1e-4', () => {
    const log2N = 3
    const input = Float32Array.from({ length: 8 }, (_, i) => (i % 3 === 0 ? 1 : 0.25 * i))
    const js = wasmDSP.fftR2C(input, log2N)
    for (const [, api] of reactors()) {
      const wasm = wasmFft(api, input, log2N)
      for (let k = 0; k < 8; k++) {
        expect(wasm.real[k]).toBeCloseTo(js.real[k], 4)
        expect(wasm.imag[k]).toBeCloseTo(js.imag[k], 4)
      }
    }
  })
})
