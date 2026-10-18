import { describe, it, expect } from 'vitest'
import { lightShowRegistry, PRESET_LOOP_BEATS, SHIP_BPM } from './index'
import { migrateShowV1toV2 } from './migrate'
import { authorShowV2, cue } from './author'
import {
  RIG_GROUP_IDS,
  createRigGroupCueState,
  easingEnvelope,
  patternPulse,
  resolveGroupCue,
  resolveRigGroupState,
} from './rigCues'
import type { LightShowV2 } from './types'
import type { ShipType } from '../../store/gameStoreTypes'

function stepCue(show: LightShowV2, t: number) {
  let active = show.cues[0]
  for (const c of show.cues) {
    if (c.beat <= t) active = c
    else break
  }
  return active
}

describe('rig-group resolution of migrated (all-target) presets', () => {
  it.each(Object.keys(SHIP_BPM) as ShipType[])('%s: every group follows the harbor-wide step cue', (shipType) => {
    const show = migrateShowV1toV2(shipType, lightShowRegistry[shipType], PRESET_LOOP_BEATS)
    const state = createRigGroupCueState()
    for (let i = 0; i < show.loopBeats * 16; i++) {
      const t = i / 16
      const expected = stepCue(show, t)
      for (const group of RIG_GROUP_IDS) {
        resolveRigGroupState(show, group, t, state)
        expect(state.active).toBe(true)
        expect(state.color).toBe(expected.color)
        expect(state.pulse).toBe(patternPulse(expected.pattern, t))
        expect(state.level).toBe(expected.intensity)
      }
    }
  })
})

describe('targeted cues', () => {
  const show = authorShowV2('t', 16, [
    cue(0, 8, 'funnel', 'breathe', '#ff0000', 0.8),
    cue(0, 16, 'all', 'sweep', '#00ff00', 0.4),
    cue(4, 2, 'mast', 'strobe', '#0000ff', 1),
    cue(8, 4, 'funnel', 'snap', '#ffffff', 1, 'linear'),
  ])

  it('a later-starting cue wins; authoring order breaks a start-beat tie', () => {
    // funnel and all both start at 0: 'all' was authored second, so it wins.
    expect(resolveGroupCue(show, 'funnel', 1)?.color).toBe('#00ff00')
    expect(resolveGroupCue(show, 'funnel', 9)?.color).toBe('#ffffff')
    expect(resolveGroupCue(show, 'mast', 5)?.color).toBe('#0000ff')
  })

  it('a targeted cue lights only its own group, and only inside its length', () => {
    expect(resolveGroupCue(show, 'bridge', 5)?.color).toBe('#00ff00')
    expect(resolveGroupCue(show, 'mast', 6)?.color).toBe('#00ff00')
    expect(resolveGroupCue(show, 'funnel', 12)?.color).toBe('#00ff00')
  })

  it('an uncovered group is inactive', () => {
    const sparse = authorShowV2('s', 8, [cue(2, 2, 'deck', 'snap', '#ffffff', 1)])
    const state = resolveRigGroupState(sparse, 'deck', 1, createRigGroupCueState())
    expect(state).toMatchObject({ active: false, level: 0, pulse: 0 })
    expect(resolveRigGroupState(sparse, 'deck', 3, state).active).toBe(true)
    expect(resolveRigGroupState(sparse, 'deck', 4, state).active).toBe(false)
    expect(resolveRigGroupState(sparse, 'bridge', 3, state).active).toBe(false)
  })

  it('easing scales level across the cue', () => {
    const state = createRigGroupCueState()
    expect(resolveRigGroupState(show, 'funnel', 8, state).level).toBe(0)
    expect(resolveRigGroupState(show, 'funnel', 10, state).level).toBeCloseTo(0.5)
  })
})

describe('easingEnvelope', () => {
  it('holds full level on step and swells 0→1 otherwise', () => {
    expect(easingEnvelope('step', 0)).toBe(1)
    for (const easing of ['linear', 'easeIn', 'easeOut', 'easeInOut'] as const) {
      expect(easingEnvelope(easing, 0)).toBe(0)
      expect(easingEnvelope(easing, 1)).toBe(1)
      expect(easingEnvelope(easing, 2)).toBe(1)
    }
    expect(easingEnvelope('easeIn', 0.5)).toBeCloseTo(0.25)
    expect(easingEnvelope('easeOut', 0.5)).toBeCloseTo(0.75)
    expect(easingEnvelope('easeInOut', 0.5)).toBeCloseTo(0.5)
  })
})
