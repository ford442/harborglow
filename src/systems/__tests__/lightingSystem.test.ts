import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { lightingSystem } from '../lightingSystem'
import { getLightShow } from '../lightShows'
import { resetUserShowsMemory, saveUserShow } from '../lightShows/userShows'
import { resetPerformance } from '../lightShows/performLog'
import { forkFactoryShow, updateCue } from '../lightShows/cueEdit'
import { ShipType } from '../../store/useGameStore'
import { createSimContext, getSim, setSim } from '../sim/SimContext'

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
    lightingSystem.stopPreview()
    lightingSystem.setShowOverride(null)
    resetUserShowsMemory()
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

  it('plays a saved fork in place of the factory preset', async () => {
    const forked = forkFactoryShow('lng')
    expect(forked).not.toBeNull()
    const edited = updateCue(forked!, forked!.cues[0].id, { color: '#112233', pattern: 'snap' })
    await saveUserShow('lng', edited)
    lightingSystem.startHarborShow('ship-lng', 'lng')
    lightingSystem.update(0, 118)
    expect(lightingSystem.getActiveCue()?.pattern).toBe('snap')
    expect(lightingSystem.getEmissiveColor('#ffffff', 'ship-lng')).toBe('#112233')
  })

  it('keeps a share-link override ahead of an authored show', async () => {
    const forked = forkFactoryShow('lng')!
    await saveUserShow('lng', updateCue(forked, forked.cues[0].id, { color: '#112233' }))
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

  it('preview of an empty show is dark: no cue, base colours', () => {
    expect(lightingSystem.startPreview('ship-lng', 'lng', { v: 2, id: 'lng', loopBeats: 32, cues: [] })).toBe(true)
    lightingSystem.setPreviewBeat(4)
    lightingSystem.update(0, 118)
    expect(lightingSystem.getActiveCue()).toBeNull()
    expect(lightingSystem.getEmissiveColor('#ffffff', 'ship-lng')).toBe('#ffffff')
    expect(lightingSystem.getLightIntensity(1)).toBe(1)
  })

  it('preview scrubs cues without moving sim time', () => {
    setSimMs(4)
    const forked = forkFactoryShow('tanker')!
    lightingSystem.startPreview('ship-tanker', 'tanker', forked)
    lightingSystem.setPreviewBeat(0)
    lightingSystem.update(99, 140)
    expect(lightingSystem.getActiveCue()?.beat).toBe(0)
    expect(lightingSystem.getEmissiveColor('#ffffff', 'ship-tanker')).toBe(forked.cues[0].color)
    expect(getSim().simTime).toBe(0.004)
  })

  it('preview plays the draft ahead of the saved show, only on its own ship, until stopped', async () => {
    const saved = forkFactoryShow('lng')!
    await saveUserShow('lng', updateCue(saved, saved.cues[0].id, { color: '#112233' }))
    const draft = updateCue(saved, saved.cues[0].id, { color: '#445566', pattern: 'sweep' })
    expect(lightingSystem.startPreview('ship-lng', 'lng', draft)).toBe(true)
    expect(lightingSystem.isPreviewing()).toBe(true)
    lightingSystem.update(0, 118)
    expect(lightingSystem.getEmissiveColor('#ffffff', 'ship-lng')).toBe('#445566')
    expect(lightingSystem.getEmissiveColor('#ffffff', 'other-ship')).toBe('#ffffff')

    // a live edit reaches the lights; an unrelated start for another ship does not inherit the draft
    lightingSystem.setPreviewShow(updateCue(draft, draft.cues[0].id, { color: '#778899' }))
    lightingSystem.update(0, 118)
    expect(lightingSystem.getEmissiveColor('#ffffff', 'ship-lng')).toBe('#778899')

    // a preview loops past the factory duration instead of ending
    setSimMs(10 * 60 * 1000)
    lightingSystem.update(1, 118)
    expect(lightingSystem.isShowActive()).toBe(true)

    lightingSystem.stopPreview()
    expect(lightingSystem.isPreviewing()).toBe(false)
    expect(lightingSystem.isShowActive()).toBe(false)
    expect(lightingSystem.getPreviewBeat()).toBeNull()
    lightingSystem.startHarborShow('ship-lng', 'lng')
    setSimMs(0)
    lightingSystem.update(0, 118)
    expect(lightingSystem.getEmissiveColor('#ffffff', 'ship-lng')).toBe('#112233') // back to the saved show
  })

  it('refuses to preview over a share-link show', () => {
    lightingSystem.setShowOverride({ v: 2, id: 'lng', loopBeats: 32, cues: [] })
    expect(lightingSystem.startPreview('ship-lng', 'lng', forkFactoryShow('lng')!)).toBe(false)
    expect(lightingSystem.isPreviewing()).toBe(false)
  })

  it('falls back to the generic beat-intensity curve for ships without a cue schedule', () => {
    lightingSystem.startHarborShow('ship-unknown', 'unknown' as ShipType)
    lightingSystem.update(0, 120)

    expect(lightingSystem.getActiveCue()).toBeNull()
    expect(lightingSystem.getEmissiveColor('#ffffff', 'ship-unknown')).toMatch(/^hsl\(/)
  })
})
