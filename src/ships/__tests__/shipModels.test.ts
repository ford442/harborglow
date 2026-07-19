import { describe, expect, it, beforeEach } from 'vitest'
import * as THREE from 'three'
import { extractAttachmentPoints } from '../extractAttachmentPoints'
import { clearShipModelCache, isShipModelAvailable, setShipModelCacheEntry } from '../shipModelCache'
import { getShipModelUrl, listGlbContracts } from '../shipModelRegistry'
import { SHIP_ATTACH_PREFIX } from '../shipModelContract'

describe('shipModelRegistry', () => {
  it('lists three priority GLB contracts', () => {
    const contracts = listGlbContracts()
    expect(contracts).toHaveLength(3)
    expect(contracts.map((c) => c.shipType)).toEqual(['cruise', 'container', 'tanker'])
  })

  it('maps ship types to public model URLs', () => {
    expect(getShipModelUrl('cruise')).toBe('./models/cruise_liner.glb')
    expect(getShipModelUrl('bulk')).toBeNull()
  })
})

describe('extractAttachmentPoints', () => {
  it('resolves nodes by id and attach_ prefix', () => {
    const root = new THREE.Group()
    root.name = 'cruise_root'

    const direct = new THREE.Object3D()
    direct.name = 'funnel1'
    direct.position.set(1, 2, 3)
    root.add(direct)

    const prefixed = new THREE.Object3D()
    prefixed.name = `${SHIP_ATTACH_PREFIX}stack1`
    prefixed.position.set(4, 5, 6)
    root.add(prefixed)

    const poses = extractAttachmentPoints(root, ['funnel1', 'stack1', 'missing'])
    expect(poses.funnel1?.position).toEqual([1, 2, 3])
    expect(poses.stack1?.position).toEqual([4, 5, 6])
    expect(poses.missing).toBeUndefined()
  })
})

describe('shipModelCache', () => {
  beforeEach(() => clearShipModelCache())

  it('tracks GLB availability for procedural fallback', () => {
    expect(isShipModelAvailable('cruise')).toBe(false)
    setShipModelCacheEntry('cruise', {
      available: true,
      url: './models/cruise_liner.glb',
      attachments: {},
    })
    expect(isShipModelAvailable('cruise')).toBe(true)
  })
})
