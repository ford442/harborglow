import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const { saveGameState } = vi.hoisted(() => ({ saveGameState: vi.fn() }))

vi.mock('../../../utils/storage_manager', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../utils/storage_manager')>()),
  saveGameState,
}))

import { useGameStore } from '../../../store/useGameStore'
import { scheduleSave } from '../../../store/gameStoreTypes'
import { lightingSystem } from '../../lightingSystem'
import { createSimContext, setSim } from '../../sim/SimContext'
import {
  beginSharedPlayback,
  endSharedPlayback,
  finishVerification,
  useSharedPlayback,
} from '../sharedPlaybackState'

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  endSharedPlayback()
  lightingSystem.setShowOverride(null)
  vi.useRealTimers()
  saveGameState.mockClear()
})

describe('shared playback never writes the viewer save', () => {
  it('scheduleSave is a no-op while playback is active', () => {
    vi.useFakeTimers()
    beginSharedPlayback('cruise', null)
    scheduleSave(useGameStore.getState())
    vi.advanceTimersByTime(2000)
    expect(saveGameState).not.toHaveBeenCalled()
  })

  it('a save already pending when playback begins is dropped', () => {
    vi.useFakeTimers()
    saveGameState.mockClear()
    scheduleSave(useGameStore.getState())
    beginSharedPlayback('cruise', null)
    vi.advanceTimersByTime(2000)
    expect(saveGameState).not.toHaveBeenCalled()
  })

  it('saves resume once playback ends', () => {
    vi.useFakeTimers()
    beginSharedPlayback('cruise', null)
    endSharedPlayback()
    scheduleSave(useGameStore.getState())
    vi.advanceTimersByTime(2000)
    expect(saveGameState).toHaveBeenCalledTimes(1)
  })
})

describe('hash verification state', () => {
  it('pending -> match / mismatch, releasing the tick hold', () => {
    beginSharedPlayback('cruise', { hash: 'deadbeef', ticks: 120 })
    expect(useSharedPlayback.getState()).toMatchObject({ verification: 'pending', verifyAtTick: 120 })
    finishVerification('deadbeef')
    expect(useSharedPlayback.getState()).toMatchObject({ verification: 'match', verifyAtTick: null })

    beginSharedPlayback('cruise', { hash: 'deadbeef', ticks: 120 })
    finishVerification('00000000')
    expect(useSharedPlayback.getState().verification).toBe('mismatch')
  })

  it('has nothing to verify without a performance', () => {
    beginSharedPlayback('cruise', null)
    expect(useSharedPlayback.getState()).toMatchObject({ verification: 'none', verifyAtTick: null })
  })
})

describe('lighting show override', () => {
  it('plays imported cues instead of the preset, and keeps looping past 30 s', () => {
    setSim({ ...createSimContext(1), simTime: 0 })
    lightingSystem.setShowOverride({
      v: 2,
      id: 'cruise',
      loopBeats: 8,
      cues: [
        { id: 'x:0', beat: 0, lengthBeats: 4, target: 'all', pattern: 'snap', color: '#123456', intensity: 0.5, easing: 'step' },
        { id: 'x:1', beat: 4, lengthBeats: 4, target: 'all', pattern: 'strobe', color: '#abcdef', intensity: 1, easing: 'step' },
      ],
    })
    vi.useFakeTimers()
    lightingSystem.startHarborShow('ship-1', 'cruise')
    lightingSystem.update(0, 120)
    expect(lightingSystem.getActiveCue()?.color).toBe('#123456')

    // 120 bpm => 2 beats/s; 2.5 s => beat 5 (second cue).
    setSim({ ...createSimContext(1), simTime: 2.5 })
    lightingSystem.update(2.5, 120)
    expect(lightingSystem.getActiveCue()?.color).toBe('#abcdef')

    // The preset's 30 s wall-clock end must not fire for an override.
    vi.advanceTimersByTime(60_000)
    expect(lightingSystem.isShowActive()).toBe(true)

    lightingSystem.setShowOverride(null)
    expect(lightingSystem.isShowActive()).toBe(false)
  })
})
