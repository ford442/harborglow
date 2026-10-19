import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { lightingSystem } from '../lightingSystem'
import { getLightShow } from '../lightShows'
import { replaceAuthoredShows } from '../lightShows/authoredShows'
import { resetPerformance } from '../lightShows/performLog'
import { forkFactoryShow, updateCue } from '../lightShows/cueEdit'
import { ShipType } from '../../store/useGameStore'
import { createSimContext, setSim } from '../sim/SimContext'

function setSimMs(ms: number) {
  setSim({ ...createSimContext(1), simTime: ms / 1000 })
}

// =============================================================================
// LIGHTING SYSTEM — per-band light-cue dispatch smoke tests
// =============================================================================

describe('lightShows registry', () => {
  it('LNG and Oil Tanker have authored cue schedules', () => {
    expect(getLightShow('lng')?.length).toBeGreaterThan(0)
    expect(getLightShow('tanker')?.length).toBeGreaterThan(0)
  })

  it('ships without an authored schedule fall back to undefined', () => {
    expect(getLightShow('unknown' as ShipType)).toBeUndefined()
  })
})

describe('LightingSystem cue dispatch', () => {
  beforeEach(() => {
    setSimMs(0)
    resetPerformance()
  })

  afterEach(() => {
    lightingSystem.clearPreview()
    lightingSystem.setShowOverride(null)
    replaceAuthoredShows({})
    setSimMs(0)
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
    setSimMs(elapsedMs)
    lightingSystem.update(elapsedMs / 1000, 118)

    expect(lightingSystem.getActiveCue()?.pattern).toBe('strobe')
    expect(lightingSystem.getEmissiveColor('#ffffff', 'ship-lng')).toBe('#eafcff')
  })

  it('blackout cues on the Oil Tanker show suppress light intensity', () => {
    lightingSystem.startHarborShow('ship-tanker', 'tanker')

    const beatDuration = 60 / 140
    const elapsedMs = Math.ceil(beatDuration * 4 * 1000) // beat 4 = blackout
    setSimMs(elapsedMs)
    lightingSystem.update(elapsedMs / 1000, 140)

    expect(lightingSystem.getActiveCue()?.pattern).toBe('blackout')
    expect(lightingSystem.getLightIntensity(1)).toBeCloseTo(0.02)
  })

  it('plays a saved fork in place of the factory preset', () => {
    const forked = forkFactoryShow('lng')
    expect(forked).not.toBeNull()
    const edited = updateCue(forked!, forked!.cues[0].id, { color: '#112233', pattern: 'snap' })
    replaceAuthoredShows({ lng: edited })
    lightingSystem.startHarborShow('ship-lng', 'lng')
    lightingSystem.update(0, 118)
    expect(lightingSystem.getActiveCue()?.pattern).toBe('snap')
    expect(lightingSystem.getEmissiveColor('#ffffff', 'ship-lng')).toBe('#112233')
  })

  it('keeps a share-link override ahead of an authored show', () => {
    const forked = forkFactoryShow('lng')!
    replaceAuthoredShows({ lng: forked })
    lightingSystem.setShowOverride({
      v: 2,
      id: 'lng',
      loopBeats: 32,
      cues: [{
        id: 'share',
        beat: 0,
        lengthBeats: 32,
        target: 'all',
        pattern: 'sweep',
        color: '#abcdef',
        intensity: 1,
        easing: 'step',
      }],
    })
    lightingSystem.startHarborShow('ship-lng', 'lng')
    lightingSystem.update(0, 118)
    expect(lightingSystem.getActiveCue()?.color).toBe('#abcdef')
  })

  it('preview scrubs cues without moving sim time', () => {
    setSimMs(4)
    const forked = forkFactoryShow('tanker')!
    lightingSystem.setPreview(forked, 0)
    expect(lightingSystem.getActiveCue()?.beat).toBe(0)
    lightingSystem.update(99, 140)
    expect(lightingSystem.getActiveCue()?.beat).toBe(0)
    expect(lightingSystem.getEmissiveColor('#ffffff', 'other-ship')).toBe(forked.cues[0].color)
  })

  it('falls back to the generic beat-intensity curve for ships without a cue schedule', () => {
    lightingSystem.startHarborShow('ship-unknown', 'unknown' as ShipType)
    lightingSystem.update(0, 120)

    expect(lightingSystem.getActiveCue()).toBeNull()
    expect(lightingSystem.getEmissiveColor('#ffffff', 'ship-unknown')).toMatch(/^hsl\(/)
  })
})
