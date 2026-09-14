import { describe, expect, it, vi } from 'vitest'
import {
  BeatTransport,
  beatsToPosition,
  noteValueToBeats,
  positionToBeats,
  scheduleLoop,
  scheduleSequence,
} from '../transport'

function manualTransport() {
  const clock = { sim: 0, audio: 0 }
  const transport = new BeatTransport({
    autoPump: false,
    clocks: { sim: () => clock.sim, audio: () => clock.audio },
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
    expect(cb).toHaveBeenCalledWith(2)
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
    expect(cb).toHaveBeenLastCalledWith(101)
    clock.sim = 5 // lag spike: beat 110.5
    transport.update()
    expect(cb).toHaveBeenCalledTimes(2)
    clock.sim = 5.25 // beat 111
    transport.update()
    expect(cb).toHaveBeenCalledTimes(3)
    expect(cb).toHaveBeenLastCalledWith(111)
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
    expect(cb).toHaveBeenLastCalledWith(12)
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
