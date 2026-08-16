import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

interface BinaryExports {
  memory: WebAssembly.Memory
  malloc(size: number): number
  free(pointer: number): void
  _initialize?(): void
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

describe('committed harborglow_dsp.wasm', () => {
  let api: BinaryExports

  beforeAll(async () => {
    const path = fileURLToPath(
      new URL('../../../public/wasm/harborglow_dsp.wasm', import.meta.url))
    const result = await WebAssembly.instantiate(await readFile(path), {
      env: { emscripten_notify_memory_growth: () => {} },
    })
    api = result.instance.exports as unknown as BinaryExports
    api._initialize?.()
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
