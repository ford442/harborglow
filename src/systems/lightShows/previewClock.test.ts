import { describe, expect, it } from 'vitest'
import { BeatTransport } from '../audio/transport'
import { getSim } from '../sim/SimContext'
import { createPreviewControls } from './previewClock'

describe('preview clock', () => {
  it('advances on the audio clock and does not read sim time', () => {
    let audio = 0
    const simAtStart = getSim().simTime
    const controls = createPreviewControls(new BeatTransport({
      autoPump: false,
      clocks: {
        audio: () => audio,
        sim: () => 50,
        simContinuous: () => 50,
        output: () => null,
      },
    }))
    controls.play(0, 60)
    audio = 2
    expect(controls.clock()).toBe('audio')
    expect(controls.beats()).toBeCloseTo(2)
    controls.scrub(4)
    expect(controls.beats()).toBeCloseTo(4)
    expect(getSim().simTime).toBe(simAtStart)
  })
})
