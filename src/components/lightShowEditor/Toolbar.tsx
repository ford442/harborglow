import { useMemo, useState } from 'react'
import { useStore } from 'zustand'
import { SHIP_TYPE_LIGHT_COLORS } from '../../systems/attachmentSystem'
import { QUANTIZE_GRIDS, barCount, type QuantizeGrid } from '../../systems/lightShows/editor/editorModel'
import type { EditorSession } from '../../systems/lightShows/editor/editorSession'
import type { LightCueEasing, LightCuePattern } from '../../systems/lightShows/types'
import * as s from './styles'

const PATTERNS: LightCuePattern[] = ['breathe', 'sweep', 'strobe', 'snap', 'blackout']
const EASINGS: LightCueEasing[] = ['step', 'linear', 'easeIn', 'easeOut', 'easeInOut']
const LOOPS = [16, 24, 32, 40, 48, 56, 64]

export default function Toolbar({ session, onShare }: { session: EditorSession; onShare?: React.ReactNode }) {
  const tool = useStore(session.store, (st) => st.tool)
  const playing = useStore(session.store, (st) => st.playing)
  const scrubBeat = useStore(session.store, (st) => st.scrubBeat)
  const music = useStore(session.store, (st) => st.music)
  const shipType = useStore(session.store, (st) => st.shipType)
  const history = useStore(session.store, (st) => st.history)
  const transient = useStore(session.store, (st) => st.transient)
  const draft = transient ?? history.draft
  const dirty = useStore(session.store, () => session.isDirty())
  const saved = useStore(session.store, (st) => st.saved)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(1)

  const bars = barCount(draft.show.loopBeats)
  const palette = useMemo(() => {
    const colors = [SHIP_TYPE_LIGHT_COLORS[shipType], '#ffffff', ...draft.show.cues.map((c) => c.color)]
    return [...new Set(colors.filter(Boolean).map((c) => c.toLowerCase()))].slice(0, 14)
  }, [shipType, draft.show.cues])

  return (
    <div style={s.toolbar} data-testid="le-toolbar">
      <div style={s.group}>
        <button style={s.button(playing)} onClick={() => (playing ? session.stop() : session.play())} data-testid="le-play">
          {playing ? '■ Stop' : '▶ Play'}
        </button>
        <label style={{ ...s.group, cursor: 'pointer' }} title="Play the ship's music with the lights">
          <input type="checkbox" checked={music} onChange={(e) => session.setMusic(e.target.checked)} /> ♪
        </label>
        {scrubBeat !== null && (
          <button style={s.button()} onClick={() => session.scrub(null)} title="Release the scrub hold">
            ✕ hold {scrubBeat.toFixed(2)}
          </button>
        )}
      </div>

      <div style={s.group}>
        <button style={s.button(false, !session.canUndo())} disabled={!session.canUndo()} onClick={() => session.undo()} data-testid="le-undo">↶</button>
        <button style={s.button(false, !session.canRedo())} disabled={!session.canRedo()} onClick={() => session.redo()} data-testid="le-redo">↷</button>
      </div>

      <div style={s.group}>
        <span style={s.label}>Pattern</span>
        <select style={s.control} value={tool.pattern} onChange={(e) => session.setTool({ pattern: e.target.value as LightCuePattern })} data-testid="le-pattern">
          {PATTERNS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <span style={s.label}>Easing</span>
        <select style={s.control} value={tool.easing} onChange={(e) => session.setTool({ easing: e.target.value as LightCueEasing })} data-testid="le-easing">
          {EASINGS.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div style={s.group}>
        <span style={s.label}>Colour</span>
        {palette.map((c) => (
          <button key={c} style={s.swatch(c, tool.color.toLowerCase() === c)} onClick={() => session.setTool({ color: c })} title={c} aria-label={`colour ${c}`} />
        ))}
        <input type="color" value={tool.color} onChange={(e) => session.setTool({ color: e.target.value })} aria-label="custom colour" data-testid="le-color" />
      </div>

      <div style={s.group}>
        <span style={s.label}>Intensity</span>
        <input type="range" min={0} max={1} step={0.05} value={tool.intensity} onChange={(e) => session.setTool({ intensity: Number(e.target.value) })} data-testid="le-intensity" />
        <span>{tool.intensity.toFixed(2)}</span>
        <span style={s.label}>Len</span>
        <input type="number" min={0.0625} max={64} step={0.25} value={tool.lengthBeats} style={{ ...s.control, width: 58 }} onChange={(e) => session.setTool({ lengthBeats: Number(e.target.value) })} data-testid="le-length" />
      </div>

      <div style={s.group}>
        <span style={s.label}>Snap</span>
        {QUANTIZE_GRIDS.map((g: QuantizeGrid) => (
          <button key={g} style={s.button(tool.grid === g)} onClick={() => session.setTool({ grid: g })}>1/{g}</button>
        ))}
        <button style={s.button(tool.grid === null)} onClick={() => session.setTool({ grid: null })}>free</button>
        <button style={s.button()} onClick={() => session.quantizeAll(tool.grid ?? 8)} title="Snap every cue to the grid">Quantize</button>
      </div>

      <div style={s.group}>
        <span style={s.label}>Loop</span>
        <select style={s.control} value={draft.show.loopBeats} onChange={(e) => session.setLoop(Number(e.target.value))} data-testid="le-loop">
          {(LOOPS.includes(draft.show.loopBeats) ? LOOPS : [...LOOPS, draft.show.loopBeats].sort((a, b) => a - b)).map((n) => <option key={n} value={n}>{n} beats</option>)}
        </select>
        <span style={s.label}>Copy bar</span>
        <select style={s.control} value={from} onChange={(e) => setFrom(Number(e.target.value))} aria-label="copy from bar">
          {Array.from({ length: bars }, (_, i) => <option key={i} value={i}>{i + 1}</option>)}
        </select>
        →
        <select style={s.control} value={to} onChange={(e) => setTo(Number(e.target.value))} aria-label="copy to bar">
          {Array.from({ length: bars }, (_, i) => <option key={i} value={i}>{i + 1}</option>)}
        </select>
        <button style={s.button(false, from === to)} disabled={from === to} onClick={() => session.copyBar(from, to)} data-testid="le-copybar">Copy</button>
      </div>

      <div style={s.group}>
        <button style={s.button()} onClick={() => session.resetToFactory()} title="Replace the draft with a fresh fork of the factory show (undoable)" data-testid="le-reset">Fork factory</button>
        <button style={s.button(dirty, false)} onClick={() => void session.save()} data-testid="le-save">{dirty ? '● Save' : 'Saved'}</button>
        {saved && <button style={s.button()} onClick={() => void session.discardSaved()} title="Delete your saved show; this ship goes back to the factory show">Delete mine</button>}
        {onShare}
      </div>
    </div>
  )
}
