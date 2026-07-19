import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

const { saveGameState, loadGameState } = vi.hoisted(() => ({
  saveGameState: vi.fn(),
  loadGameState: vi.fn(),
}))

vi.mock('../../utils/storage_manager', () => ({
  saveGameState,
  loadGameState,
  clearSave: vi.fn(),
}))

vi.mock('../../systems/commsSystem', () => ({
  ACOUSTIC_NOTE_LAYOUT: [
    'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1',
    'G1', 'G#1', 'A1', 'A#1', 'B1', 'C2',
  ],
}))

import { useGameStore } from '../useGameStore'
import type { Ship } from '../gameStoreTypes'

function buildSavedPayload() {
  return {
    ships: [
      {
        id: 'saved-ship-1',
        type: 'ferry' as const,
        modelName: 'ferry_vessel',
        position: [0, 0, -20] as [number, number, number],
        length: 80,
        attachmentPoints: [],
        name: 'Saved Ferry',
        isDocked: true,
      },
    ],
    craneUpgrades: [
      { shipId: 'saved-ship-1', partName: 'nav-lights', installed: true, installedAt: 1 },
    ],
    musicEnabled: true,
    bpm: 140,
    lyricsSize: 24,
    lightIntensity: 2,
    timeOfDay: 14,
    cameraMode: 'orbit' as const,
    shipVersions: {},
    shipSailTimes: {},
    shipDockedStatus: { 'saved-ship-1': true },
    weather: 'clear' as const,
    weatherIntensity: 0.4,
    operationMode: 'crane' as const,
    money: 500,
    season: 'summer' as const,
    wildlifeDensity: 0.5,
    enableMarineLife: true,
  }
}

function makeShip(id: string): Ship {
  return {
    id,
    type: 'container',
    modelName: 'container_vessel',
    position: [5, 0, -15],
    length: 120,
    attachmentPoints: [{ position: [0, 2, 0], rotation: [0, 0, 0], partName: 'bow-rig' }],
    name: 'Test Container',
    isDocked: true,
  }
}

describe('core store actions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    saveGameState.mockClear()
    loadGameState.mockReset()
    loadGameState.mockReturnValue(null)
    useGameStore.getState().resetGame()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('addShip appends a vessel and selects it when the fleet is empty', () => {
    const ship = makeShip('ship-alpha')
    useGameStore.getState().addShip(ship)

    const state = useGameStore.getState()
    expect(state.ships).toHaveLength(1)
    expect(state.ships[0]?.id).toBe('ship-alpha')
    expect(state.currentShipId).toBe('ship-alpha')
  })

  it('installUpgrade records a rig install for the target ship', () => {
    const ship = makeShip('ship-bravo')
    useGameStore.getState().addShip(ship)
    useGameStore.getState().installUpgrade('ship-bravo', 'bow-rig')

    const upgrades = useGameStore.getState().installedUpgrades
    expect(upgrades).toHaveLength(1)
    expect(upgrades[0]).toMatchObject({
      shipId: 'ship-bravo',
      partName: 'bow-rig',
      installed: true,
    })
    expect(useGameStore.getState().craneUpgrades).toEqual(upgrades)
  })

  it('loadSavedState hydrates ships and upgrades from storage_manager', () => {
    loadGameState.mockReturnValue(buildSavedPayload())

    useGameStore.getState().loadSavedState()

    const state = useGameStore.getState()
    expect(state.ships).toHaveLength(1)
    expect(state.ships[0]?.name).toBe('Saved Ferry')
    expect(state.installedUpgrades).toHaveLength(1)
    expect(state.installedUpgrades[0]?.partName).toBe('nav-lights')
    expect(state.money).toBe(500)
    expect(state.bpm).toBe(140)
  })

  it('scheduleSave debounces persistence after mutating actions', () => {
    useGameStore.getState().addShip(makeShip('ship-charlie'))

    expect(saveGameState).not.toHaveBeenCalled()

    vi.advanceTimersByTime(499)
    expect(saveGameState).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(saveGameState).toHaveBeenCalledTimes(1)
    expect(saveGameState.mock.calls[0]?.[0]?.ships?.[0]?.id).toBe('ship-charlie')
  })
})
