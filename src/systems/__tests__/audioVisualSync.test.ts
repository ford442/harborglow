import { describe, it, expect } from 'vitest'
import {
  AudioVisualSync,
  BAND_BIN_RANGES,
  computeMeasuredBands,
  createOnsetDetectorState,
  detectBeatOnset,
  getTransportBeatPhase,
  isWithinBeatWindow,
  mapBandsToAnalysisFields,
  meanByteBins,
} from '../audioVisualSync'

// =============================================================================
// audioVisualSync — band computation + onset detector unit tests
// =============================================================================

function makeSyntheticSpectrum(): Uint8Array {
  const buf = new Uint8Array(1024)
  for (let i = BAND_BIN_RANGES.bass[0]; i <= BAND_BIN_RANGES.bass[1]; i++) {
    buf[i] = 200
  }
  for (let i = BAND_BIN_RANGES.mid[0]; i <= BAND_BIN_RANGES.mid[1]; i++) {
    buf[i] = 100
  }
  for (let i = BAND_BIN_RANGES.treble[0]; i <= BAND_BIN_RANGES.treble[1]; i++) {
    buf[i] = 50
  }
  return buf
}

describe('meanByteBins', () => {
  it('returns normalized mean for a constant region', () => {
    const buf = new Uint8Array(10)
    buf.fill(255, 0, 5)
    expect(meanByteBins(buf, 0, 4)).toBeCloseTo(1, 5)
  })

  it('returns 0 for empty range', () => {
    const buf = new Uint8Array(4)
    expect(meanByteBins(buf, 2, 1)).toBe(0)
  })
})

describe('computeMeasuredBands', () => {
  it('computes bass/mid/treble means from synthetic byte spectrum', () => {
    const buf = makeSyntheticSpectrum()
    const bands = computeMeasuredBands(buf)

    expect(bands.bass).toBeCloseTo(200 / 255, 4)
    expect(bands.mid).toBeCloseTo(100 / 255, 4)
    expect(bands.treble).toBeCloseTo(50 / 255, 4)
  })
})

describe('mapBandsToAnalysisFields', () => {
  it('maps three measured bands onto all five legacy fields', () => {
    const mapped = mapBandsToAnalysisFields(0.8, 0.5, 0.25)

    expect(mapped.bass).toBeCloseTo(0.8, 5)
    expect(mapped.lowMid).toBeCloseTo(0.68, 5)
    expect(mapped.mid).toBeCloseTo(0.5, 5)
    expect(mapped.highMid).toBeCloseTo(0.375, 5)
    expect(mapped.treble).toBeCloseTo(0.25, 5)
  })
})

describe('getTransportBeatPhase', () => {
  it('returns 0 at beat boundary and 0.5 at mid-beat', () => {
    const bpm = 120
    const beatDuration = 60 / bpm
    expect(getTransportBeatPhase(bpm, 0)).toBe(0)
    expect(getTransportBeatPhase(bpm, beatDuration * 0.5)).toBeCloseTo(0.5, 5)
    expect(getTransportBeatPhase(bpm, beatDuration)).toBeCloseTo(0, 5)
  })
})

describe('isWithinBeatWindow', () => {
  it('accepts phases near downbeat and rejects mid-beat', () => {
    expect(isWithinBeatWindow(0.05)).toBe(true)
    expect(isWithinBeatWindow(0.5)).toBe(false)
    expect(isWithinBeatWindow(0.19)).toBe(true)
    expect(isWithinBeatWindow(0.21)).toBe(false)
  })
})

describe('detectBeatOnset', () => {
  it('does not fire on steady bass', () => {
    const state = createOnsetDetectorState()
    let rolling = state

    for (let t = 0; t < 10; t++) {
      const result = detectBeatOnset(rolling, 0.3, t * 0.1, 128, { emaAlpha: 0.5 })
      rolling = { rollingBassAvg: result.rollingBassAvg, lastBeatTime: result.lastBeatTime }
      expect(result.beat).toBe(false)
    }
  })

  it('fires when bass spikes above rolling average', () => {
    const state = createOnsetDetectorState()
    state.rollingBassAvg = 0.2

    const result = detectBeatOnset(state, 0.9, 1.0, 128)
    expect(result.beat).toBe(true)
    expect(result.shouldFireCallback).toBe(true)
    expect(result.beatPhase).toBe(0)
  })

  it('rejects second spike within BPM min interval', () => {
    const state = createOnsetDetectorState()
    state.rollingBassAvg = 0.2
    state.lastBeatTime = 1.0

    const bpm = 128
    const minInterval = 60 / bpm
    const tooSoon = 1.0 + minInterval * 0.5

    const result = detectBeatOnset(state, 0.95, tooSoon, bpm)
    expect(result.beat).toBe(false)
    expect(result.shouldFireCallback).toBe(false)
  })

  it('accepts spike after BPM min interval (~0.469s at 128 BPM)', () => {
    const state = createOnsetDetectorState()
    state.rollingBassAvg = 0.2
    state.lastBeatTime = 1.0

    const bpm = 128
    const minInterval = 60 / bpm
    const afterGate = 1.0 + minInterval + 0.01

    const result = detectBeatOnset(state, 0.95, afterGate, bpm)
    expect(result.beat).toBe(true)
    expect(minInterval).toBeCloseTo(0.46875, 4)
  })

  it('rejects bass spike outside Transport beat window', () => {
    const state = createOnsetDetectorState()
    state.rollingBassAvg = 0.2

    const result = detectBeatOnset(state, 0.9, 1.0, 128, { transportBeatPhase: 0.5 })
    expect(result.beat).toBe(false)
    expect(result.shouldFireCallback).toBe(false)
  })

  it('accepts bass spike inside Transport beat window', () => {
    const state = createOnsetDetectorState()
    state.rollingBassAvg = 0.2

    const result = detectBeatOnset(state, 0.9, 1.0, 128, { transportBeatPhase: 0.05 })
    expect(result.beat).toBe(true)
    expect(result.shouldFireCallback).toBe(true)
  })
})

describe('AudioVisualSync smoke', () => {
  it('returns global data without throwing before initialize', () => {
    const sync = new AudioVisualSync()
    const data = sync.analyze(0)
    expect(data.bass).toBe(0)
    expect(data.beat).toBe(false)
  })
})
