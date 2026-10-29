import { describe, expect, it } from 'vitest'
import { EMITTER_PRESETS } from '../../../rendering/particles/emitterPresets'
import { AliveEstimator } from '../aliveEstimate'
import { forceGc } from './forceGc'

describe('AliveEstimator', () => {
  it('counts spawns while younger than the preset lifetime, then forgets them', () => {
    const e = new AliveEstimator()
    e.add('spark', 10, 500)
    expect(e.estimate(10, 10_000)).toBe(500)
    expect(e.estimate(10 + EMITTER_PRESETS.spark.lifeS * 0.5, 10_000)).toBe(500)
    expect(e.estimate(10 + EMITTER_PRESETS.spark.lifeS + 0.2, 10_000)).toBe(0)
  })

  it('sums presets with different lifetimes', () => {
    const e = new AliveEstimator()
    e.add('spark', 0, 100)
    e.add('mist', 0, 1000)
    expect(e.estimate(0.1, 10_000)).toBe(1100)
    expect(e.estimate(2, 10_000)).toBe(1000)
    expect(e.estimate(5, 10_000)).toBe(0)
  })

  it('accumulates within a bucket and never exceeds the ring capacity', () => {
    const e = new AliveEstimator()
    for (let i = 0; i < 10; i++) e.add('glitter', 1 + i * 0.001, 400)
    expect(e.estimate(1.1, 100_000)).toBe(4000)
    expect(e.estimate(1.1, 1000)).toBe(1000)
  })

  it('ignores empty adds and recovers a reused bucket after a full history wrap', () => {
    const e = new AliveEstimator()
    e.add('spark', 1, 0)
    expect(e.estimate(1, 100)).toBe(0)
    e.add('spark', 1, 50)
    e.add('spark', 1 + 8, 70) // same slot, 8 s later
    expect(e.estimate(1 + 8, 1000)).toBe(70)
  })

  it('does not allocate in add / estimate', () => {
    const e = new AliveEstimator()
    const sink = new Float64Array(1) // not a captured `let`: boxing a double there would allocate
    const run = (n: number) => {
      for (let i = 0; i < n; i++) {
        const t = i / 60
        e.add('firework', t, 100)
        sink[0] += e.estimate(t, 250_000)
      }
    }
    run(20_000)
    forceGc()?.()
    const before = process.memoryUsage().heapUsed
    run(100_000)
    expect(sink[0]).toBeGreaterThan(0)
    expect(process.memoryUsage().heapUsed - before).toBeLessThan(1_000_000)
  })
})
