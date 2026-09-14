import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../utils/storage_manager', () => ({
  saveGameState: vi.fn(),
  loadGameState: vi.fn(() => null),
  clearSave: vi.fn(),
}))

vi.mock('../../commsSystem', () => ({
  ACOUSTIC_NOTE_LAYOUT: [
    'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1',
    'G1', 'G#1', 'A1', 'A#1', 'B1', 'C2',
  ],
}))

import { iceFieldSystem } from '../IceFieldSystem'
import { startIceEscort, ICE_ESCORT_DEFAULT_SEED } from '../iceEscortMission'
import { useGameStore } from '../../../store/useGameStore'
import { SIM_DT } from '../../sim/SimContext'

describe('IceFieldSystem', () => {
  beforeEach(() => {
    iceFieldSystem.reset()
    useGameStore.getState().resetGame()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('same seed produces the same layout', () => {
    iceFieldSystem.start({ seed: 204 })
    const a = iceFieldSystem.snapshot().health
    iceFieldSystem.reset()
    iceFieldSystem.start({ seed: 204 })
    const b = iceFieldSystem.snapshot().health
    expect(a).toEqual(b)
  })

  it('different seeds diverge', () => {
    iceFieldSystem.start({ seed: 1 })
    const a = iceFieldSystem.snapshot().health.join(',')
    iceFieldSystem.reset()
    iceFieldSystem.start({ seed: 2 })
    const b = iceFieldSystem.snapshot().health.join(',')
    expect(a).not.toBe(b)
  })

  it('completes when the corridor is cleared and the client transits', () => {
    startIceEscort({ seed: ICE_ESCORT_DEFAULT_SEED })
    expect(useGameStore.getState().activeMission?.type).toBe('ice-escort')
    for (const cell of iceFieldSystem.getCells()) {
      if (cell.corridor) cell.health = 0
    }
    expect(iceFieldSystem.channelClearance()).toBeGreaterThan(0.9)
    for (let i = 0; i < 2400; i++) {
      iceFieldSystem.update(SIM_DT)
      if (iceFieldSystem.isDocked()) break
    }
    expect(iceFieldSystem.isDocked()).toBe(true)
    const state = useGameStore.getState()
    expect(state.activeMission?.status).toBe('completed')
    expect(state.boothTier).toBe(3)
    expect(state.tugboatCareerStats.iceEscorts).toBe(1)
  })

  it('fails on timeout without a channel', () => {
    startIceEscort({ seed: 7 })
    useGameStore.getState().updateMission({ timeRemaining: 0.05 })
    iceFieldSystem.update(0.1)
    expect(useGameStore.getState().activeMission?.status).toBe('failed')
  })
})
