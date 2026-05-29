// =============================================================================
// wasmDSP.ts — HarborGlow WebAssembly DSP System
//
// Loads harborglow_dsp.wasm and exposes near-native math helpers for:
//   • Audio / DSP    (additive synthesis, RMS, signal mixing)
//   • Ocean physics  (Gerstner wave height queries, batch evaluation)
//   • Utility math   (clamp, remap, smoothstep, fast trig)
//
// The module falls back to equivalent pure TypeScript implementations when
// the WASM binary is unavailable (Node.js test environments, first load
// before async init completes, etc.).
//
// Usage:
//   import { wasmDSP } from './wasmDSP'
//   await wasmDSP.init()
//   const h = wasmDSP.waveHeight(x, z, t, amp, freq, speed, dx, dz)
// =============================================================================

// ---------------------------------------------------------------------------
// Public interface — mirrors the exports of harborglow_dsp.wasm
// ---------------------------------------------------------------------------

export interface HarborGlowDSPExports {
  /** Linear interpolation: a + (b − a) × t */
  dsp_mix(a: number, b: number, t: number): number

  /** Clamp x to the closed interval [lo, hi]. */
  dsp_clamp(x: number, lo: number, hi: number): number

  /**
   * Remap v from input range [lo1, hi1] to output range [lo2, hi2].
   * No clamping applied; extrapolation is allowed.
   */
  dsp_remap(v: number, lo1: number, hi1: number, lo2: number, hi2: number): number
}

// ---------------------------------------------------------------------------
// Pure TypeScript fallback — always available
// ---------------------------------------------------------------------------

const jsFallback: HarborGlowDSPExports = {
  dsp_mix:   (a, b, t)                    => a + (b - a) * t,
  dsp_clamp: (x, lo, hi)                  => Math.min(Math.max(x, lo), hi),
  dsp_remap: (v, lo1, hi1, lo2, hi2)      => lo2 + (v - lo1) / (hi1 - lo1) * (hi2 - lo2),
}

// ---------------------------------------------------------------------------
// Additional high-level helpers (implemented in TypeScript, delegate to
// either WASM or JS fallback depending on load state)
// ---------------------------------------------------------------------------

/** Cubic smoothstep for t ∈ [0, 1]. */
function smoothStep(t: number): number {
  const tc = Math.min(Math.max(t, 0), 1)
  return tc * tc * (3 - 2 * tc)
}

/** Ken Perlin's smoother-step for t ∈ [0, 1]. */
function smootherStep(t: number): number {
  const tc = Math.min(Math.max(t, 0), 1)
  return tc * tc * tc * (tc * (tc * 6 - 15) + 10)
}

/**
 * Fast sine approximation using Bhaskara I's formula.
 * Valid for x ∈ [0, π].  Max error ≈ 0.1 %.
 */
function sinApprox(x: number): number {
  const xpix = x * (Math.PI - x)
  return (16 * xpix) / (5 * Math.PI * Math.PI - 4 * xpix)
}

/** Full-cycle fast sine: wraps x to [0, 2π] then applies Bhaskara I. */
function sinFull(x: number): number {
  const TWO_PI = 2 * Math.PI
  x = x - TWO_PI * Math.floor(x / TWO_PI)
  return x < Math.PI ? sinApprox(x) : -sinApprox(x - Math.PI)
}

/**
 * Single Gerstner wave height at (x, z, time).
 *
 * @param x     World X (metres)
 * @param z     World Z (metres)
 * @param time  Simulation time (seconds)
 * @param amp   Amplitude (metres)
 * @param freq  Angular spatial frequency (2π / wavelength, rad/m)
 * @param speed Phase speed (m/s)
 * @param dirX  Normalised wave direction X
 * @param dirZ  Normalised wave direction Z
 */
function waveHeight(
  x: number, z: number, time: number,
  amp: number, freq: number, speed: number,
  dirX: number, dirZ: number,
): number {
  const phase = freq * (x * dirX + z * dirZ) - speed * time
  return amp * Math.cos(phase)
}

/**
 * Additive synthesizer — sum of `harmonics` sine partials.
 *
 * Each partial k contributes: sin(2π × freq × k × time) / k^decay
 *
 * @param freq      Fundamental frequency (Hz)
 * @param time      Sample time (seconds)
 * @param harmonics Number of partials (1 … 64)
 * @param decay     Harmonic roll-off exponent (1 = 1/k, 2 = 1/k², …)
 * @returns         Normalised sample in [−1, 1]
 */
function additiveSynthSample(
  freq: number, time: number,
  harmonics: number, decay: number,
): number {
  const n = Math.min(Math.max(Math.round(harmonics), 1), 64)
  const TWO_PI = 2 * Math.PI
  let sample = 0
  let norm = 0
  for (let k = 1; k <= n; k++) {
    const weight = 1 / Math.pow(k, decay)
    sample += Math.sin(TWO_PI * freq * k * time) * weight
    norm   += weight
  }
  return norm > 0 ? sample / norm : 0
}

/**
 * Compute the RMS of a Float32Array audio buffer (pure JS).
 */
function audioRms(data: Float32Array): number {
  if (data.length === 0) return 0
  let sum = 0
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
  return Math.sqrt(sum / data.length)
}

// ---------------------------------------------------------------------------
// WasmDSPSystem — singleton managing WASM lifecycle
// ---------------------------------------------------------------------------

type WasmStatus = 'idle' | 'loading' | 'ready' | 'unavailable'

class WasmDSPSystem {
  private _exports: HarborGlowDSPExports = jsFallback
  private _status: WasmStatus = 'idle'
  private _loadPromise: Promise<void> | null = null

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Attempt to load the WASM module from `public/wasm/harborglow_dsp.wasm`.
   * Safe to call multiple times — subsequent calls return the same promise.
   * The system is immediately usable via JS fallbacks even before init().
   */
  init(): Promise<void> {
    if (this._loadPromise) return this._loadPromise
    this._loadPromise = this._load()
    return this._loadPromise
  }

  /** Whether the WASM binary is currently in use. */
  get isWasmActive(): boolean {
    return this._status === 'ready'
  }

  /** Current load status. */
  get status(): WasmStatus {
    return this._status
  }

  // -------------------------------------------------------------------------
  // DSP helpers — delegates to WASM or JS fallback
  // -------------------------------------------------------------------------

  /** Linear interpolation: a + (b − a) × t */
  mix(a: number, b: number, t: number): number {
    return this._exports.dsp_mix(a, b, t)
  }

  /** Clamp x to [lo, hi]. */
  clamp(x: number, lo: number, hi: number): number {
    return this._exports.dsp_clamp(x, lo, hi)
  }

  /** Remap v from [lo1, hi1] to [lo2, hi2]. */
  remap(v: number, lo1: number, hi1: number, lo2: number, hi2: number): number {
    return this._exports.dsp_remap(v, lo1, hi1, lo2, hi2)
  }

  /** Cubic smoothstep (pure TS — always available). */
  smoothStep  = smoothStep
  /** Perlin smoother-step (pure TS — always available). */
  smootherStep = smootherStep

  /** Fast Bhaskara sine for x ∈ [0, π] (pure TS — always available). */
  sinApprox  = sinApprox
  /** Full-cycle fast sine, any x in radians (pure TS — always available). */
  sinFull    = sinFull

  /** Single Gerstner wave height (pure TS — always available). */
  waveHeight = waveHeight

  /**
   * Additive synthesizer sample (pure TS — always available).
   * @see additiveSynthSample for parameter documentation.
   */
  additiveSynthSample = additiveSynthSample

  /** RMS of a Float32Array (pure TS — always available). */
  audioRms = audioRms

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private async _load(): Promise<void> {
    this._status = 'loading'
    try {
      // Resolve URL relative to Vite's BASE_URL (handles base: './' in prod)
      const base = typeof import.meta !== 'undefined'
        ? (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? './'
        : './'
      const url = `${base}wasm/harborglow_dsp.wasm`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${url}`)
      }

      const buffer = await response.arrayBuffer()
      const { instance } = await WebAssembly.instantiate(buffer)
      const exp = instance.exports as unknown as HarborGlowDSPExports

      // Verify expected exports are present
      const required: Array<keyof HarborGlowDSPExports> = [
        'dsp_mix', 'dsp_clamp', 'dsp_remap',
      ]
      for (const fn of required) {
        if (typeof exp[fn] !== 'function') {
          throw new Error(`WASM export missing: ${fn}`)
        }
      }

      this._exports = exp
      this._status  = 'ready'
    } catch (err) {
      this._status = 'unavailable'
      // Fallback is already in place; log only in dev
      if (typeof import.meta !== 'undefined' &&
          (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
        console.warn('[wasmDSP] Falling back to JS implementation:', err)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/** Singleton WASM DSP system. Call wasmDSP.init() once at app start. */
export const wasmDSP = new WasmDSPSystem()

// Expose on window in dev for browser console inspection
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).wasmDSP = wasmDSP
}
