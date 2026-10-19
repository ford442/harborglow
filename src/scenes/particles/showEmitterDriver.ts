// =============================================================================
// SHOW EMITTER DRIVER — turns the active light cue into particle emission
//
// Until cues carry an `fx` field (slice 3/7), the pattern picks the look:
//   strobe          → spark bursts from every non-projector rig on each beat
//   snap            → firework shells over mast/funnel rigs on each downbeat
//   breathe / sweep → glitter streams from matrix/strip rigs, scaled by
//                     cue intensity and bass
//   blackout        → nothing
// Projector rigs host laser beams instead (LaserBeamLayer). Only installed
// points on the show's ship emit, filtered by the cue's rig-group target.
// =============================================================================

import type { EmitterPresetId } from '../../rendering/particles/emitterPresets'
import { EMITTER_PRESETS } from '../../rendering/particles/emitterPresets'
import type { LightCuePattern, RigGroupId } from '../../systems/lightShows/types'
import type { EmitterAnchor } from './emitterAnchors'

export interface ShowFrame {
  /** Ship whose show is playing; null = no show. */
  shipId: string | null
  pattern: LightCuePattern
  target: RigGroupId | 'all'
  intensity: number
  color: string | null
  beatPhase: number
  bass: number
  dt: number
}

export type EmitSink = (
  preset: EmitterPresetId,
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  count: number,
  color: string | null,
  seed: number,
) => void

/** Shells burst this far above the rig, m. */
export const FIREWORK_ALTITUDE = 22
/** At most this many firework anchors per downbeat. */
const MAX_FIREWORK_ANCHORS = 3

export class ShowEmitterDriver {
  private prevPhase = 0
  private beat = 0
  private readonly streams = new Map<string, number>()
  /** Scales counts and rates with the ring (1 at the 250k high budget). */
  constructor(public budgetScale: number) {}

  update(frame: ShowFrame, anchors: Iterable<EmitterAnchor>, emit: EmitSink): void {
    const beatEdge = frame.beatPhase < this.prevPhase - 0.5
    this.prevPhase = frame.beatPhase
    if (beatEdge) this.beat++
    if (!frame.shipId || frame.pattern === 'blackout' || frame.intensity <= 0) {
      this.streams.clear()
      return
    }
    const scale = this.budgetScale * Math.min(1, frame.intensity)
    let fireworks = 0
    for (const a of anchors) {
      if (a.shipId !== frame.shipId || !a.installed || a.rigType === 'projector') continue
      if (frame.target !== 'all' && a.group !== frame.target) continue
      const p = a.position
      const seed = ((this.beat * 0.618033) + p.x * 0.013 + p.z * 0.029) % 1
      switch (frame.pattern) {
        case 'strobe':
          if (beatEdge) emit('spark', p.x, p.y, p.z, 0, 1, 0, EMITTER_PRESETS.spark.burstCount * scale, frame.color, seed)
          break
        case 'snap':
          if (beatEdge && this.beat % 4 === 0 && (a.group === 'mast' || a.group === 'funnel') && fireworks < MAX_FIREWORK_ANCHORS) {
            fireworks++
            emit('firework', p.x, p.y + FIREWORK_ALTITUDE, p.z, 0, 1, 0, EMITTER_PRESETS.firework.burstCount * scale, frame.color, seed)
          }
          break
        case 'breathe':
        case 'sweep': {
          if (a.rigType !== 'rgb_matrix' && a.rigType !== 'led_strip') break
          const rate = EMITTER_PRESETS.glitter.ratePerS * scale * (0.5 + frame.bass)
          const acc = (this.streams.get(a.key) ?? 0) + rate * frame.dt
          const n = Math.floor(acc)
          this.streams.set(a.key, acc - n)
          if (n > 0) emit('glitter', p.x, p.y, p.z, 0, 1, 0, n, frame.color, seed)
          break
        }
      }
    }
  }
}

/**
 * Fractional-rate accumulator for named streams (fxBus continuous emitters).
 * Returns whole particles to emit this frame.
 */
export class StreamAccumulator {
  private readonly acc = new Map<string, number>()
  take(key: string, ratePerS: number, dt: number): number {
    const v = (this.acc.get(key) ?? 0) + Math.max(0, ratePerS) * dt
    const n = Math.floor(v)
    this.acc.set(key, v - n)
    return n
  }
  /** Drop accumulators for keys no longer present. */
  retain(keep: (key: string) => boolean): void {
    for (const k of this.acc.keys()) if (!keep(k)) this.acc.delete(k)
  }
}
