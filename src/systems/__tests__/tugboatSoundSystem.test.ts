import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// =============================================================================
// TugboatSoundSystem — smoke tests
//
// Audio goes to the recording fake audioRuntime installed by src/test/setup.ts
// and Zustand is mocked to avoid full store initialisation.  Tests cover the
// enabled flag, start/stop lifecycle, engine drone, ducking, and stingers.
// =============================================================================

// ---------------------------------------------------------------------------
// Mock Zustand store
// ---------------------------------------------------------------------------
vi.mock('../../store/useGameStore', () => {
  return {
    useGameStore: {
      getState: () => ({ musicEnabled: true }),
    },
  }
})

// ---------------------------------------------------------------------------
// Import system under test AFTER mocks
// ---------------------------------------------------------------------------
import { tugboatSoundSystem, TUG_AUDIO_CONFIG } from '../tugboatSoundSystem'
import { audioRuntime } from '../audio/AudioRuntime'
import { WAVEFORMS } from '../audio/voices'
import type { FakeAudioRuntime } from '../../test/audioRuntimeMock'

const fake = audioRuntime as unknown as FakeAudioRuntime

/** Sustained (no-duration) voices currently held. */
function heldNotes() {
  return fake.notes.filter((n) => n.options.duration === undefined && fake.active.has(n.id))
}

// ---------------------------------------------------------------------------

describe('TugboatSoundSystem — lifecycle', () => {
  beforeEach(() => {
    tugboatSoundSystem.setEnabled(true)
    tugboatSoundSystem.stop()
  })

  afterEach(() => {
    tugboatSoundSystem.stop()
  })

  it('is not running before start() is called', () => {
    expect(tugboatSoundSystem.isRunning()).toBe(false)
  })

  it('becomes running after start() and holds the engine thrum drone', async () => {
    fake.reset()
    await tugboatSoundSystem.start()
    expect(tugboatSoundSystem.isRunning()).toBe(true)
    const held = heldNotes()
    expect(held).toHaveLength(1)
    expect(held[0].note).toBe(TUG_AUDIO_CONFIG.thrumBaseFreq)
    expect(held[0].options.waveform).toBe(WAVEFORMS.triangle)
  })

  it('is not running after stop() and releases the thrum', async () => {
    await tugboatSoundSystem.start()
    tugboatSoundSystem.stop()
    expect(tugboatSoundSystem.isRunning()).toBe(false)
    expect(heldNotes()).toHaveLength(0)
  })

  it('start() is idempotent — calling twice keeps one thrum voice', async () => {
    fake.reset()
    await tugboatSoundSystem.start()
    await tugboatSoundSystem.start()
    expect(tugboatSoundSystem.isRunning()).toBe(true)
    expect(heldNotes()).toHaveLength(1)
  })
})

describe('TugboatSoundSystem — enabled flag', () => {
  beforeEach(() => {
    tugboatSoundSystem.setEnabled(true)
    tugboatSoundSystem.stop()
  })

  it('start() is a no-op when disabled', async () => {
    tugboatSoundSystem.setEnabled(false)
    await tugboatSoundSystem.start()
    expect(tugboatSoundSystem.isRunning()).toBe(false)
  })

  it('setEnabled(false) stops a running system', async () => {
    tugboatSoundSystem.setEnabled(true)
    await tugboatSoundSystem.start()
    expect(tugboatSoundSystem.isRunning()).toBe(true)
    tugboatSoundSystem.setEnabled(false)
    expect(tugboatSoundSystem.isRunning()).toBe(false)
  })

  it('re-enabling allows start() again', async () => {
    tugboatSoundSystem.setEnabled(false)
    await tugboatSoundSystem.start()
    expect(tugboatSoundSystem.isRunning()).toBe(false)
    tugboatSoundSystem.setEnabled(true)
    await tugboatSoundSystem.start()
    expect(tugboatSoundSystem.isRunning()).toBe(true)
  })
})

describe('TugboatSoundSystem — update() guard', () => {
  beforeEach(() => {
    tugboatSoundSystem.setEnabled(true)
    tugboatSoundSystem.stop()
  })

  it('update() does not throw when system is stopped', () => {
    expect(() => {
      tugboatSoundSystem.update(50, 50, 0, 0.016)
    }).not.toThrow()
  })

  it('update() does not throw when running', async () => {
    await tugboatSoundSystem.start()
    expect(() => {
      tugboatSoundSystem.update(75, 60, 0.2, 0.016)
    }).not.toThrow()
  })

  it('update() does not throw with max RPM + high cavitation', async () => {
    await tugboatSoundSystem.start()
    expect(() => {
      tugboatSoundSystem.update(100, 100, 1.0, 0.016)
    }).not.toThrow()
  })

  it('raises thrum pitch with RPM', async () => {
    fake.reset()
    await tugboatSoundSystem.start()
    tugboatSoundSystem.update(100, 100, 0, 0.016)
    const held = heldNotes()
    expect(held).toHaveLength(1)
    expect(held[0].note as number).toBeGreaterThan(TUG_AUDIO_CONFIG.thrumMaxFreq - 4)
  })

  it('ducks the thrum level during heavy cavitation', async () => {
    fake.reset()
    await tugboatSoundSystem.start()
    tugboatSoundSystem.update(100, 100, 0, 0.016)
    const loud = heldNotes()[0].options.velocity!
    tugboatSoundSystem.update(100, 100, 1.0, 0.016)
    const ducked = heldNotes()[0].options.velocity!
    expect(ducked).toBeLessThan(loud)
  })
})

describe('TugboatSoundSystem — stingers', () => {
  beforeEach(async () => {
    tugboatSoundSystem.setEnabled(true)
    await tugboatSoundSystem.start()
    fake.reset()
  })

  afterEach(() => {
    tugboatSoundSystem.stop()
    vi.useRealTimers()
  })

  it('triggerHandshakeComplete() plays its full chord', async () => {
    vi.useFakeTimers()
    await tugboatSoundSystem.triggerHandshakeComplete()
    vi.runAllTimers()
    expect(fake.notes.map((n) => n.note)).toEqual(['C4', 'E4', 'G4', 'C5'])
  })

  it('triggerTowLineAttach() resolves without throwing', async () => {
    await expect(tugboatSoundSystem.triggerTowLineAttach()).resolves.toBeUndefined()
  })

  it('triggerTowLineDetach() resolves without throwing', async () => {
    await expect(tugboatSoundSystem.triggerTowLineDetach()).resolves.toBeUndefined()
  })

  it('triggerHandshakeComplete() resolves without throwing', async () => {
    await expect(tugboatSoundSystem.triggerHandshakeComplete()).resolves.toBeUndefined()
  })

  it('triggerSuccessfulManeuver() resolves without throwing', async () => {
    await expect(tugboatSoundSystem.triggerSuccessfulManeuver()).resolves.toBeUndefined()
  })

  it('stingers are no-ops when disabled', async () => {
    tugboatSoundSystem.setEnabled(false)
    fake.reset()
    await expect(tugboatSoundSystem.triggerTowLineAttach()).resolves.toBeUndefined()
    await expect(tugboatSoundSystem.triggerHandshakeComplete()).resolves.toBeUndefined()
    expect(fake.notes).toHaveLength(0)
  })
})

describe('TugboatSoundSystem — configuration', () => {
  it('TUG_AUDIO_CONFIG has sane duck threshold', () => {
    expect(TUG_AUDIO_CONFIG.cavitationDuckThreshold).toBeGreaterThan(0)
    expect(TUG_AUDIO_CONFIG.cavitationDuckThreshold).toBeLessThan(1)
  })

  it('TUG_AUDIO_CONFIG radio intervals are ordered correctly', () => {
    expect(TUG_AUDIO_CONFIG.radioIntervalMin).toBeLessThan(TUG_AUDIO_CONFIG.radioIntervalMax)
  })

  it('TUG_AUDIO_CONFIG motif intervals are ordered correctly', () => {
    expect(TUG_AUDIO_CONFIG.motifIntervalMin).toBeLessThan(TUG_AUDIO_CONFIG.motifIntervalMax)
  })

  it('setMasterVolume() does not throw', () => {
    expect(() => tugboatSoundSystem.setMasterVolume(-6)).not.toThrow()
  })
})
