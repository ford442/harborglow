// =============================================================================
// wasmDSP.ts — HarborGlow WebAssembly DSP System
//
// Loads harborglow_dsp.wasm (Emscripten STANDALONE_WASM reactor) and exposes
// near-native math helpers for:
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

  dsp_smooth_step(t: number): number
  dsp_smoother_step(t: number): number
  dsp_sin_approx(x: number): number
  dsp_sin_full(x: number): number

  dsp_wave_height(
    x: number, z: number, time: number,
    amp: number, freq: number, speed: number,
    dirX: number, dirZ: number,
  ): number

  dsp_wave_height_batch(
    xsPtr: number, zsPtr: number, time: number,
    amp: number, freq: number, speed: number, dirX: number, dirZ: number,
    outPtr: number, count: number,
  ): void

  dsp_additive_synth_sample(
    freq: number, time: number, harmonics: number, decay: number,
  ): number

  dsp_audio_rms(dataPtr: number, count: number): number
}

// ---------------------------------------------------------------------------
// Raw Emscripten STANDALONE_WASM exports (memory + allocators)
// ---------------------------------------------------------------------------

interface RawWasmInstance {
  memory: WebAssembly.Memory
  malloc: (size: number) => number
  free: (ptr: number) => void
  _initialize?: () => void
  dsp_mix: (a: number, b: number, t: number) => number
  dsp_clamp: (x: number, lo: number, hi: number) => number
  dsp_remap: (v: number, lo1: number, hi1: number, lo2: number, hi2: number) => number
  dsp_smooth_step: (t: number) => number
  dsp_smoother_step: (t: number) => number
  dsp_sin_approx: (x: number) => number
  dsp_sin_full: (x: number) => number
  dsp_wave_height: HarborGlowDSPExports['dsp_wave_height']
  dsp_wave_height_batch: HarborGlowDSPExports['dsp_wave_height_batch']
  dsp_additive_synth_sample: HarborGlowDSPExports['dsp_additive_synth_sample']
  dsp_audio_rms: (dataPtr: number, count: number) => number
}

// ---------------------------------------------------------------------------
// Pure TypeScript fallback — always available
// ---------------------------------------------------------------------------

const jsExports: HarborGlowDSPExports = {
  dsp_mix:   (a, b, t)                    => a + (b - a) * t,
  dsp_clamp: (x, lo, hi)                  => Math.min(Math.max(x, lo), hi),
  dsp_remap: (v, lo1, hi1, lo2, hi2)      => lo2 + (v - lo1) / (hi1 - lo1) * (hi2 - lo2),
  dsp_smooth_step: (t) => {
    const tc = Math.min(Math.max(t, 0), 1)
    return tc * tc * (3 - 2 * tc)
  },
  dsp_smoother_step: (t) => {
    const tc = Math.min(Math.max(t, 0), 1)
    return tc * tc * tc * (tc * (tc * 6 - 15) + 10)
  },
  dsp_sin_approx: (x) => {
    const xpix = x * (Math.PI - x)
    return (16 * xpix) / (5 * Math.PI * Math.PI - 4 * xpix)
  },
  dsp_sin_full: (x) => {
    const TWO_PI = 2 * Math.PI
    x = x - TWO_PI * Math.floor(x / TWO_PI)
    return x < Math.PI ? jsExports.dsp_sin_approx(x) : -jsExports.dsp_sin_approx(x - Math.PI)
  },
  dsp_wave_height: (x, z, time, amp, freq, speed, dirX, dirZ) => {
    const dot = x * dirX + z * dirZ
    const phase = dot * freq + speed * time
    return amp * Math.sin(phase)
  },
  dsp_wave_height_batch: (xsPtr, zsPtr, time, amp, freq, speed, dirX, dirZ, outPtr, count) => {
    // Unused in JS path — waveHeightBatch implements the batch loop directly.
    void xsPtr; void zsPtr; void outPtr
    for (let i = 0; i < count; i++) {
      // no-op — callers use waveHeightBatch helper on WasmDSPSystem
    }
    void time; void amp; void freq; void speed; void dirX; void dirZ
  },
  dsp_additive_synth_sample: (freq, time, harmonics, decay) => {
    const n = Math.min(Math.max(Math.round(harmonics), 1), 64)
    const TWO_PI = 2 * Math.PI
    let sample = 0
    let norm = 0
    for (let k = 1; k <= n; k++) {
      const weight = 1 / Math.pow(k, decay)
      sample += Math.sin(TWO_PI * freq * k * time) * weight
      norm += weight
    }
    return norm > 0 ? sample / norm : 0
  },
  dsp_audio_rms: (_dataPtr, count) => {
    void _dataPtr
    return count <= 0 ? 0 : 0
  },
}

// ---------------------------------------------------------------------------
// WasmDSPSystem — singleton managing WASM lifecycle
// ---------------------------------------------------------------------------

type WasmStatus = 'idle' | 'loading' | 'ready' | 'unavailable'

class WasmDSPSystem {
  private _exports: HarborGlowDSPExports = jsExports
  private _raw: RawWasmInstance | null = null
  private _status: WasmStatus = 'idle'
  private _loadPromise: Promise<void> | null = null

  // Reusable scratch buffer for single-layer batch (foam grid = 64 points max typical)
  private _batchScratch: Float32Array | null = null

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

  mix(a: number, b: number, t: number): number {
    return this._exports.dsp_mix(a, b, t)
  }

  clamp(x: number, lo: number, hi: number): number {
    return this._exports.dsp_clamp(x, lo, hi)
  }

  remap(v: number, lo1: number, hi1: number, lo2: number, hi2: number): number {
    return this._exports.dsp_remap(v, lo1, hi1, lo2, hi2)
  }

  smoothStep(t: number): number {
    return this._exports.dsp_smooth_step(t)
  }

  smootherStep(t: number): number {
    return this._exports.dsp_smoother_step(t)
  }

  sinApprox(x: number): number {
    return this._exports.dsp_sin_approx(x)
  }

  sinFull(x: number): number {
    return this._exports.dsp_sin_full(x)
  }

  waveHeight(
    x: number, z: number, time: number,
    amp: number, freq: number, speed: number,
    dirX: number, dirZ: number,
  ): number {
    return this._exports.dsp_wave_height(x, z, time, amp, freq, speed, dirX, dirZ)
  }

  additiveSynthSample(
    freq: number, time: number, harmonics: number, decay: number,
  ): number {
    return this._exports.dsp_additive_synth_sample(freq, time, harmonics, decay)
  }

  /**
   * RMS of a Float32Array. Uses WASM heap when active.
   */
  audioRms(data: Float32Array): number {
    if (data.length === 0) return 0
    if (this._raw) {
      const raw = this._raw
      const ptr = raw.malloc(data.length * 4)
      try {
        new Float32Array(raw.memory.buffer, ptr, data.length).set(data)
        return raw.dsp_audio_rms(ptr, data.length)
      } finally {
        raw.free(ptr)
      }
    }
    let sum = 0
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
    return Math.sqrt(sum / data.length)
  }

  /**
   * Evaluate one Gerstner layer for many (x,z) positions.
   * Writes heights into `out` (reused or newly allocated).
   */
  waveHeightBatch(
    xs: Float32Array | number[],
    zs: Float32Array | number[],
    time: number,
    amp: number,
    freq: number,
    speed: number,
    dirX: number,
    dirZ: number,
    out?: Float32Array,
  ): Float32Array {
    const count = xs.length
    if (count !== zs.length) {
      throw new Error('waveHeightBatch: xs and zs must have equal length')
    }
    const heights = out ?? new Float32Array(count)

    if (this._raw) {
      const raw = this._raw
      const xsPtr = raw.malloc(count * 4)
      const zsPtr = raw.malloc(count * 4)
      const outPtr = raw.malloc(count * 4)
      try {
        const heap = new Float32Array(raw.memory.buffer)
        const xsOff = xsPtr / 4
        const zsOff = zsPtr / 4
        const outOff = outPtr / 4
        for (let i = 0; i < count; i++) {
          heap[xsOff + i] = xs[i]
          heap[zsOff + i] = zs[i]
        }
        raw.dsp_wave_height_batch(xsPtr, zsPtr, time, amp, freq, speed, dirX, dirZ, outPtr, count)
        heights.set(heap.subarray(outOff, outOff + count))
      } finally {
        raw.free(xsPtr)
        raw.free(zsPtr)
        raw.free(outPtr)
      }
      return heights
    }

    for (let i = 0; i < count; i++) {
      heights[i] = this.waveHeight(xs[i], zs[i], time, amp, freq, speed, dirX, dirZ)
    }
    return heights
  }

  /**
   * Scratch buffer for accumulating multi-layer batch results without
   * allocating each frame (WaveSystem uses this).
   */
  getBatchScratch(count: number): Float32Array {
    if (!this._batchScratch || this._batchScratch.length < count) {
      this._batchScratch = new Float32Array(count)
    }
    return this._batchScratch
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private async _load(): Promise<void> {
    this._status = 'loading'
    try {
      const base = typeof import.meta !== 'undefined'
        ? (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? './'
        : './'
      const url = `${base}wasm/harborglow_dsp.wasm`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${url}`)
      }

      const buffer = await response.arrayBuffer()
      const imports = {
        env: {
          emscripten_notify_memory_growth: () => {},
        },
      }
      const { instance } = await WebAssembly.instantiate(buffer, imports)
      const exp = instance.exports as unknown as RawWasmInstance

      const required: Array<keyof RawWasmInstance> = [
        'memory', 'malloc', 'free',
        'dsp_mix', 'dsp_clamp', 'dsp_remap',
        'dsp_smooth_step', 'dsp_smoother_step',
        'dsp_sin_approx', 'dsp_sin_full',
        'dsp_wave_height', 'dsp_wave_height_batch',
        'dsp_additive_synth_sample', 'dsp_audio_rms',
      ]
      for (const fn of required) {
        if (exp[fn] === undefined) {
          throw new Error(`WASM export missing: ${fn}`)
        }
      }

      if (exp._initialize) exp._initialize()

      this._raw = exp
      this._exports = exp
      this._status = 'ready'
    } catch (err) {
      this._status = 'unavailable'
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

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).wasmDSP = wasmDSP
}
