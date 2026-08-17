/**
 * xoshiro128** (Blackman & Vigna, 2018) — 32-bit PRNG for the sim core.
 *
 * Algorithm: https://prng.di.unimi.it/xoshiro128starstar.c
 * Period 2^128 − 1. Not cryptographic. State is four uint32 words.
 *
 * Seeding uses splitmix32 so a single 32-bit seed expands into a well-mixed
 * 128-bit state. `next()` returns a float in [0, 1).
 */

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0
}

function splitmix32(state: number): { value: number; state: number } {
  const next = (state + 0x9e3779b9) >>> 0
  let z = next
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0
  return { value: (z ^ (z >>> 16)) >>> 0, state: next }
}

export type RngState = readonly [number, number, number, number]

export class Rng {
  private s0: number
  private s1: number
  private s2: number
  private s3: number

  constructor(seed: number) {
    const mix = seed >>> 0
    const a = splitmix32(mix)
    const b = splitmix32(a.state)
    const c = splitmix32(b.state)
    const d = splitmix32(c.state)
    this.s0 = a.value
    this.s1 = b.value
    this.s2 = c.value
    this.s3 = d.value
  }

  static fromState(state: RngState): Rng {
    const rng = new Rng(0)
    rng.s0 = state[0] >>> 0
    rng.s1 = state[1] >>> 0
    rng.s2 = state[2] >>> 0
    rng.s3 = state[3] >>> 0
    return rng
  }

  getState(): RngState {
    return [this.s0, this.s1, this.s2, this.s3]
  }

  /** Next uint32 from xoshiro128**. */
  nextUint32(): number {
    const result = (Math.imul(rotl(Math.imul(this.s1, 5) >>> 0, 7), 9)) >>> 0
    const t = (this.s1 << 9) >>> 0
    this.s2 ^= this.s0
    this.s3 ^= this.s1
    this.s1 ^= this.s2
    this.s0 ^= this.s3
    this.s2 ^= t
    this.s3 = rotl(this.s3, 11)
    return result
  }

  /** Uniform float in [0, 1). */
  next(): number {
    return this.nextUint32() / 0x100000000
  }

  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  nextInt(minInclusive: number, maxExclusive: number): number {
    const span = maxExclusive - minInclusive
    if (span <= 0) return minInclusive
    return minInclusive + (this.nextUint32() % span)
  }

  pick<T>(items: readonly T[]): T {
    return items[this.nextInt(0, items.length)]
  }

  /** Independent stream for a subsystem (does not advance this generator). */
  fork(streamId: number): Rng {
    const mix = (this.s0 ^ Math.imul(streamId >>> 0, 0x9e3779b9)) >>> 0
    return new Rng(mix)
  }
}
