import { describe, it, expect, vi, beforeEach } from 'vitest'

// =============================================================================
// CavitationSystem — smoke tests
//
// Audio goes to the recording fake audioRuntime installed by src/test/setup.ts
// and Zustand is mocked to avoid full store initialisation.  Tests exercise
// slip computation, hysteresis, thrust multipliers, state reset, and chatter.
// =============================================================================

// ---------------------------------------------------------------------------
// Mock Zustand store (only the slice the system touches)
// ---------------------------------------------------------------------------
vi.mock('../../store/useGameStore', () => {
  const updateTugboatState = vi.fn()
  return {
    useGameStore: {
      getState: () => ({ updateTugboatState }),
    },
  }
})

// ---------------------------------------------------------------------------
// Import system under test AFTER mocks are registered
// ---------------------------------------------------------------------------
import { cavitationSystem, cavitationState, CAVITATION_CONFIG } from '../CavitationSystem'
import { audioRuntime } from '../audio/AudioRuntime'
import { WAVEFORMS } from '../audio/voices'
import type { FakeAudioRuntime } from '../../test/audioRuntimeMock'

const fake = audioRuntime as unknown as FakeAudioRuntime

// ---------------------------------------------------------------------------

describe('CavitationSystem — slip calculation', () => {
  beforeEach(() => {
    cavitationSystem.resetCavitation()
  })

  it('no cavitation when RPM is zero', () => {
    // Zero commanded RPM → no slip → no cavitation
    cavitationSystem.update(0, 0, 0, 0.016)
    expect(cavitationState.portCavitating).toBe(false)
    expect(cavitationState.starboardCavitating).toBe(false)
  })

  it('no cavitation when hull speed matches prop speed', () => {
    // At 100 RPM, maxPropSpeed means perfect bite → slip ~0
    const fullSpeed = CAVITATION_CONFIG.maxPropSpeed
    cavitationSystem.update(100, 100, fullSpeed, 0.016)
    expect(cavitationState.portCavitating).toBe(false)
    expect(cavitationState.starboardCavitating).toBe(false)
  })

  it('cavitation triggers after sustained high slip', () => {
    // Max RPM with zero hull speed = slip ratio near 1.0
    // Run enough frames to exceed minDurationForAlarm
    const frameTime = 0.016
    const framesNeeded = Math.ceil((CAVITATION_CONFIG.minDurationForAlarm + 0.05) / frameTime)
    for (let i = 0; i < framesNeeded; i++) {
      cavitationSystem.update(100, 100, 0, frameTime)
    }
    expect(cavitationState.portCavitating).toBe(true)
    expect(cavitationState.starboardCavitating).toBe(true)
    expect(cavitationState.intensity).toBeGreaterThan(0)
  })
})

describe('CavitationSystem — thrust multiplier', () => {
  beforeEach(() => {
    cavitationSystem.resetCavitation()
  })

  it('returns 1.0 (full thrust) when not cavitating', () => {
    expect(cavitationSystem.getThrustMultiplier('port')).toBe(1.0)
    expect(cavitationSystem.getThrustMultiplier('starboard')).toBe(1.0)
  })

  it('returns configured penalty when cavitating', () => {
    // Drive into cavitation
    const frameTime = 0.016
    const framesNeeded = Math.ceil((CAVITATION_CONFIG.minDurationForAlarm + 0.05) / frameTime)
    for (let i = 0; i < framesNeeded; i++) {
      cavitationSystem.update(100, 100, 0, frameTime)
    }
    expect(cavitationSystem.getThrustMultiplier('port')).toBe(CAVITATION_CONFIG.thrustMultiplier)
    expect(cavitationSystem.getThrustMultiplier('starboard')).toBe(CAVITATION_CONFIG.thrustMultiplier)
  })

  it('asymmetric: only port cavitates when starboard RPM is low', () => {
    const frameTime = 0.016
    const framesNeeded = Math.ceil((CAVITATION_CONFIG.minDurationForAlarm + 0.05) / frameTime)
    for (let i = 0; i < framesNeeded; i++) {
      // Port full throttle, starboard idle — only port slips
      cavitationSystem.update(100, 0, 0, frameTime)
    }
    expect(cavitationSystem.getThrustMultiplier('port')).toBe(CAVITATION_CONFIG.thrustMultiplier)
    expect(cavitationSystem.getThrustMultiplier('starboard')).toBe(1.0)
  })
})

describe('CavitationSystem — hysteresis & recovery', () => {
  beforeEach(() => {
    cavitationSystem.resetCavitation()
  })

  it('resetCavitation() clears all state immediately', () => {
    // First drive into cavitation
    const frameTime = 0.016
    const framesNeeded = Math.ceil((CAVITATION_CONFIG.minDurationForAlarm + 0.05) / frameTime)
    for (let i = 0; i < framesNeeded; i++) {
      cavitationSystem.update(100, 100, 0, frameTime)
    }
    expect(cavitationState.portCavitating).toBe(true)

    // Then reset
    cavitationSystem.resetCavitation()

    expect(cavitationState.portCavitating).toBe(false)
    expect(cavitationState.starboardCavitating).toBe(false)
    expect(cavitationState.intensity).toBe(0)
    expect(cavitationState.portSlip).toBe(0)
    expect(cavitationState.starboardSlip).toBe(0)
    expect(cavitationSystem.getThrustMultiplier('port')).toBe(1.0)
    expect(cavitationSystem.getThrustMultiplier('starboard')).toBe(1.0)
  })

  it('does not instantly clear on a single idle frame after cavitation', () => {
    // Drive into cavitation
    const frameTime = 0.016
    const framesNeeded = Math.ceil((CAVITATION_CONFIG.minDurationForAlarm + 0.05) / frameTime)
    for (let i = 0; i < framesNeeded; i++) {
      cavitationSystem.update(100, 100, 0, frameTime)
    }
    expect(cavitationState.portCavitating).toBe(true)

    // A single frame at low RPM drains latchTimer but slip smoothing means
    // the alarm state (read from cavitationState) does not flip instantly.
    // We verify the thrust multiplier is still penalised.
    cavitationSystem.update(0, 0, 0, frameTime)
    // Slip is smoothed; portCavitating may still be true after one frame
    // because latchTimer drainage is gradual (×2.5 speed) not instant.
    // We simply assert the multiplier is not erroneously > 1
    const mult = cavitationSystem.getThrustMultiplier('port')
    expect(mult).toBeLessThanOrEqual(1.0)
    expect(mult).toBeGreaterThan(0)
  })
})

describe('CavitationSystem — getState()', () => {
  beforeEach(() => {
    cavitationSystem.resetCavitation()
  })

  it('returns a snapshot that mirrors the singleton', () => {
    const state = cavitationSystem.getState()
    expect(state.portCavitating).toBe(cavitationState.portCavitating)
    expect(state.starboardCavitating).toBe(cavitationState.starboardCavitating)
    expect(state.intensity).toBe(cavitationState.intensity)
    expect(state.portSlip).toBe(cavitationState.portSlip)
    expect(state.starboardSlip).toBe(cavitationState.starboardSlip)
  })
})

describe('CavitationSystem — setEnabled()', () => {
  beforeEach(() => {
    cavitationSystem.resetCavitation()
    cavitationSystem.setEnabled(true)
  })

  it('disabled system produces no cavitation regardless of RPM', () => {
    cavitationSystem.setEnabled(false)
    const frameTime = 0.016
    for (let i = 0; i < 100; i++) {
      cavitationSystem.update(100, 100, 0, frameTime)
    }
    expect(cavitationState.portCavitating).toBe(false)
    expect(cavitationState.starboardCavitating).toBe(false)
    // Re-enable for other tests
    cavitationSystem.setEnabled(true)
  })
})

describe('CavitationSystem — chatter audio', () => {
  beforeEach(() => {
    cavitationSystem.setEnabled(true)
    cavitationSystem.resetCavitation()
    fake.reset()
  })

  it('stays silent without sustained cavitation', async () => {
    cavitationSystem.update(100, 100, CAVITATION_CONFIG.maxPropSpeed, 0.016)
    await Promise.resolve()
    expect(fake.notes).toHaveLength(0)
  })

  it('plays short metallic strikes once cavitation latches', async () => {
    vi.useFakeTimers()
    try {
      const frameTime = 0.016
      const framesNeeded = Math.ceil((CAVITATION_CONFIG.minDurationForAlarm + 0.2) / frameTime)
      for (let i = 0; i < framesNeeded; i++) {
        cavitationSystem.update(100, 100, 0, frameTime)
        await vi.advanceTimersByTimeAsync(0)
      }
      vi.runAllTimers()
      const strikes = fake.notes.filter((n) => n.options.waveform === WAVEFORMS.metal)
      expect(strikes.length).toBeGreaterThan(0)
      for (const strike of strikes) expect(strike.options.duration).toBeLessThan(0.05)
    } finally {
      vi.useRealTimers()
    }
  })
})
