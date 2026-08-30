import { describe, expect, it } from 'vitest'
import { OceanFFTField } from '../OceanFFTField'

const SMALL = { size: 32, patchSize: 64 }

function maxAbs(values: Float32Array): number {
  let max = 0
  for (const value of values) max = Math.max(max, Math.abs(value))
  return max
}

describe('OceanFFTField', () => {
  it('is bit-identical for the same seed and time', () => {
    const a = new OceanFFTField({ ...SMALL, seed: 7 })
    const b = new OceanFFTField({ ...SMALL, seed: 7 })
    a.update(12.5)
    b.update(12.5)
    expect(Array.from(a.heights)).toEqual(Array.from(b.heights))
    expect(Array.from(a.displacementX)).toEqual(Array.from(b.displacementX))
    expect(Array.from(a.displacementZ)).toEqual(Array.from(b.displacementZ))
  })

  it('diverges for a different seed', () => {
    const a = new OceanFFTField({ ...SMALL, seed: 7 })
    const b = new OceanFFTField({ ...SMALL, seed: 8 })
    a.update(3)
    b.update(3)
    expect(Array.from(a.heights)).not.toEqual(Array.from(b.heights))
  })

  it('produces a finite, non-trivial, zero-mean surface', () => {
    const field = new OceanFFTField({ ...SMALL, seed: 11 })
    field.update(4)

    let sum = 0
    for (const h of field.heights) {
      expect(Number.isFinite(h)).toBe(true)
      sum += h
    }
    expect(field.getRms()).toBeGreaterThan(0)
    // No k = 0 term in the Phillips spectrum ⇒ mean sea level stays at 0.
    expect(Math.abs(sum / field.heights.length)).toBeLessThan(field.getRms() * 1e-3)
  })

  it('repeats after loopPeriod (ω is quantised)', () => {
    const loopPeriod = 40
    const field = new OceanFFTField({ ...SMALL, seed: 3, loopPeriod })
    field.update(6)
    const first = Array.from(field.heights)
    field.update(6 + loopPeriod)
    // Quantising ω makes the surface periodic up to float rounding of the
    // phase, not bit-identical; the residual is ~1e-6 m.
    field.heights.forEach((height, i) => expect(height).toBeCloseTo(first[i], 5))
  })

  it('evolves between updates', () => {
    const field = new OceanFFTField({ ...SMALL, seed: 3, loopPeriod: 0 })
    field.update(0)
    const start = Array.from(field.heights)
    field.update(5)
    expect(Array.from(field.heights)).not.toEqual(start)
  })

  it('scales linearly with amplitude', () => {
    const base = new OceanFFTField({ ...SMALL, seed: 5, amplitude: 1 })
    const doubled = new OceanFFTField({ ...SMALL, seed: 5, amplitude: 2 })
    base.update(2)
    doubled.update(2)
    for (let i = 0; i < base.heights.length; i++) {
      expect(doubled.heights[i]).toBeCloseTo(base.heights[i] * 2, 4)
    }
  })

  it('grows with wind speed', () => {
    const calm = new OceanFFTField({ ...SMALL, seed: 5, windSpeed: 5 })
    const gale = new OceanFFTField({ ...SMALL, seed: 5, windSpeed: 15 })
    calm.update(2)
    gale.update(2)
    expect(gale.getRms()).toBeGreaterThan(calm.getRms() * 2)
  })

  it('emits no horizontal displacement when choppiness is 0', () => {
    const flat = new OceanFFTField({ ...SMALL, seed: 5, choppiness: 0 })
    flat.update(2)
    expect(maxAbs(flat.displacementX)).toBe(0)
    expect(maxAbs(flat.displacementZ)).toBe(0)

    const choppy = new OceanFFTField({ ...SMALL, seed: 5, choppiness: 1 })
    choppy.update(2)
    expect(maxAbs(choppy.displacementX)).toBeGreaterThan(0)
    // Choppiness is horizontal only — it must not change the height field.
    expect(Array.from(choppy.heights)).toEqual(Array.from(flat.heights))
  })
})

describe('OceanFFTField sampling (buoyancy contract)', () => {
  it('returns the grid value exactly at grid nodes', () => {
    const field = new OceanFFTField({ ...SMALL, seed: 9 })
    field.update(1)
    const metresPerCell = field.patchSize / field.size

    for (const [row, col] of [[0, 0], [3, 5], [31, 31]]) {
      const height = field.heightAt(col * metresPerCell, row * metresPerCell)
      expect(height).toBeCloseTo(field.heights[row * field.size + col], 4)
    }
  })

  it('tiles every patchSize metres, including negative coordinates', () => {
    const field = new OceanFFTField({ ...SMALL, seed: 9 })
    field.update(1)
    const { patchSize } = field

    for (const [x, z] of [[3.5, -7.25], [-120.5, 44.75]]) {
      expect(field.heightAt(x + patchSize, z)).toBeCloseTo(field.heightAt(x, z), 4)
      expect(field.heightAt(x, z + patchSize)).toBeCloseTo(field.heightAt(x, z), 4)
    }
  })

  it('interpolates between neighbouring nodes', () => {
    const field = new OceanFFTField({ ...SMALL, seed: 9 })
    field.update(1)
    const metresPerCell = field.patchSize / field.size

    const left = field.heights[0]
    const right = field.heights[1]
    const middle = field.heightAt(metresPerCell * 0.5, 0)
    expect(middle).toBeCloseTo((left + right) / 2, 4)
  })

  it('batch queries agree with single queries', () => {
    const field = new OceanFFTField({ ...SMALL, seed: 9 })
    field.update(1)
    const xs = Float32Array.from([0, 12.5, -33.25, 190])
    const zs = Float32Array.from([0, -4.5, 61.75, 7])
    const batch = field.heightBatch(xs, zs)
    for (let i = 0; i < xs.length; i++) {
      // `heightBatch` narrows to float32 on the way into the output array.
      expect(batch[i]).toBeCloseTo(field.heightAt(xs[i], zs[i]), 5)
    }
  })

  it('rejects a size change through setParams', () => {
    const field = new OceanFFTField(SMALL)
    expect(() => field.setParams({ size: 64 })).toThrow(/size is fixed/)
  })
})
