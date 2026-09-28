import type { LightCue, LightShowV2 } from './types'

/**
 * Lift an authored V1 cue list into a V2 show document. Pure and deterministic:
 * cue ids are `${id}:${index}`, lengths run to the next cue (the last one to the
 * loop end), and every cue targets the whole rig with step easing.
 */
export function migrateShowV1toV2(id: string, cues: LightCue[], loopBeats = 32): LightShowV2 {
  return {
    v: 2,
    id,
    loopBeats,
    cues: cues.map((cue, i) => {
      const nextBeat = i + 1 < cues.length ? cues[i + 1].beat : loopBeats
      return {
        id: `${id}:${i}`,
        beat: cue.beat,
        lengthBeats: nextBeat - cue.beat,
        target: 'all',
        pattern: cue.pattern,
        color: cue.color,
        intensity: cue.intensity,
        easing: 'step',
      }
    }),
  }
}
