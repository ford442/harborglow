import { describe, it, expect } from 'vitest'
import {
  calcMagneticFalloff,
  calcSettlingDamping,
  springStep,
} from '../physicsMath'

describe('calcMagneticFalloff', () => {
  const radius = 5

  it('returns 0 at and beyond radius', () => {
    expect(calcMagneticFalloff(5, radius)).toBe(0)
    expect(calcMagneticFalloff(6, radius)).toBe(0)
    expect(calcMagneticFalloff(100, radius)).toBe(0)
  })

  it('returns 1 at center', () => {
    expect(calcMagneticFalloff(0, radius)).toBe(1)
  })

  it('is monotonic decreasing with distance', () => {
    const samples = [0, 1, 2, 3, 4, 4.9]
    for (let i = 1; i < samples.length; i++) {
      expect(calcMagneticFalloff(samples[i], radius)).toBeLessThanOrEqual(
        calcMagneticFalloff(samples[i - 1], radius),
      )
    }
  })

  it('respects curve exponent', () => {
    const d = 2.5
    expect(calcMagneticFalloff(d, radius, 1)).toBeGreaterThan(
      calcMagneticFalloff(d, radius, 3),
    )
  })

  it('returns 0 for non-positive radius', () => {
    expect(calcMagneticFalloff(1, 0)).toBe(0)
    expect(calcMagneticFalloff(1, -1)).toBe(0)
  })
})

describe('calcSettlingDamping', () => {
  const base = 1.0
  const peak = 0.8
  const duration = 1000

  it('returns peak at t=0', () => {
    expect(calcSettlingDamping(0, duration, base, peak)).toBe(peak)
  })

  it('returns base at and after duration', () => {
    expect(calcSettlingDamping(1000, duration, base, peak)).toBe(base)
    expect(calcSettlingDamping(2000, duration, base, peak)).toBe(base)
  })

  it('eases from peak toward base over time', () => {
    const mid = calcSettlingDamping(500, duration, base, peak)
    expect(mid).toBeGreaterThan(peak)
    expect(mid).toBeLessThan(base)
  })
})

describe('springStep', () => {
  it('accelerates toward reducing positive offset', () => {
    const step = springStep(2, 0, 4, 0.85, 1 / 60)
    expect(step.acceleration).toBeGreaterThan(0)
  })

  it('updates velocity with dt scaling', () => {
    const step = springStep(1, 0, 4, 0.85, 0.5)
    expect(step.velocity).not.toBe(0)
  })
})
