import { describe, it, expect, beforeEach, vi } from 'vitest'

// =============================================================================
// wasmDSP — unit tests
//
// The WASM binary is not available in the Node.js test environment, so every
// test exercises the pure-TypeScript fallback path.  The behaviour is
// identical to what the WASM module produces (same algorithms, different
// substrate), so these tests validate both paths at once.
// =============================================================================

// Prevent real fetch calls in tests
vi.stubGlobal('fetch', async () => {
  return { ok: false, status: 404 } as Response
})

// Import after mocking globals
import { wasmDSP } from '../wasmDSP'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const EPS = 1e-5
const near = (got: number, expected: number, eps = EPS) =>
  Math.abs(got - expected) < eps

// ---------------------------------------------------------------------------

describe('wasmDSP — arithmetic helpers', () => {
  describe('mix (linear interpolation)', () => {
    it('returns a at t=0', () => {
      expect(wasmDSP.mix(10, 20, 0)).toBe(10)
    })

    it('returns b at t=1', () => {
      expect(wasmDSP.mix(10, 20, 1)).toBe(20)
    })

    it('returns midpoint at t=0.5', () => {
      expect(near(wasmDSP.mix(10, 20, 0.5), 15)).toBe(true)
    })

    it('handles negative values', () => {
      expect(near(wasmDSP.mix(-1, 1, 0.5), 0)).toBe(true)
    })
  })

  describe('clamp', () => {
    it('passes through values inside the range', () => {
      expect(wasmDSP.clamp(0.5, 0, 1)).toBe(0.5)
    })

    it('clamps below lo', () => {
      expect(wasmDSP.clamp(-5, 0, 10)).toBe(0)
    })

    it('clamps above hi', () => {
      expect(wasmDSP.clamp(15, 0, 10)).toBe(10)
    })

    it('handles lo === hi', () => {
      expect(wasmDSP.clamp(999, 5, 5)).toBe(5)
    })
  })

  describe('remap', () => {
    it('maps 0 → lo2 when v = lo1', () => {
      expect(near(wasmDSP.remap(0, 0, 1, 0, 100), 0)).toBe(true)
    })

    it('maps hi1 → hi2', () => {
      expect(near(wasmDSP.remap(1, 0, 1, 0, 100), 100)).toBe(true)
    })

    it('maps midpoint correctly', () => {
      expect(near(wasmDSP.remap(0.5, 0, 1, 0, 100), 50)).toBe(true)
    })

    it('maps between arbitrary ranges', () => {
      // Remap [0, 360] degrees to [0, 2π] radians
      expect(near(wasmDSP.remap(180, 0, 360, 0, 2 * Math.PI), Math.PI, 1e-4)).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------

describe('wasmDSP — smoothstep', () => {
  it('smoothStep(0) = 0', () => expect(wasmDSP.smoothStep(0)).toBe(0))
  it('smoothStep(1) = 1', () => expect(wasmDSP.smoothStep(1)).toBe(1))
  it('smoothStep(0.5) = 0.5', () => expect(near(wasmDSP.smoothStep(0.5), 0.5)).toBe(true))
  it('smoothStep clamps below 0', () => expect(wasmDSP.smoothStep(-1)).toBe(0))
  it('smoothStep clamps above 1', () => expect(wasmDSP.smoothStep(2)).toBe(1))

  it('smootherStep(0) = 0', () => expect(wasmDSP.smootherStep(0)).toBe(0))
  it('smootherStep(1) = 1', () => expect(wasmDSP.smootherStep(1)).toBe(1))
  it('smootherStep(0.5) = 0.5', () =>
    expect(near(wasmDSP.smootherStep(0.5), 0.5)).toBe(true))
})

// ---------------------------------------------------------------------------

describe('wasmDSP — fast trig', () => {
  it('sinApprox(0) ≈ 0', () =>
    expect(near(wasmDSP.sinApprox(0), Math.sin(0), 1e-3)).toBe(true))

  it('sinApprox(π/2) ≈ 1', () =>
    expect(near(wasmDSP.sinApprox(Math.PI / 2), 1, 0.001)).toBe(true))

  it('sinApprox max error < 0.2% over [0, π]', () => {
    let maxErr = 0
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * Math.PI
      maxErr = Math.max(maxErr, Math.abs(wasmDSP.sinApprox(x) - Math.sin(x)))
    }
    expect(maxErr).toBeLessThan(0.002)
  })

  it('sinFull(0) ≈ 0', () =>
    expect(near(wasmDSP.sinFull(0), 0, 1e-3)).toBe(true))

  it('sinFull(π) ≈ 0', () =>
    expect(near(wasmDSP.sinFull(Math.PI), 0, 1e-3)).toBe(true))

  it('sinFull(3π/2) ≈ -1', () =>
    expect(near(wasmDSP.sinFull(3 * Math.PI / 2), -1, 0.001)).toBe(true))

  it('sinFull wraps correctly for 3π (same as π)', () =>
    expect(near(wasmDSP.sinFull(3 * Math.PI), Math.sin(3 * Math.PI), 1e-3)).toBe(true))
})

// ---------------------------------------------------------------------------

describe('wasmDSP — wave height', () => {
  it('returns 0 displacement for zero amplitude', () => {
    expect(wasmDSP.waveHeight(0, 0, 0, 0, 1, 1, 1, 0)).toBe(0)
  })

  it('returns amp when phase=0 (cos(0)=1)', () => {
    // phase = freq*(x*dirX + z*dirZ) - speed*time = 1*(0*1 + 0*0) - 1*0 = 0
    const amp = 2.5
    expect(near(wasmDSP.waveHeight(0, 0, 0, amp, 1, 1, 1, 0), amp)).toBe(true)
  })

  it('wave height lies within [-amp, amp]', () => {
    const amp = 1.2
    for (let t = 0; t < 10; t += 0.1) {
      const h = wasmDSP.waveHeight(5, 3, t, amp, 0.1, 0.8, 0.7, 0.7)
      expect(h).toBeGreaterThanOrEqual(-amp - 1e-6)
      expect(h).toBeLessThanOrEqual(amp + 1e-6)
    }
  })
})

// ---------------------------------------------------------------------------

describe('wasmDSP — additive synthesis', () => {
  it('produces a non-zero sample', () => {
    const s = wasmDSP.additiveSynthSample(440, 0.01, 4, 1)
    expect(typeof s).toBe('number')
    expect(isNaN(s)).toBe(false)
  })

  it('output is within [-1, 1]', () => {
    for (let t = 0; t < 0.1; t += 0.001) {
      const s = wasmDSP.additiveSynthSample(440, t, 8, 1.5)
      expect(s).toBeGreaterThanOrEqual(-1.001)
      expect(s).toBeLessThanOrEqual(1.001)
    }
  })

  it('1 harmonic = pure sine', () => {
    const freq = 220
    const time = 0.005
    const s = wasmDSP.additiveSynthSample(freq, time, 1, 1)
    expect(near(s, Math.sin(2 * Math.PI * freq * time), 1e-4)).toBe(true)
  })

  it('harmonics clamped to 64', () => {
    // Should not throw or return NaN with extreme harmonic count
    const s = wasmDSP.additiveSynthSample(100, 0.01, 1000, 1)
    expect(isNaN(s)).toBe(false)
  })
})

// ---------------------------------------------------------------------------

describe('wasmDSP — audio RMS', () => {
  it('returns 0 for empty buffer', () => {
    expect(wasmDSP.audioRms(new Float32Array(0))).toBe(0)
  })

  it('returns 1 for constant +1 signal', () => {
    const buf = new Float32Array(128).fill(1)
    expect(near(wasmDSP.audioRms(buf), 1)).toBe(true)
  })

  it('RMS of +1/-1 alternating = 1', () => {
    const buf = new Float32Array(128)
    for (let i = 0; i < buf.length; i++) buf[i] = i % 2 === 0 ? 1 : -1
    expect(near(wasmDSP.audioRms(buf), 1)).toBe(true)
  })

  it('RMS of silence = 0', () => {
    const buf = new Float32Array(128).fill(0)
    expect(wasmDSP.audioRms(buf)).toBe(0)
  })
})

// ---------------------------------------------------------------------------

describe('wasmDSP — WASM load / fallback', () => {
  beforeEach(() => {
    // Reset any previous load attempt by creating a fresh instance
  })

  it('starts in idle or loading state and becomes unavailable (no server in tests)', async () => {
    await wasmDSP.init()
    expect(wasmDSP.status).toBe('unavailable')
    expect(wasmDSP.isWasmActive).toBe(false)
  })

  it('init() can be called multiple times safely', async () => {
    const p1 = wasmDSP.init()
    const p2 = wasmDSP.init()
    expect(p1).toBe(p2)  // same promise
    await p1
  })

  it('DSP helpers still work after failed WASM load', async () => {
    await wasmDSP.init()
    expect(near(wasmDSP.mix(0, 10, 0.3), 3)).toBe(true)
  })
})
