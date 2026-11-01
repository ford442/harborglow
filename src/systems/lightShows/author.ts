import type { LightCueEasing, LightCuePattern, LightCueV2, LightShowV2, RigGroupId } from './types'

export type AuthoredCue = Omit<LightCueV2, 'id'>

/** Compact cue literal for native V2 presets. */
export function cue(
  beat: number,
  lengthBeats: number,
  target: RigGroupId | 'all',
  pattern: LightCuePattern,
  color: string,
  intensity: number,
  easing: LightCueEasing = 'step',
): AuthoredCue {
  return { beat, lengthBeats, target, pattern, color, intensity, easing }
}

/**
 * Build a native V2 factory preset. Cues are stably sorted by beat (authoring
 * order breaks ties) and get deterministic `${id}:${index}` ids, like migrated presets.
 */
export function authorShowV2(id: string, loopBeats: number, cues: AuthoredCue[]): LightShowV2 {
  const sorted = cues
    .map((c, order) => ({ c, order }))
    .sort((a, b) => a.c.beat - b.c.beat || a.order - b.order)
  return {
    v: 2,
    id,
    loopBeats,
    cues: sorted.map(({ c }, i) => ({ id: `${id}:${i}`, ...c })),
  }
}
