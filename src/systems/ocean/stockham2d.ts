// =============================================================================
// STOCKHAM 2-D FFT — GPU-algorithm reference (matches oceanFftWgsl.ts)
//
// `fft2d.ts` remains the Cooley–Tukey DFT *definition*. This module is the
// self-sorting Stockham schedule the WGSL butterflies implement, so Vitest can
// prove the GPU algorithm against the reference without a live device.
//
// Convention matches fft2d.ts: both directions unnormalised,
// inverse(forward(x)) === x · N².
// =============================================================================

function stockham1d(
  re: Float32Array,
  im: Float32Array,
  n: number,
  offset: number,
  stride: number,
  inverse: boolean,
): void {
  const sign = inverse ? 1 : -1
  let srcRe = new Float32Array(n)
  let srcIm = new Float32Array(n)
  let dstRe = new Float32Array(n)
  let dstIm = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const idx = offset + i * stride
    srcRe[i] = re[idx]
    srcIm[i] = im[idx]
  }

  const logN = Math.log2(n)
  for (let stage = 0; stage < logN; stage++) {
    const n1 = (1 << stage)
    const span = (n1 << 1)
    for (let i = 0; i < n; i++) {
      const block = i >> (stage + 1)
      const j = i & (n1 - 1)
      const isUpper = (i & n1) !== 0
      const src0 = block * n1 + j
      const src1 = src0 + (n >> 1)
      const ar = srcRe[src0]
      const ai = srcIm[src0]
      const br = srcRe[src1]
      const bi = srcIm[src1]
      const theta = (sign * 2 * Math.PI * j) / span
      const wr = Math.cos(theta)
      const wi = Math.sin(theta)
      const tr = wr * br - wi * bi
      const ti = wr * bi + wi * br
      if (!isUpper) {
        dstRe[i] = ar + tr
        dstIm[i] = ai + ti
      } else {
        dstRe[i] = ar - tr
        dstIm[i] = ai - ti
      }
    }
    const swapRe = srcRe
    const swapIm = srcIm
    srcRe = dstRe
    srcIm = dstIm
    dstRe = swapRe
    dstIm = swapIm
  }

  for (let i = 0; i < n; i++) {
    const idx = offset + i * stride
    re[idx] = srcRe[i]
    im[idx] = srcIm[i]
  }
}

/**
 * In-place N×N Stockham transform, same layout and normalisation as `fft2d`.
 * Used as the CPU oracle for the WGSL butterfly passes.
 */
export function stockham2d(
  re: Float32Array,
  im: Float32Array,
  n: number,
  inverse: boolean,
): void {
  const total = n * n
  if (re.length < total || im.length < total) {
    throw new Error(`stockham2d: buffers must hold ${total} elements`)
  }
  for (let row = 0; row < n; row++) {
    stockham1d(re, im, n, row * n, 1, inverse)
  }
  for (let col = 0; col < n; col++) {
    stockham1d(re, im, n, col, n, inverse)
  }
}
