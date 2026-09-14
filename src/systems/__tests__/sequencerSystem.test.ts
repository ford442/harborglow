import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BeatTransport } from '../audio/transport'
import { SequencerSystem, sequencerSystem } from '../sequencerSystem'
import { transport } from '../audio/transport'

// =============================================================================
// SEQUENCER SYSTEM — smoke tests
// Cues are keyed by transport beat; no audio context is needed.
// =============================================================================

describe('SequencerSystem', () => {
  beforeEach(() => {
    transport.stop()
    transport.seek(0)
    sequencerSystem.clearAll()
  })

  it('schedule() fires callback at the correct beat offset', () => {
    const cb = vi.fn()
    sequencerSystem.schedule(4, cb)

    // Transport just before the target beat — should not fire.
    sequencerSystem['_flushDueCues'](3.99)
    expect(cb).not.toHaveBeenCalled()

    // Transport reaching the target — should fire exactly once.
    sequencerSystem['_flushDueCues'](4)
    sequencerSystem['_flushDueCues'](5)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('schedule() is relative to the current transport beat', () => {
    const cb = vi.fn()
    transport.seek(10)
    sequencerSystem.schedule(2, cb)
    sequencerSystem['_flushDueCues'](11.5)
    expect(cb).not.toHaveBeenCalled()
    sequencerSystem['_flushDueCues'](12)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('cancel() prevents the callback from firing', () => {
    const cb = vi.fn()
    const id = sequencerSystem.schedule(4, cb)
    sequencerSystem.cancel(id)
    sequencerSystem['_flushDueCues'](100)
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

    sequencerSystem['_flushDueCues'](100)
    expect(cb1).not.toHaveBeenCalled()
    expect(cb2).not.toHaveBeenCalled()
    expect(cb3).not.toHaveBeenCalled()
  })

  it('flushes from transport updates driven by sim time', () => {
    const clock = { sim: 0 }
    const beatTransport = new BeatTransport({ autoPump: false, clocks: { sim: () => clock.sim } })
    const sequencer = new SequencerSystem(beatTransport)
    const cb = vi.fn()
    beatTransport.bpm = 120
    beatTransport.start({ clock: 'sim', atBeat: 0 })
    sequencer.schedule(4, cb)

    clock.sim = 1.99
    beatTransport.update()
    expect(cb).not.toHaveBeenCalled()

    clock.sim = 2 // 4 beats at 120 BPM
    beatTransport.update()
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
