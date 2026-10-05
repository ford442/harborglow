// =============================================================================
// EMITTER PRESETS — the particle looks the GPU engine knows (#248)
//
// Per-particle simulation constants live in a GPU uniform table (two vec4 rows
// per preset, see packPresetTable); spawn-shape fields (speed, cone, jitter)
// are applied when a batch is packed. Pure TS — no three/tsl import.
// =============================================================================

export type EmitterPresetId = 'spark' | 'firework' | 'mist' | 'glitter' | 'installBurst'

export interface EmitterPreset {
  id: EmitterPresetId
  /** Row index in the GPU preset table; also encoded into each particle (< 8). */
  index: number
  /** Vertical acceleration, m/s² (negative falls). */
  gravity: number
  /** Linear drag, 1/s. */
  drag: number
  /** Mean lifetime, s (each particle varies ±30%). */
  lifeS: number
  /** Sprite world size at birth, m. */
  size: number
  /** Size multiplier at end of life. */
  sizeEnd: number
  /** Curl-ish noise acceleration amplitude, m/s². */
  turbulence: number
  /** How much bass / treble analysis scales brightness and size. */
  beatGain: { bass: number; treble: number }
  /** Launch speed range, m/s. */
  speed: readonly [number, number]
  /** 0 = along the emit direction, 1 = any direction. */
  cone: number
  /** Spawn position jitter radius, m. */
  jitter: number
  /** Default count for a one-shot trigger. */
  burstCount: number
  /** Default rate for a continuous emitter, particles/s. */
  ratePerS: number
}

export const EMITTER_PRESETS: Readonly<Record<EmitterPresetId, EmitterPreset>> = {
  spark: {
    id: 'spark', index: 0,
    gravity: -9.8, drag: 0.6, lifeS: 0.9, size: 0.12, sizeEnd: 0.3, turbulence: 0.5,
    beatGain: { bass: 0.4, treble: 1.0 },
    speed: [6, 14], cone: 0.55, jitter: 0.1, burstCount: 600, ratePerS: 1500,
  },
  firework: {
    id: 'firework', index: 1,
    gravity: -3.5, drag: 1.2, lifeS: 2.2, size: 0.35, sizeEnd: 0.2, turbulence: 1.0,
    beatGain: { bass: 1.0, treble: 0.4 },
    speed: [10, 22], cone: 1, jitter: 0.2, burstCount: 4000, ratePerS: 0,
  },
  mist: {
    id: 'mist', index: 2,
    gravity: 0.4, drag: 2.5, lifeS: 3.5, size: 1.2, sizeEnd: 2.5, turbulence: 2.0,
    beatGain: { bass: 0.3, treble: 0 },
    speed: [8, 16], cone: 0.25, jitter: 0.3, burstCount: 2000, ratePerS: 6000,
  },
  glitter: {
    id: 'glitter', index: 3,
    gravity: -0.6, drag: 1.5, lifeS: 3.0, size: 0.08, sizeEnd: 0.5, turbulence: 1.5,
    beatGain: { bass: 0.2, treble: 1.5 },
    speed: [0.5, 3], cone: 1, jitter: 1.5, burstCount: 1500, ratePerS: 3000,
  },
  installBurst: {
    id: 'installBurst', index: 4,
    gravity: -6, drag: 1.0, lifeS: 1.6, size: 0.18, sizeEnd: 0.2, turbulence: 0.8,
    beatGain: { bass: 0.5, treble: 0.5 },
    speed: [3, 9], cone: 0.8, jitter: 0.2, burstCount: 2500, ratePerS: 0,
  },
}

/** Rows reserved in the GPU table; `index` must stay below this. */
export const PRESET_TABLE_ROWS = 8

/**
 * Two vec4 rows per preset, laid out for `uniformArray(…, 'vec4')`:
 * row 2i   = [gravity, drag, lifeS, size]
 * row 2i+1 = [turbulence, bassGain, trebleGain, sizeEnd]
 */
export function packPresetTable(): Float32Array {
  const out = new Float32Array(PRESET_TABLE_ROWS * 2 * 4)
  for (const p of Object.values(EMITTER_PRESETS)) {
    const o = p.index * 8
    out.set([p.gravity, p.drag, p.lifeS, p.size, p.turbulence, p.beatGain.bass, p.beatGain.treble, p.sizeEnd], o)
  }
  return out
}
