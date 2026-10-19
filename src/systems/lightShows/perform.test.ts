import { describe, expect, it, afterEach } from 'vitest'
import {
  cueFromJoystick,
  cueFromPad,
  cuesFromThrottle,
  nextQuantizedBeat,
  resetPerformTuning,
  scoreHit,
  DEFAULT_PERFORM_TUNING,
} from './perform'
import { applyShowCue, performanceSnapshot, resetPerformance } from './performLog'
import { setSim, createSimContext } from '../sim/SimContext'

afterEach(() => {
  resetPerformance()
  resetPerformTuning()
  setSim(createSimContext(1))
})

const tuning = DEFAULT_PERFORM_TUNING

describe('perform gestures', () => {
  it('maps pads, joystick crossings, and rising throttle gates', () => {
    expect(cueFromPad('1')?.pattern).toBe('breathe')
    expect(cueFromPad('5')?.target).toBe('all')
    expect(cueFromPad('w')).toBeNull()
    expect(cueFromJoystick({ x: 0, y: 0 }, { x: 0.8, y: 0 })?.pattern).toBe('sweep')
    expect(cueFromJoystick({ x: 0.8, y: 0 }, { x: 0.9, y: 0 })).toBeNull()
    expect(cueFromJoystick({ x: 0, y: 0 }, { x: 0, y: -0.7 })?.target).toBe('deck')
    expect(cuesFromThrottle(0, 0.2)).toEqual([])
    expect(cuesFromThrottle(0.2, 0.5).map((cue) => cue.pattern)).toEqual(['sweep'])
    expect(cuesFromThrottle(0, 1).map((cue) => cue.pattern)).toEqual(['sweep', 'strobe', 'snap'])
  })

  it('quantizes to the next 1/8 or 1/16 and scores accuracy plus a new pattern', () => {
    expect(nextQuantizedBeat(1, 0.5)).toBe(1)
    expect(nextQuantizedBeat(1.01, 0.5)).toBe(1.5)
    expect(nextQuantizedBeat(0.1, 0.25)).toBe(0.25)
    const onGrid = scoreHit({
      rawBeat: 1,
      quantizedBeat: 1,
      quantum: 0.5,
      pattern: 'snap',
      seen: new Set(),
      tuning,
    })
    const late = scoreHit({
      rawBeat: 1.01,
      quantizedBeat: 1.5,
      quantum: 0.5,
      pattern: 'snap',
      seen: new Set(['snap']),
      tuning,
    })
    expect(onGrid.credits).toBeGreaterThan(late.credits)
    expect(onGrid.reputation).toBeGreaterThan(0)
  })

  it('applies a cue from sim time into the performance log', () => {
    setSim({ ...createSimContext(1), simTime: 1, dt: 1 / 60, tick: 60, alpha: 0 })
    applyShowCue({
      pattern: 'strobe',
      target: 'mast',
      quantize: '1/8',
      source: 'pad',
      bpm: 60,
      accuracyWeight: 1,
      varietyWeight: 1,
      creditScale: 40,
      reputationScale: 8,
    }, 60)
    const shot = performanceSnapshot()
    expect(shot.cues).toEqual(['1:strobe:mast:pad'])
    expect(shot.credits).toBeGreaterThan(0)
    applyShowCue({ pattern: 'nope' }, 61)
    expect(performanceSnapshot().cues).toHaveLength(1)
  })
})
