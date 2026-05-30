import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../utils/storage_manager', () => ({
  saveGameState: vi.fn(),
  loadGameState: vi.fn(() => null),
  clearSave: vi.fn(),
}))

vi.mock('../../systems/commsSystem', () => ({
  ACOUSTIC_NOTE_LAYOUT: [
    'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1',
    'G1', 'G#1', 'A1', 'A#1', 'B1', 'C2',
  ],
}))

import { useGameStore } from '../useGameStore'
import { reputationSystem } from '../../systems/reputationSystem'

describe('salvage dispatch contracts', () => {
  beforeEach(() => {
    reputationSystem.reset()
    useGameStore.getState().resetGame()
    useGameStore.getState().setOperationMode('tugboat')
  })

  it('accepts a salvage contract and creates an active salvage mission', () => {
    const store = useGameStore.getState()
    const contract = store.salvageContracts[0]
    expect(contract).toBeDefined()

    store.acceptSalvageContract(contract.id)

    const state = useGameStore.getState()
    expect(state.activeMission?.type).toBe('salvage')
    expect(state.activeMission?.targetShipType).toBe(contract.vesselType)
    expect(state.handshakeComplete).toBe(false)
    expect(state.tugboatObjectives).toHaveLength(1)
    expect(state.money).toBe(0)
  })

  it('unlocks heavy tow winch after repeated successful salvages', () => {
    const state = useGameStore.getState()
    const [first, second] = state.salvageContracts
    state.acceptSalvageContract(first.id)
    useGameStore.getState().completeMission()

    useGameStore.getState().acceptSalvageContract(second.id)
    useGameStore.getState().completeMission()

    const updated = useGameStore.getState()
    expect(updated.salvageSuccessfulTows).toBeGreaterThanOrEqual(2)
    expect(updated.tugboatUpgrades.heavy_tow_winch).toBe(true)
    expect(updated.money).toBeGreaterThan(0)
    expect(reputationSystem.getState().totalReputation).toBeGreaterThan(0)
  })

  it('applies salvage penalties when tow line snaps', () => {
    const state = useGameStore.getState()
    const contract = state.salvageContracts[0]
    state.acceptSalvageContract(contract.id)
    useGameStore.getState().attachTowLine(useGameStore.getState().activeMission!.targetShipId)

    const before = useGameStore.getState()
    useGameStore.getState().signalTowLineSnap()
    const after = useGameStore.getState()

    expect(before.activeMission?.status).toBe('active')
    expect(after.activeMission?.status).toBe('failed')
    expect(after.reputation).toBeLessThanOrEqual(before.reputation)
  })

  it('awards objective dock rewards and records tug career stats', () => {
    const store = useGameStore.getState()
    store.setTugboatObjectives([
      {
        id: 'obj-1',
        label: 'Berth One',
        berthCenter: [0, 0, 0],
        berthRadius: 5,
        completed: false,
        shipType: 'container',
      },
    ])
    const before = useGameStore.getState()
    useGameStore.getState().completeTugboatObjective('obj-1')
    const after = useGameStore.getState()

    expect(after.tugboatDockedCount).toBe(1)
    expect(after.money).toBeGreaterThan(before.money)
    expect(after.reputation).toBeGreaterThan(before.reputation)
    expect(after.tugboatCareerStats.totalTonsAssisted).toBeGreaterThan(0)
  })

  it('allows purchasing new tugboat upgrades when requirements are met', () => {
    const store = useGameStore.getState()
    store.addMoney(2000)
    store.addReputation(1200)

    const boughtSearchlight = useGameStore.getState().purchaseTugboatUpgrade('searchlight_rig')
    const boughtDynamic = useGameStore.getState().purchaseTugboatUpgrade('dynamic_positioning_assist')
    const updated = useGameStore.getState()

    expect(boughtSearchlight).toBe(true)
    expect(boughtDynamic).toBe(true)
    expect(updated.tugboatUpgrades.searchlight_rig).toBe(true)
    expect(updated.tugboatUpgrades.dynamic_positioning_assist).toBe(true)
  })
})
