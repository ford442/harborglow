// =============================================================================
// CUE EDITING — pure piano-roll operations on a LightShowV2 document.
// Ids are derived from the show id and an index. Nothing here touches the
// sim clock, the store, or Math.random.
// =============================================================================

import type { ShipType } from '../../store/gameStoreDomainTypes'
import { getLightShowV2 } from './index'
import { getRigGroups } from './rigGroups'
import type { LightCueEasing, LightCuePattern, LightCueV2, LightShowV2, RigGroupId } from './types'

export const BAR_BEATS = 4

/** Quarter-note grid. 1/4 = 1 beat, 1/8 = half, 1/16 = a quarter beat. */
export const QUANTIZE_BEATS = {
  '1/4': 1,
  '1/8': 0.5,
  '1/16': 0.25,
} as const

export type QuantizeId = keyof typeof QUANTIZE_BEATS

export const RIG_ROW_ORDER: readonly (RigGroupId | 'all')[] = [
  'all',
  'funnel',
  'bridge',
  'hullStrip',
  'gantry',
  'mast',
  'deck',
  'accent',
]

export function quantizeBeat(beat: number, quantum: number): number {
  const q = quantum > 0 ? quantum : 1
  const snapped = Math.round(beat / q) * q
  return Math.max(0, Math.round(snapped * 1000) / 1000)
}

export function rowsForShip(shipType: ShipType): (RigGroupId | 'all')[] {
  const have = getRigGroups(shipType)
  return RIG_ROW_ORDER.filter((row) => row === 'all' || have.has(row))
}

/** Copy of the factory preset. Cue ids are `${shipType}:fork:${index}`. */
export function forkFactoryShow(shipType: ShipType): LightShowV2 | null {
  const preset = getLightShowV2(shipType)
  if (!preset) return null
  return {
    v: 2,
    id: shipType,
    loopBeats: preset.loopBeats,
    cues: preset.cues.map((cue, i) => ({ ...cue, id: `${shipType}:fork:${i}` })),
  }
}

export function placeCue(
  show: LightShowV2,
  input: {
    target: RigGroupId | 'all'
    beat: number
    quantum: number
    pattern: LightCuePattern
    color: string
    intensity: number
    easing: LightCueEasing
  },
): LightShowV2 {
  const beat = Math.min(show.loopBeats - input.quantum, quantizeBeat(input.beat, input.quantum))
  const lengthBeats = Math.min(input.quantum, show.loopBeats - beat)
  if (lengthBeats <= 0 || beat < 0) return show
  const cue: LightCueV2 = {
    id: nextId(show),
    beat,
    lengthBeats,
    target: input.target,
    pattern: input.pattern,
    color: input.color,
    intensity: clamp01(input.intensity),
    easing: input.easing,
  }
  return withCues(show, [...show.cues, cue])
}

export function stretchCue(show: LightShowV2, cueId: string, lengthBeats: number): LightShowV2 {
  return withCues(show, show.cues.map((cue) => {
    if (cue.id !== cueId) return cue
    const room = show.loopBeats - cue.beat
    const length = Math.min(room, Math.max(0.25, lengthBeats))
    return { ...cue, lengthBeats: Math.round(length * 1000) / 1000 }
  }))
}

/** Duplicate a cue one bar later. No-op when the copy would start past the loop. */
export function copyCueByBar(show: LightShowV2, cueId: string): LightShowV2 {
  const cue = show.cues.find((item) => item.id === cueId)
  if (!cue) return show
  const beat = cue.beat + BAR_BEATS
  if (beat >= show.loopBeats) return show
  const copy: LightCueV2 = {
    ...cue,
    id: nextId(show),
    beat,
    lengthBeats: Math.min(cue.lengthBeats, show.loopBeats - beat),
  }
  return withCues(show, [...show.cues, copy])
}

export function quantizeCue(show: LightShowV2, cueId: string, quantum: number): LightShowV2 {
  return withCues(show, show.cues.map((cue) => {
    if (cue.id !== cueId) return cue
    const beat = Math.min(show.loopBeats - quantum, quantizeBeat(cue.beat, quantum))
    const lengthBeats = Math.max(quantum, quantizeBeat(cue.lengthBeats, quantum))
    return {
      ...cue,
      beat: Math.max(0, beat),
      lengthBeats: Math.min(lengthBeats, show.loopBeats - Math.max(0, beat)),
    }
  }))
}

export function updateCue(
  show: LightShowV2,
  cueId: string,
  patch: Partial<Pick<LightCueV2, 'pattern' | 'color' | 'intensity' | 'easing' | 'target'>>,
): LightShowV2 {
  return withCues(show, show.cues.map((cue) => {
    if (cue.id !== cueId) return cue
    return {
      ...cue,
      ...patch,
      intensity: patch.intensity === undefined ? cue.intensity : clamp01(patch.intensity),
    }
  }))
}

export function deleteCue(show: LightShowV2, cueId: string): LightShowV2 {
  return withCues(show, show.cues.filter((cue) => cue.id !== cueId))
}

/**
 * Cue whose window contains `elapsedBeats`, latest start winning.
 * A gap falls back to the last cue that has already started, which is how
 * factory presets (lengths tiled to the next cue) already behave.
 */
export function resolveActiveCue(show: LightShowV2, elapsedBeats: number): LightCueV2 | null {
  if (show.cues.length === 0) return null
  const t = wrapBeat(elapsedBeats, show.loopBeats)
  let active: LightCueV2 | null = null
  for (const cue of show.cues) {
    if (cueContains(cue, t, show.loopBeats)) active = cue
  }
  if (active) return active
  let fallback = show.cues[0]
  for (const cue of show.cues) {
    if (cue.beat <= t) fallback = cue
    else break
  }
  return fallback
}

/** `cue.intensity` shaped by easing across the cue. Step stays flat. */
export function easedIntensity(cue: LightCueV2, elapsedBeats: number, loopBeats: number): number {
  const t = wrapBeat(elapsedBeats, loopBeats)
  let local = t - cue.beat
  if (local < 0) local += loopBeats
  const u = cue.lengthBeats > 0 ? Math.min(1, Math.max(0, local / cue.lengthBeats)) : 1
  return cue.intensity * easingGain(cue.easing, u)
}

function easingGain(easing: LightCueEasing, u: number): number {
  switch (easing) {
    case 'step':
      return 1
    case 'linear':
      return u
    case 'easeIn':
      return u * u
    case 'easeOut':
      return 1 - (1 - u) * (1 - u)
    case 'easeInOut':
      return u < 0.5 ? 2 * u * u : 1 - ((-2 * u + 2) ** 2) / 2
    default:
      return 1
  }
}

function cueContains(cue: LightCueV2, t: number, loopBeats: number): boolean {
  const end = cue.beat + cue.lengthBeats
  if (end <= loopBeats) return t >= cue.beat && t < end
  const wrapped = end % loopBeats
  return t >= cue.beat || t < wrapped
}

function wrapBeat(beat: number, loopBeats: number): number {
  if (loopBeats <= 0) return 0
  return ((beat % loopBeats) + loopBeats) % loopBeats
}

function withCues(show: LightShowV2, cues: LightCueV2[]): LightShowV2 {
  const sorted = [...cues].sort((a, b) => a.beat - b.beat || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return { ...show, cues: sorted }
}

function nextId(show: LightShowV2): string {
  const used = new Set(show.cues.map((cue) => cue.id))
  let n = show.cues.length
  let id = `${show.id}:u:${n}`
  while (used.has(id)) {
    n += 1
    id = `${show.id}:u:${n}`
  }
  return id
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}
