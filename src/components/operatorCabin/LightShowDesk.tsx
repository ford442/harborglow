// =============================================================================
// LIGHT SHOW DESK — booth piano roll plus a full-screen overlay.
// Scrub and playback advance a private audio-clock transport and redraw the
// canvas. They do not write the store or the sim, so the WebGPU canvas is
// not asked to re-render.
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { SHIP_COLORS } from '../DesignSystem'
import type { ShipType } from '../../store/gameStoreDomainTypes'
import { useGameStore } from '../../store/useGameStore'
import { lightingSystem } from '../../systems/lightingSystem'
import { SHIP_BPM } from '../../systems/lightShows'
import { getAuthoredShow } from '../../systems/lightShows/authoredShows'
import {
  QUANTIZE_BEATS,
  copyCueByBar,
  deleteCue,
  forkFactoryShow,
  placeCue,
  quantizeCue,
  rowsForShip,
  stretchCue,
  updateCue,
  type QuantizeId,
} from '../../systems/lightShows/cueEdit'
import { drawCueRoll, hitCue, xToBeat, yToRow, type RollMetrics } from '../../systems/lightShows/cueRoll'
import { previewClock } from '../../systems/lightShows/previewClock'
import type { LightCueEasing, LightCuePattern, LightShowV2 } from '../../systems/lightShows/types'

const PATTERNS: LightCuePattern[] = ['breathe', 'sweep', 'strobe', 'snap', 'blackout']
const EASINGS: LightCueEasing[] = ['step', 'linear', 'easeIn', 'easeOut', 'easeInOut']
const QUANTIZE_IDS = Object.keys(QUANTIZE_BEATS) as QuantizeId[]

interface LightShowDeskProps {
  shipType: ShipType
  onClose: () => void
}

export default function LightShowDesk({ shipType, onClose }: LightShowDeskProps) {
  const [expanded, setExpanded] = useState(false)
  const [show, setShow] = useState<LightShowV2>(() => getAuthoredShow(shipType) ?? forkFactoryShow(shipType) ?? emptyShow(shipType))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [quantizeId, setQuantizeId] = useState<QuantizeId>('1/4')
  const [pattern, setPattern] = useState<LightCuePattern>('breathe')
  const [color, setColor] = useState(SHIP_COLORS[shipType].primary)
  const [intensity, setIntensity] = useState(0.8)
  const [easing, setEasing] = useState<LightCueEasing>('step')
  const [playing, setPlaying] = useState(false)
  const [saved, setSaved] = useState(false)

  const boothRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const showRef = useRef(show)
  const selectedRef = useRef(selectedId)
  const playBeatRef = useRef(0)
  const stretchRef = useRef<{ id: string; lengthBeats: number } | null>(null)
  const dragRef = useRef<null | { kind: 'scrub' } | { kind: 'stretch'; id: string; beat: number }>(null)
  const playingRef = useRef(false)
  const quantumRef = useRef<number>(QUANTIZE_BEATS['1/4'])
  const toolRef = useRef({ pattern, color, intensity, easing })
  const drawRef = useRef<() => void>(() => {})

  showRef.current = show
  selectedRef.current = selectedId
  playingRef.current = playing
  quantumRef.current = QUANTIZE_BEATS[quantizeId]
  toolRef.current = { pattern, color, intensity, easing }

  const rows = rowsForShip(shipType)
  const palette = [SHIP_COLORS[shipType].primary, SHIP_COLORS[shipType].secondary]

  function redraw() {
    paint(boothRef.current)
    paint(overlayRef.current)
  }
  drawRef.current = redraw

  function paint(canvas: HTMLCanvasElement | null) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (width < 2 || height < 2) return
    const dpr = window.devicePixelRatio || 1
    const px = Math.floor(width * dpr)
    const py = Math.floor(height * dpr)
    if (canvas.width !== px || canvas.height !== py) {
      canvas.width = px
      canvas.height = py
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawCueRoll(ctx, {
      metrics: metricsFor(canvas),
      show: showRef.current,
      playBeat: playBeatRef.current,
      selectedId: selectedRef.current,
      stretch: stretchRef.current,
    })
  }

  function metricsFor(canvas: HTMLCanvasElement): RollMetrics {
    return {
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      labelWidth: 72,
      rulerHeight: 22,
      rows,
      loopBeats: showRef.current.loopBeats,
    }
  }

  useEffect(() => {
    drawRef.current()
    const frame = requestAnimationFrame(() => drawRef.current())
    return () => cancelAnimationFrame(frame)
  }, [show, selectedId, expanded])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    const loop = () => {
      playBeatRef.current = previewClock.beats() % showRef.current.loopBeats
      lightingSystem.setPreview(showRef.current, playBeatRef.current)
      drawRef.current()
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  useEffect(() => () => {
    previewClock.pause()
    lightingSystem.clearPreview()
  }, [])

  function seek(beat: number) {
    const q = Math.min(showRef.current.loopBeats, Math.max(0, beat))
    playBeatRef.current = q
    previewClock.scrub(q)
    if (playingRef.current) previewClock.play(q, SHIP_BPM[shipType])
    lightingSystem.setPreview(showRef.current, q)
    redraw()
  }

  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget
    canvas.setPointerCapture(event.pointerId)
    const point = localPoint(canvas, event)
    const metrics = metricsFor(canvas)
    if (point.y < metrics.rulerHeight || point.x < metrics.labelWidth) {
      dragRef.current = { kind: 'scrub' }
      seek(quantizeBeatSafe(xToBeat(metrics, point.x)))
      return
    }
    const hit = hitCue(showRef.current, metrics, point.x, point.y)
    if (hit?.edge) {
      dragRef.current = { kind: 'stretch', id: hit.cue.id, beat: hit.cue.beat }
      stretchRef.current = { id: hit.cue.id, lengthBeats: hit.cue.lengthBeats }
      setSelectedId(hit.cue.id)
      return
    }
    if (hit) {
      setSelectedId(hit.cue.id)
      setPattern(hit.cue.pattern)
      setColor(hit.cue.color)
      setIntensity(hit.cue.intensity)
      setEasing(hit.cue.easing)
      return
    }
    const row = yToRow(metrics, point.y)
    if (!row) return
    const tool = toolRef.current
    setShow(placeCue(showRef.current, {
      target: row,
      beat: xToBeat(metrics, point.x),
      quantum: quantumRef.current,
      pattern: tool.pattern,
      color: tool.color,
      intensity: tool.intensity,
      easing: tool.easing,
    }))
    setSaved(false)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current
    if (!drag) return
    const metrics = metricsFor(event.currentTarget)
    const beat = xToBeat(metrics, localPoint(event.currentTarget, event).x)
    if (drag.kind === 'scrub') {
      seek(quantizeBeatSafe(beat))
      return
    }
    stretchRef.current = { id: drag.id, lengthBeats: Math.max(quantumRef.current, beat - drag.beat) }
    redraw()
  }

  function onPointerUp() {
    const drag = dragRef.current
    if (drag?.kind === 'stretch' && stretchRef.current) {
      setShow(stretchCue(showRef.current, stretchRef.current.id, quantizeBeatSafe(stretchRef.current.lengthBeats)))
      setSaved(false)
    }
    dragRef.current = null
    stretchRef.current = null
    redraw()
  }

  function quantizeBeatSafe(beat: number): number {
    const q = quantumRef.current
    const snapped = Math.round(beat / q) * q
    return Math.max(0, Math.round(snapped * 1000) / 1000)
  }

  function patchSelected(patch: Parameters<typeof updateCue>[2]) {
    if (!selectedId) return
    setShow(updateCue(show, selectedId, patch))
    setSaved(false)
  }

  function togglePlay() {
    if (playing) {
      previewClock.pause()
      setPlaying(false)
      return
    }
    previewClock.play(playBeatRef.current, SHIP_BPM[shipType])
    setPlaying(true)
  }

  const tools = (
    <div style={toolRow}>
      <button type="button" style={toolBtn} onClick={togglePlay}>{playing ? 'Pause' : 'Play'}</button>
      <button type="button" style={toolBtn} onClick={() => {
        const next = forkFactoryShow(shipType)
        if (!next) return
        setShow(next)
        setSelectedId(null)
        setSaved(false)
      }}>Fork</button>
      <button type="button" style={toolBtn} disabled={!selectedId} onClick={() => {
        if (!selectedId) return
        setShow(copyCueByBar(show, selectedId))
        setSaved(false)
      }}>Copy bar</button>
      <button type="button" style={toolBtn} disabled={!selectedId} onClick={() => {
        if (!selectedId) return
        setShow(quantizeCue(show, selectedId, quantumRef.current))
        setSaved(false)
      }}>Quantize</button>
      <button type="button" style={toolBtn} disabled={!selectedId} onClick={() => {
        if (!selectedId) return
        setShow(deleteCue(show, selectedId))
        setSelectedId(null)
        setSaved(false)
      }}>Delete</button>
      {QUANTIZE_IDS.map((id) => (
        <button key={id} type="button" style={id === quantizeId ? toolBtnOn : toolBtn} onClick={() => setQuantizeId(id)}>{id}</button>
      ))}
      {PATTERNS.map((item) => (
        <button key={item} type="button" style={item === pattern ? toolBtnOn : toolBtn} onClick={() => {
          setPattern(item)
          patchSelected({ pattern: item })
        }}>{item}</button>
      ))}
      {palette.map((swatch) => (
        <button key={swatch} type="button" aria-label={swatch} style={{ ...swatchBtn, background: swatch, outline: swatch === color ? '2px solid #fff' : 'none' }} onClick={() => {
          setColor(swatch)
          patchSelected({ color: swatch })
        }} />
      ))}
      <label style={label}>
        I
        <input type="range" min={0} max={1} step={0.05} value={intensity} onChange={(event) => {
          const value = Number(event.target.value)
          setIntensity(value)
          patchSelected({ intensity: value })
        }} />
      </label>
      {EASINGS.map((item) => (
        <button key={item} type="button" style={item === easing ? toolBtnOn : toolBtn} onClick={() => {
          setEasing(item)
          patchSelected({ easing: item })
        }}>{item}</button>
      ))}
      <Curve easing={easing} />
      <button type="button" style={toolBtnOn} onClick={() => {
        useGameStore.getState().saveAuthoredShow(show)
        setSaved(true)
      }}>{saved ? 'Saved' : 'Save'}</button>
    </div>
  )

  return (
    <>
      <section style={boothStyle} aria-label="Cue roll">
        <header style={header}>
          <span>CUE ROLL · {shipType}</span>
          <span>
            <button type="button" style={toolBtn} onClick={() => setExpanded(true)}>Expand</button>
            <button type="button" style={toolBtn} onClick={onClose}>Close</button>
          </span>
        </header>
        <canvas
          ref={boothRef}
          style={{ ...canvasStyle, pointerEvents: expanded ? 'none' : 'auto' }}
          onPointerDown={expanded ? undefined : onPointerDown}
          onPointerMove={expanded ? undefined : onPointerMove}
          onPointerUp={expanded ? undefined : onPointerUp}
        />
        {!expanded && tools}
      </section>
      {expanded && (
        <section style={overlayStyle} aria-label="Cue timeline">
          <header style={header}>
            <span>LIGHT SHOW · {shipType} · bars:beats</span>
            <button type="button" style={toolBtn} onClick={() => setExpanded(false)}>Booth</button>
          </header>
          <canvas
            ref={overlayRef}
            style={canvasStyle}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
          {tools}
        </section>
      )}
    </>
  )
}

function Curve({ easing }: { easing: LightCueEasing }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, 64, 28)
    ctx.strokeStyle = '#00d4aa'
    ctx.beginPath()
    for (let i = 0; i <= 32; i++) {
      const u = i / 32
      const y = 26 - gain(easing, u) * 22
      if (i === 0) ctx.moveTo(2, y)
      else ctx.lineTo(2 + u * 60, y)
    }
    ctx.stroke()
  }, [easing])
  return <canvas ref={ref} width={64} height={28} style={{ width: 64, height: 28, background: '#0c1218', borderRadius: 4 }} />
}

function gain(easing: LightCueEasing, u: number): number {
  switch (easing) {
    case 'linear': return u
    case 'easeIn': return u * u
    case 'easeOut': return 1 - (1 - u) * (1 - u)
    case 'easeInOut': return u < 0.5 ? 2 * u * u : 1 - ((-2 * u + 2) ** 2) / 2
    default: return 1
  }
}

function localPoint(canvas: HTMLCanvasElement, event: ReactPointerEvent<HTMLCanvasElement>) {
  const rect = canvas.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function emptyShow(shipType: ShipType): LightShowV2 {
  return { v: 2, id: shipType, loopBeats: 32, cues: [] }
}

const boothStyle: CSSProperties = {
  position: 'absolute',
  left: 24,
  bottom: 24,
  width: 'min(720px, 52vw)',
  zIndex: 2,
  pointerEvents: 'auto',
  background: 'rgba(8, 14, 20, 0.88)',
  border: '1px solid rgba(0,212,170,0.35)',
  borderRadius: 12,
  padding: 10,
  color: '#d5e4ef',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 16,
  zIndex: 3,
  pointerEvents: 'auto',
  background: 'rgba(6, 10, 16, 0.94)',
  border: '1px solid rgba(0,212,170,0.45)',
  borderRadius: 16,
  padding: 16,
  color: '#d5e4ef',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const header: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  font: '600 12px/1 sans-serif',
  letterSpacing: '0.06em',
}

const canvasStyle: CSSProperties = {
  width: '100%',
  height: 220,
  flex: 1,
  minHeight: 140,
  borderRadius: 8,
  cursor: 'crosshair',
  touchAction: 'none',
}

const toolRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  alignItems: 'center',
}

const toolBtn: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  color: '#d5e4ef',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 6,
  padding: '4px 8px',
  font: '11px sans-serif',
  cursor: 'pointer',
}

const toolBtnOn: CSSProperties = {
  ...toolBtn,
  background: 'rgba(0,212,170,0.25)',
  borderColor: 'rgba(0,212,170,0.7)',
}

const swatchBtn: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: 4,
  border: 'none',
  cursor: 'pointer',
  padding: 0,
}

const label: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  font: '11px sans-serif',
}
