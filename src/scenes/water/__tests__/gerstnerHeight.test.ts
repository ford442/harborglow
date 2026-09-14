import { describe, expect, it } from 'vitest'
import { computeHarborWetness } from '../../HarborPBRMaterials'
import {
  gerstnerHeight,
  gerstnerRippleDetail,
  MAX_WAVE_LAYERS,
} from '../gerstnerHeight'

const layers = [
  { amplitude: 1, frequency: 0.5, speed: 1, direction: [1, 0] as [number, number], steepness: 0 },
  { amplitude: 0.5, frequency: 1, speed: 2, direction: [0, 1] as [number, number], steepness: 0 },
]

describe('gerstnerHeight', () => {
  it('is zero at origin when phase is a multiple of pi for a single axis layer', () => {
    const h = gerstnerHeight(0, 0, 0, layers.slice(0, 1), 1, 1, 0)
    expect(h).toBeCloseTo(0, 8)
  })

  it('matches amp * sin(x * freq) for a single layer', () => {
    const x = 1.2
    const h = gerstnerHeight(x, 0, 0, layers.slice(0, 1), 1, 1, 0)
    expect(h).toBeCloseTo(Math.sin(x * 0.5), 8)
  })

  it('applies storm amplitude 1 + 2 * intensity', () => {
    const calm = gerstnerHeight(1, 0, 0, layers.slice(0, 1), 1, 1, 0)
    const storm = gerstnerHeight(1, 0, 0, layers.slice(0, 1), 1, 1, 1)
    expect(storm).toBeCloseTo(calm * 3, 8)
  })

  it('caps layer count at MAX_WAVE_LAYERS', () => {
    expect(MAX_WAVE_LAYERS).toBe(4)
  })
})

describe('gerstnerRippleDetail', () => {
  it('is zero below storm threshold', () => {
    expect(gerstnerRippleDetail(3, 4, 1, 0.05)).toBe(0)
  })

  it('scales with storm intensity', () => {
    const a = gerstnerRippleDetail(3, 4, 1, 0.5)
    const b = gerstnerRippleDetail(3, 4, 1, 1)
    expect(Math.abs(b)).toBeGreaterThan(Math.abs(a))
  })
})

describe('computeHarborWetness', () => {
  it('maps weather to wetness', () => {
    expect(computeHarborWetness('storm', false)).toBe(1)
    expect(computeHarborWetness('rain', false)).toBe(0.78)
    expect(computeHarborWetness('fog', true)).toBe(0.42)
    expect(computeHarborWetness('clear', false)).toBe(0.06)
  })
})
