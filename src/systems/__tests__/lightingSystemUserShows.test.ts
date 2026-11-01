import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { forkShow, placeCue, emptyDraft } from '../lightShows/editor/editorModel'
import { getLightShowV2, lightShowRegistryV2, SHIP_BPM } from '../lightShows'
import { deleteUserShow, resetUserShowsMemory, saveUserShow } from '../lightShows/userShows'
import { lightingSystem } from '../lightingSystem'
import { createSimContext, setSim } from '../sim/SimContext'
import { hashSimSnapshot, simScheduler } from '../sim/index'
import { bootHeadlessRegistry, resetDeterministicSystems, stepHeadless } from '../sim/headless'
import { stormSystem } from '../StormSystem'

function setSimMs(ms: number) {
  setSim({ ...createSimContext(1), simTime: ms / 1000 })
}

function atBeat(bpm: number, beat: number) {
  const ms = Math.ceil((60 / bpm) * beat * 1000)
  setSimMs(ms)
  lightingSystem.update(ms / 1000, bpm)
}

/** A one-cue show lighting every group red for the whole loop. */
function allRed(shipType: 'cruise' | 'tanker', loopBeats = 32) {
  let d = emptyDraft(shipType, loopBeats)
  d = placeCue(d, { beat: 0, lengthBeats: loopBeats, target: 'all', pattern: 'snap', color: '#ff0000', intensity: 0.5 }).draft
  return d.show
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  resetUserShowsMemory()
  setSimMs(0)
})

afterEach(async () => {
  lightingSystem.setShowOverride(null)
  await deleteUserShow('cruise')
  await deleteUserShow('tanker')
  resetUserShowsMemory()
  vi.restoreAllMocks()
  setSimMs(0)
})

describe('lightingSystem plays the player’s saved show', () => {
  it('uses the user show when one is saved, the factory show otherwise', async () => {
    const bpm = SHIP_BPM.cruise
    lightingSystem.startHarborShow('c1', 'cruise')
    atBeat(bpm, 2)
    const factoryColor = lightingSystem.getRigGroupState('c1', 'funnel')?.color
    expect(factoryColor).not.toBe('#ff0000')
    lightingSystem.endHarborShow()

    await saveUserShow('cruise', allRed('cruise'))
    lightingSystem.startHarborShow('c2', 'cruise')
    atBeat(bpm, 2)
    expect(lightingSystem.getRigGroupState('c2', 'funnel')).toMatchObject({ active: true, color: '#ff0000', pattern: 'snap' })
    expect(lightingSystem.getRigGroupState('c2', 'deck')?.color).toBe('#ff0000')
    expect(lightingSystem.getActiveCue()?.id).toBe('cruise-user:0')
    lightingSystem.endHarborShow()

    await deleteUserShow('cruise')
    lightingSystem.startHarborShow('c3', 'cruise')
    atBeat(bpm, 2)
    expect(lightingSystem.getRigGroupState('c3', 'funnel')?.color).toBe(factoryColor)
  })

  it('a user show only affects its own ship', async () => {
    await saveUserShow('cruise', allRed('cruise'))
    lightingSystem.startHarborShow('t1', 'tanker')
    atBeat(SHIP_BPM.tanker, 2)
    expect(lightingSystem.getActiveCue()?.id.startsWith('tanker:')).toBe(true)
  })

  it('sizes the show duration from the user show’s loop (24 beats @120 = 12 s -> 3 loops)', async () => {
    await saveUserShow('cruise', allRed('cruise', 24))
    lightingSystem.startHarborShow('c1', 'cruise')
    expect(lightingSystem.getCurrentShow().duration).toBe(36000)
  })

  it('an override (share link / editor play) wins over the saved show and loops until cleared', async () => {
    await saveUserShow('cruise', allRed('cruise'))
    lightingSystem.setShowOverride(getLightShowV2('cruise')!)
    expect(lightingSystem.hasShowOverride()).toBe(true)
    lightingSystem.startHarborShow('c1', 'cruise')
    atBeat(SHIP_BPM.cruise, 2)
    expect(lightingSystem.getActiveCue()?.id.startsWith('cruise:')).toBe(true)
    lightingSystem.setShowOverride(null)
    expect(lightingSystem.hasShowOverride()).toBe(false)
  })
})

describe('setPreviewBeat', () => {
  const bpm = SHIP_BPM.cruise
  const cruise = lightShowRegistryV2.cruise // overture: hullStrip gold @0..8, bar 7 drop: funnel strobe @24..28

  it('resolves cues at the held beat instead of elapsed sim time', () => {
    lightingSystem.setShowOverride(cruise)
    lightingSystem.startHarborShow('c1', 'cruise')
    atBeat(bpm, 0)
    const atZero = lightingSystem.getRigGroupState('c1', 'funnel')?.pattern
    expect(atZero).toBe('breathe')

    lightingSystem.setPreviewBeat(25)
    atBeat(bpm, 0) // sim clock still at 0
    expect(lightingSystem.getPreviewBeat()).toBe(25)
    expect(lightingSystem.getRigGroupState('c1', 'funnel')).toMatchObject({ pattern: 'strobe', color: '#ffffff', active: true })

    atBeat(bpm, 9) // sim time moves; the preview does not
    expect(lightingSystem.getRigGroupState('c1', 'funnel')?.pattern).toBe('strobe')

    lightingSystem.setPreviewBeat(null)
    atBeat(bpm, 9)
    expect(lightingSystem.getRigGroupState('c1', 'funnel')?.pattern).toBe('snap') // bars 3–4 chase
  })

  it('wraps past the loop, clamps negatives, and ignores non-finite values', () => {
    lightingSystem.setShowOverride(cruise)
    lightingSystem.startHarborShow('c1', 'cruise')
    lightingSystem.setPreviewBeat(32 + 25)
    atBeat(bpm, 0)
    expect(lightingSystem.getRigGroupState('c1', 'funnel')?.pattern).toBe('strobe')
    lightingSystem.setPreviewBeat(-5)
    expect(lightingSystem.getPreviewBeat()).toBe(0)
    lightingSystem.setPreviewBeat(NaN)
    expect(lightingSystem.getPreviewBeat()).toBeNull()
  })

  it('is cleared when the show ends', () => {
    lightingSystem.setShowOverride(cruise)
    lightingSystem.startHarborShow('c1', 'cruise')
    lightingSystem.setPreviewBeat(10)
    lightingSystem.setShowOverride(null)
    expect(lightingSystem.getPreviewBeat()).toBeNull()
  })

  it('does nothing without an active show', () => {
    lightingSystem.setPreviewBeat(10)
    atBeat(bpm, 0)
    expect(lightingSystem.getRigGroupState('c1', 'funnel')).toBeNull()
    lightingSystem.setPreviewBeat(null)
  })
})

describe('sim hash', () => {
  /** Hash plus proof that the lighting system really ran (so equality is not vacuous). */
  function run(mode: 'silent' | 'show' | 'preview'): string {
    const ticks = 240
    simScheduler.reset(42)
    resetDeterministicSystems()
    bootHeadlessRegistry()
    stormSystem.start(180)
    if (mode !== 'silent') {
      lightingSystem.setShowOverride(forkShow('cruise', lightShowRegistryV2.cruise).show)
      lightingSystem.startHarborShow('c1', 'cruise')
    }
    while (simScheduler.tick < ticks) {
      stepHeadless(1 / 60)
      if (mode === 'preview') lightingSystem.setPreviewBeat((simScheduler.tick * 0.37) % 32)
    }
    const h = hashSimSnapshot()
    const state = lightingSystem.getRigGroupState('c1', 'funnel')
    if (mode === 'silent') {
      expect(state).toBeNull()
    } else {
      expect(state?.active).toBe(true)
      expect(lightingSystem.getPreviewBeat() !== null).toBe(mode === 'preview')
    }
    lightingSystem.setShowOverride(null)
    return h
  }

  it('scrubbing a preview does not change the sim hash', () => {
    const playing = run('show')
    const previewing = run('preview')
    expect(previewing).toBe(playing)
  })

  it('playing an edited show does not change the sim hash either', () => {
    expect(run('show')).toBe(run('silent'))
  })
})
