import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

const { saveGameState, loadGameState, clearSave } = vi.hoisted(() => ({
  saveGameState: vi.fn(),
  loadGameState: vi.fn(),
  clearSave: vi.fn(),
}))

vi.mock('../../utils/storage_manager', () => ({
  saveGameState,
  loadGameState,
  clearSave,
}))

vi.mock('../../systems/commsSystem', () => ({
  ACOUSTIC_NOTE_LAYOUT: [
    'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1',
    'G1', 'G#1', 'A1', 'A#1', 'B1', 'C2',
  ],
}))

import { useGameStore } from '../useGameStore'
import { getSerializableState } from '../gameStoreTypes'
import type { Ship } from '../gameStoreTypes'
import { forkFactoryShow } from '../../systems/lightShows/cueEdit'
import { USER_SHOWS_KEY, getPendingLegacyShows, getUserShow, resetUserShowsMemory, saveUserShow } from '../../systems/lightShows/userShows'

/** The debounce inside scheduleSave; tests drive it with fake timers. */
const SAVE_DEBOUNCE_MS = 500

function makeShip(id: string): Ship {
  return {
    id,
    type: 'cruise',
    modelName: 'cruise_liner',
    position: [0, 0, 0],
    length: 20,
    attachmentPoints: [],
    name: `Test ${id}`,
    isDocked: true,
  }
}

/** Latest state handed to the storage layer, after flushing the debounce. */
function flushSave() {
  vi.advanceTimersByTime(SAVE_DEBOUNCE_MS)
  const calls = saveGameState.mock.calls
  return calls.length > 0 ? calls[calls.length - 1][0] : null
}

describe('store persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    saveGameState.mockClear()
    loadGameState.mockReset()
    useGameStore.getState().resetGame()
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS)
    saveGameState.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes through exactly one debounced save per burst of actions', () => {
    const store = useGameStore.getState()
    store.setSeason('winter')
    store.setWildlifeDensity(0.9)
    store.addHarborCredits(250, 'test')

    // Three actions, one write: the subscription is the single save path.
    expect(saveGameState).not.toHaveBeenCalled()
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS)
    expect(saveGameState).toHaveBeenCalledTimes(1)
  })

  it('round-trips season, wildlifeDensity and credits through the save payload', () => {
    const store = useGameStore.getState()
    const startingCredits = useGameStore.getState().harborCredits

    store.setSeason('fall')
    store.setWildlifeDensity(0.25)
    store.setEnableMarineLife(false)
    store.addHarborCredits(500, 'test')

    const saved = flushSave()
    expect(saved).toMatchObject({
      season: 'fall',
      wildlifeDensity: 0.25,
      enableMarineLife: false,
      harborCredits: startingCredits + 500,
    })
  })

  it('persists a full upgrade install path', () => {
    const store = useGameStore.getState()
    store.addShip(makeShip('persist-ship'))
    store.installUpgrade('persist-ship', 'funnel1')
    store.installUpgrade('persist-ship', 'funnel2')

    const saved = flushSave()
    expect(saved.ships.map((s: Ship) => s.id)).toContain('persist-ship')
    expect(saved.craneUpgrades).toHaveLength(2)
    expect(saved.craneUpgrades.map((u: { partName: string }) => u.partName)).toEqual([
      'funnel1',
      'funnel2',
    ])
  })

  it('restores a saved payload through loadSavedState', () => {
    loadGameState.mockReturnValue({
      ships: [makeShip('restored-ship')],
      craneUpgrades: [
        { shipId: 'restored-ship', partName: 'funnel1', installed: true, installedAt: 1 },
      ],
      harborCredits: 4242,
      season: 'winter',
      wildlifeDensity: 0.15,
      enableMarineLife: false,
    })

    useGameStore.getState().loadSavedState()

    const state = useGameStore.getState()
    expect(state.ships.map((s) => s.id)).toEqual(['restored-ship'])
    expect(state.installedUpgrades).toHaveLength(1)
    expect(state.harborCredits).toBe(4242)
    expect(state.season).toBe('winter')
    expect(state.wildlifeDensity).toBe(0.15)
    expect(state.enableMarineLife).toBe(false)
  })

  it('round-trips an icebreaker ship and remaps legacy icebreaker-yamal ids', () => {
    const icebreaker: Ship = {
      ...makeShip('yamal-1'),
      type: 'icebreaker',
      modelName: 'icebreaker',
      name: 'Yamal',
      length: 24,
    }
    loadGameState.mockReturnValue({
      ships: [icebreaker],
      craneUpgrades: [],
    })
    useGameStore.getState().loadSavedState()
    expect(useGameStore.getState().ships[0].type).toBe('icebreaker')

    loadGameState.mockReturnValue({
      ships: [{ ...icebreaker, id: 'legacy-yamal', type: 'icebreaker-yamal' as Ship['type'] }],
      craneUpgrades: [],
    })
    useGameStore.getState().loadSavedState()
    expect(useGameStore.getState().ships[0].type).toBe('icebreaker')
  })

  it('loads an unknown saved ship type as cruise without throwing', () => {
    loadGameState.mockReturnValue({
      ships: [{ ...makeShip('mystery'), type: 'not-a-ship' as Ship['type'] }],
      craneUpgrades: [],
    })
    expect(() => useGameStore.getState().loadSavedState()).not.toThrow()
    expect(useGameStore.getState().ships[0].type).toBe('cruise')
  })

  it('excludes ephemeral frame state from the serialized payload', () => {
    const store = useGameStore.getState()
    store.setTwistlockEngaged(true)
    store.setIsMoving(true)

    const serialized = getSerializableState(useGameStore.getState())

    // Crane kinematics are recomputed every frame — persisting them would
    // restore a half-finished pick on load.
    expect(serialized).not.toHaveProperty('spreaderPos')
    expect(serialized).not.toHaveProperty('twistlockEngaged')
    expect(serialized).not.toHaveProperty('installAttemptStartedAt')
    expect(serialized).not.toHaveProperty('isMoving')
  })
})

describe('install metrics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useGameStore.getState().resetGame()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stamps an attempt start when the twistlock engages and clears it on release', () => {
    const store = useGameStore.getState()
    expect(useGameStore.getState().installAttemptStartedAt).toBeNull()

    store.setTwistlockEngaged(true)
    expect(useGameStore.getState().installAttemptStartedAt).toBeTypeOf('number')

    store.setTwistlockEngaged(false)
    expect(useGameStore.getState().installAttemptStartedAt).toBeNull()
  })

  it('installs with or without measured metrics', () => {
    const store = useGameStore.getState()
    store.addShip(makeShip('metrics-ship'))

    expect(() => store.installUpgrade('metrics-ship', 'a')).not.toThrow()
    expect(() =>
      store.installUpgrade('metrics-ship', 'b', { timeSeconds: 12, swayPercent: 0.05, damage: 0 }),
    ).not.toThrow()

    expect(useGameStore.getState().installedUpgrades).toHaveLength(2)
  })
  describe('light shows (one store: userShows.ts)', () => {
    let data: Map<string, string>

    beforeEach(() => {
      resetUserShowsMemory()
      data = new Map()
      ;(globalThis as { localStorage?: unknown }).localStorage = {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => void data.set(k, v),
        removeItem: (k: string) => void data.delete(k),
      }
      vi.spyOn(console, 'warn').mockImplementation(() => {})
    })
    afterEach(() => {
      loadGameState.mockReset() // the next test's resetGame() would otherwise "rescue" this save's shows
      resetUserShowsMemory()
      delete (globalThis as { localStorage?: unknown }).localStorage
      vi.restoreAllMocks()
    })

    /** What a desk-era save held: the fork under `authoredShows`, with the ship type as its id. */
    const legacySave = () => ({
      ships: [],
      craneUpgrades: [],
      authoredShows: { cruise: forkFactoryShow('cruise')!, tanker: forkFactoryShow('tanker')! },
    })

    it('keeps light shows out of the save', async () => {
      await saveUserShow('cruise', forkFactoryShow('cruise')!)
      const payload = flushSave() as Record<string, unknown> | null
      expect(payload?.authoredShows).toBeUndefined()
      expect('authoredShows' in useGameStore.getState()).toBe(false)
      expect('saveAuthoredShow' in useGameStore.getState()).toBe(false)
      expect(getUserShow('cruise')?.id).toBe('cruise-user')
    })

    it('migrates desk shows from a legacy save on load, and the save stops carrying them', async () => {
      const legacy = legacySave()
      loadGameState.mockReturnValue(legacy)
      useGameStore.getState().loadSavedState()

      // Until the import is persisted, an autosave still carries them (nothing can be lost in the gap).
      expect((getSerializableState(useGameStore.getState()) as { authoredShows?: unknown }).authoredShows).toBe(legacy.authoredShows)

      await vi.waitFor(() => expect(getPendingLegacyShows()).toBeUndefined()) // import persisted
      expect(getUserShow('cruise')).toMatchObject({ id: 'cruise-user', loopBeats: legacy.authoredShows.cruise.loopBeats })
      expect(getUserShow('cruise')?.cues.map((c) => c.id)).toEqual(legacy.authoredShows.cruise.cues.map((c) => c.id))
      expect(getUserShow('tanker')?.id).toBe('tanker-user')
      expect(Object.keys(JSON.parse(data.get(USER_SHOWS_KEY)!)).sort()).toEqual(['cruise', 'tanker'])

      useGameStore.getState().addHarborCredits(1, 'test') // any change schedules a save
      const payload = flushSave() as Record<string, unknown> | null
      expect(payload).not.toBeNull()
      expect(payload?.authoredShows).toBeUndefined()
    })

    it('keeps the legacy copy in the save while the new key cannot be written', async () => {
      ;(globalThis as { localStorage?: unknown }).localStorage = {
        getItem: () => null,
        setItem: () => {
          throw new DOMException('full', 'QuotaExceededError')
        },
        removeItem: () => {},
      }
      const legacy = legacySave()
      loadGameState.mockReturnValue(legacy)
      useGameStore.getState().loadSavedState()
      await vi.waitFor(() => expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('could not write'), expect.anything()))
      expect(getUserShow('cruise')).toBeDefined() // still plays, from memory
      expect((getSerializableState(useGameStore.getState()) as { authoredShows?: unknown }).authoredShows).toBe(legacy.authoredShows)
    })

    it('New Game rescues desk shows from the save it is about to clear', async () => {
      loadGameState.mockReturnValue(legacySave())
      useGameStore.getState().resetGame()
      expect(clearSave).toHaveBeenCalled()
      await vi.waitFor(() => expect(getPendingLegacyShows()).toBeUndefined())
      expect(getUserShow('tanker')?.id).toBe('tanker-user')
      expect(data.has(USER_SHOWS_KEY)).toBe(true)
    })

    it('a show the player saved in the cue editor wins over the same ship’s legacy desk show', async () => {
      const mine = { ...forkFactoryShow('cruise')!, loopBeats: 16, cues: [] as never[] }
      await saveUserShow('cruise', mine)
      loadGameState.mockReturnValue(legacySave())
      useGameStore.getState().loadSavedState()
      await vi.waitFor(() => expect(getPendingLegacyShows()).toBeUndefined())
      expect(getUserShow('tanker')).toBeDefined()
      expect(getUserShow('cruise')?.loopBeats).toBe(16)
    })

    it('is a no-op for saves without desk shows and for reloads of an already migrated save', async () => {
      loadGameState.mockReturnValue({ ships: [], craneUpgrades: [] })
      useGameStore.getState().loadSavedState()
      expect(getUserShow('cruise')).toBeUndefined()
      expect(data.has(USER_SHOWS_KEY)).toBe(false)

      loadGameState.mockReturnValue(legacySave())
      useGameStore.getState().loadSavedState()
      await vi.waitFor(() => expect(getPendingLegacyShows()).toBeUndefined())
      const stored = data.get(USER_SHOWS_KEY)
      useGameStore.getState().loadSavedState() // same legacy blob again
      await vi.advanceTimersByTimeAsync(10)
      expect(data.get(USER_SHOWS_KEY)).toBe(stored)
    })
  })
})

describe('ops slice smoke', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('starts a crane training module and switches mode', () => {
    useGameStore.getState().startTrainingModule('basic-hooks')

    const state = useGameStore.getState()
    expect(state.gameMode).toBe('training')
    expect(state.currentTrainingModule).toBe('basic-hooks')
    expect(state.operationMode).toBe('crane')
  })

  it('exits a training module back to sandbox', () => {
    const store = useGameStore.getState()
    store.startTrainingModule('basic-hooks')
    store.exitTrainingModule()

    const state = useGameStore.getState()
    expect(state.gameMode).toBe('sandbox')
    expect(state.currentTrainingModule).toBeNull()
  })

  it('moves between crane and tugboat operation modes', () => {
    const store = useGameStore.getState()
    store.setOperationMode('tugboat')
    expect(useGameStore.getState().operationMode).toBe('tugboat')

    store.setOperationMode('crane')
    expect(useGameStore.getState().operationMode).toBe('crane')
  })
})
