// =============================================================================
// Host-side gesture → sim input. The beat is not computed here; applyShowCue
// does that on the tick the log entry lands, so replay uses the same clock.
// =============================================================================

import { recordHostInput } from '../sim/hostInput'
import { lightingSystem } from '../lightingSystem'
import { getPerformTuning, type PerformSource } from './perform'
import type { LightCuePattern, RigGroupId } from './types'

export function firePerformCue(
  gesture: { pattern: LightCuePattern; target: RigGroupId | 'all' },
  source: PerformSource,
): void {
  const show = lightingSystem.getCurrentShow()
  if (!show.isActive) return
  const tuning = getPerformTuning()
  recordHostInput('show.cue', {
    pattern: gesture.pattern,
    target: gesture.target,
    quantize: tuning.quantize,
    source,
    bpm: show.bpm > 0 ? show.bpm : 120,
    accuracyWeight: tuning.accuracyWeight,
    varietyWeight: tuning.varietyWeight,
    creditScale: tuning.creditScale,
    reputationScale: tuning.reputationScale,
  })
}
