import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { SHIP_BLUEPRINTS, getBlueprint } from '../../types/ShipBlueprint'
import {
  getShipModelUrl,
  getShipGlbContract,
  getShipModelSettings,
  isGlbCapableShipType,
  listGlbCapableShipTypes,
} from '../shipModelRegistry'

describe('Ship Models', () => {
  it('every ShipType should have a resolvable model URL', () => {
    for (const shipType of listGlbCapableShipTypes()) {
      expect(isGlbCapableShipType(shipType)).toBe(true)
      const url = getShipModelUrl(shipType)
      expect(url).toBeTruthy()
      
      // Verify file exists on disk
      const filePath = path.resolve(__dirname, '../../../public', url!.replace('./', ''))
      expect(fs.existsSync(filePath)).toBe(true)
    }
  })

  it('every ShipType should have non-empty extracted attachment points via contract', () => {
    for (const bp of SHIP_BLUEPRINTS.filter((blueprint) =>
      isGlbCapableShipType(blueprint.id as any),
    )) {
      const shipType = bp.id as any
      const contract = getShipGlbContract(shipType)
      
      expect(contract.attachmentNodeIds.length).toBeGreaterThan(0)
      
      // We expect either socket maps or naming conventions to be present for every attachment
      for (const id of contract.attachmentNodeIds) {
        // If there's a socket map, it must cover the id, OR the id must exist as a fallback.
        // In our setup, all generated/authored ships use socket maps for their hardpoints,
        // or follow the direct name convention.
        const mappedNodes = Object.values(contract.attachmentSocketMap)
        if (mappedNodes.length > 0) {
          expect(mappedNodes).toContain(id)
        }
      }
    }
  })

  it('icebreaker has no GLB and falls back to procedural without throwing', () => {
    expect(() => getShipModelSettings('icebreaker')).not.toThrow()
    expect(getShipModelSettings('icebreaker')).toBeNull()
    expect(isGlbCapableShipType('icebreaker')).toBe(false)
  })

  it('resolves icebreaker and the legacy icebreaker-yamal blueprint id', () => {
    expect(getBlueprint('icebreaker')?.id).toBe('icebreaker')
    expect(getBlueprint('icebreaker-yamal')?.id).toBe('icebreaker')
  })
})
