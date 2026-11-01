import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { openEditorSession, type EditorSession } from '../../systems/lightShows/editor/editorSession'
import type { ShipType } from '../../store/gameStoreTypes'
import TimelineCanvas from './TimelineCanvas'
import Toolbar from './Toolbar'
import { publishEditorDebug } from './debugHook'
import * as s from './styles'

// Full-screen cue timeline editor (#270). Lazy chunk, opened from the operator
// cabin. All state lives in an EditorSession (vanilla store): nothing here
// writes useGameStore, and crane/HUD hotkeys are held off while it is open.

export interface LightShowEditorProps {
  shipId: string
  shipType: ShipType
  onClose: () => void
}

const TYPING = new Set(['INPUT', 'SELECT', 'TEXTAREA'])

export default function LightShowEditor({ shipId, shipType, onClose }: LightShowEditorProps) {
  const [session, setSession] = useState<EditorSession | null>(null)

  useEffect(() => {
    let cancelled = false
    let opened: EditorSession | null = null
    void openEditorSession({ shipType, shipId }).then((sess) => {
      if (cancelled) {
        sess.dispose()
        return
      }
      opened = sess
      publishEditorDebug(sess)
      setSession(sess)
    })
    return () => {
      cancelled = true
      opened?.dispose()
      publishEditorDebug(null)
    }
  }, [shipId, shipType])

  // Capture-phase keyboard: stops the event before the crane / HUD / pause handlers
  // (window bubble listeners) see it. keyup is left alone so a key held while
  // opening still releases in the crane's pressed-key set.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (!session) return
      const el = e.target as HTMLElement | null
      if (el && TYPING.has(el.tagName)) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) session.redo()
        else session.undo()
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        session.redo()
      } else if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void session.save()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        session.deleteSelected()
      } else if (e.key === ' ') {
        e.preventDefault()
        if (session.store.getState().playing) session.stop()
        else session.play()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [session, onClose])

  return (
    <div style={s.overlay} role="dialog" aria-label="Light show editor" data-testid="light-show-editor">
      <div style={s.header}>
        <strong style={{ color: s.ACCENT, fontSize: 14 }}>🎛️ Light show editor</strong>
        <span style={{ color: '#7f93a3' }}>{shipType}</span>
        <span style={{ flex: 1 }} />
        <button style={s.button()} onClick={onClose} data-testid="le-close">Close (Esc)</button>
      </div>
      {session ? <EditorBody session={session} /> : <div style={{ padding: 24 }}>Loading…</div>}
    </div>
  )
}

function EditorBody({ session }: { session: EditorSession }) {
  const status = useStore(session.store, (st) => st.status)
  const dirty = useStore(session.store, () => session.isDirty())
  const cueCount = useStore(session.store, () => session.draft().show.cues.length)
  const loopBeats = useStore(session.store, () => session.draft().show.loopBeats)
  return (
    <>
      <Toolbar session={session} />
      <div style={s.canvasHost}>
        <TimelineCanvas session={session} />
      </div>
      <div style={s.statusBar}>
        <span data-testid="le-status">{status ?? (dirty ? 'Unsaved changes' : 'All changes saved')}</span>
        <span>
          {cueCount} cues · {loopBeats} beats · click to place · drag to move · edge-drag to stretch · Shift+drag to copy · ruler to scrub
        </span>
      </div>
    </>
  )
}
