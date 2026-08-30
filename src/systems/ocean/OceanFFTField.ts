// =============================================================================
// OCEAN FFT FIELD — Phillips spectrum + inverse FFT ocean surface (CPU/WASM tier)
//
// This is the `high` quality-tier ocean referenced by ADR 0001 Phase C. It
// replaces nothing at `low`/`medium`: those tiers keep the 4-layer Gerstner sum
// in `WaveSystem` / `gerstnerTsl`.
//
// Pipeline (Tessendorf, "Simulating Ocean Water"):
//
//   1. h̃₀(k) = (ξr + i·ξi)/√2 · √P(k)          — built once, from a seeded RNG
//   2. h̃(k,t) = h̃₀(k)·e^(iωt) + conj(h̃₀(−k))·e^(−iωt)
//   3. D̃(k,t) = −i·(k/|k|)·h̃(k,t)              — horizontal "choppy" term
//   4. h(x,t), D(x,t) = IFFT of the above, with the (−1)^(m+n) centre shift
//
// The result is one tiling patch of `patchSize` metres, consumed by two callers
// that MUST agree (the buoyancy contract, see docs/systems/OCEAN_FFT.md):
//
//   • the water vertex shader, via a HalfFloat DataTexture (RGB = Dx, h, Dz)
//   • `WaveSystem` height/normal/foam queries, via `heightAt()` — a bilinear
//     read of the *same* IFFT output, not a second Gerstner evaluation and not
//     a GPU readback.
//
// Determinism: the only entropy is the `seed` in the config, consumed through
// `Rng` (xoshiro128**). Nothing here reads `Math.random`, the wall clock, or
// the store. Same seed + same config + same `time` ⇒ bit-identical output.
// =============================================================================

import { Rng } from '../sim/Rng'
import { fft2d } from './fft2d'

/** Gravitational acceleration used for the deep-water dispersion relation. */
export const GRAVITY = 9.81

export interface OceanFFTConfig {
  /** Grid resolution N (power of two). 128 at `high`, 256 at `cinema`. */
  size: number
  /** Patch edge length in metres. The field tiles every `patchSize` metres. */
  patchSize: number
  /** Wind heading in radians, measured the same way as `store.windDirection`. */
  windDirection: number
  /** Wind speed in m/s. Drives the Phillips peak wavelength L = V²/g. */
  windSpeed: number
  /** Global height multiplier applied after the IFFT. */
  amplitude: number
  /** Horizontal displacement strength (0 = pure vertical, ~1 = sharp crests). */
  choppiness: number
  /** Suppression length for capillary ripples, in metres. */
  smallWaveLength: number
  /** Seed for the h̃₀ Gaussian draw. */
  seed: number
  /**
   * When > 0, ω is quantised to multiples of 2π/loopPeriod so the surface
   * repeats with that period (seconds), to within float precision. Keeps long
   * sessions and replays from wandering into an unrepresentative sea state.
   */
  loopPeriod: number
}

export const DEFAULT_OCEAN_FFT_CONFIG: OceanFFTConfig = {
  size: 128,
  patchSize: 180,
  windDirection: 0,
  windSpeed: 9,
  amplitude: 1,
  choppiness: 0.85,
  smallWaveLength: 0.35,
  seed: 0x0cea4ff7,
  loopPeriod: 200,
}

/** Phillips amplitude constant, calibrated against the Gerstner tier's look. */
const PHILLIPS_A = 3.5e-6

function gaussianPair(rng: Rng): [number, number] {
  // Box–Muller. `u` is nudged off zero so log() stays finite.
  const u = Math.max(rng.next(), 1e-9)
  const v = rng.next()
  const radius = Math.sqrt(-2 * Math.log(u))
  const theta = 2 * Math.PI * v
  return [radius * Math.cos(theta), radius * Math.sin(theta)]
}

export class OceanFFTField {
  private config: OceanFFTConfig
  private n: number
  private cells: number

  // Static per-configuration tables (rebuilt only when the spectrum changes).
  private h0Re: Float32Array
  private h0Im: Float32Array
  /** Already-conjugated conj(h̃₀(−k)), so evolution is two multiplies. */
  private h0ConjRe: Float32Array
  private h0ConjIm: Float32Array
  private omega: Float64Array
  /** kx/|k| and kz/|k|, zero at k = 0. */
  private kxNorm: Float32Array
  private kzNorm: Float32Array

  // Per-frame scratch.
  private heightRe: Float32Array
  private heightIm: Float32Array
  private dispRe: Float32Array
  private dispIm: Float32Array

  /** Vertical displacement, row-major `idx = row * N + col` (row = +Z, col = +X). */
  readonly heights: Float32Array
  /** Horizontal displacement along +X. */
  readonly displacementX: Float32Array
  /** Horizontal displacement along +Z. */
  readonly displacementZ: Float32Array

  private lastTime = Number.NaN
  /** Root-mean-square surface elevation of the most recent `update()`, metres. */
  private rms = 0

  constructor(config: Partial<OceanFFTConfig> = {}) {
    this.config = { ...DEFAULT_OCEAN_FFT_CONFIG, ...config }
    this.n = this.config.size
    this.cells = this.n * this.n

    const { cells } = this
    this.h0Re = new Float32Array(cells)
    this.h0Im = new Float32Array(cells)
    this.h0ConjRe = new Float32Array(cells)
    this.h0ConjIm = new Float32Array(cells)
    this.omega = new Float64Array(cells)
    this.kxNorm = new Float32Array(cells)
    this.kzNorm = new Float32Array(cells)
    this.heightRe = new Float32Array(cells)
    this.heightIm = new Float32Array(cells)
    this.dispRe = new Float32Array(cells)
    this.dispIm = new Float32Array(cells)
    this.heights = new Float32Array(cells)
    this.displacementX = new Float32Array(cells)
    this.displacementZ = new Float32Array(cells)

    this.buildSpectrum()
    this.update(0)
  }

  getConfig(): OceanFFTConfig {
    return { ...this.config }
  }

  get size(): number {
    return this.n
  }

  get patchSize(): number {
    return this.config.patchSize
  }

  /** RMS elevation of the last `update()`; significant wave height ≈ 4 × RMS. */
  getRms(): number {
    return this.rms
  }

  /**
   * Update wind / amplitude / choppiness. Wind and seed changes rebuild the
   * h̃₀ tables (an O(N²) pass); amplitude and choppiness are applied per frame
   * and are therefore free to animate.
   */
  setParams(params: Partial<OceanFFTConfig>): void {
    const next = { ...this.config, ...params }
    if (next.size !== this.config.size) {
      throw new Error('OceanFFTField.setParams: size is fixed; construct a new field instead')
    }

    const spectrumChanged =
      next.windDirection !== this.config.windDirection ||
      next.windSpeed !== this.config.windSpeed ||
      next.patchSize !== this.config.patchSize ||
      next.smallWaveLength !== this.config.smallWaveLength ||
      next.loopPeriod !== this.config.loopPeriod ||
      next.seed !== this.config.seed

    this.config = next
    if (spectrumChanged) {
      this.buildSpectrum()
      this.lastTime = Number.NaN
    }
  }

  // =========================================================================
  // SPECTRUM
  // =========================================================================

  /**
   * Phillips power spectrum with a directional cosine-squared term and a
   * capillary cutoff. Returns 0 at k = 0 and for waves travelling against
   * the wind is damped rather than zeroed (|k̂·ŵ|² keeps both directions).
   */
  private phillips(kx: number, kz: number, windX: number, windZ: number): number {
    const kSq = kx * kx + kz * kz
    if (kSq < 1e-12) return 0

    const k = Math.sqrt(kSq)
    const { windSpeed, smallWaveLength } = this.config
    const largest = (windSpeed * windSpeed) / GRAVITY
    if (largest < 1e-6) return 0

    const kL = k * largest
    const directional = (kx / k) * windX + (kz / k) * windZ

    const base = (PHILLIPS_A * Math.exp(-1 / (kL * kL))) / (kSq * kSq)
    const damp = Math.exp(-kSq * smallWaveLength * smallWaveLength)
    return base * directional * directional * damp
  }

  /** Rebuild h̃₀, its mirrored conjugate, ω and the normalised k directions. */
  private buildSpectrum(): void {
    const { n } = this
    const { patchSize, windDirection, loopPeriod, seed } = this.config
    const windX = Math.cos(windDirection)
    const windZ = Math.sin(windDirection)
    const twoPiOverL = (2 * Math.PI) / patchSize
    const half = n / 2
    const omegaQuantum = loopPeriod > 0 ? (2 * Math.PI) / loopPeriod : 0

    // Amplitudes first: h̃₀(−k) has to be readable while filling index k, so the
    // draw is a separate pass from the mirroring pass.
    const rng = new Rng(seed)
    for (let row = 0; row < n; row++) {
      const kz = (row - half) * twoPiOverL
      for (let col = 0; col < n; col++) {
        const kx = (col - half) * twoPiOverL
        const idx = row * n + col

        const [xi, eta] = gaussianPair(rng)
        const amplitude = Math.sqrt(this.phillips(kx, kz, windX, windZ) / 2)
        this.h0Re[idx] = xi * amplitude
        this.h0Im[idx] = eta * amplitude

        const kSq = kx * kx + kz * kz
        const k = Math.sqrt(kSq)
        if (k > 1e-9) {
          this.kxNorm[idx] = kx / k
          this.kzNorm[idx] = kz / k
        } else {
          this.kxNorm[idx] = 0
          this.kzNorm[idx] = 0
        }

        let w = Math.sqrt(GRAVITY * k)
        if (omegaQuantum > 0) w = Math.floor(w / omegaQuantum) * omegaQuantum
        this.omega[idx] = w
      }
    }

    // conj(h̃₀(−k)). Index (row, col) maps to −k at (n − row, n − col) modulo n,
    // which for the centred layout is the mirror about the grid centre.
    for (let row = 0; row < n; row++) {
      const mirrorRow = (n - row) % n
      for (let col = 0; col < n; col++) {
        const mirrorCol = (n - col) % n
        const idx = row * n + col
        const mirror = mirrorRow * n + mirrorCol
        this.h0ConjRe[idx] = this.h0Re[mirror]
        this.h0ConjIm[idx] = -this.h0Im[mirror]
      }
    }

  }

  // =========================================================================
  // TIME EVOLUTION
  // =========================================================================

  /**
   * Evolve the spectrum to `time` seconds and inverse-transform it.
   *
   * Two IFFTs: one for the height field, one carrying Dx in the real part and
   * Dz in the imaginary part (valid because both are real-valued fields).
   * Skipped entirely when `time` is unchanged since the last call.
   */
  update(time: number): void {
    if (time === this.lastTime) return
    this.lastTime = time

    const { n, cells } = this
    const { choppiness, amplitude } = this.config
    const wantsChoppy = choppiness > 1e-4

    for (let idx = 0; idx < cells; idx++) {
      const phase = this.omega[idx] * time
      const c = Math.cos(phase)
      const s = Math.sin(phase)

      // h̃₀(k)·e^(iωt)
      const ar = this.h0Re[idx] * c - this.h0Im[idx] * s
      const ai = this.h0Re[idx] * s + this.h0Im[idx] * c
      // conj(h̃₀(−k))·e^(−iωt)
      const br = this.h0ConjRe[idx] * c + this.h0ConjIm[idx] * s
      const bi = this.h0ConjIm[idx] * c - this.h0ConjRe[idx] * s

      const hRe = ar + br
      const hIm = ai + bi
      this.heightRe[idx] = hRe
      this.heightIm[idx] = hIm

      if (wantsChoppy) {
        // D̃x = −i·k̂x·h̃, D̃z = −i·k̂z·h̃, packed as D̃x + i·D̃z so a single
        // complex IFFT yields Dx in .re and Dz in .im.
        const kx = this.kxNorm[idx]
        const kz = this.kzNorm[idx]
        this.dispRe[idx] = kx * hIm + kz * hRe
        this.dispIm[idx] = kz * hIm - kx * hRe
      }
    }

    fft2d(this.heightRe, this.heightIm, n, true)
    if (wantsChoppy) fft2d(this.dispRe, this.dispIm, n, true)

    // Centre shift: indexing k from −N/2 leaves a (−1)^(row+col) factor.
    let sumSq = 0
    for (let row = 0; row < n; row++) {
      const rowOdd = row & 1
      for (let col = 0; col < n; col++) {
        const idx = row * n + col
        const sign = (rowOdd ^ (col & 1)) === 1 ? -1 : 1
        const h = this.heightRe[idx] * sign * amplitude
        this.heights[idx] = h
        sumSq += h * h
        if (wantsChoppy) {
          const scale = sign * amplitude * choppiness
          this.displacementX[idx] = this.dispRe[idx] * scale
          this.displacementZ[idx] = this.dispIm[idx] * scale
        } else {
          this.displacementX[idx] = 0
          this.displacementZ[idx] = 0
        }
      }
    }
    this.rms = Math.sqrt(sumSq / cells)
  }

  // =========================================================================
  // SAMPLING — the CPU half of the buoyancy contract
  // =========================================================================

  private wrapIndex(value: number): number {
    const n = this.n
    const wrapped = value % n
    return wrapped < 0 ? wrapped + n : wrapped
  }

  /**
   * Bilinear read of a grid at world XZ, tiling every `patchSize` metres.
   * This is the exact field the shader displaces by, sampled on the CPU so
   * buoyancy never has to stall on a GPU readback.
   */
  private sampleGrid(grid: Float32Array, x: number, z: number): number {
    const { n } = this
    const cellsPerMetre = n / this.config.patchSize
    const gx = x * cellsPerMetre
    const gz = z * cellsPerMetre

    const x0 = Math.floor(gx)
    const z0 = Math.floor(gz)
    const tx = gx - x0
    const tz = gz - z0

    const col0 = this.wrapIndex(x0)
    const col1 = this.wrapIndex(x0 + 1)
    const row0 = this.wrapIndex(z0)
    const row1 = this.wrapIndex(z0 + 1)

    const h00 = grid[row0 * n + col0]
    const h10 = grid[row0 * n + col1]
    const h01 = grid[row1 * n + col0]
    const h11 = grid[row1 * n + col1]

    const top = h00 + (h10 - h00) * tx
    const bottom = h01 + (h11 - h01) * tx
    return top + (bottom - top) * tz
  }

  /** Vertical displacement at world XZ, metres. */
  heightAt(x: number, z: number): number {
    return this.sampleGrid(this.heights, x, z)
  }

  /** Horizontal displacement at world XZ, written into `out` as [dx, dz]. */
  displacementAt(x: number, z: number, out: [number, number] = [0, 0]): [number, number] {
    out[0] = this.sampleGrid(this.displacementX, x, z)
    out[1] = this.sampleGrid(this.displacementZ, x, z)
    return out
  }

  /** Batch height query — same result as `heightAt` per element, fewer calls. */
  heightBatch(
    xs: ArrayLike<number>,
    zs: ArrayLike<number>,
    out: Float32Array = new Float32Array(xs.length),
  ): Float32Array {
    for (let i = 0; i < xs.length; i++) {
      out[i] = this.sampleGrid(this.heights, xs[i], zs[i])
    }
    return out
  }
}
