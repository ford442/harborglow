import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

const { saveGameState } = vi.hoisted(() => ({
  saveGameState: vi.fn(),
  loadGameState: vi.fn(),
  clearSave: vi.fn(),
}))

vi.mock('../../utils/storage_manager', () => ({
  saveGameState,
  loadGameState: vi.fn(),
  clearSave: vi.fn(),
}))

vi.mock('../../systems/commsSystem', () => ({
  ACOUSTIC_NOTE_LAYOUT: ['C1', 'D1', 'E1'],
}))

vi.mock('../../systems/economySystem', () => ({
  economySystem: {
    serialize: () => '{}',
    deserialize: vi.fn(),
  },
}))

import { useGameStore } from '../useGameStore'
import { getNetworkSyncState } from '../gameStoreTypes'

const SAVE_DEBOUNCE_MS = 500

describe('multiplayer store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    saveGameState.mockClear()
    useGameStore.getState().resetGame()
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS)
    saveGameState.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('getNetworkSyncState includes crane kinematics and musicPlaying record', () => {
    useGameStore.getState().setSpreaderPos({ x: 5, y: 6, z: 7 })
    useGameStore.getState().setMusicPlaying('ship-1', true)
    const sync = getNetworkSyncState(useGameStore.getState())
    expect(sync.spreaderPos).toEqual({ x: 5, y: 6, z: 7 })
    expect(sync.musicPlaying).toEqual({ 'ship-1': true })
  })

  it('applyNetworkPatch rehydrates musicPlaying Map', () => {
    useGameStore.getState().setMultiplayerRole('spectator')
    useGameStore.getState().applyNetworkPatch({
      musicPlaying: { 'ship-a': true, 'ship-b': false },
    })
    expect(useGameStore.getState().musicPlaying.get('ship-a')).toBe(true)
    expect(useGameStore.getState().musicPlaying.get('ship-b')).toBe(false)
  })

  it('spectator role does not trigger persistence saves', () => {
    useGameStore.getState().setMultiplayerRole('spectator')
    useGameStore.getState().applyNetworkPatch({ bpm: 150 })
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS)
    expect(saveGameState).not.toHaveBeenCalled()
  })

  it('host role still persists after state changes', () => {
    useGameStore.getState().setMultiplayerRole('host')
    useGameStore.getState().setBPM(160)
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS)
    expect(saveGameState).toHaveBeenCalled()
  })
})
