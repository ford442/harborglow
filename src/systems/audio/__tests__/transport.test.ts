import { describe, expect, it, vi } from 'vitest'
import {
  BeatTransport,
  beatsToPosition,
  noteValueToBeats,
  positionToBeats,
  scheduleLoop,
  scheduleSequence,
} from '../transport'

function manualTransport(lookaheadSeconds = 0.1) {
  const clock = { sim: 0, audio: 0, output: null as number | null }
  const transport = new BeatTransport({
    autoPump: false,
    lookaheadSeconds,
    clocks: { sim: () => clock.sim, audio: () => clock.audio, output: () => clock.output },
  })
  return { transport, clock }
}

describe('position helpers', () => {
  it('converts bars:beats[:sixteenths] to beats and back', () => {
    expect(positionToBeats('0:0')).toBe(0)
    expect(positionToBeats('1:2')).toBe(6)
    expect(positionToBeats('2:1:2')).toBe(9.5)
    expect(beatsToPosition(9.5)).toBe('2:1:2')
  })

  it('converts note values to beats', () => {
    expect(noteValueToBeats('4n')).toBe(1)
    expect(noteValueToBeats('8n')).toBe(0.5)
    expect(noteValueToBeats('1n')).toBe(4)
    expect(noteValueToBeats('2m')).toBe(8)
    expect(noteValueToBeats('4:0')).toBe(16)
  })
})

describe('BeatTransport', () => {
  it('derives beats from the selected clock, not from update() calls', () => {
    const { transport, clock } = manualTransport()
    clock.sim = 10
    transport.bpm = 120
    transport.start({ clock: 'sim', atBeat: 0 })
    clock.sim = 12
    expect(transport.beats).toBeCloseTo(4)
    clock.audio = 999 // other clock is ignored
    expect(transport.beats).toBeCloseTo(4)
  })

  it('same sim time lands on the same beat regardless of pump cadence', () => {
    const a = manualTransport()
    const b = manualTransport()
    for (const { transport } of [a, b]) {
      transport.bpm = 128
      transport.start({ clock: 'sim', atBeat: 0 })
    }
    for (let i = 0; i < 600; i++) {
      a.clock.sim += 1 / 60
      a.transport.update()
      if (i % 7 === 0) {
        b.clock.sim = a.clock.sim
        b.transport.update()
      }
    }
    b.clock.sim = a.clock.sim
    expect(b.transport.beats).toBeCloseTo(a.transport.beats, 9)
  })

  it('keeps position continuous across tempo changes', () => {
    const { transport, clock } = manualTransport()
    transport.bpm = 60
    transport.start({ clock: 'sim', atBeat: 0 })
    clock.sim = 4
    transport.bpm = 120
    expect(transport.beats).toBeCloseTo(4)
    clock.sim = 5
    expect(transport.beats).toBeCloseTo(6)
  })

  it('freezes position while stopped and resumes from it', () => {
    const { transport, clock } = manualTransport()
    transport.start({ clock: 'sim', atBeat: 0 })
    clock.sim = 1
    transport.stop()
    clock.sim = 50
    expect(transport.beats).toBeCloseTo(2)
    transport.start()
    clock.sim = 50.5
    expect(transport.beats).toBeCloseTo(3)
  })

  it('fires one-shot events once when their beat is reached', () => {
    const { transport, clock } = manualTransport()
    const cb = vi.fn()
    transport.start({ clock: 'sim', atBeat: 0 })
    transport.scheduleOnce(cb, 2)
    clock.sim = 0.99
    transport.update()
    expect(cb).not.toHaveBeenCalled()
    clock.sim = 1
    transport.update()
    transport.update()
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(2, expect.any(Number))
  })

  it('does not replay missed repeats after a late start or lag spike', () => {
    const { transport, clock } = manualTransport()
    const cb = vi.fn()
    transport.scheduleRepeat(cb, 1, 0)
    transport.start({ clock: 'sim', atBeat: 100.5 })
    transport.update()
    expect(cb).not.toHaveBeenCalled()
    clock.sim = 0.25 // beat 101
    transport.update()
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenLastCalledWith(101, expect.any(Number))
    clock.sim = 5 // lag spike: beat 110.5
    transport.update()
    expect(cb).toHaveBeenCalledTimes(2)
    clock.sim = 5.25 // beat 111
    transport.update()
    expect(cb).toHaveBeenCalledTimes(3)
    expect(cb).toHaveBeenLastCalledWith(111, expect.any(Number))
  })

  it('clear() and cancel() drop scheduled events', () => {
    const { transport, clock } = manualTransport()
    const a = vi.fn()
    const b = vi.fn()
    transport.start({ clock: 'sim', atBeat: 0 })
    const id = transport.scheduleOnce(a, 1)
    transport.scheduleRepeat(b, 1, 1)
    transport.clear(id)
    transport.cancel()
    clock.sim = 10
    transport.update()
    expect(a).not.toHaveBeenCalled()
    expect(b).not.toHaveBeenCalled()
  })

  it('seek() moves the position and realigns repeats', () => {
    const { transport, clock } = manualTransport()
    const cb = vi.fn()
    transport.start({ clock: 'sim', atBeat: 0 })
    transport.scheduleRepeat(cb, 4, 0)
    transport.update()
    expect(cb).toHaveBeenCalledTimes(1)
    transport.seek(9)
    transport.update()
    expect(cb).toHaveBeenCalledTimes(1)
    clock.sim = 1.5 // +3 beats → 12
    transport.update()
    expect(cb).toHaveBeenLastCalledWith(12, expect.any(Number))
  })
})

describe('pattern helpers', () => {
  it('scheduleSequence derives the step from the beat', () => {
    const { transport, clock } = manualTransport()
    const played: string[] = []
    scheduleSequence(transport, ['a', null, 'c', 'd'], 1, (_beat, value) => played.push(value))
    transport.start({ clock: 'sim', atBeat: 6 }) // index 6 % 4 = 2 → 'c'
    transport.update()
    clock.sim = 0.5
    transport.update() // beat 7 → 'd'
    clock.sim = 1
    transport.update() // beat 8 → 'a'
    clock.sim = 1.5
    transport.update() // beat 9 → null
    expect(played).toEqual(['c', 'd', 'a'])
  })

  it('scheduleLoop repeats each event every loop length', () => {
    const { transport, clock } = manualTransport()
    const played: number[] = []
    scheduleLoop(transport, [{ beat: 0, n: 1 }, { beat: 2, n: 2 }], 4, (beat, e) => played.push(e.n * 100 + beat))
    transport.start({ clock: 'sim', atBeat: 0 })
    for (let t = 0; t <= 4; t += 0.5) {
      clock.sim = t // 0..8 beats
      transport.update()
    }
    expect(played).toEqual([100, 202, 104, 206, 108])
  })
})

describe('look-ahead scheduling', () => {
  it('fires ahead events early with the audio time of their beat', () => {
    const { transport, clock } = manualTransport(0.1)
    const ahead = vi.fn()
    const onBeat = vi.fn()
    clock.audio = 10
    transport.bpm = 120 // 0.5 s per beat
    transport.start({ clock: 'audio', atBeat: 0 })
    transport.scheduleOnce(ahead, 1, { ahead: true })
    transport.scheduleOnce(onBeat, 1)
    clock.audio = 10.39 // beat 0.78: 1 is 0.11 s away
    transport.update()
    expect(ahead).not.toHaveBeenCalled()
    clock.audio = 10.41 // 0.09 s away: inside the look-ahead
    transport.update()
    expect(ahead).toHaveBeenCalledWith(1, 10.5)
    expect(onBeat).not.toHaveBeenCalled()
    clock.audio = 10.5
    transport.update()
    expect(onBeat).toHaveBeenCalledWith(1, 10.5)
    expect(ahead).toHaveBeenCalledTimes(1)
  })

  it('fires each repeat once even though it fires before its beat', () => {
    const { transport, clock } = manualTransport(0.1)
    const beats: number[] = []
    transport.bpm = 120
    transport.scheduleRepeat((beat) => beats.push(beat), 0.25, 0, { ahead: true })
    transport.start({ clock: 'audio', atBeat: 0 })
    for (let t = 0; t <= 1; t += 0.004) {
      clock.audio = t
      transport.update()
    }
    // Horizon at t = 1 is beat 2.2; each step fires exactly once, in order.
    expect(beats).toEqual([0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2])
  })

  it('maps sim beats to audio time through the measured offset', () => {
    const { transport, clock } = manualTransport(0.1)
    const times: number[] = []
    transport.bpm = 120
    clock.sim = 3
    clock.audio = 103 // audio runs 100 s ahead of sim
    transport.scheduleRepeat((_beat, time) => times.push(time), 1, 0, { ahead: true })
    transport.start({ clock: 'sim', atBeat: 0 })
    transport.update()
    expect(times[0]).toBeCloseTo(103, 9) // beat 0 sounds now
    expect(transport.audioTimeAt(4)).toBeCloseTo(105, 9)
  })

  it('smooths the stepped sim clock to sub-millisecond note spacing', () => {
    const { transport, clock } = manualTransport(0.1)
    const times: number[] = []
    transport.bpm = 140
    transport.scheduleRepeat((_beat, time) => times.push(time), 0.25, 0, { ahead: true })
    transport.start({ clock: 'sim', atBeat: 0 })
    // Real time in 12 ms pump ticks (± 5 ms timer jitter); sim in 1/60 s steps;
    // main-thread currentTime in 128-frame quanta.
    let seed = 0x1234567
    let audio = 0
    for (let tick = 0; tick < 2000; tick++) {
      seed = (seed * 1103515245 + 12345) >>> 0
      audio += 0.012 + ((seed / 0xffffffff) - 0.5) * 0.01
      clock.audio = Math.floor(audio * 375) / 375
      clock.sim = Math.floor(audio * 60) / 60
      transport.update()
    }
    const step = 60 / 140 / 4
    // Skip the first two seconds while the offset estimate settles.
    const settled = times.slice(Math.ceil(2 / step))
    let worst = 0
    for (let i = 1; i < settled.length; i++) {
      worst = Math.max(worst, Math.abs(settled[i] - settled[i - 1] - step))
    }
    expect(settled.length).toBeGreaterThan(50)
    expect(worst).toBeLessThan(0.001)
  })

  it('re-anchors the offset after the sim pauses', () => {
    const { transport, clock } = manualTransport(0.1)
    transport.bpm = 120
    transport.start({ clock: 'sim', atBeat: 0 })
    transport.update()
    clock.audio = 30 // sim frozen for 30 s (tab hidden, pause menu)
    transport.update()
    expect(transport.audioTimeAt(transport.beats)).toBeCloseTo(30, 9)
  })

  it('reports the beat reaching the speakers as audibleBeats / beatPhase', () => {
    const { transport, clock } = manualTransport(0.1)
    transport.bpm = 120
    clock.audio = 10
    transport.start({ clock: 'audio', atBeat: 0 })
    clock.audio = 11.25 // scheduling position: beat 2.5
    clock.output = 11.2 // 50 ms of output latency: beat 2.4 is being heard
    expect(transport.beats).toBeCloseTo(2.5)
    expect(transport.audibleBeats).toBeCloseTo(2.4)
    expect(transport.beatPhase()).toBeCloseTo(0.4)
    clock.output = null // no AudioContext: fall back to the schedule
    expect(transport.audibleBeats).toBeCloseTo(2.5)
  })
})
