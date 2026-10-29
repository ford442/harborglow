// =============================================================================
// FX FRAME UNIFORMS — shared beat-reactive TSL uniforms for particles + lasers
//
// Module singletons, written exactly once per frame by writeFxFrameUniforms()
// (called from GpuParticleLayer's useFrame). Every particle/laser material and
// compute kernel reads the same uniform objects, so there is one CPU→GPU write
// per value per frame no matter how many effects are mounted.
// =============================================================================

import * as THREE from 'three/webgpu'
import { uniform } from 'three/tsl'
import { getAudioAnalysisData } from '../../systems/audioVisualSync'
import { lightingSystem } from '../../systems/lightingSystem'

/** Longest step the particle integrator takes (s); hitches don't explode bursts. */
export const FX_MAX_DT = 1 / 20

export const fxUniforms = {
  uTime: uniform(0),
  uDt: uniform(0),
  uBass: uniform(0),
  uMid: uniform(0),
  uTreble: uniform(0),
  uBeatPhase: uniform(0),
  uBeatPulse: uniform(0),
  uCueIntensity: uniform(0),
  uCueColor: uniform(new THREE.Color(1, 1, 1)),
}

let lastFrameKey = Number.NaN

/**
 * Write audio analysis + cue state into the shared uniforms. Idempotent per
 * `frameKey` (pass R3F's `state.clock.elapsedTime`, identical for every
 * useFrame callback in one frame), so particles and lasers can both call it
 * and only the first write lands. Returns the clamped dt.
 */
export function writeFxFrameUniforms(delta: number, frameKey: number): number {
  const dt = Math.min(Math.max(delta, 0), FX_MAX_DT)
  if (frameKey === lastFrameKey) return dt
  lastFrameKey = frameKey
  const u = fxUniforms
  const audio = getAudioAnalysisData()
  u.uDt.value = dt
  u.uTime.value += dt
  u.uBass.value = audio.bass
  u.uMid.value = audio.mid
  u.uTreble.value = audio.treble
  u.uBeatPhase.value = audio.beatPhase
  u.uBeatPulse.value = lightingSystem.getBeatPulse()
  const cue = lightingSystem.isShowActive() ? lightingSystem.getCueState() : null
  if (cue) {
    u.uCueIntensity.value = cue.intensity
    u.uCueColor.value.set(cue.color)
  } else {
    u.uCueIntensity.value = 0
  }
  return dt
}
