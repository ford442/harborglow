import { describe, it, expect, vi, beforeEach } from 'vitest'

// =============================================================================
// SEQUENCER SYSTEM — smoke tests
// All Tone.js Transport interactions are mocked so no audio context is needed.
// =============================================================================

// ---------------------------------------------------------------------------
// Mock Tone.js before importing the system under test.
// ---------------------------------------------------------------------------
vi.mock('tone', () => {
  let _seconds = 0
  let _bpm = 120
  let _state: 'started' | 'stopped' = 'started'

  const transport = {
    get seconds() { return _seconds },
    set seconds(v: number) { _seconds = v },
    get bpm() { return { value: _bpm } },
    get state() { return _state },
    scheduleRepeat: vi.fn(),
    position: '0:0:0',
    stop: vi.fn(() => { _state = 'stopped' }),
    start: vi.fn(() => { _state = 'started' }),
    _setSeconds(v: number) { _seconds = v },
    _setBpm(v: number) { _bpm = v },
  }

  return {
    getTransport: () => transport,
  }
})

// ---------------------------------------------------------------------------
// Import the system only after mocks are registered.
// ---------------------------------------------------------------------------
import * as Tone from 'tone'

// Helper: expose the transport mock's internal setter via the public interface.
function setTransportSeconds(v: number) {
  // The mock exposes an internal setter through the same object reference.
  (Tone.getTransport() as unknown as { _setSeconds: (v: number) => void })._setSeconds(v)
}

// Re-import sequencerSystem fresh for each test group by resetting the module.
// We do NOT use module isolation here because the singleton is recreated at
// module load time — mocking Tone before the first import is sufficient.
import { sequencerSystem } from '../sequencerSystem'

// ---------------------------------------------------------------------------

describe('SequencerSystem', () => {
  beforeEach(() => {
    // Reset transport seconds to 0 and clear all cues before each test.
    setTransportSeconds(0)
    sequencerSystem.clearAll()
  })

  it('schedule() fires callback at the correct beat offset', () => {
    const cb = vi.fn()
    const BPM = 120
    const beatOffset = 4
    // At 120 BPM: seconds-per-beat = 0.5; 4 beats = 2 s from now (seconds=0).
    const expectedTarget = (60 / BPM) * beatOffset // 2.0

    sequencerSystem.schedule(beatOffset, cb)

    // Simulate Transport advancing to just before the target — should not fire.
    setTransportSeconds(expectedTarget - 0.01)
    sequencerSystem['_flushDueCues'](Tone.getTransport().seconds)
    expect(cb).not.toHaveBeenCalled()

    // Simulate Transport reaching/passing the target — should fire.
    setTransportSeconds(expectedTarget)
    sequencerSystem['_flushDueCues'](Tone.getTransport().seconds)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('cancel() prevents the callback from firing', () => {
    const cb = vi.fn()
    const id = sequencerSystem.schedule(4, cb)

    // Cancel before the cue's target time.
    sequencerSystem.cancel(id)

    // Advance well past the target.
    setTransportSeconds(100)
    sequencerSystem['_flushDueCues'](Tone.getTransport().seconds)
    expect(cb).not.toHaveBeenCalled()
  })

  it('clearAll() cancels all pending cues', () => {
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    const cb3 = vi.fn()

    sequencerSystem.schedule(1, cb1)
    sequencerSystem.schedule(2, cb2)
    sequencerSystem.schedule(3, cb3)

    sequencerSystem.clearAll()

    // Advance past all targets.
    setTransportSeconds(100)
    sequencerSystem['_flushDueCues'](Tone.getTransport().seconds)
    expect(cb1).not.toHaveBeenCalled()
    expect(cb2).not.toHaveBeenCalled()
    expect(cb3).not.toHaveBeenCalled()
  })
})
