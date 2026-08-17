import { describe, expect, it } from 'vitest'
import { Rng } from '../Rng'

/** Frozen xoshiro128** / splitmix32 vector for seed 42 (this implementation). */
const SEED_42_FIRST8 = [
  2837322924, 544945897, 479756282, 3500138142,
  339756180, 113173290, 65323186, 1112262688,
]

describe('Rng xoshiro128**', () => {
  it('is reproducible for the same seed', () => {
    const a = new Rng(42)
    const b = new Rng(42)
    for (let i = 0; i < 32; i++) {
      expect(a.nextUint32()).toBe(b.nextUint32())
    }
  })

  it('diverges for different seeds', () => {
    const a = new Rng(1)
    const b = new Rng(2)
    expect(a.nextUint32()).not.toBe(b.nextUint32())
  })

  it('round-trips state', () => {
    const a = new Rng(99)
    a.nextUint32()
    const restored = Rng.fromState(a.getState())
    expect(restored.nextUint32()).toBe(a.nextUint32())
  })

  it('next() stays in [0, 1)', () => {
    const rng = new Rng(7)
    for (let i = 0; i < 1000; i++) {
      const value = rng.next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('Rng known vector', () => {
  it('matches the captured seed-42 stream (or records it once)', () => {
    const rng = new Rng(42)
    const got = Array.from({ length: 8 }, () => rng.nextUint32())
    expect(got).toEqual(SEED_42_FIRST8)
  })
})
