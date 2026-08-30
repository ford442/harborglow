// =============================================================================
// FFT2D — radix-2 Cooley-Tukey complex FFT (1-D strided + 2-D row/column)
//
// The C++ core already ships `dsp_fft_r2c`, a *packed real-to-complex 1-D*
// transform capped at N ≤ 4096. An ocean needs a *2-D complex* transform of a
// 128²/256² spectrum grid, which that entry point cannot express, so this is a
// standalone implementation.
//
// Convention: BOTH directions are unnormalised, i.e.
//
//   forward(x)[k] = Σ_n x[n] · e^(−2πi·kn/N)
//   inverse(X)[n] = Σ_k X[k] · e^(+2πi·kn/N)
//
// so `inverse(forward(x)) === x · N²` for a 2-D grid. This matches Tessendorf's
// ocean formulation (h(x,t) = Σ_k h̃(k,t)·e^(i k·x), no 1/N² factor), where the
// wave amplitude is carried by the Phillips constant instead. Callers that want
// a mathematically normalised IDFT divide by N² themselves.
//
// Everything here is pure math over Float32Array — no THREE, no store, no
// clock, no RNG — so it is safe to call from the deterministic sim core.
// =============================================================================

/** Largest transform we build twiddle tables for (256² ocean grids and below). */
const MAX_SIZE = 4096

function isPowerOfTwo(n: number): boolean {
  return n >= 2 && (n & (n - 1)) === 0
}

/**
 * Precomputed bit-reversal permutation and twiddle tables for one transform
 * length. Instances are cached per size because the ocean re-transforms the
 * same grid every frame.
 */
export class Fft1D {
  readonly n: number
  private readonly rev: Uint16Array | Uint32Array
  /** cos(2πj/n) for j ∈ [0, n/2). */
  private readonly cos: Float64Array
  /** sin(2πj/n) for j ∈ [0, n/2). */
  private readonly sin: Float64Array

  constructor(n: number) {
    if (!isPowerOfTwo(n) || n > MAX_SIZE) {
      throw new Error(`Fft1D: size must be a power of two in [2, ${MAX_SIZE}], got ${n}`)
    }
    this.n = n

    const bits = Math.log2(n)
    this.rev = n <= 0x10000 ? new Uint16Array(n) : new Uint32Array(n)
    for (let i = 0; i < n; i++) {
      let r = 0
      for (let b = 0; b < bits; b++) {
        if ((i >> b) & 1) r |= 1 << (bits - 1 - b)
      }
      this.rev[i] = r
    }

    const half = n >> 1
    this.cos = new Float64Array(half)
    this.sin = new Float64Array(half)
    for (let j = 0; j < half; j++) {
      const theta = (2 * Math.PI * j) / n
      this.cos[j] = Math.cos(theta)
      this.sin[j] = Math.sin(theta)
    }
  }

  /**
   * In-place transform of one strided line.
   *
   * @param re      real components
   * @param im      imaginary components
   * @param offset  index of element 0 of the line
   * @param stride  distance between consecutive elements (1 for a row, N for a column)
   * @param inverse true for e^(+iθ) kernel; neither direction is scaled
   */
  transform(
    re: Float32Array,
    im: Float32Array,
    offset: number,
    stride: number,
    inverse: boolean,
  ): void {
    const { n, rev, cos, sin } = this

    // Decimation-in-time reordering.
    for (let i = 0; i < n; i++) {
      const j = rev[i]
      if (j <= i) continue
      const a = offset + i * stride
      const b = offset + j * stride
      const tr = re[a]
      const ti = im[a]
      re[a] = re[b]
      im[a] = im[b]
      re[b] = tr
      im[b] = ti
    }

    // Forward uses e^(−iθ), inverse e^(+iθ).
    const sign = inverse ? 1 : -1

    for (let len = 2; len <= n; len <<= 1) {
      const halfLen = len >> 1
      const twiddleStep = n / len
      for (let base = 0; base < n; base += len) {
        for (let j = 0, tw = 0; j < halfLen; j++, tw += twiddleStep) {
          const wr = cos[tw]
          const wi = sign * sin[tw]
          const a = offset + (base + j) * stride
          const b = offset + (base + j + halfLen) * stride
          const xr = re[b] * wr - im[b] * wi
          const xi = re[b] * wi + im[b] * wr
          re[b] = re[a] - xr
          im[b] = im[a] - xi
          re[a] += xr
          im[a] += xi
        }
      }
    }
  }
}

const planCache = new Map<number, Fft1D>()

/** Cached transform plan for `n`. Plans are immutable and safe to share. */
export function getFftPlan(n: number): Fft1D {
  let plan = planCache.get(n)
  if (!plan) {
    plan = new Fft1D(n)
    planCache.set(n, plan)
  }
  return plan
}

/**
 * In-place 2-D transform of an N×N grid stored row-major (`idx = row * n + col`).
 *
 * Separable: every row is transformed, then every column. Unnormalised in both
 * directions — see the module header.
 */
export function fft2d(
  re: Float32Array,
  im: Float32Array,
  n: number,
  inverse: boolean,
): void {
  const total = n * n
  if (re.length < total || im.length < total) {
    throw new Error(`fft2d: buffers must hold ${total} elements`)
  }
  const plan = getFftPlan(n)

  for (let row = 0; row < n; row++) {
    plan.transform(re, im, row * n, 1, inverse)
  }
  for (let col = 0; col < n; col++) {
    plan.transform(re, im, col, n, inverse)
  }
}
