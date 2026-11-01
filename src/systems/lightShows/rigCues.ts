import type { LightCueEasing, LightCuePattern, LightCueV2, LightShowV2, RigGroupId } from './types'

// =============================================================================
// RIG CUES — play-time interpretation of LightCueV2 target / lengthBeats / easing.
// Pure; lightingSystem resolves every group once per update into reused objects.
// =============================================================================

export const RIG_GROUP_IDS: readonly RigGroupId[] = [
  'funnel',
  'bridge',
  'hullStrip',
  'gantry',
  'mast',
  'deck',
  'accent',
]

export interface RigGroupCueState {
  /** A cue covers this group at the current beat. */
  active: boolean
  pattern: LightCuePattern
  /** 0..1 pattern pulse at the current beat (0 when inactive). */
  pulse: number
  /** Cue intensity × easing envelope, 0..1 (0 when inactive). */
  level: number
  /** '#rrggbb' of the covering cue ('#000000' when inactive). */
  color: string
}

export function createRigGroupCueState(): RigGroupCueState {
  return { active: false, pattern: 'blackout', pulse: 0, level: 0, color: '#000000' }
}

/** Pattern pulse at a loop-relative beat — the curve lightingSystem has always used. */
export function patternPulse(pattern: LightCuePattern, beat: number): number {
  switch (pattern) {
    case 'breathe':
      return (Math.sin(beat * Math.PI / 2) + 1) / 2
    case 'sweep':
      return (beat % 4) / 4
    case 'strobe':
      return ((beat * 8) % 2) < 1 ? 1 : 0
    case 'snap': {
      const frac = beat % 1
      return frac < 0.25 ? 1 - frac * 4 : 0
    }
    case 'blackout':
      return 0
    default:
      return 0
  }
}

/**
 * Intensity envelope over a cue's length, p in 0..1. `step` holds full level;
 * every other easing is a swell from 0 to full across the cue.
 */
export function easingEnvelope(easing: LightCueEasing, p: number): number {
  const t = p <= 0 ? 0 : p >= 1 ? 1 : p
  switch (easing) {
    case 'linear':
      return t
    case 'easeIn':
      return t * t
    case 'easeOut':
      return 1 - (1 - t) * (1 - t)
    case 'easeInOut':
      return t * t * (3 - 2 * t)
    case 'step':
    default:
      return 1
  }
}

const byGroupCache = new WeakMap<LightShowV2, Record<RigGroupId, LightCueV2[]>>()

/** Cues that can light each group (its own + `'all'`), in show order. Built once per show. */
function cuesByGroup(show: LightShowV2): Record<RigGroupId, LightCueV2[]> {
  let byGroup = byGroupCache.get(show)
  if (!byGroup) {
    const built = {} as Record<RigGroupId, LightCueV2[]>
    for (const group of RIG_GROUP_IDS) {
      built[group] = show.cues.filter((cue) => cue.target === 'all' || cue.target === group)
    }
    byGroup = built
    byGroupCache.set(show, byGroup)
  }
  return byGroup
}

/**
 * The cue lighting `group` at `beatInLoop`: the latest-starting cue targeting the
 * group or `'all'` whose `[beat, beat + lengthBeats)` window covers the beat.
 * Null when nothing covers it — the group is dark for that stretch.
 */
export function resolveGroupCue(show: LightShowV2, group: RigGroupId, beatInLoop: number): LightCueV2 | null {
  let active: LightCueV2 | null = null
  for (const cue of cuesByGroup(show)[group]) {
    if (cue.beat > beatInLoop) break
    if (beatInLoop < cue.beat + cue.lengthBeats) active = cue
  }
  return active
}

/** Resolve `group` at `beatInLoop` into `out` (no allocation). */
export function resolveRigGroupState(
  show: LightShowV2,
  group: RigGroupId,
  beatInLoop: number,
  out: RigGroupCueState,
): RigGroupCueState {
  const cue = resolveGroupCue(show, group, beatInLoop)
  if (!cue) {
    out.active = false
    out.pattern = 'blackout'
    out.pulse = 0
    out.level = 0
    out.color = '#000000'
    return out
  }
  out.active = true
  out.pattern = cue.pattern
  out.pulse = patternPulse(cue.pattern, beatInLoop)
  out.level = cue.intensity * easingEnvelope(cue.easing, (beatInLoop - cue.beat) / cue.lengthBeats)
  out.color = cue.color
  return out
}
