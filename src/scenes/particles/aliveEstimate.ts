// =============================================================================
// ALIVE ESTIMATE — CPU-side count of live particles, for diagnostics
//
// The ring has no per-particle CPU state and the frame path never reads the
// GPU back (mapAsync would stall it), so "how many are alive" is estimated from
// what was emitted: spawns are binned by time and counted while younger than
// their preset's mean lifetime. Particle lives vary ±30%, so this is an
// estimate; it is capped at the ring capacity (older spawns are overwritten).
// Fixed typed arrays: no allocation after construction.
// =============================================================================

import { EMITTER_PRESETS, PRESET_TABLE_ROWS, type EmitterPresetId } from '../../rendering/particles/emitterPresets'

const BUCKETS_PER_S = 32
/** 8 s of history: longer than any preset's life. */
const BUCKETS = 256

export class AliveEstimator {
  private readonly stamp = new Int32Array(PRESET_TABLE_ROWS * BUCKETS).fill(-1)
  private readonly count = new Float32Array(PRESET_TABLE_ROWS * BUCKETS)
  private readonly lifeBuckets = new Int32Array(PRESET_TABLE_ROWS)

  constructor() {
    for (const p of Object.values(EMITTER_PRESETS)) {
      this.lifeBuckets[p.index] = Math.min(BUCKETS - 1, Math.ceil(p.lifeS * BUCKETS_PER_S))
    }
  }

  /** Record `n` particles of `preset` spawned at visual time `t` (s). */
  add(preset: EmitterPresetId, t: number, n: number): void {
    if (n <= 0) return
    const index = EMITTER_PRESETS[preset].index
    const id = Math.floor(t * BUCKETS_PER_S)
    const slot = index * BUCKETS + (id % BUCKETS)
    if (this.stamp[slot] !== id) {
      this.stamp[slot] = id
      this.count[slot] = 0
    }
    this.count[slot] += n
  }

  /** Estimated live particles at visual time `t`, capped at `capacity`. */
  estimate(t: number, capacity: number): number {
    const nowId = Math.floor(t * BUCKETS_PER_S)
    let total = 0
    for (let index = 0; index < PRESET_TABLE_ROWS; index++) {
      const life = this.lifeBuckets[index]
      for (let k = 0; k <= life; k++) {
        const id = nowId - k
        if (id < 0) break
        const slot = index * BUCKETS + (id % BUCKETS)
        if (this.stamp[slot] === id) total += this.count[slot]
      }
    }
    return Math.min(Math.round(total), capacity)
  }

  reset(): void {
    this.stamp.fill(-1)
    this.count.fill(0)
  }
}
