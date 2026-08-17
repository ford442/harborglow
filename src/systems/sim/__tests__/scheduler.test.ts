import { describe, expect, it } from 'vitest'
import { SIM_DT, simScheduler } from '../FixedStepScheduler'
import { getSim } from '../SimContext'

describe('FixedStepScheduler', () => {
  it('advances an integer number of 60 Hz steps independent of frame dt', () => {
    simScheduler.reset(1)
    let steps = 0
    simScheduler.advance(1 / 30, () => {
      steps++
    })
    expect(steps).toBe(2)
    expect(simScheduler.tick).toBe(2)
    expect(simScheduler.simTime).toBeCloseTo(2 * SIM_DT, 8)
    expect(getSim().dt).toBe(SIM_DT)
  })

  it('exposes leftover time as alpha', () => {
    simScheduler.reset(1)
    simScheduler.advance(SIM_DT * 1.5, () => {})
    expect(simScheduler.tick).toBe(1)
    expect(getSim().alpha).toBeCloseTo(0.5, 5)
  })

  it('records and serializes inputs', () => {
    simScheduler.reset(7)
    simScheduler.startRecording()
    simScheduler.advance(SIM_DT, () => {})
    simScheduler.record('storm.start', { duration: 180 })
    const file = simScheduler.stopRecording()
    expect(file.seed).toBe(7)
    expect(file.inputs).toHaveLength(1)
    expect(file.inputs[0].action).toBe('storm.start')
  })
})
