// =============================================================================
// PIANO-ROLL GEOMETRY — bars:beats hit testing. Drawing is separate so the
// editor can scrub without asking React to re-render.
// =============================================================================

import type { LightCueV2, LightShowV2, RigGroupId } from './types'

export interface RollMetrics {
  width: number
  height: number
  labelWidth: number
  rulerHeight: number
  rows: readonly (RigGroupId | 'all')[]
  loopBeats: number
}

export function rowHeight(metrics: RollMetrics): number {
  return (metrics.height - metrics.rulerHeight) / Math.max(1, metrics.rows.length)
}

export function beatToX(metrics: RollMetrics, beat: number): number {
  const span = Math.max(1, metrics.width - metrics.labelWidth)
  return metrics.labelWidth + (beat / metrics.loopBeats) * span
}

export function xToBeat(metrics: RollMetrics, x: number): number {
  const span = Math.max(1, metrics.width - metrics.labelWidth)
  const u = (x - metrics.labelWidth) / span
  return Math.min(metrics.loopBeats, Math.max(0, u * metrics.loopBeats))
}

export function yToRow(metrics: RollMetrics, y: number): RigGroupId | 'all' | null {
  if (y < metrics.rulerHeight) return null
  const index = Math.floor((y - metrics.rulerHeight) / rowHeight(metrics))
  return metrics.rows[index] ?? null
}

export interface CueHit {
  cue: LightCueV2
  /** Pointer is on the right edge, so the gesture stretches. */
  edge: boolean
}

export function hitCue(show: LightShowV2, metrics: RollMetrics, x: number, y: number, edgePx = 8): CueHit | null {
  const row = yToRow(metrics, y)
  if (!row) return null
  const beat = xToBeat(metrics, x)
  const height = rowHeight(metrics)
  const rowIndex = metrics.rows.indexOf(row)
  const rowTop = metrics.rulerHeight + rowIndex * height
  if (y < rowTop || y > rowTop + height) return null
  let found: CueHit | null = null
  for (const cue of show.cues) {
    if (cue.target !== row) continue
    const x0 = beatToX(metrics, cue.beat)
    const x1 = beatToX(metrics, cue.beat + cue.lengthBeats)
    if (x < x0 || x > x1) continue
    if (beat < cue.beat || beat >= cue.beat + cue.lengthBeats) continue
    found = { cue, edge: x1 - x <= edgePx }
  }
  return found
}

const ROW_LABEL: Record<string, string> = {
  all: 'ALL',
  funnel: 'FUNNEL',
  bridge: 'BRIDGE',
  hullStrip: 'HULL',
  gantry: 'GANTRY',
  mast: 'MAST',
  deck: 'DECK',
  accent: 'ACCENT',
}

export interface DrawRollOptions {
  metrics: RollMetrics
  show: LightShowV2
  playBeat: number
  selectedId: string | null
  /** Live length while a stretch drag is in progress. */
  stretch?: { id: string; lengthBeats: number } | null
}

export function drawCueRoll(ctx: CanvasRenderingContext2D, options: DrawRollOptions): void {
  const { metrics, show, playBeat, selectedId, stretch } = options
  const { width, height, labelWidth, rulerHeight } = metrics
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#0c1218'
  ctx.fillRect(0, 0, width, height)

  const heightRow = rowHeight(metrics)
  metrics.rows.forEach((row, index) => {
    const y = rulerHeight + index * heightRow
    ctx.fillStyle = index % 2 === 0 ? '#121a22' : '#101820'
    ctx.fillRect(labelWidth, y, width - labelWidth, heightRow)
    ctx.fillStyle = '#8aa0b4'
    ctx.font = '11px sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillText(ROW_LABEL[row] ?? row, 8, y + heightRow / 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.beginPath()
    ctx.moveTo(0, y + heightRow)
    ctx.lineTo(width, y + heightRow)
    ctx.stroke()
  })

  const bars = Math.ceil(metrics.loopBeats / 4)
  ctx.font = '10px sans-serif'
  ctx.textBaseline = 'top'
  for (let bar = 0; bar < bars; bar++) {
    const x = beatToX(metrics, bar * 4)
    ctx.strokeStyle = 'rgba(0,212,170,0.35)'
    ctx.beginPath()
    ctx.moveTo(x, rulerHeight)
    ctx.lineTo(x, height)
    ctx.stroke()
    ctx.fillStyle = '#9eb4c6'
    ctx.fillText(`${bar}:0`, x + 4, 4)
  }

  for (const cue of show.cues) {
    const rowIndex = metrics.rows.indexOf(cue.target)
    if (rowIndex < 0) continue
    const length = stretch?.id === cue.id ? stretch.lengthBeats : cue.lengthBeats
    const x = beatToX(metrics, cue.beat)
    const w = Math.max(2, beatToX(metrics, cue.beat + length) - x)
    const y = rulerHeight + rowIndex * heightRow + 3
    ctx.fillStyle = cue.color
    ctx.globalAlpha = 0.35 + cue.intensity * 0.65
    ctx.fillRect(x, y, w, heightRow - 6)
    ctx.globalAlpha = 1
    if (cue.id === selectedId) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.strokeRect(x + 1, y + 1, w - 2, heightRow - 8)
      ctx.lineWidth = 1
    }
  }

  const wrapped = playBeat % metrics.loopBeats
  const playX = beatToX(metrics, wrapped)
  ctx.strokeStyle = '#ffe08a'
  ctx.beginPath()
  ctx.moveTo(playX, 0)
  ctx.lineTo(playX, height)
  ctx.stroke()
  const bar = Math.floor(wrapped / 4)
  const beatInBar = Math.floor(wrapped % 4)
  const sixteenth = Math.floor((wrapped % 1) * 4)
  ctx.fillStyle = '#ffe08a'
  ctx.font = '11px sans-serif'
  ctx.textBaseline = 'top'
  ctx.fillText(`${bar}:${beatInBar}:${sixteenth}`, width - 52, 4)
}
