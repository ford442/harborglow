import { describe, expect, it } from 'vitest'
import {
  RingLayout,
  SharedRingReader,
  SharedRingWriter,
} from '../audio/audioProtocol'

const layout: RingLayout = {
  readOffset: 0,
  writeOffset: 4,
  overflowOffset: 8,
  dataOffset: 16,
}

describe('shared audio SPSC protocol', () => {
  it('preserves FIFO order across wraparound and rejects overflow', () => {
    const memory = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true })
    const writer = new SharedRingWriter(memory, 0, 4, 4, layout)
    const reader = new SharedRingReader(memory, 0, 4, 4, layout)
    const push = (value: number) => writer.push((view) => view.setInt32(0, value, true))
    const pop = () => {
      let value: number | undefined
      const success = reader.pop((view) => { value = view.getInt32(0, true) })
      return success ? value : undefined
    }

    expect([push(0), push(1), push(2), push(3)]).toEqual([true, true, true, true])
    expect(push(99)).toBe(false)
    expect(pop()).toBe(0)
    expect(pop()).toBe(1)
    expect(push(4)).toBe(true)
    expect(push(5)).toBe(true)
    expect([pop(), pop(), pop(), pop()]).toEqual([2, 3, 4, 5])
    expect(pop()).toBeUndefined()
    expect(Atomics.load(new Int32Array(memory.buffer), 2)).toBe(1)
  })

  it('matches a seeded operation stream against a reference queue', () => {
    const memory = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true })
    const writer = new SharedRingWriter(memory, 128, 8, 4, layout)
    const reader = new SharedRingReader(memory, 128, 8, 4, layout)
    const reference: number[] = []
    let seed = 0x12345678
    for (let step = 0; step < 2000; step++) {
      seed ^= seed << 13
      seed ^= seed >>> 17
      seed ^= seed << 5
      if ((seed >>> 0) % 3 !== 0) {
        const success = writer.push((view) => view.setInt32(0, step, true))
        if (reference.length < 8) {
          expect(success).toBe(true)
          reference.push(step)
        } else {
          expect(success).toBe(false)
        }
      } else {
        let value: number | undefined
        const success = reader.pop((view) => { value = view.getInt32(0, true) })
        expect(success).toBe(reference.length > 0)
        if (success) expect(value).toBe(reference.shift())
      }
    }
  })
})
