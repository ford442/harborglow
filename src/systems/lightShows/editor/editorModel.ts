import type { ShipType } from '../../../store/gameStoreTypes'
import { BEATS_PER_BAR } from '../../audio/transport'
import { RIG_GROUP_IDS } from '../rigCues'
import type { LightCueEasing, LightCuePattern, LightCueV2, LightShowV2, RigGroupId } from '../types'
import { userShowId } from '../userShows'

// =============================================================================
// EDITOR MODEL (#270) — pure operations on a LightShowV2 draft.
//
// Everything here is immutable and deterministic: an edit returns a new draft
// (rigCues caches per show object, so a played draft must never be mutated) or
// the *same* reference when it changes nothing. No Math.random, no clocks.
//
// Invariants kept by every operation (and re-established by `draftFromShow`):
//   0 <= beat < loopBeats           lengthBeats >= MIN_CUE_BEATS
//   beat + lengthBeats <= loopBeats  intensity in 0..1, '#rrggbb' colour
//   ids are `${show.id}:${n}` from the draft's monotonic counter (never reused)
//   cues sorted by beat, ties in insertion (id counter) order
// which is strictly tighter than what parseLightShow accepts.
// =============================================================================

export const MIN_CUE_BEATS = 1 / 16
export const MIN_LOOP_BEATS = 16
export const MAX_LOOP_BEATS = 64
export const DEFAULT_LOOP_BEATS = 32
export const HISTORY_LIMIT = 100

export type CueTarget = RigGroupId | 'all'
/** Rows of the timeline, top to bottom. */
export const TARGET_ROWS: readonly CueTarget[] = [...RIG_GROUP_IDS, 'all']

/** Note-value grid: 4 = quarter note (1 beat), 8 = 1/2 beat, 16 = 1/4 beat. */
export type QuantizeGrid = 4 | 8 | 16
export const QUANTIZE_GRIDS: readonly QuantizeGrid[] = [4, 8, 16]
export const gridBeats = (grid: QuantizeGrid): number => 4 / grid

export interface EditorDraft {
  show: LightShowV2
  /** Next cue id suffix. Monotonic; deleting a cue never frees its number. */
  nextId: number
}

/** Fields a caller can set on a cue. */
export interface CueProps {
  beat: number
  lengthBeats: number
  target: CueTarget
  pattern: LightCuePattern
  color: string
  intensity: number
  easing: LightCueEasing
}

export const DEFAULT_CUE_PROPS: CueProps = {
  beat: 0,
  lengthBeats: 1,
  target: 'all',
  pattern: 'breathe',
  color: '#ffffff',
  intensity: 1,
  easing: 'step',
}

const PATTERNS: readonly LightCuePattern[] = ['breathe', 'sweep', 'strobe', 'snap', 'blackout']
const EASINGS: readonly LightCueEasing[] = ['step', 'linear', 'easeIn', 'easeOut', 'easeInOut']
const COLOR_RE = /^#[0-9a-fA-F]{6}$/

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)
const finiteOr = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback)

export const clampLoopBeats = (n: number): number => clamp(Math.round(finiteOr(n, DEFAULT_LOOP_BEATS)), MIN_LOOP_BEATS, MAX_LOOP_BEATS)

function normColor(c: unknown, fallback: string): string {
  return typeof c === 'string' && COLOR_RE.test(c) ? c.toLowerCase() : fallback
}

// ---------------------------------------------------------------------------
// ids & ordering
// ---------------------------------------------------------------------------

function idNumber(showId: string, id: string): number | null {
  if (!id.startsWith(`${showId}:`)) return null
  const tail = id.slice(showId.length + 1)
  return /^\d+$/.test(tail) ? Number(tail) : null
}

/** Sort by beat, ties by id counter (insertion order). Always returns a new array. */
function sorted(showId: string, cues: LightCueV2[]): LightCueV2[] {
  return cues
    .map((cue, i) => ({ cue, i, n: idNumber(showId, cue.id) ?? i }))
    .sort((a, b) => a.cue.beat - b.cue.beat || a.n - b.n || a.i - b.i)
    .map((x) => x.cue)
}

function withCues(draft: EditorDraft, cues: LightCueV2[], nextId = draft.nextId): EditorDraft {
  return { show: { ...draft.show, cues: sorted(draft.show.id, cues) }, nextId }
}

/**
 * Clamp one cue into the invariants, keeping its start and clipping its length
 * (never retiming it). Returns the same object when already valid.
 */
function fit(cue: LightCueV2, loopBeats: number): LightCueV2 {
  const beat = clamp(finiteOr(cue.beat, 0), 0, loopBeats - MIN_CUE_BEATS)
  const lengthBeats = clamp(finiteOr(cue.lengthBeats, 1), MIN_CUE_BEATS, loopBeats - beat)
  const intensity = clamp(finiteOr(cue.intensity, 1), 0, 1)
  if (beat === cue.beat && lengthBeats === cue.lengthBeats && intensity === cue.intensity) return cue
  return { ...cue, beat, lengthBeats, intensity }
}

// ---------------------------------------------------------------------------
// construction
// ---------------------------------------------------------------------------

/**
 * Normalise any V2 show into a draft: loop clamped to 16–64, cues dropped when
 * they start past the loop, clipped to fit, colours lower-cased, sorted, and
 * re-id'd to `${show.id}:${n}` unless every id already follows that scheme
 * uniquely (then they are kept, so a saved draft round-trips unchanged).
 */
export function draftFromShow(show: LightShowV2): EditorDraft {
  const loopBeats = clampLoopBeats(show.loopBeats)
  const cues: LightCueV2[] = []
  for (const c of show.cues) {
    if (!(c.beat < loopBeats) || !Number.isFinite(c.beat)) continue
    cues.push(
      fit(
        {
          ...c,
          target: c.target === 'all' || RIG_GROUP_IDS.includes(c.target) ? c.target : 'all',
          pattern: PATTERNS.includes(c.pattern) ? c.pattern : 'breathe',
          easing: EASINGS.includes(c.easing) ? c.easing : 'step',
          color: normColor(c.color, '#ffffff'),
        },
        loopBeats,
      ),
    )
  }
  const keep = cues.every((c) => idNumber(show.id, c.id) !== null) && new Set(cues.map((c) => c.id)).size === cues.length
  let ordered: LightCueV2[]
  let nextId: number
  if (keep) {
    ordered = sorted(show.id, cues)
    nextId = cues.reduce((m, c) => Math.max(m, (idNumber(show.id, c.id) ?? -1) + 1), 0)
  } else {
    const byBeat = cues.map((c, i) => ({ c, i })).sort((a, b) => a.c.beat - b.c.beat || a.i - b.i)
    ordered = byBeat.map(({ c }, n) => ({ ...c, id: `${show.id}:${n}` }))
    nextId = ordered.length
  }
  const out: LightShowV2 = { v: 2, id: show.id, loopBeats, cues: ordered }
  if (show.seed !== undefined) out.seed = show.seed
  return { show: out, nextId }
}

/** Fork `factory` into the player's editable show for `shipType` (id `${shipType}-user`). */
export function forkShow(shipType: ShipType, factory: LightShowV2): EditorDraft {
  return draftFromShow({ ...factory, id: userShowId(shipType) })
}

/** A blank show for `shipType` with the default 32-beat loop. */
export function emptyDraft(shipType: ShipType, loopBeats = DEFAULT_LOOP_BEATS): EditorDraft {
  return { show: { v: 2, id: userShowId(shipType), loopBeats: clampLoopBeats(loopBeats), cues: [] }, nextId: 0 }
}

// ---------------------------------------------------------------------------
// cue operations
// ---------------------------------------------------------------------------

export function findCue(draft: EditorDraft, id: string): LightCueV2 | undefined {
  return draft.show.cues.find((c) => c.id === id)
}

/** Place a new cue. A cue that would overrun the loop is shortened, not moved. */
export function placeCue(
  draft: EditorDraft,
  props: Partial<CueProps> & Pick<CueProps, 'beat'>,
): { draft: EditorDraft; cueId: string } {
  const p = { ...DEFAULT_CUE_PROPS, ...props }
  const loop = draft.show.loopBeats
  const beat = clamp(finiteOr(p.beat, 0), 0, loop - MIN_CUE_BEATS)
  const lengthBeats = clamp(finiteOr(p.lengthBeats, 1), MIN_CUE_BEATS, loop - beat)
  const id = `${draft.show.id}:${draft.nextId}`
  const cue: LightCueV2 = {
    id,
    beat,
    lengthBeats,
    target: p.target === 'all' || RIG_GROUP_IDS.includes(p.target) ? p.target : 'all',
    pattern: PATTERNS.includes(p.pattern) ? p.pattern : 'breathe',
    color: normColor(p.color, '#ffffff'),
    intensity: clamp(finiteOr(p.intensity, 1), 0, 1),
    easing: EASINGS.includes(p.easing) ? p.easing : 'step',
  }
  return { draft: withCues(draft, [...draft.show.cues, cue], draft.nextId + 1), cueId: id }
}

/** Move a cue to `beat` (length kept, so it is clamped to the loop) and optionally another row. */
export function moveCue(draft: EditorDraft, id: string, beat: number, target?: CueTarget): EditorDraft {
  const cue = findCue(draft, id)
  if (!cue) return draft
  const nextTarget = target && (target === 'all' || RIG_GROUP_IDS.includes(target)) ? target : cue.target
  const nextBeat = clamp(finiteOr(beat, cue.beat), 0, draft.show.loopBeats - cue.lengthBeats)
  if (nextBeat === cue.beat && nextTarget === cue.target) return draft
  return withCues(draft, draft.show.cues.map((c) => (c === cue ? { ...c, beat: nextBeat, target: nextTarget } : c)))
}

/**
 * Drag an edge of a cue to `toBeat`. The opposite edge stays put; the cue never
 * gets shorter than MIN_CUE_BEATS or leaves the loop.
 */
export function stretchCue(draft: EditorDraft, id: string, edge: 'start' | 'end', toBeat: number): EditorDraft {
  const cue = findCue(draft, id)
  if (!cue) return draft
  const loop = draft.show.loopBeats
  const end = cue.beat + cue.lengthBeats
  let beat = cue.beat
  let lengthBeats = cue.lengthBeats
  if (edge === 'end') {
    lengthBeats = clamp(finiteOr(toBeat, end) - cue.beat, MIN_CUE_BEATS, loop - cue.beat)
  } else {
    beat = clamp(finiteOr(toBeat, cue.beat), 0, end - MIN_CUE_BEATS)
    lengthBeats = end - beat
  }
  if (beat === cue.beat && lengthBeats === cue.lengthBeats) return draft
  return withCues(draft, draft.show.cues.map((c) => (c === cue ? { ...c, beat, lengthBeats } : c)))
}

export function deleteCue(draft: EditorDraft, id: string): EditorDraft {
  if (!findCue(draft, id)) return draft
  return withCues(draft, draft.show.cues.filter((c) => c.id !== id))
}

/** Duplicate a cue at `beat` (and optionally another row) — Shift+drag. */
export function duplicateCue(
  draft: EditorDraft,
  id: string,
  beat: number,
  target?: CueTarget,
): { draft: EditorDraft; cueId: string | null } {
  const cue = findCue(draft, id)
  if (!cue) return { draft, cueId: null }
  return placeCue(draft, { ...cue, beat, target: target ?? cue.target })
}

export type CuePropsPatch = Partial<Pick<CueProps, 'target' | 'pattern' | 'color' | 'intensity' | 'easing' | 'lengthBeats'>>

/** Change non-positional properties. Invalid values are ignored; length is re-fitted to the loop. */
export function setCueProps(draft: EditorDraft, id: string, patch: CuePropsPatch): EditorDraft {
  const cue = findCue(draft, id)
  if (!cue) return draft
  const next: LightCueV2 = { ...cue }
  if (patch.target !== undefined && (patch.target === 'all' || RIG_GROUP_IDS.includes(patch.target))) next.target = patch.target
  if (patch.pattern !== undefined && PATTERNS.includes(patch.pattern)) next.pattern = patch.pattern
  if (patch.easing !== undefined && EASINGS.includes(patch.easing)) next.easing = patch.easing
  if (patch.color !== undefined) next.color = normColor(patch.color, cue.color)
  if (patch.intensity !== undefined) next.intensity = clamp(finiteOr(patch.intensity, cue.intensity), 0, 1)
  if (patch.lengthBeats !== undefined) {
    next.lengthBeats = clamp(finiteOr(patch.lengthBeats, cue.lengthBeats), MIN_CUE_BEATS, draft.show.loopBeats - cue.beat)
  }
  const same = (Object.keys(next) as Array<keyof LightCueV2>).every((k) => next[k] === cue[k])
  if (same) return draft
  return withCues(draft, draft.show.cues.map((c) => (c === cue ? next : c)))
}

/** Number of bars the loop spans (a partial last bar counts). */
export const barCount = (loopBeats: number): number => Math.ceil(loopBeats / BEATS_PER_BAR)

/**
 * Copy every cue that *starts* in bar `from` (0-based) onto bar `to`, replacing
 * the cues that start in `to`. Lengths are kept and clipped at the loop end.
 */
export function copyBar(draft: EditorDraft, from: number, to: number): EditorDraft {
  const bars = barCount(draft.show.loopBeats)
  if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) return draft
  if (from < 0 || to < 0 || from >= bars || to >= bars) return draft
  const startsIn = (bar: number) => (c: LightCueV2) => c.beat >= bar * BEATS_PER_BAR && c.beat < (bar + 1) * BEATS_PER_BAR
  const source = draft.show.cues.filter(startsIn(from))
  const kept = draft.show.cues.filter((c) => !startsIn(to)(c))
  const offset = (to - from) * BEATS_PER_BAR
  let nextId = draft.nextId
  const copies = source.map((c) => ({ ...fit({ ...c, beat: c.beat + offset }, draft.show.loopBeats), id: `${draft.show.id}:${nextId++}` }))
  if (copies.length === 0 && kept.length === draft.show.cues.length) return draft
  return withCues(draft, [...kept, ...copies], nextId)
}

/**
 * Snap beats and lengths to the grid (every cue, or just `ids`). Length rounds
 * to the nearest multiple of the grid, at least one step.
 */
export function quantize(draft: EditorDraft, grid: QuantizeGrid, ids?: readonly string[]): EditorDraft {
  const g = gridBeats(grid)
  const loop = draft.show.loopBeats
  const only = ids ? new Set(ids) : null
  let changed = false
  const cues = draft.show.cues.map((c) => {
    if (only && !only.has(c.id)) return c
    const lengthBeats = Math.max(g, Math.round(c.lengthBeats / g) * g)
    const beat = clamp(Math.round(c.beat / g) * g, 0, Math.max(0, loop - lengthBeats))
    if (beat === c.beat && lengthBeats === c.lengthBeats) return c
    changed = true
    return { ...c, beat, lengthBeats: Math.min(lengthBeats, loop - beat) }
  })
  return changed ? withCues(draft, cues) : draft
}

/** Snap one beat position to the grid (UI helper for placing / dragging). */
export function snapBeat(beat: number, grid: QuantizeGrid | null): number {
  if (grid === null) return beat
  const g = gridBeats(grid)
  return Math.round(beat / g) * g
}

/** Change the loop length (16–64). Cues starting past the new end are dropped; others are clipped. */
export function setLoopBeats(draft: EditorDraft, loopBeats: number): EditorDraft {
  const loop = clampLoopBeats(loopBeats)
  if (loop === draft.show.loopBeats) return draft
  const cues = draft.show.cues.filter((c) => c.beat < loop).map((c) => fit(c, loop))
  return { show: { ...draft.show, loopBeats: loop, cues: sorted(draft.show.id, cues) }, nextId: draft.nextId }
}

// ---------------------------------------------------------------------------
// history
// ---------------------------------------------------------------------------

export interface EditorState {
  draft: EditorDraft
  past: EditorDraft[]
  future: EditorDraft[]
}

export function createEditorState(draft: EditorDraft): EditorState {
  return { draft, past: [], future: [] }
}

/** Record `next` as the new present. A no-op (same reference) leaves history alone. */
export function commit(state: EditorState, next: EditorDraft): EditorState {
  if (next === state.draft) return state
  const past = [...state.past, state.draft]
  if (past.length > HISTORY_LIMIT) past.splice(0, past.length - HISTORY_LIMIT)
  return { draft: next, past, future: [] }
}

export function undo(state: EditorState): EditorState {
  const prev = state.past[state.past.length - 1]
  if (!prev) return state
  return { draft: prev, past: state.past.slice(0, -1), future: [state.draft, ...state.future] }
}

export function redo(state: EditorState): EditorState {
  const next = state.future[0]
  if (!next) return state
  return { draft: next, past: [...state.past, state.draft], future: state.future.slice(1) }
}

export const canUndo = (s: EditorState): boolean => s.past.length > 0
export const canRedo = (s: EditorState): boolean => s.future.length > 0

// ---------------------------------------------------------------------------
// invariants (tests / dev assertions)
// ---------------------------------------------------------------------------

/** Every violated editor invariant, as human-readable strings. Empty = valid. */
export function checkInvariants(draft: EditorDraft): string[] {
  const { show } = draft
  const out: string[] = []
  if (show.v !== 2) out.push('v must be 2')
  if (show.loopBeats < MIN_LOOP_BEATS || show.loopBeats > MAX_LOOP_BEATS) out.push(`loopBeats ${show.loopBeats} out of range`)
  const seen = new Set<string>()
  let prev = -Infinity
  let prevN = -Infinity
  for (const c of show.cues) {
    if (!(c.beat >= 0 && c.beat < show.loopBeats)) out.push(`${c.id}: beat ${c.beat} outside loop`)
    if (!(c.lengthBeats >= MIN_CUE_BEATS)) out.push(`${c.id}: length ${c.lengthBeats} < min`)
    if (c.beat + c.lengthBeats > show.loopBeats + 1e-9) out.push(`${c.id}: overruns loop`)
    if (!(c.intensity >= 0 && c.intensity <= 1)) out.push(`${c.id}: intensity ${c.intensity}`)
    if (!COLOR_RE.test(c.color)) out.push(`${c.id}: colour ${c.color}`)
    const n = idNumber(show.id, c.id)
    if (n === null) out.push(`${c.id}: id not ${show.id}:<n>`)
    else if (n >= draft.nextId) out.push(`${c.id}: id >= nextId ${draft.nextId}`)
    if (seen.has(c.id)) out.push(`${c.id}: duplicate id`)
    seen.add(c.id)
    if (c.beat < prev) out.push(`${c.id}: not sorted by beat`)
    else if (c.beat === prev && (n ?? 0) < prevN) out.push(`${c.id}: tie not in insertion order`)
    prev = c.beat
    prevN = n ?? 0
  }
  return out
}
