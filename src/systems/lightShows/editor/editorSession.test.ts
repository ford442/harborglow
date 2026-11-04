import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../../store/useGameStore'
import { lightingSystem } from '../../lightingSystem'
import { musicSystem } from '../../music'
import { beginSharedPlayback, endSharedPlayback } from '../../share/sharedPlaybackState'
import { createSimContext, setSim } from '../../sim/SimContext'
import { SHIP_BPM, lightShowRegistryV2, resolveShowForShip } from '../index'
import { deleteUserShow, getUserShow, resetUserShowsMemory } from '../userShows'
import { moveCue, stretchCue } from './editorModel'
import { createEditorSession, openEditorSession, type EditorSession } from './editorSession'

function setSimMs(ms: number) {
  setSim({ ...createSimContext(1), simTime: ms / 1000 })
}
function tickAtBeat(bpm: number, beat: number) {
  const ms = Math.ceil((60 / bpm) * beat * 1000)
  setSimMs(ms)
  lightingSystem.update(ms / 1000, bpm)
}

let session: EditorSession | null = null

function installStorage() {
  const data = new Map<string, string>()
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  }
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  installStorage()
  resetUserShowsMemory()
  setSimMs(0)
})
afterEach(async () => {
  session?.dispose()
  session = null
  lightingSystem.setShowOverride(null)
  musicSystem.stopAllMusic()
  await deleteUserShow('cruise')
  resetUserShowsMemory()
  delete (globalThis as { localStorage?: unknown }).localStorage
  vi.restoreAllMocks()
})

const open = () => (session = createEditorSession({ shipType: 'cruise', shipId: 'c1' }))

describe('opening', () => {
  it('forks the factory show when nothing is saved', () => {
    const s = open()
    expect(s.draft().show.id).toBe('cruise-user')
    expect(s.draft().show.cues).toHaveLength(lightShowRegistryV2.cruise.cues.length)
    expect(s.isDirty()).toBe(true) // an unsaved fork
    expect(s.store.getState().status).toMatch(/not saved/)
  })

  it('opens on the saved show', async () => {
    const a = open()
    a.placeAt(5, 'mast')
    await a.save()
    a.dispose()
    const b = (session = await openEditorSession({ shipType: 'cruise', shipId: 'c1' }))
    expect(b.draft().show).toEqual(getUserShow('cruise'))
    expect(b.isDirty()).toBe(false)
  })
})

describe('editing', () => {
  it('places with the toolbar cue, selects it, and applies tool changes to the selection', () => {
    const s = open()
    s.setTool({ pattern: 'snap', color: '#00ff88', intensity: 0.4, lengthBeats: 3, easing: 'easeOut' })
    const id = s.placeAt(10.5, 'mast')
    expect(s.store.getState().selection).toBe(id)
    expect(s.draft().show.cues.find((c) => c.id === id)).toMatchObject({
      beat: 10.5, lengthBeats: 3, target: 'mast', pattern: 'snap', color: '#00ff88', intensity: 0.4, easing: 'easeOut',
    })
    s.setTool({ color: '#112233' }) // selection is live: recolours the cue too
    expect(s.draft().show.cues.find((c) => c.id === id)?.color).toBe('#112233')
    s.select(null)
    s.setTool({ color: '#445566' })
    expect(s.draft().show.cues.find((c) => c.id === id)?.color).toBe('#112233')
  })

  it('a whole drag is one undo step and nothing is committed before pointer-up', () => {
    const s = open()
    const id = s.placeAt(4, 'funnel')
    const before = s.base()
    for (const beat of [5, 6, 7, 8]) s.setTransient(moveCue(before, id, beat, 'bridge'))
    expect(s.base()).toBe(before) // committed draft untouched mid-drag
    expect(s.draft().show.cues.find((c) => c.id === id)?.beat).toBe(8)
    s.commitTransient()
    expect(s.base().show.cues.find((c) => c.id === id)).toMatchObject({ beat: 8, target: 'bridge' })
    s.undo()
    expect(s.base().show.cues.find((c) => c.id === id)).toMatchObject({ beat: 4, target: 'funnel' })
    s.redo()
    expect(s.base().show.cues.find((c) => c.id === id)?.beat).toBe(8)
  })

  it('deletes the selection, duplicates it, copies bars, quantizes and resizes the loop', () => {
    const s = open()
    s.edit(() => ({ show: { ...s.base().show, cues: [] }, nextId: 0 }))
    const id = s.placeAt(1.3, 'deck')
    const dup = s.duplicateSelectedTo(9.1, 'accent')
    expect(dup).not.toBeNull()
    s.quantizeAll(4)
    expect(s.draft().show.cues.map((c) => c.beat)).toEqual([1, 9])
    s.copyBar(0, 3)
    expect(s.draft().show.cues.map((c) => c.beat)).toEqual([1, 9, 13])
    s.setLoop(16)
    expect(s.draft().show.loopBeats).toBe(16)
    expect(s.draft().show.cues.map((c) => c.beat)).toEqual([1, 9, 13])
    s.select(id)
    s.deleteSelected()
    expect(s.store.getState().selection).toBeNull()
    expect(s.draft().show.cues.map((c) => c.beat)).toEqual([9, 13])
  })

  it('tracks dirty against the saved show, including undo back to it', async () => {
    const s = open()
    await s.save()
    expect(s.isDirty()).toBe(false)
    s.placeAt(2, 'bridge')
    expect(s.isDirty()).toBe(true)
    s.undo()
    expect(s.isDirty()).toBe(false)
  })

  it('reset to factory is undoable; discard removes the saved show', async () => {
    const s = open()
    s.placeAt(2, 'bridge')
    await s.save()
    s.resetToFactory()
    expect(s.draft().show.cues).toHaveLength(lightShowRegistryV2.cruise.cues.length)
    s.undo()
    expect(s.draft().show.cues).toHaveLength(lightShowRegistryV2.cruise.cues.length + 1)
    await s.discardSaved()
    expect(getUserShow('cruise')).toBeUndefined()
    expect(resolveShowForShip('cruise')).toBe(lightShowRegistryV2.cruise)
  })

  it('revert returns to the saved show', async () => {
    const s = open()
    s.placeAt(2, 'bridge')
    await s.save()
    s.placeAt(3, 'mast')
    await s.revertToSaved()
    expect(s.draft().show.cues.some((c) => c.target === 'mast' && c.beat === 3)).toBe(false)
    expect(s.isDirty()).toBe(false)
  })
})

describe('playback', () => {
  const bpm = SHIP_BPM.cruise

  it('plays the draft through lightingSystem, follows edits live, and releases on stop', () => {
    const s = open()
    s.play()
    expect(lightingSystem.hasShowOverride()).toBe(true)
    expect(lightingSystem.isShowActive()).toBe(true)
    expect(s.store.getState().playing).toBe(true)

    const id = s.placeAt(2, 'mast')
    s.setTool({ color: '#12ab34' })
    tickAtBeat(bpm, 2.5)
    expect(lightingSystem.getRigGroupState('c1', 'mast')).toMatchObject({ active: true, color: '#12ab34' })
    expect(id).toBeTruthy()

    s.stop()
    expect(lightingSystem.hasShowOverride()).toBe(false)
    expect(lightingSystem.isShowActive()).toBe(false)
    expect(s.store.getState().playing).toBe(false)
  })

  it('starts and stops the ship music with play/stop and the music toggle', () => {
    const start = vi.spyOn(musicSystem, 'startMusic').mockResolvedValue(undefined)
    const stop = vi.spyOn(musicSystem, 'stopMusic')
    const s = open()
    s.play()
    expect(start).toHaveBeenCalledWith('cruise')
    s.setMusic(false)
    expect(stop).toHaveBeenCalledWith('cruise')
    s.setMusic(true)
    expect(start).toHaveBeenCalledTimes(2)
    s.stop()
  })

  it('scrubbing holds the preview beat and releases the show when it ends', () => {
    const s = open()
    s.scrub(25)
    expect(lightingSystem.getPreviewBeat()).toBe(25)
    expect(s.playheadBeat()).toBe(25)
    tickAtBeat(bpm, 0)
    expect(lightingSystem.getRigGroupState('c1', 'funnel')?.pattern).toBe('strobe')
    s.scrub(null)
    expect(lightingSystem.getPreviewBeat()).toBeNull()
    expect(lightingSystem.isShowActive()).toBe(false)
  })

  it('refuses to take over a share-link playback', () => {
    beginSharedPlayback('cruise', null)
    const s = open()
    s.play()
    expect(s.store.getState().playing).toBe(false)
    expect(s.store.getState().status).toMatch(/shared show/)
    expect(lightingSystem.hasShowOverride()).toBe(false)
    endSharedPlayback()
  })

  it('the playhead follows the sim clock while playing and wraps at the loop', () => {
    const s = open()
    s.play()
    setSimMs((60 / bpm) * 40 * 1000) // 40 beats in, 32-beat loop
    expect(s.playheadBeat()).toBeCloseTo(8, 3)
  })

  it('dispose releases the show', () => {
    const s = open()
    s.play()
    s.dispose()
    expect(lightingSystem.hasShowOverride()).toBe(false)
  })
})

describe('acceptance: fork → edit → save → complete upgrades → the edited show plays', () => {
  it('a saved cue-specific edit is what getRigGroupState reports for a later real show', async () => {
    const bpm = SHIP_BPM.cruise
    const s = open()
    const id = s.placeAt(10, 'mast') // the liner's factory finale leaves the mast dark here
    s.edit((d) => stretchCue(d, id, 'end', 14))
    s.setTool({ pattern: 'strobe', color: '#ff00aa' })
    expect(await s.save()).toBe(true)
    s.dispose()

    // A later session: no editor, no override; the ship's show starts the normal way.
    resetUserShowsMemory() // new page load…
    await openEditorSession({ shipType: 'cruise', shipId: 'c1' }).then((x) => x.dispose()) // …hydrate from storage
    lightingSystem.startHarborShow('c2', 'cruise')
    tickAtBeat(bpm, 11)
    expect(lightingSystem.getRigGroupState('c2', 'mast')).toMatchObject({ active: true, pattern: 'strobe', color: '#ff00aa' })
    tickAtBeat(bpm, 14.5)
    expect(lightingSystem.getRigGroupState('c2', 'mast')?.color).not.toBe('#ff00aa')
    lightingSystem.endHarborShow()
  })
})

describe('isolation from the game store', () => {
  it('a 30 s editing session (1800 ticks of drags, plays, scrubs, undo) notifies useGameStore 0 times', () => {
    const s = open()
    let notifications = 0
    const unsub = useGameStore.subscribe(() => {
      notifications += 1
    })
    // Positive control: the subscriber really fires on a store write.
    useGameStore.setState({ isMoving: !useGameStore.getState().isMoving })
    expect(notifications).toBe(1)
    notifications = 0

    s.play()
    let id = s.placeAt(0, 'deck')
    for (let tick = 0; tick < 1800; tick++) {
      const base = s.base()
      const t = tick / 60
      switch (tick % 12) {
        case 0: id = s.placeAt((t * 3) % 31, 'funnel'); break
        case 1: s.setTransient(moveCue(base, id, (t * 5) % 30, 'bridge')); break
        case 2: s.setTransient(moveCue(base, id, (t * 5 + 1) % 30, 'mast')); break
        case 3: s.commitTransient(); break
        case 4: s.scrub((t * 7) % 32); break
        case 5: s.setTool({ intensity: (tick % 10) / 10 }); break
        case 6: s.undo(); break
        case 7: s.redo(); break
        case 8: s.scrub(null); break
        case 9: s.select(id); break
        default: break
      }
      setSimMs((tick / 60) * 1000)
      lightingSystem.update(tick / 60, SHIP_BPM.cruise)
    }
    s.stop()
    unsub()
    expect(notifications).toBe(0)
  })
})
