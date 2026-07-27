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
    store.addMoney(250)

    // Three actions, one write: the subscription is the single save path.
    expect(saveGameState).not.toHaveBeenCalled()
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS)
    expect(saveGameState).toHaveBeenCalledTimes(1)
  })

  it('round-trips season, wildlifeDensity and money through the save payload', () => {
    const store = useGameStore.getState()
    const startingMoney = useGameStore.getState().money

    store.setSeason('fall')
    store.setWildlifeDensity(0.25)
    store.setEnableMarineLife(false)
    store.addMoney(500)

    const saved = flushSave()
    expect(saved).toMatchObject({
      season: 'fall',
      wildlifeDensity: 0.25,
      enableMarineLife: false,
      money: startingMoney + 500,
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
      money: 4242,
      season: 'winter',
      wildlifeDensity: 0.15,
      enableMarineLife: false,
    })

    useGameStore.getState().loadSavedState()

    const state = useGameStore.getState()
    expect(state.ships.map((s) => s.id)).toEqual(['restored-ship'])
    expect(state.installedUpgrades).toHaveLength(1)
    expect(state.money).toBe(4242)
    expect(state.season).toBe('winter')
    expect(state.wildlifeDensity).toBe(0.15)
    expect(state.enableMarineLife).toBe(false)
  })

  it('excludes ephemeral frame state from the serialized payload', () => {
    const store = useGameStore.getState()
    store.setSpreaderPos({ x: 1, y: 2, z: 3 })
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
