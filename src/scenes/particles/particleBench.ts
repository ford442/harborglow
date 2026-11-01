// =============================================================================
// PARTICLE BENCH — `?particleBench=1` stress fixture for the #248 acceptance
//
// Pins the ring to the `high` budget and keeps it full: four glitter streams
// and four firework streams around the first docked ship (or the origin),
// each spawning at capacity / (8 × life) per second. `window.__particleBench`
// reports average and p95 frame time over the last 30 s (raw R3F delta) —
// the numbers the acceptance run records in docs/systems/PARTICLES.md.
// =============================================================================

import { percentile } from '../../rendering/frameBudgetState'
import { EMITTER_PRESETS, type EmitterPresetId } from '../../rendering/particles/emitterPresets'

export function parseParticleBench(
  search = typeof window === 'undefined' ? '' : window.location.search,
): boolean {
  const raw = new URLSearchParams(search).get('particleBench')
  return raw === '1' || raw === 'true'
}

export interface ParticleBenchStats {
  capacity: number
  spawnedPerSec: number
  /** Rolling 30 s window of raw frame times. */
  frameMsAvg: number
  frameMsP95: number
  frameSamples: number
}

/** 30 s at 60 fps. */
export const BENCH_WINDOW_FRAMES = 1800

type Emit = (
  preset: EmitterPresetId,
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  count: number,
  color: string | null,
  seed: number,
) => number

const BENCH_EMITTERS: ReadonlyArray<{ preset: EmitterPresetId; angle: number; color: string }> = [
  { preset: 'glitter', angle: 0, color: '#66ccff' },
  { preset: 'firework', angle: 0.785, color: '#ff66cc' },
  { preset: 'glitter', angle: 1.571, color: '#ffd166' },
  { preset: 'firework', angle: 2.356, color: '#7cff6b' },
  { preset: 'glitter', angle: 3.142, color: '#c084fc' },
  { preset: 'firework', angle: 3.927, color: '#ff8c42' },
  { preset: 'glitter', angle: 4.712, color: '#00d4ff' },
  { preset: 'firework', angle: 5.498, color: '#ffffff' },
]

const BENCH_RADIUS = 30
const BENCH_HEIGHT = 18

export class ParticleBench {
  private readonly acc = new Float64Array(BENCH_EMITTERS.length)
  private spawned = 0
  private window = 0
  private readonly frameMs = new Float64Array(BENCH_WINDOW_FRAMES)
  private readonly sortScratch = new Float64Array(BENCH_WINDOW_FRAMES)
  private frames = 0
  readonly stats: ParticleBenchStats

  constructor(readonly capacity: number) {
    this.stats = { capacity, spawnedPerSec: 0, frameMsAvg: 0, frameMsP95: 0, frameSamples: 0 }
    if (typeof window !== 'undefined') {
      ;(window as unknown as { __particleBench?: ParticleBenchStats }).__particleBench = this.stats
    }
  }

  /** Record one raw (unclamped) frame delta, in seconds. */
  recordFrame(deltaS: number): void {
    this.frameMs[this.frames % BENCH_WINDOW_FRAMES] = deltaS * 1000
    this.frames++
  }

  step(dt: number, cx: number, cz: number, emit: Emit): void {
    for (let i = 0; i < BENCH_EMITTERS.length; i++) {
      const e = BENCH_EMITTERS[i]
      const rate = this.capacity / (BENCH_EMITTERS.length * EMITTER_PRESETS[e.preset].lifeS)
      const v = this.acc[i] + rate * dt
      const n = Math.floor(v)
      this.acc[i] = v - n
      if (n <= 0) continue
      const x = cx + Math.cos(e.angle) * BENCH_RADIUS
      const z = cz + Math.sin(e.angle) * BENCH_RADIUS
      this.spawned += emit(e.preset, x, BENCH_HEIGHT, z, 0, 1, 0, n, e.color, (i * 0.137 + this.window) % 1)
    }
    this.window += dt
    if (this.window >= 1) {
      this.stats.spawnedPerSec = Math.round(this.spawned / this.window)
      this.spawned = 0
      this.window = 0
      const n = Math.min(this.frames, BENCH_WINDOW_FRAMES)
      let sum = 0
      for (let i = 0; i < n; i++) sum += this.frameMs[i]
      this.stats.frameSamples = n
      this.stats.frameMsAvg = n > 0 ? sum / n : 0
      this.stats.frameMsP95 = percentile(this.frameMs, n, 0.95, this.sortScratch)
    }
  }
}
