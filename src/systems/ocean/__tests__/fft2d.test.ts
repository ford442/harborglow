import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { Fft1D, fft2d, fft2dC2R, fft2dR2C, getFftPlan } from '../fft2d'
import { stockham2d } from '../stockham2d'
import { wasmDSP } from '../../wasmDSP'

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

  it('JS fft2d matches wasmDSP.fft2d fallback (same kernel)', () => {
    const n = 8
    const reA = new Float32Array(n * n)
    const imA = new Float32Array(n * n)
    for (let i = 0; i < n * n; i++) {
      reA[i] = Math.sin(i * 1.1)
      imA[i] = Math.cos(i * 0.7)
    }
    const reB = reA.slice()
    const imB = imA.slice()
    fft2d(reA, imA, n, false)
    wasmDSP.fft2d(reB, imB, n, false)
    for (let i = 0; i < n * n; i++) {
      expect(reB[i]).toBeCloseTo(reA[i], 5)
      expect(imB[i]).toBeCloseTo(imA[i], 5)
    }
  })

  it('fft2dR2C matches fft2d of a real grid', () => {
    const n = 8
    const real = Float32Array.from({ length: n * n }, (_, i) => Math.sin(i * 0.8))
    const reA = new Float32Array(n * n)
    const imA = new Float32Array(n * n)
    fft2dR2C(real, reA, imA, n)
    const reB = real.slice()
    const imB = new Float32Array(n * n)
    fft2d(reB, imB, n, false)
    for (let i = 0; i < n * n; i++) {
      expect(reA[i]).toBe(reB[i])
      expect(imA[i]).toBe(imB[i])
    }
  })

  it('fft2dC2R is the unnormalised inverse of fft2dR2C', () => {
    const n = 8
    const real = Float32Array.from({ length: n * n }, (_, i) => Math.cos(i * 0.5))
    const re = new Float32Array(n * n)
    const im = new Float32Array(n * n)
    fft2dR2C(real, re, im, n)
    fft2dC2R(re, im, n)
    const scale = n * n
    for (let i = 0; i < n * n; i++) {
      expect(re[i] / scale).toBeCloseTo(real[i], 5)
    }
  })

  it('Stockham matches Cooley-Tukey fft2d (GPU butterfly oracle)', () => {
    // Stockham is a different schedule of the same unnormalised DFT. WGSL
    // implements this helper; residual vs fft2d is float32 rounding over
    // log2(N) stages (well under 1e-4 on N=8/16).
    for (const n of [8, 16]) {
      const reA = new Float32Array(n * n)
      const imA = new Float32Array(n * n)
      for (let i = 0; i < n * n; i++) {
        reA[i] = Math.sin(i * 1.3)
        imA[i] = Math.cos(i * 0.6)
      }
      const reB = reA.slice()
      const imB = imA.slice()
      fft2d(reA, imA, n, true)
      stockham2d(reB, imB, n, true)
      let maxErr = 0
      for (let i = 0; i < n * n; i++) {
        maxErr = Math.max(maxErr, Math.abs(reA[i] - reB[i]), Math.abs(imA[i] - imB[i]))
      }
      expect(maxErr).toBeLessThan(1e-4)
    }
  })
})

interface Fft2dWasm {
  memory: WebAssembly.Memory
  malloc(size: number): number
  free(ptr: number): void
  _initialize?(): void
  dsp_fft2d(re: number, im: number, n: number, inverse: number): void
  dsp_fft2d_r2c(realIn: number, re: number, im: number, n: number, inverse: number): void
}

describe('WASM dsp_fft2d matches JS fft2d', () => {
  // C++ twiddles are float32; JS Fft1D uses Float64Array cos/sin. Residual
  // on N=16 is ~1e-5, so we bound at 1e-4 rather than bit-identical.
  async function loadCore(): Promise<Fft2dWasm> {
    const path = fileURLToPath(new URL('../../../../public/wasm/harborglow_dsp.wasm', import.meta.url))
    const result = await WebAssembly.instantiate(await readFile(path), {
      env: { emscripten_notify_memory_growth: () => {} },
    })
    const api = result.instance.exports as unknown as Fft2dWasm
    api._initialize?.()
    return api
  }

  it('dsp_fft2d and dsp_fft2d_r2c stay within 1e-4 of the JS reference', async () => {
    const api = await loadCore()
    expect(api.dsp_fft2d).toBeTypeOf('function')
    expect(api.dsp_fft2d_r2c).toBeTypeOf('function')

    const n = 16
    const cells = n * n
    const reJs = Float32Array.from({ length: cells }, (_, i) => Math.sin(i * 1.1))
    const imJs = Float32Array.from({ length: cells }, (_, i) => Math.cos(i * 0.7))
    const reWasm = reJs.slice()
    const imWasm = imJs.slice()
    fft2d(reJs, imJs, n, false)

    const rePtr = api.malloc(cells * 4)
    const imPtr = api.malloc(cells * 4)
    new Float32Array(api.memory.buffer, rePtr, cells).set(reWasm)
    new Float32Array(api.memory.buffer, imPtr, cells).set(imWasm)
    api.dsp_fft2d(rePtr, imPtr, n, 0)
    const wr = new Float32Array(api.memory.buffer, rePtr, cells)
    const wi = new Float32Array(api.memory.buffer, imPtr, cells)
    for (let i = 0; i < cells; i++) {
      expect(wr[i]).toBeCloseTo(reJs[i], 4)
      expect(wi[i]).toBeCloseTo(imJs[i], 4)
    }
    api.free(rePtr)
    api.free(imPtr)

    const real = Float32Array.from({ length: cells }, (_, i) => Math.sin(i * 0.4))
    const jsRe = new Float32Array(cells)
    const jsIm = new Float32Array(cells)
    fft2dR2C(real, jsRe, jsIm, n)
    const inPtr = api.malloc(cells * 4)
    const outRe = api.malloc(cells * 4)
    const outIm = api.malloc(cells * 4)
    new Float32Array(api.memory.buffer, inPtr, cells).set(real)
    api.dsp_fft2d_r2c(inPtr, outRe, outIm, n, 0)
    const rr = new Float32Array(api.memory.buffer, outRe, cells)
    const ri = new Float32Array(api.memory.buffer, outIm, cells)
    for (let i = 0; i < cells; i++) {
      expect(rr[i]).toBeCloseTo(jsRe[i], 4)
      expect(ri[i]).toBeCloseTo(jsIm[i], 4)
    }
    api.free(inPtr)
    api.free(outRe)
    api.free(outIm)

    const jsC2rRe = jsRe.slice()
    const jsC2rIm = jsIm.slice()
    fft2dC2R(jsC2rRe, jsC2rIm, n)
    const invRe = api.malloc(cells * 4)
    const invIm = api.malloc(cells * 4)
    new Float32Array(api.memory.buffer, invRe, cells).set(jsRe)
    new Float32Array(api.memory.buffer, invIm, cells).set(jsIm)
    api.dsp_fft2d_r2c(0, invRe, invIm, n, 1)
    const c2r = new Float32Array(api.memory.buffer, invRe, cells)
    for (let i = 0; i < cells; i++) {
      expect(c2r[i]).toBeCloseTo(jsC2rRe[i], 4)
    }
    api.free(invRe)
    api.free(invIm)
  })
})
