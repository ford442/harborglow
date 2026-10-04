import type { ShowDocument } from '../../schemas/showDocument'
import type { ShipType } from '../../store/gameStoreDomainTypes'
import { getLightShowV2 } from '../lightShows'
import { simScheduler } from '../sim/FixedStepScheduler'
import { captureSimSnapshot, hashSimSnapshot } from '../sim/hashState'

// =============================================================================
// BUILD SHOW DOCUMENT — snapshot the live session into a shareable document.
// =============================================================================

export interface BuildShowOptions {
  /** Defaults to the factory preset for `shipType` (until the cue editor lands). */
  cues?: ShowDocument['cues']
  loopBeats?: number
}

/** A recording is replayable only if it began on a fresh `reset(seed)` (tick 0). */
function hasShareablePerformance(): boolean {
  return simScheduler.isRecording && simScheduler.recordingStartTick === 0
}

export function buildShowDocument(shipType: ShipType, opts: BuildShowOptions = {}): ShowDocument {
  const preset = getLightShowV2(shipType)
  const cues = opts.cues ?? preset?.cues
  if (!cues || cues.length === 0) throw new Error(`No light show for ${shipType}`)

  const doc: ShowDocument = {
    v: 1,
    shipType,
    trackId: shipType,
    loopBeats: opts.loopBeats ?? preset?.loopBeats ?? 32,
    cues,
  }
  if (hasShareablePerformance()) {
    const replay = simScheduler.snapshotReplay()
    doc.inputLog = replay.inputs
    doc.sim = {
      seed: replay.seed,
      dt: replay.dt,
      ticks: simScheduler.tick,
      hash: hashSimSnapshot(captureSimSnapshot()),
    }
  }
  return doc
}
