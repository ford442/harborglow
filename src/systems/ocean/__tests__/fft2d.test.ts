import { describe, expect, it } from 'vitest'
import { Fft1D, fft2d, getFftPlan } from '../fft2d'

/** Naive O(N⁴) 2-D DFT, used as ground truth for one output bin. */
function naiveBin(
  re: Float32Array,
  n: number,
  ku: number,
  kv: number,
): [number, number] {
  let sr = 0
  let si = 0
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const theta = -2 * Math.PI * ((kv * row) / n + (ku * col) / n)
      sr += re[row * n + col] * Math.cos(theta)
      si += re[row * n + col] * Math.sin(theta)
    }
  }
  return [sr, si]
}

describe('fft2d', () => {
  it('matches a naive DFT bin for bin', () => {
    const n = 8
    const re = new Float32Array(n * n)
    const im = new Float32Array(n * n)
    for (let i = 0; i < n * n; i++) re[i] = Math.sin(i * 1.7) + Math.cos(i * 0.3)
    const source = re.slice()

    fft2d(re, im, n, false)

    for (const [ku, kv] of [[0, 0], [1, 2], [3, 3], [7, 5]]) {
      const [sr, si] = naiveBin(source, n, ku, kv)
      expect(re[kv * n + ku]).toBeCloseTo(sr, 4)
      expect(im[kv * n + ku]).toBeCloseTo(si, 4)
    }
  })

  it('inverse ∘ forward scales by N² (both directions unnormalised)', () => {
    const n = 16
    const re = new Float32Array(n * n)
    const im = new Float32Array(n * n)
    for (let i = 0; i < n * n; i++) {
      re[i] = Math.sin(i * 0.9)
      im[i] = Math.cos(i * 0.4)
    }
    const sourceRe = re.slice()
    const sourceIm = im.slice()

    fft2d(re, im, n, false)
    fft2d(re, im, n, true)

    const scale = n * n
    for (let i = 0; i < n * n; i++) {
      expect(re[i] / scale).toBeCloseTo(sourceRe[i], 4)
      expect(im[i] / scale).toBeCloseTo(sourceIm[i], 4)
    }
  })

  it('transforms a real DC signal to a single bin', () => {
    const n = 8
    const re = new Float32Array(n * n).fill(2)
    const im = new Float32Array(n * n)
    fft2d(re, im, n, false)

    expect(re[0]).toBeCloseTo(2 * n * n, 3)
    for (let i = 1; i < n * n; i++) {
      expect(Math.abs(re[i])).toBeLessThan(1e-3)
      expect(Math.abs(im[i])).toBeLessThan(1e-3)
    }
  })

  it('caches plans per size', () => {
    expect(getFftPlan(32)).toBe(getFftPlan(32))
    expect(getFftPlan(32)).not.toBe(getFftPlan(64))
  })

  it('rejects sizes that are not powers of two', () => {
    expect(() => new Fft1D(48)).toThrow(/power of two/)
    expect(() => new Fft1D(1)).toThrow(/power of two/)
  })

  it('rejects undersized buffers', () => {
    expect(() => fft2d(new Float32Array(4), new Float32Array(4), 8, false)).toThrow(/64 elements/)
  })
})
