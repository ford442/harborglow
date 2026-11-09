import { createStore, type StoreApi } from 'zustand/vanilla'
import type { ShipType } from '../../../store/gameStoreTypes'
import { lightingSystem } from '../../lightingSystem'
import { musicSystem } from '../../music'
import { isSharedPlaybackActive } from '../../share/sharedPlaybackState'
import { simNowMs } from '../../sim/SimContext'
import { SHIP_BPM, lightShowRegistryV2 } from '../index'
import type { LightCueEasing, LightCuePattern, LightShowV2 } from '../types'
import { deleteUserShow, getUserShow, hydrateUserShows, saveUserShow } from '../userShows'
import {
  canRedo,
  canUndo,
  clampLoopBeats,
  commit,
  copyBar,
  createEditorState,
  deleteCue,
  draftFromShow,
  duplicateCue,
  findCue,
  forkShow,
  placeCue,
  quantize,
  redo,
  setCueProps,
  setLoopBeats,
  undo,
  type CuePropsPatch,
  type CueTarget,
  type EditorDraft,
  type EditorState,
  type QuantizeGrid,
} from './editorModel'

// =============================================================================
// EDITOR SESSION (#270) — the cue editor's state, outside React and outside
// useGameStore. A vanilla store: editing never notifies the game store (the
// R3F canvas must not re-render while a player drags cues), and playing or
// scrubbing only talks to lightingSystem / musicSystem, whose reads of sim time
// never write the sim.
// =============================================================================

export interface ToolState {
  pattern: LightCuePattern
  easing: LightCueEasing
  color: string
  intensity: number
  lengthBeats: number
  /** Snap grid for placing / dragging; null = free. */
  grid: QuantizeGrid | null
}

export const DEFAULT_TOOL: ToolState = {
  pattern: 'breathe',
  easing: 'step',
  color: '#ffd700',
  intensity: 0.9,
  lengthBeats: 2,
  grid: 8,
}

export interface SessionState {
  shipType: ShipType
  shipId: string
  history: EditorState
  /** Uncommitted drag result; the committed draft stays in `history` until pointer-up. */
  transient: EditorDraft | null
  selection: string | null
  tool: ToolState
  /** Lights are looping the draft (and music, when on). */
  playing: boolean
  /** Playhead held by the scrub bar; null = follow the clock. */
  scrubBeat: number | null
  music: boolean
  /** The show object last written to storage, for the dirty flag. */
  saved: LightShowV2 | undefined
  status: string | null
}

export interface EditorSession {
  readonly store: StoreApi<SessionState>
  /** The draft to draw: the drag preview if any, else the committed one. */
  draft(): EditorDraft
  /** The committed draft (drag maths start from here). */
  base(): EditorDraft
  isDirty(): boolean
  hasFactory(): boolean
  canUndo(): boolean
  canRedo(): boolean
  // editing
  edit(fn: (d: EditorDraft) => EditorDraft): void
  setTransient(d: EditorDraft | null): void
  commitTransient(): void
  select(id: string | null): void
  setTool(patch: Partial<ToolState>): void
  placeAt(beat: number, target: CueTarget): string
  duplicateSelectedTo(beat: number, target: CueTarget): string | null
  deleteSelected(): void
  copyBar(from: number, to: number): void
  quantizeAll(grid: QuantizeGrid): void
  setLoop(beats: number): void
  undo(): void
  redo(): void
  resetToFactory(): void
  // persistence
  save(): Promise<boolean>
  revertToSaved(): Promise<void>
  discardSaved(): Promise<void>
  // playback
  play(): void
  stop(): void
  scrub(beat: number | null): void
  setMusic(on: boolean): void
  playheadBeat(): number
  dispose(): void
}

/** Same loop and cues (fields compared, key order ignored). */
function sameShow(a: LightShowV2 | undefined, b: LightShowV2): boolean {
  if (!a || a.loopBeats !== b.loopBeats || a.cues.length !== b.cues.length) return false
  return a.cues.every((c, i) => {
    const o = b.cues[i]
    return (
      c.id === o.id && c.beat === o.beat && c.lengthBeats === o.lengthBeats && c.target === o.target &&
      c.pattern === o.pattern && c.color === o.color && c.intensity === o.intensity && c.easing === o.easing
    )
  })
}

export interface SessionOptions {
  shipType: ShipType
  shipId: string
}

/** Open a session on the player's saved show for the ship, or a fork of the factory show. */
export async function openEditorSession(opts: SessionOptions): Promise<EditorSession> {
  await hydrateUserShows()
  return createEditorSession(opts)
}

/** Synchronous variant: uses whatever is already loaded (tests; callers that awaited hydration). */
export function createEditorSession({ shipType, shipId }: SessionOptions): EditorSession {
  const factory = lightShowRegistryV2[shipType]
  const savedShow = getUserShow(shipType)
  const initial = savedShow ? draftFromShow(savedShow) : forkShow(shipType, factory)

  const store = createStore<SessionState>(() => ({
    shipType,
    shipId,
    history: createEditorState(initial),
    transient: null,
    selection: null,
    tool: DEFAULT_TOOL,
    playing: false,
    scrubBeat: null,
    music: true,
    saved: savedShow,
    status: savedShow ? null : 'Forked from the factory show — not saved yet',
  }))
  const get = store.getState
  const set = store.setState

  /** True while this session owns lightingSystem's preview. */
  let ownsShow = false

  const base = () => get().history.draft
  const draft = () => get().transient ?? get().history.draft

  function pushToLighting() {
    if (ownsShow) lightingSystem.setPreviewShow(draft().show)
  }

  /** Start the draft playing (idempotent). False when something else owns the show. */
  function acquireShow(): boolean {
    if (ownsShow) return true
    if (isSharedPlaybackActive() || !lightingSystem.startPreview(get().shipId, shipType, draft().show)) {
      set({ status: 'A shared show is playing — leave it to edit playback' })
      return false
    }
    ownsShow = true
    return true
  }

  function releaseShow() {
    if (!ownsShow) return
    ownsShow = false
    lightingSystem.stopPreview()
    musicSystem.stopMusic(shipType)
  }

  const session: EditorSession = {
    store,
    draft,
    base,
    // By value: a reopened draft is a new object, and undo back to the saved state must read clean.
    isDirty: () => !sameShow(get().saved, base().show),
    hasFactory: () => !!factory,
    canUndo: () => canUndo(get().history),
    canRedo: () => canRedo(get().history),

    edit(fn) {
      const next = fn(base())
      const history = commit(get().history, next)
      if (history === get().history) return
      set({ history, transient: null, status: null })
      pushToLighting()
    },
    setTransient(d) {
      set({ transient: d })
      pushToLighting()
    },
    commitTransient() {
      const t = get().transient
      if (!t) return
      const history = commit(get().history, t)
      set({ history, transient: null })
      pushToLighting()
    },
    select(id) {
      set({ selection: id })
    },
    setTool(patch) {
      const tool = { ...get().tool, ...patch }
      set({ tool })
      const id = get().selection
      if (id && findCue(base(), id)) {
        const cuePatch: CuePropsPatch = {}
        if (patch.pattern !== undefined) cuePatch.pattern = patch.pattern
        if (patch.easing !== undefined) cuePatch.easing = patch.easing
        if (patch.color !== undefined) cuePatch.color = patch.color
        if (patch.intensity !== undefined) cuePatch.intensity = patch.intensity
        if (patch.lengthBeats !== undefined) cuePatch.lengthBeats = patch.lengthBeats
        if (Object.keys(cuePatch).length > 0) session.edit((d) => setCueProps(d, id, cuePatch))
      }
    },
    placeAt(beat, target) {
      const { tool } = get()
      let cueId = ''
      session.edit((d) => {
        const r = placeCue(d, {
          beat,
          target,
          lengthBeats: tool.lengthBeats,
          pattern: tool.pattern,
          easing: tool.easing,
          color: tool.color,
          intensity: tool.intensity,
        })
        cueId = r.cueId
        return r.draft
      })
      set({ selection: cueId })
      return cueId
    },
    duplicateSelectedTo(beat, target) {
      const id = get().selection
      if (!id) return null
      let cueId: string | null = null
      session.edit((d) => {
        const r = duplicateCue(d, id, beat, target)
        cueId = r.cueId
        return r.draft
      })
      if (cueId) set({ selection: cueId })
      return cueId
    },
    deleteSelected() {
      const id = get().selection
      if (!id) return
      session.edit((d) => deleteCue(d, id))
      set({ selection: null })
    },
    copyBar(from, to) {
      session.edit((d) => copyBar(d, from, to))
    },
    quantizeAll(grid) {
      session.edit((d) => quantize(d, grid))
    },
    setLoop(beats) {
      session.edit((d) => setLoopBeats(d, clampLoopBeats(beats)))
    },
    undo() {
      const history = undo(get().history)
      if (history === get().history) return
      const selection = get().selection
      set({ history, transient: null, selection: selection && findCue(history.draft, selection) ? selection : null })
      pushToLighting()
    },
    redo() {
      const history = redo(get().history)
      if (history === get().history) return
      set({ history, transient: null })
      pushToLighting()
    },
    resetToFactory() {
      session.edit(() => forkShow(shipType, factory))
      set({ selection: null, status: 'Reset to the factory show' })
    },

    async save() {
      const show = base().show
      const ok = await saveUserShow(shipType, show)
      // Even when storage failed the show is held in memory (and plays), so it counts as saved.
      const inMemory = sameShow(getUserShow(shipType), show)
      set({
        saved: inMemory ? show : get().saved,
        status: ok ? 'Saved' : inMemory ? 'Saved for this session only (storage unavailable)' : 'Could not save this show',
      })
      return ok
    },
    async revertToSaved() {
      const s = getUserShow(shipType)
      const next = s ? draftFromShow(s) : forkShow(shipType, factory)
      session.edit(() => next)
      set({ selection: null, saved: s, status: 'Reverted' })
    },
    async discardSaved() {
      await deleteUserShow(shipType)
      session.edit(() => forkShow(shipType, factory))
      set({ selection: null, saved: undefined, status: 'Back to the factory show' })
    },

    play() {
      if (!acquireShow()) return
      lightingSystem.setPreviewBeat(null)
      set({ playing: true, scrubBeat: null })
      if (get().music) void musicSystem.startMusic(shipType)
    },
    stop() {
      musicSystem.stopMusic(shipType)
      lightingSystem.setPreviewBeat(null)
      set({ playing: false, scrubBeat: null })
      releaseShow()
    },
    scrub(beat) {
      if (beat === null) {
        lightingSystem.setPreviewBeat(null)
        set({ scrubBeat: null })
        if (!get().playing) releaseShow()
        return
      }
      if (!acquireShow()) return
      const loop = base().show.loopBeats
      const b = Math.max(0, Math.min(loop - 1 / 64, beat))
      lightingSystem.setPreviewBeat(b)
      set({ scrubBeat: b })
    },
    setMusic(on) {
      set({ music: on })
      if (!get().playing) return
      if (on) void musicSystem.startMusic(shipType)
      else musicSystem.stopMusic(shipType)
    },
    playheadBeat() {
      const s = get()
      if (s.scrubBeat !== null) return s.scrubBeat
      if (!s.playing) return 0
      const bpm = SHIP_BPM[shipType] ?? 120
      const elapsedBeats = ((simNowMs() - lightingSystem.getCurrentShow().startTime) / 1000) * (bpm / 60)
      return elapsedBeats % base().show.loopBeats
    },
    dispose() {
      releaseShow()
    },
  }
  return session
}
