import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { lightingSystem } from '../lightingSystem'
import { getLightShow } from '../lightShows'

// =============================================================================
// LIGHTING SYSTEM — per-band light-cue dispatch smoke tests
// =============================================================================

describe('lightShows registry', () => {
  it('LNG and Oil Tanker have authored cue schedules', () => {
    expect(getLightShow('lng')?.length).toBeGreaterThan(0)
    expect(getLightShow('tanker')?.length).toBeGreaterThan(0)
  })

  it('ships without an authored schedule fall back to undefined', () => {
    expect(getLightShow('cruise')).toBeUndefined()
  })
})

describe('LightingSystem cue dispatch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  afterEach(() => {
    lightingSystem.endHarborShow()
    vi.useRealTimers()
  })

  it('starts the LNG show on the cyan breathing cue, then reaches the strobe cue at the drop (beat 24)', () => {
    lightingSystem.startHarborShow('ship-lng', 'lng')

    lightingSystem.update(0, 118)
    expect(lightingSystem.getActiveCue()?.pattern).toBe('breathe')
    expect(lightingSystem.getEmissiveColor('#ffffff', 'ship-lng')).toBe('#1ad6ff')

    const beatDuration = 60 / 118
    // Date.now() truncates to whole milliseconds, so round up to ensure the
    // beat-24 cue boundary has been crossed.
    const elapsedMs = Math.ceil(beatDuration * 24 * 1000)
    vi.setSystemTime(elapsedMs)
    lightingSystem.update(elapsedMs / 1000, 118)

    expect(lightingSystem.getActiveCue()?.pattern).toBe('strobe')
    expect(lightingSystem.getEmissiveColor('#ffffff', 'ship-lng')).toBe('#eafcff')
  })

  it('blackout cues on the Oil Tanker show suppress light intensity', () => {
    lightingSystem.startHarborShow('ship-tanker', 'tanker')

    const beatDuration = 60 / 140
    const elapsedMs = Math.ceil(beatDuration * 4 * 1000) // beat 4 = blackout
    vi.setSystemTime(elapsedMs)
    lightingSystem.update(elapsedMs / 1000, 140)

    expect(lightingSystem.getActiveCue()?.pattern).toBe('blackout')
    expect(lightingSystem.getLightIntensity(1)).toBeCloseTo(0.02)
  })

  it('falls back to the generic beat-intensity curve for ships without a cue schedule', () => {
    lightingSystem.startHarborShow('ship-cruise', 'cruise')
    lightingSystem.update(0, 120)

    expect(lightingSystem.getActiveCue()).toBeNull()
    expect(lightingSystem.getEmissiveColor('#ffffff', 'ship-cruise')).toMatch(/^hsl\(/)
  })
})
