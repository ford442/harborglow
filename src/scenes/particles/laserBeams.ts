// =============================================================================
// LASER BEAMS — per-frame beam poses from the active cue (#248)
//
// Projector rigs on the show's ship host two beams each, fanned left/right
// and tilted off vertical. The cue pattern drives motion and gating:
//   sweep    — yaw sweeps a full turn every 4 beats
//   breathe  — slow drift, tilt breathes with the beat phase
//   strobe   — fixed fan, on for the first 15% of each beat
//   snap     — fixed fan, on for the first 30% of each beat
//   blackout — off
// =============================================================================

import * as THREE from 'three'
import type { LightCuePattern, RigGroupId } from '../../systems/lightShows/types'
import type { EmitterAnchor } from './emitterAnchors'

export const BEAMS_PER_RIG = 2
export const LASER_LENGTH_M = 70
export const LASER_RADIUS_M = 0.35
const BASE_TILT = 0.45 // rad off vertical

export interface LaserFrame {
  shipId: string | null
  pattern: LightCuePattern
  target: RigGroupId | 'all'
  beatPhase: number
  /** Beats since the show started (fractional), for multi-beat sweeps. */
  beats: number
  time: number
}

/** 0..1 visibility gate for the whole beam set. */
export function laserGate(pattern: LightCuePattern, beatPhase: number): number {
  switch (pattern) {
    case 'blackout': return 0
    case 'strobe': return beatPhase < 0.15 ? 1 : 0
    case 'snap': return beatPhase < 0.3 ? 1 : 0
    default: return 1
  }
}

const UP = new THREE.Vector3(0, 1, 0)
const scratchQ = new THREE.Quaternion()
const scratchE = new THREE.Euler(0, 0, 0, 'YXZ')
const scratchS = new THREE.Vector3()

/**
 * Write beam matrices for every eligible projector anchor into `out` (up to
 * `out.length`); returns the number of beams written.
 */
export function layoutLaserBeams(frame: LaserFrame, anchors: Iterable<EmitterAnchor>, out: THREE.Matrix4[]): number {
  if (!frame.shipId || frame.pattern === 'blackout') return 0
  let n = 0
  let rig = 0
  for (const a of anchors) {
    if (a.shipId !== frame.shipId || !a.installed || a.rigType !== 'projector') continue
    if (frame.target !== 'all' && a.group !== frame.target) continue
    for (let b = 0; b < BEAMS_PER_RIG && n < out.length; b++) {
      const side = b === 0 ? -1 : 1
      let yaw = rig * 1.3 + side * 0.5
      let tilt = BASE_TILT
      if (frame.pattern === 'sweep') yaw += (frame.beats / 4) * Math.PI * 2 * side
      else if (frame.pattern === 'breathe') {
        yaw += frame.time * 0.25 * side
        tilt += 0.15 * Math.sin(frame.beatPhase * Math.PI * 2)
      }
      scratchE.set(tilt * side, yaw, 0)
      scratchQ.setFromEuler(scratchE)
      scratchS.set(LASER_RADIUS_M, LASER_LENGTH_M, LASER_RADIUS_M)
      out[n].compose(a.position, scratchQ, scratchS)
      n++
    }
    rig++
    if (n >= out.length) break
  }
  return n
}

/** Beam direction (unit) encoded in a beam matrix — for tests/diagnostics. */
export function beamDirection(m: THREE.Matrix4, target = new THREE.Vector3()): THREE.Vector3 {
  return target.copy(UP).transformDirection(m)
}
