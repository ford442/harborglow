import { describe, it, expect } from 'vitest'
import { getCutawayPlan, DEFAULT_CUTAWAY_PLAN, oilTankerCutaway, cruiseCutaway } from './index'
import { CutawayCue } from './types'
import { ShipType } from '../../store/gameStoreTypes'

const CUE_LOOP_BEATS = 32

function assertWithinEnvelope(plan: CutawayCue[], label: string) {
  for (const cue of plan) {
    expect(cue.beat, `${label} beat ${cue.beat} outside 0..32 envelope`).toBeGreaterThanOrEqual(0)
    expect(cue.beat, `${label} beat ${cue.beat} outside 0..32 envelope`).toBeLessThanOrEqual(CUE_LOOP_BEATS)
  }
}

describe('getCutawayPlan', () => {
  it('returns DEFAULT_CUTAWAY_PLAN for unauthored ship types', () => {
    expect(getCutawayPlan('container')).toEqual(DEFAULT_CUTAWAY_PLAN)
    expect(getCutawayPlan('lng')).toEqual(DEFAULT_CUTAWAY_PLAN)
  })

  it('returns authored tanker plan with hero and waterline shots', () => {
    const plan = getCutawayPlan('tanker')
    expect(plan).toBe(oilTankerCutaway)
    expect(plan.some((c) => c.action.type === 'camera_mode' && c.action.mode === 'ship-low')).toBe(true)
    expect(plan.some((c) => c.action.type === 'camera_mode' && c.action.mode === 'ship-water')).toBe(true)
  })

  it('returns authored cruise plan with aerial showcase', () => {
    const plan = getCutawayPlan('cruise')
    expect(plan).toBe(cruiseCutaway)
    expect(plan.some((c) => c.action.type === 'camera_mode' && c.action.mode === 'ship-aerial')).toBe(true)
  })
})

describe('CutawayPlan invariants', () => {
  const authored: Array<[ShipType, CutawayCue[]]> = [
    ['tanker', oilTankerCutaway],
    ['cruise', cruiseCutaway],
  ]

  it('keeps DEFAULT_CUTAWAY_PLAN within the 32-beat envelope', () => {
    assertWithinEnvelope(DEFAULT_CUTAWAY_PLAN, 'default')
  })

  for (const [type, plan] of authored) {
    it(`keeps ${type} cues inside the 0..31 envelope`, () => {
      assertWithinEnvelope(plan, type)
    })

    it(`schedules ${type} hide_band_name at beat 32`, () => {
      const hideCue = plan.find((c) => c.action.type === 'hide_band_name')
      expect(hideCue?.beat).toBe(32)
    })
  }
})
