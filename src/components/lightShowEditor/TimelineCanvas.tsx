import { useCallback, useEffect, useMemo, useRef } from 'react'
import { easingEnvelope } from '../../systems/lightShows/rigCues'
import { getRigGroups } from '../../systems/lightShows/rigGroups'
import {
  TARGET_ROWS,
  duplicateCue,
  moveCue,
  snapBeat,
  stretchCue,
  type CueTarget,
  type EditorDraft,
} from '../../systems/lightShows/editor/editorModel'
import type { EditorSession } from '../../systems/lightShows/editor/editorSession'
import {
  barLines,
  beatToX,
  createLayout,
  cueRect,
  hitTest,
  nearestRow,
  pxPerBeat,
  rowAtY,
  rowHeight,
  rowTop,
  xToBeat,
  type TimelineLayout,
} from '../../systems/lightShows/editor/timelineGeometry'
import type { LightCuePattern } from '../../systems/lightShows/types'

// Piano-roll canvas. Rows = rig groups (+ all), columns = beats, bars every 4.
// Click empty = place the toolbar cue; drag = move; edge-drag = stretch;
// Shift+drag = copy; the ruler scrubs. Drags edit a transient draft and commit
// once on pointer-up, so a whole gesture is one undo step.

const PATTERN_TAG: Record<LightCuePattern, string> = { breathe: '~', sweep: '»', strobe: '⚡', snap: '•', blackout: '■' }
const DRAG_THRESHOLD_PX = 4

type Drag =
  | { kind: 'scrub' }
  | { kind: 'place'; x: number; y: number; moved: boolean }
  | { kind: 'move'; id: string; base: EditorDraft; grabBeats: number }
  | { kind: 'stretch'; id: string; edge: 'start' | 'end'; base: EditorDraft }

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export default function TimelineCanvas({ session }: { session: EditorSession }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef({ w: 800, h: 360, dpr: 1 })
  const drag = useRef<Drag | null>(null)
  const raf = useRef(0)
  const absent = useMemo(() => {
    const has = getRigGroups(session.store.getState().shipType)
    return new Set<CueTarget>(TARGET_ROWS.filter((r) => r !== 'all' && !has.has(r)))
  }, [session])

  const layout = useCallback(
    (): TimelineLayout => createLayout(sizeRef.current.w, sizeRef.current.h, session.draft().show.loopBeats),
    [session],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      raf.current = 0
      const { w, h, dpr } = sizeRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const state = session.store.getState()
      const draft = session.draft()
      const l = layout()
      const ppb = pxPerBeat(l)
      const rh = rowHeight(l)

      // rows
      ctx.font = '11px ui-monospace, Menlo, monospace'
      ctx.textBaseline = 'middle'
      TARGET_ROWS.forEach((row, i) => {
        const y = rowTop(l, i)
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.05)'
        ctx.fillRect(l.labelW, y, w - l.labelW, rh)
        if (absent.has(row)) {
          ctx.fillStyle = 'rgba(120,120,120,0.22)'
          ctx.fillRect(l.labelW, y, w - l.labelW, rh)
          ctx.strokeStyle = 'rgba(160,160,160,0.18)'
          ctx.beginPath()
          for (let x = l.labelW - rh; x < w; x += 10) {
            ctx.moveTo(x, y + rh)
            ctx.lineTo(x + rh, y)
          }
          ctx.save()
          ctx.beginPath()
          ctx.rect(l.labelW, y, w - l.labelW, rh)
          ctx.clip()
          ctx.stroke()
          ctx.restore()
        }
        ctx.fillStyle = absent.has(row) ? '#5b6670' : '#9fb4c4'
        ctx.fillText(absent.has(row) ? `${row} (none)` : row, 8, y + rh / 2)
      })

      // beat + bar grid
      for (let b = 0; b <= l.loopBeats; b++) {
        const x = beatToX(l, b)
        const bar = b % 4 === 0
        ctx.strokeStyle = bar ? 'rgba(160,200,230,0.35)' : 'rgba(160,200,230,0.1)'
        ctx.beginPath()
        ctx.moveTo(x + 0.5, l.rulerH)
        ctx.lineTo(x + 0.5, h)
        ctx.stroke()
      }
      ctx.fillStyle = '#7f93a3'
      for (const b of barLines(l.loopBeats)) ctx.fillText(String(b / 4 + 1), beatToX(l, b) + 4, l.rulerH / 2)

      // cues
      for (const cue of draft.show.cues) {
        const r = cueRect(l, cue)
        if (!r) continue
        const selected = cue.id === state.selection
        ctx.fillStyle = rgba(cue.color, 0.2 + 0.7 * cue.intensity)
        ctx.fillRect(r.x, r.y, r.w, r.h)
        ctx.strokeStyle = selected ? '#ffffff' : rgba(cue.color, 0.95)
        ctx.lineWidth = selected ? 2 : 1
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1)
        ctx.lineWidth = 1
        // easing ramp glyph: the envelope the cue plays with
        if (r.w > 14) {
          ctx.strokeStyle = 'rgba(0,0,0,0.55)'
          ctx.beginPath()
          const steps = Math.min(24, Math.floor(r.w / 3))
          for (let i = 0; i <= steps; i++) {
            const p = i / steps
            const x = r.x + 2 + p * (r.w - 4)
            const y = r.y + r.h - 3 - easingEnvelope(cue.easing, p) * (r.h - 6)
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
        if (r.w > 22) {
          ctx.fillStyle = 'rgba(0,0,0,0.75)'
          ctx.fillText(PATTERN_TAG[cue.pattern], r.x + 4, r.y + r.h / 2)
        }
      }

      // loop end + playhead
      ctx.strokeStyle = 'rgba(255,120,120,0.6)'
      ctx.beginPath()
      ctx.moveTo(beatToX(l, l.loopBeats) - 0.5, l.rulerH)
      ctx.lineTo(beatToX(l, l.loopBeats) - 0.5, h)
      ctx.stroke()
      if (state.playing || state.scrubBeat !== null) {
        const x = l.labelW + session.playheadBeat() * ppb
        ctx.strokeStyle = '#5fd4ff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
        ctx.lineWidth = 1
        if (state.playing && state.scrubBeat === null) schedule() // keep animating the playhead
      }
    }

    const schedule = () => {
      if (!raf.current) raf.current = requestAnimationFrame(draw)
    }

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = Math.max(320, Math.floor(rect.width))
      const h = Math.max(200, Math.floor(rect.height))
      sizeRef.current = { w, h, dpr }
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      schedule()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    const unsub = session.store.subscribe(schedule)
    return () => {
      unsub()
      ro.disconnect()
      if (raf.current) cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }, [session, absent, layout])

  const local = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const snap = (beat: number) => snapBeat(beat, session.store.getState().tool.grid)

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const { x, y } = local(e)
    const l = layout()
    canvasRef.current!.setPointerCapture(e.pointerId)

    if (y < l.rulerH) {
      drag.current = { kind: 'scrub' }
      session.scrub(xToBeat(l, x))
      return
    }
    const draft = session.base()
    const hit = hitTest(l, draft.show.cues, x, y)
    if (!hit) {
      drag.current = { kind: 'place', x, y, moved: false }
      return
    }
    session.select(hit.cueId)
    const cue = draft.show.cues.find((c) => c.id === hit.cueId)!
    if (hit.zone === 'body') {
      if (e.shiftKey) {
        // Shift+drag = copy: the duplicate lives in the transient draft, so copy + move is one undo step.
        const r = duplicateCue(draft, cue.id, cue.beat)
        if (!r.cueId) return
        session.select(r.cueId)
        session.setTransient(r.draft)
        drag.current = { kind: 'move', id: r.cueId, base: r.draft, grabBeats: xToBeat(l, x) - cue.beat }
      } else {
        drag.current = { kind: 'move', id: cue.id, base: draft, grabBeats: xToBeat(l, x) - cue.beat }
      }
    } else {
      drag.current = { kind: 'stretch', id: cue.id, edge: hit.zone, base: draft }
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const { x, y } = local(e)
    const l = layout()
    const d = drag.current
    if (!d) {
      const hit = rowAtY(l, y) >= 0 ? hitTest(l, session.draft().show.cues, x, y) : null
      canvasRef.current!.style.cursor = y < l.rulerH ? 'pointer' : !hit ? 'crosshair' : hit.zone === 'body' ? 'grab' : 'ew-resize'
      return
    }
    switch (d.kind) {
      case 'scrub':
        session.scrub(xToBeat(l, x))
        break
      case 'place':
        if (Math.hypot(x - d.x, y - d.y) > DRAG_THRESHOLD_PX) d.moved = true
        break
      case 'move': {
        const row = TARGET_ROWS[nearestRow(l, y)]
        session.setTransient(moveCue(d.base, d.id, snap(xToBeat(l, x) - d.grabBeats), row))
        break
      }
      case 'stretch':
        session.setTransient(stretchCue(d.base, d.id, d.edge, snap(xToBeat(l, x))))
        break
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (canvasRef.current?.hasPointerCapture(e.pointerId)) canvasRef.current.releasePointerCapture(e.pointerId)
    if (!d) return
    const { x, y } = local(e)
    const l = layout()
    if (d.kind === 'place') {
      const row = rowAtY(l, y)
      if (!d.moved && row >= 0 && x >= l.labelW) {
        const grid = session.store.getState().tool.grid
        const raw = xToBeat(l, x)
        const beat = grid === null ? raw : Math.floor(raw / (4 / grid)) * (4 / grid) // the cell that was clicked
        session.placeAt(beat, TARGET_ROWS[row])
      } else if (!d.moved) {
        session.select(null)
      }
    } else if (d.kind === 'move' || d.kind === 'stretch') {
      session.commitTransient()
    }
  }

  return (
    <div ref={hostRef} style={{ position: 'absolute', inset: 12 }}>
      <canvas
        ref={canvasRef}
        data-testid="le-canvas"
        style={{ touchAction: 'none', display: 'block', borderRadius: 6, background: 'rgba(0,0,0,0.35)' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null
          session.setTransient(null)
        }}
      />
    </div>
  )
}
