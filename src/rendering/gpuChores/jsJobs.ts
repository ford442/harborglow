import {
  BT709_LUMA,
  EXPOSURE_MAX,
  EXPOSURE_MIN,
  EXPOSURE_TARGET_LUMA,
  HIST_BINS,
} from './types'

function lumaBt709(r: number, g: number, b: number): number {
  return r * BT709_LUMA.r + g * BT709_LUMA.g + b * BT709_LUMA.b
}

function sampleChannel(src: ArrayLike<number>, offset: number, normalized: boolean): number {
  const v = src[offset] ?? 0
  return normalized ? v : v / 255
}

/**
 * 256-bin BT.709 luma histogram. `src` is tightly packed RGBA (4 channels).
 * `normalized` true means channels are already 0..1 (float); false means 0..255.
 */
export function lumaHistogramBt709(
  src: ArrayLike<number>,
  pixelCount: number,
  channels = 4,
  normalized = false,
  bins: Uint32Array = new Uint32Array(HIST_BINS),
): Uint32Array {
  bins.fill(0)
  const stride = channels
  for (let i = 0; i < pixelCount; i++) {
    const o = i * stride
    const y = lumaBt709(
      sampleChannel(src, o, normalized),
      sampleChannel(src, o + 1, normalized),
      sampleChannel(src, o + 2, normalized),
    )
    const bin = Math.min(HIST_BINS - 1, Math.max(0, Math.floor(y * (HIST_BINS - 1) + 1e-6)))
    bins[bin] += 1
  }
  return bins
}

/** Log-average luma in 0..1 from a 256-bin histogram. */
export function logAverageLuma(bins: Uint32Array): number {
  let sumLog = 0
  let count = 0
  for (let i = 0; i < bins.length; i++) {
    const n = bins[i]
    if (!n) continue
    const y = (i + 0.5) / bins.length
    sumLog += n * Math.log(Math.max(y, 1e-4))
    count += n
  }
  if (count === 0) return EXPOSURE_TARGET_LUMA
  return Math.exp(sumLog / count)
}

export function exposureFromLogAverage(
  logAvg: number,
  target = EXPOSURE_TARGET_LUMA,
  min = EXPOSURE_MIN,
  max = EXPOSURE_MAX,
): number {
  const next = target / Math.max(logAvg, 1e-4)
  return Math.min(max, Math.max(min, next))
}

/** Box-filter downsample of packed RGBA8. */
export function downsample2d(
  src: Uint8Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  dst: Uint8Array = new Uint8Array(dstW * dstH * 4),
): Uint8Array {
  for (let y = 0; y < dstH; y++) {
    const y0 = Math.floor((y * srcH) / dstH)
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * srcH) / dstH))
    for (let x = 0; x < dstW; x++) {
      const x0 = Math.floor((x * srcW) / dstW)
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * srcW) / dstW))
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      let n = 0
      for (let sy = y0; sy < y1 && sy < srcH; sy++) {
        for (let sx = x0; sx < x1 && sx < srcW; sx++) {
          const i = (sy * srcW + sx) * 4
          r += src[i]
          g += src[i + 1]
          b += src[i + 2]
          a += src[i + 3]
          n += 1
        }
      }
      const o = (y * dstW + x) * 4
      const d = n || 1
      dst[o] = Math.round(r / d)
      dst[o + 1] = Math.round(g / d)
      dst[o + 2] = Math.round(b / d)
      dst[o + 3] = Math.round(a / d)
    }
  }
  return dst
}

const GAUSS_5 = [0.0625, 0.25, 0.375, 0.25, 0.0625] as const

function blurAxis(
  src: Uint8Array,
  width: number,
  height: number,
  dirX: number,
  dirY: number,
  dst: Uint8Array,
): void {
  const taps = GAUSS_5
  const radius = 2
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let t = -radius; t <= radius; t++) {
        const sx = Math.min(width - 1, Math.max(0, x + t * dirX))
        const sy = Math.min(height - 1, Math.max(0, y + t * dirY))
        const i = (sy * width + sx) * 4
        const w = taps[t + radius]
        r += src[i] * w
        g += src[i + 1] * w
        b += src[i + 2] * w
        a += src[i + 3] * w
      }
      const o = (y * width + x) * 4
      dst[o] = r
      dst[o + 1] = g
      dst[o + 2] = b
      dst[o + 3] = a
    }
  }
}

/** Separable 5-tap Gaussian blur (horizontal then vertical). */
export function separableBlur(
  src: Uint8Array,
  width: number,
  height: number,
  dst: Uint8Array = new Uint8Array(src.length),
  temp: Uint8Array = new Uint8Array(src.length),
): Uint8Array {
  blurAxis(src, width, height, 1, 0, temp)
  blurAxis(temp, width, height, 0, 1, dst)
  return dst
}

export function reduceLuma(
  src: ArrayLike<number>,
  pixelCount: number,
  channels = 4,
  normalized = false,
): { mean: number; max: number; count: number } {
  let sum = 0
  let max = 0
  let count = 0
  for (let i = 0; i < pixelCount; i++) {
    const o = i * channels
    const y = lumaBt709(
      sampleChannel(src, o, normalized),
      sampleChannel(src, o + 1, normalized),
      sampleChannel(src, o + 2, normalized),
    )
    sum += y
    if (y > max) max = y
    count += 1
  }
  return { mean: count ? sum / count : 0, max, count }
}
