import { describe, it, expect } from 'vitest'
import { getLightShow, SHIP_BPM } from './index'
import { LightCue, LightCuePattern } from './types'
import { ShipType } from '../../store/gameStoreTypes'

// =============================================================================
// LIGHT SHOW REGISTRY — invariant checks for every authored ship
// =============================================================================

const shipTypes = Object.keys(SHIP_BPM) as ShipType[]
const VALID_PATTERNS: Set<LightCuePattern> = new Set([
  'breathe',
  'sweep',
  'strobe',
  'snap',
  'blackout',
])

describe('lightShowRegistry coverage', () => {
  it('has a non-empty cue schedule for every ShipType', () => {
    for (const type of shipTypes) {
      const show = getLightShow(type)
      expect(show, `expected ${type} to have a light show`).toBeDefined()
      expect(show!.length, `expected ${type} show to have cues`).toBeGreaterThan(0)
    }
  })

  it('starts each schedule at beat 0', () => {
    for (const type of shipTypes) {
      const show = getLightShow(type)!
      expect(show[0].beat, `expected ${type} first cue at beat 0`).toBe(0)
    }
  })
})

describe('LightCue invariants', () => {
  for (const type of shipTypes) {
    const show = getLightShow(type)!

    it(`keeps ${type} cues inside the 0..31 loop`, () => {
      for (const cue of show) {
        expect(cue.beat).toBeGreaterThanOrEqual(0)
        expect(cue.beat).toBeLessThanOrEqual(31)
      }
    })

    it(`uses only known patterns for ${type}`, () => {
      for (const cue of show) {
        expect(VALID_PATTERNS.has(cue.pattern)).toBe(true)
      }
    })

    it(`keeps ${type} intensities in [0, 1]`, () => {
      for (const cue of show) {
        expect(cue.intensity).toBeGreaterThanOrEqual(0)
        expect(cue.intensity).toBeLessThanOrEqual(1)
      }
    })

    it(`uses hex color strings for ${type}`, () => {
      for (const cue of show) {
        expect(cue.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    })
  }
})
