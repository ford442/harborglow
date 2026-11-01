// =============================================================================
// SHOW PLAYHEAD — where the active light show is, for the binding driver
//
// lightingSystem keeps `beatInLoop` private inside update(); this recomputes it
// from the same inputs (sim clock, show start, BPM, the preset's loop length).
// Imported shows (share links) replace the factory timeline the emitter
// bindings were authored against, so they get no binding playback.
// =============================================================================

import { getLightShowV2 } from '../../systems/lightShows'
import { lightingSystem } from '../../systems/lightingSystem'
import { isSharedPlaybackActive } from '../../systems/share/sharedPlaybackState'
import { simNowMs } from '../../systems/sim/SimContext'
import { showBeatInLoop, type BindingFrame } from './showBindingDriver'

/** Fill `out` from the live show (or mark it idle) and return it. No allocation. */
export function readShowPlayhead(out: BindingFrame, dt: number): BindingFrame {
  out.dt = dt
  out.shipId = null
  out.shipType = null
  const show = lightingSystem.getCurrentShow()
  if (!show.isActive || !show.shipType || !(show.bpm > 0) || isSharedPlaybackActive()) return out
  const loopBeats = getLightShowV2(show.shipType)?.loopBeats
  if (!loopBeats) return out
  out.shipId = show.shipId
  out.shipType = show.shipType
  out.beatSeconds = 60 / show.bpm
  out.beatInLoop = showBeatInLoop(simNowMs() - show.startTime, show.bpm, loopBeats)
  return out
}
