import { BEATS_PER_BAR } from '../../audio/transport'
import type { LightCueV2 } from '../types'
import { TARGET_ROWS, type CueTarget } from './editorModel'

// =============================================================================
// TIMELINE GEOMETRY (#270) — pure mapping between the piano-roll canvas
// (pixels) and the show (beats × rig-group rows). No DOM, so hit-testing and
// drag maths are unit-tested; TimelineCanvas only draws and forwards pointers.
// =============================================================================

export interface TimelineLayout {
  width: number
  height: number
  /** Left gutter with the row labels. */
  labelW: number
  /** Top strip with bar numbers; clicking it scrubs. */
  rulerH: number
  loopBeats: number
  rows: readonly CueTarget[]
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type HitZone = 'body' | 'start' | 'end'
export interface Hit {
  cueId: string
  zone: HitZone
}

export const DEFAULT_LABEL_W = 84
export const DEFAULT_RULER_H = 22
/** Pixels of a cue's left/right edge that grab a stretch (capped at a third of the cue). */
export const EDGE_GRAB_PX = 7
export const CUE_INSET_PX = 2

export function createLayout(width: number, height: number, loopBeats: number, rows: readonly CueTarget[] = TARGET_ROWS): TimelineLayout {
  return { width, height, labelW: DEFAULT_LABEL_W, rulerH: DEFAULT_RULER_H, loopBeats, rows }
}

export const pxPerBeat = (l: TimelineLayout): number => Math.max(1, l.width - l.labelW) / l.loopBeats
export const rowHeight = (l: TimelineLayout): number => Math.max(1, l.height - l.rulerH) / l.rows.length
export const beatToX = (l: TimelineLayout, beat: number): number => l.labelW + beat * pxPerBeat(l)
export const xToBeat = (l: TimelineLayout, x: number): number => (x - l.labelW) / pxPerBeat(l)
export const rowTop = (l: TimelineLayout, rowIndex: number): number => l.rulerH + rowIndex * rowHeight(l)

/** Row index under `y`, or -1 over the ruler / outside the rows. */
export function rowAtY(l: TimelineLayout, y: number): number {
  if (y < l.rulerH) return -1
  const i = Math.floor((y - l.rulerH) / rowHeight(l))
  return i >= 0 && i < l.rows.length ? i : -1
}

/** Row index clamped to the grid — used while dragging so a cue sticks to the nearest row. */
export function nearestRow(l: TimelineLayout, y: number): number {
  const i = Math.floor((y - l.rulerH) / rowHeight(l))
  return Math.max(0, Math.min(l.rows.length - 1, i))
}

export function cueRect(l: TimelineLayout, cue: LightCueV2): Rect | null {
  const row = l.rows.indexOf(cue.target)
  if (row < 0) return null
  return {
    x: beatToX(l, cue.beat),
    y: rowTop(l, row) + CUE_INSET_PX,
    w: Math.max(2, cue.lengthBeats * pxPerBeat(l)),
    h: rowHeight(l) - CUE_INSET_PX * 2,
  }
}

/** Topmost cue under (x, y); later cues draw on top, so they win. */
export function hitTest(l: TimelineLayout, cues: readonly LightCueV2[], x: number, y: number): Hit | null {
  for (let i = cues.length - 1; i >= 0; i--) {
    const r = cueRect(l, cues[i])
    if (!r || x < r.x || x > r.x + r.w || y < r.y || y > r.y + r.h) continue
    const grab = Math.min(EDGE_GRAB_PX, r.w / 3)
    const zone: HitZone = x - r.x <= grab ? 'start' : r.x + r.w - x <= grab ? 'end' : 'body'
    return { cueId: cues[i].id, zone }
  }
  return null
}

/** Beats of the first column of each bar line, for drawing (every BEATS_PER_BAR). */
export function barLines(loopBeats: number): number[] {
  const out: number[] = []
  for (let b = 0; b < loopBeats; b += BEATS_PER_BAR) out.push(b)
  return out
}

/** Bar index (0-based) containing `beat`, clamped to the loop. */
export function barAtBeat(beat: number, loopBeats: number): number {
  return Math.max(0, Math.min(Math.ceil(loopBeats / BEATS_PER_BAR) - 1, Math.floor(beat / BEATS_PER_BAR)))
}
