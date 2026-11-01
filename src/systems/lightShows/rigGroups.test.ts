import { describe, it, expect } from 'vitest'
import { SHIP_BLUEPRINTS } from '../../types/ShipBlueprint'
import { getRigGroups, rigGroupForAttachmentPoint } from './rigGroups'
import type { RigGroupId } from './types'
import type { ShipType } from '../../store/gameStoreTypes'

const GROUPS: RigGroupId[] = ['funnel', 'bridge', 'hullStrip', 'gantry', 'mast', 'deck', 'accent']

describe('rig groups', () => {
  it('maps every blueprint attachment point to exactly one known group', () => {
    const mapping: Record<string, Record<string, RigGroupId>> = {}
    for (const bp of SHIP_BLUEPRINTS) {
      mapping[bp.id] = {}
      for (const point of bp.attachmentPoints) {
        const group = rigGroupForAttachmentPoint(point)
        expect(GROUPS).toContain(group)
        mapping[bp.id][point] = group
      }
    }
    // A new blueprint id shows up here as a reviewable diff, not a silent accent.
    expect(mapping).toMatchSnapshot()
  })

  it('falls back to accent for unknown ids', () => {
    expect(rigGroupForAttachmentPoint('somethingNew')).toBe('accent')
  })

  it('getRigGroups returns the groups a ship has', () => {
    expect([...getRigGroups('container' as ShipType)].sort()).toEqual(['deck', 'gantry', 'mast'])
    expect(getRigGroups('nope' as ShipType).size).toBe(0)
  })
})
