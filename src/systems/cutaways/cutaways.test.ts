import { describe, it, expect } from 'vitest'
import {
  getCutawayPlan,
  DEFAULT_CUTAWAY_PLAN,
  oilTankerCutaway,
  cruiseCutaway,
  containerCutaway,
  bulkCutaway,
  lngCutaway,
  roroCutaway,
  researchCutaway,
  droneshipCutaway,
  ferryCutaway,
  trawlerCutaway,
  horizonCutaway,
  fireboatCutaway,
} from './index'
import { CutawayCue } from './types'
import { ShipType } from '../../store/gameStoreTypes'

const CUE_LOOP_BEATS = 32

function assertWithinEnvelope(plan: CutawayCue[], label: string) {
  for (const cue of plan) {
    expect(cue.beat, `${label} beat ${cue.beat} outside 0..32 envelope`).toBeGreaterThanOrEqual(0)
    expect(cue.beat, `${label} beat ${cue.beat} outside 0..32 envelope`).toBeLessThanOrEqual(CUE_LOOP_BEATS)
  }
}

const ALL_SHIP_TYPES: ShipType[] = [
  'cruise',
  'container',
  'tanker',
  'bulk',
  'lng',
  'roro',
  'research',
  'droneship',
  'ferry',
  'trawler',
  'horizon',
  'fireboat',
]

describe('getCutawayPlan', () => {
  it('returns a non-default authored plan for every ship type', () => {
    for (const shipType of ALL_SHIP_TYPES) {
      const plan = getCutawayPlan(shipType)
      expect(plan, `${shipType} should resolve to an authored cutaway plan`).not.toBe(DEFAULT_CUTAWAY_PLAN)
      expect(plan.length, `${shipType} plan should not be empty`).toBeGreaterThan(0)
    }
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
    ['container', containerCutaway],
    ['bulk', bulkCutaway],
    ['lng', lngCutaway],
    ['roro', roroCutaway],
    ['research', researchCutaway],
    ['droneship', droneshipCutaway],
    ['ferry', ferryCutaway],
    ['trawler', trawlerCutaway],
    ['horizon', horizonCutaway],
    ['fireboat', fireboatCutaway],
  ]

  it('keeps DEFAULT_CUTAWAY_PLAN within the 32-beat envelope', () => {
    assertWithinEnvelope(DEFAULT_CUTAWAY_PLAN, 'default')
  })

  for (const [type, plan] of authored) {
    it(`keeps ${type} cues inside the 0..32 envelope`, () => {
      assertWithinEnvelope(plan, type)
    })

    it(`schedules ${type} hide_band_name at beat 32`, () => {
      const hideCue = plan.find((c) => c.action.type === 'hide_band_name')
      expect(hideCue?.beat).toBe(32)
    })
  }
})
