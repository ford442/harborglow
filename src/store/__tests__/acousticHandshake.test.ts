import { describe, it, expect, beforeEach, vi } from 'vitest'

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
import { ACOUSTIC_NOTE_LAYOUT } from '../../systems/commsSystem'

describe('acoustic handshake protocol', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('generates a hidden target sequence when tugboat objectives are assigned', () => {
    useGameStore.getState().setTugboatObjectives([
      {
        id: 'freighter-alpha',
        label: 'Berth Alpha',
        berthCenter: [0, 0, 0],
        berthRadius: 8,
        completed: false,
        shipType: 'container',
      },
    ])

    const state = useGameStore.getState()
    expect(state.handshakeTargetSequence).toHaveLength(4)
    expect(state.handshakeInputSequence).toEqual([])
    expect(state.handshakeComplete).toBe(false)
    expect(state.towingUnlocked).toBe(false)
    state.handshakeTargetSequence.forEach((note) => {
      expect(ACOUSTIC_NOTE_LAYOUT).toContain(note)
    })
  })

  it('unlocks towing when the correct sequence is entered', () => {
    useGameStore.getState().setTugboatObjectives([
      {
        id: 'freighter-beta',
        label: 'Berth Beta',
        berthCenter: [10, 0, -5],
        berthRadius: 8,
        completed: false,
        shipType: 'tanker',
      },
    ])

    const target = useGameStore.getState().handshakeTargetSequence
    target.forEach((note) => useGameStore.getState().submitAcousticNote(note))

    const state = useGameStore.getState()
    expect(state.handshakeComplete).toBe(true)
    expect(state.towingUnlocked).toBe(true)
    expect(state.handshakeInputSequence).toEqual(target)
  })
})
