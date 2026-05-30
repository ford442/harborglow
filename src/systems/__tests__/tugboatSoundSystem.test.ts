import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// =============================================================================
// TugboatSoundSystem — smoke tests
//
// Tone.js is mocked (no audio context in Node) and Zustand is mocked to avoid
// full store initialisation.  All tests cover the observable pure-logic paths:
// enabled flag, start/stop lifecycle, volume control, and stinger dispatch.
// =============================================================================

// ---------------------------------------------------------------------------
// Mock Tone.js
// ---------------------------------------------------------------------------
vi.mock('tone', () => {
  class FakeNode {
    connect = vi.fn().mockReturnThis()
    toDestination = vi.fn().mockReturnThis()
    dispose = vi.fn()
    volume = { value: 0, rampTo: vi.fn() }
    frequency = { value: 0 }
    min = 0
    max = 0
    start = vi.fn().mockReturnThis()
    stop = vi.fn()
    triggerAttackRelease = vi.fn()
    triggerAttack = vi.fn()
    triggerRelease = vi.fn()
    set = vi.fn()
  }

  class FakePolySynth extends FakeNode {
    constructor(_VoiceType?: unknown, _options?: unknown) { super() }
  }

  return {
    context: { state: 'running' },
    start: vi.fn(),
    now: vi.fn(() => 0),
    Oscillator: FakeNode,
    LFO: FakeNode,
    Filter: FakeNode,
    Volume: FakeNode,
    NoiseSynth: FakeNode,
    Synth: FakeNode,
    PolySynth: FakePolySynth,
  }
})

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

  it('becomes running after start()', async () => {
    await tugboatSoundSystem.start()
    expect(tugboatSoundSystem.isRunning()).toBe(true)
  })

  it('is not running after stop()', async () => {
    await tugboatSoundSystem.start()
    tugboatSoundSystem.stop()
    expect(tugboatSoundSystem.isRunning()).toBe(false)
  })

  it('start() is idempotent — calling twice keeps it running', async () => {
    await tugboatSoundSystem.start()
    await tugboatSoundSystem.start()
    expect(tugboatSoundSystem.isRunning()).toBe(true)
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
})

describe('TugboatSoundSystem — stingers', () => {
  beforeEach(async () => {
    tugboatSoundSystem.setEnabled(true)
    await tugboatSoundSystem.start()
  })

  afterEach(() => {
    tugboatSoundSystem.stop()
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
    await expect(tugboatSoundSystem.triggerTowLineAttach()).resolves.toBeUndefined()
    await expect(tugboatSoundSystem.triggerHandshakeComplete()).resolves.toBeUndefined()
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
