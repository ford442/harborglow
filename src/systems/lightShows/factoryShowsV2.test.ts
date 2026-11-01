import { describe, it, expect } from 'vitest'
import { authoredShowsV2, PRESET_LOOP_BEATS } from './index'
import { getRigGroups } from './rigGroups'
import { RIG_GROUP_IDS, resolveGroupCue } from './rigCues'
import { FACTORY_SHOW_EMITTERS, getActiveShowEmitters } from './showEmitters'
import { parseLightShow } from '../../schemas/lightShow'
import { getBlueprint } from '../../types/ShipBlueprint'
import type { ShipType } from '../../store/gameStoreTypes'

const authored = Object.entries(authoredShowsV2) as Array<[ShipType, NonNullable<(typeof authoredShowsV2)[ShipType]>]>

describe('native V2 factory shows (#253)', () => {
  it('ships the cruise finale, fireboat water-cannon and icebreaker aurora shows', () => {
    expect(authored.map(([t]) => t).sort()).toEqual(['cruise', 'fireboat', 'icebreaker'])
  })

  describe.each(authored)('%s', (shipType, show) => {
    it('passes the import schema (share links carry it unchanged)', () => {
      const result = parseLightShow(structuredClone(show))
      expect(result.ok, result.ok ? '' : result.error.message).toBe(true)
    })

    it('loops on the preset loop with in-loop, positive-length cues and deterministic ids', () => {
      expect(show.id).toBe(shipType)
      expect(show.loopBeats).toBe(PRESET_LOOP_BEATS)
      show.cues.forEach((c, i) => {
        expect(c.id).toBe(`${shipType}:${i}`)
        expect(c.lengthBeats).toBeGreaterThan(0)
        expect(c.beat + c.lengthBeats).toBeLessThanOrEqual(show.loopBeats)
      })
    })

    it('targets rig groups, and only groups this hull has', () => {
      const groups = getRigGroups(shipType)
      const targeted = show.cues.filter((c) => c.target !== 'all')
      expect(targeted.length).toBeGreaterThan(0)
      for (const c of targeted) expect(groups.has(c.target as never), `${c.id} → ${c.target}`).toBe(true)
    })

    it('lights every rig group the hull has', () => {
      for (const group of getRigGroups(shipType)) {
        let lit = false
        for (let t = 0; t < show.loopBeats && !lit; t += 0.25) {
          const c = resolveGroupCue(show, group, t)
          lit = !!c && c.pattern !== 'blackout'
        }
        expect(lit, group).toBe(true)
      }
    })

    it('gives at least two groups different cues at some beat', () => {
      const groups = [...getRigGroups(shipType)]
      let differs = false
      for (let t = 0; t < show.loopBeats && !differs; t += 0.25) {
        const cueIds = new Set(groups.map((g) => resolveGroupCue(show, g, t)?.id))
        differs = cueIds.size > 1
      }
      expect(differs).toBe(true)
    })
  })

  it('matches the snapshot', () => {
    expect(authoredShowsV2).toMatchSnapshot()
  })

  it('RIG_GROUP_IDS matches the schema target union (minus all)', () => {
    expect([...RIG_GROUP_IDS].sort()).toEqual(['accent', 'bridge', 'deck', 'funnel', 'gantry', 'hullStrip', 'mast'])
  })
})

describe('show emitter bindings', () => {
  it('pairs fireworks with the cruise, mist with the fireboat and glitter with the icebreaker', () => {
    const kinds = (t: ShipType) => new Set(FACTORY_SHOW_EMITTERS[t]!.map((e) => e.kind))
    expect(kinds('cruise')).toEqual(new Set(['fireworks']))
    expect(kinds('fireboat')).toEqual(new Set(['mist']))
    expect(kinds('icebreaker')).toEqual(new Set(['glitter']))
  })

  it.each(Object.entries(FACTORY_SHOW_EMITTERS) as Array<[ShipType, NonNullable<(typeof FACTORY_SHOW_EMITTERS)[ShipType]>]>)(
    '%s anchors every emitter on a blueprint attachment point inside the loop',
    (shipType, bindings) => {
      const points = getBlueprint(shipType)!.attachmentPoints
      for (const b of bindings) {
        expect(points).toContain(b.attachmentPoint)
        expect(b.beat).toBeGreaterThanOrEqual(0)
        expect(b.beat + b.lengthBeats).toBeLessThanOrEqual(PRESET_LOOP_BEATS)
        expect(b.density).toBeGreaterThan(0)
        expect(b.density).toBeLessThanOrEqual(1)
        expect(b.color).toMatch(/^#[0-9a-f]{6}$/i)
      }
      expect(bindings.reduce((sum, b) => sum + b.density, 0)).toBeLessThanOrEqual(1)
    },
  )

  it('returns the emitters live at a beat, reusing the out array', () => {
    const out = getActiveShowEmitters('fireboat', 18)
    expect(out.map((e) => e.attachmentPoint)).toEqual(['waterCannonPort', 'waterCannonStbd', 'foamDeck'])
    expect(getActiveShowEmitters('fireboat', 30, out)).toBe(out)
    expect(out).toEqual([])
    expect(getActiveShowEmitters('icebreaker', 17).map((e) => e.attachmentPoint)).toEqual(['funnelMain', 'mastArray'])
    expect(getActiveShowEmitters('tanker', 4)).toEqual([])
  })
})
