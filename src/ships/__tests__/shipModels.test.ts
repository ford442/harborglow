import { describe, expect, it, beforeEach } from 'vitest'
import * as THREE from 'three'
import { extractAttachmentPoints } from '../extractAttachmentPoints'
import {
  clearShipModelCache,
  getShipModelCacheEntry,
  isShipModelAvailable,
  markShipModelUnavailable,
  setShipModelCacheEntry,
} from '../shipModelCache'
import {
  getShipGlbContract,
  getShipModelSettings,
  getShipModelUrl,
  isGlbCapableShipType,
  listGlbCapableShipTypes,
  listGlbContracts,
} from '../shipModelRegistry'
import { isEmissiveSlotName, isGlbAllowedForQuality, SHIP_ATTACH_PREFIX } from '../shipModelContract'
import { getShipModelConfig, validateShipModelConfig } from '../../types/ShipBlueprint'
import { collectEmissiveSlots } from '../emissiveSlots'

describe('shipModelRegistry', () => {
  it('lists priority heroes first among all GLB-capable contracts', () => {
    const contracts = listGlbContracts()
    expect(contracts.map((c) => c.shipType).slice(0, 3)).toEqual(['cruise', 'container', 'tanker'])
    expect(listGlbCapableShipTypes()).toEqual(
      expect.arrayContaining(['cruise', 'container', 'tanker', 'fireboat', 'lng']),
    )
    expect(contracts.length).toBeGreaterThanOrEqual(5)
  })

  it('maps ship types to public model URLs', () => {
    expect(getShipModelUrl('cruise')).toBe('./models/cruise_liner.glb')
    expect(getShipModelUrl('fireboat')).toBe('./models/fireboat.glb')
    expect(getShipModelUrl('lng')).toBe('./models/lng_carrier.glb')
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

describe('ShipModelConfig on blueprints', () => {
  it('resolves the hero trio model config from ships.json', () => {
    const cruise = getShipModelConfig('cruise')
    expect(cruise?.url).toBe('./models/cruise_liner.glb')
    expect(getShipModelConfig('container')?.url).toBe('./models/container_vessel.glb')
    expect(getShipModelConfig('tanker')?.url).toBe('./models/oil_tanker.glb')
  })

  it('resolves stretch fleet model configs', () => {
    expect(getShipModelConfig('fireboat')?.url).toBe('./models/fireboat.glb')
    expect(getShipModelConfig('lng')?.url).toBe('./models/lng_carrier.glb')
  })

  it('returns null for blueprints without a model block', () => {
    expect(getShipModelConfig('bulk')).toBeNull()
    expect(getShipModelSettings('bulk')).toBeNull()
    expect(isGlbCapableShipType('bulk')).toBe(false)
  })

  it('fills defaults for scale and yOffset and exposes authored socket maps', () => {
    const settings = getShipModelSettings('cruise')
    expect(settings?.scale).toBe(1)
    expect(settings?.yOffset).toBe(0)
    expect(settings?.attachmentSocketMap.Empty_HP_05).toBe('funnel1')
    expect(Object.keys(settings?.attachmentSocketMap ?? {}).length).toBe(6)
  })

  it('maps every attachment id for each GLB-capable blueprint via socket map', () => {
    for (const shipType of listGlbCapableShipTypes()) {
      const contract = getShipGlbContract(shipType)
      const mappedIds = new Set(Object.values(contract.attachmentSocketMap))
      for (const id of contract.attachmentNodeIds) {
        expect(mappedIds.has(id), `${shipType} missing socket for ${id}`).toBe(true)
      }
    }
  })
})

describe('validateShipModelConfig', () => {
  it('accepts a minimal valid config', () => {
    expect(validateShipModelConfig({ url: './models/x.glb' }, 'x')).toEqual([])
  })

  it('accepts optional fields', () => {
    const errors = validateShipModelConfig(
      { url: './models/x.gltf', scale: 0.5, yOffset: -1.5, attachmentSocketMap: { Empty_001: 'funnel1' } },
      'x',
    )
    expect(errors).toEqual([])
  })

  it('treats undefined as "no model" rather than an error', () => {
    expect(validateShipModelConfig(undefined, 'x')).toEqual([])
  })

  it('rejects a missing or non-glb url', () => {
    expect(validateShipModelConfig({}, 'x')).toHaveLength(1)
    expect(validateShipModelConfig({ url: './models/x.obj' }, 'x')[0]).toMatch(/\.glb or \.gltf/)
  })

  it('rejects bad scale, yOffset and socket map values', () => {
    expect(validateShipModelConfig({ url: 'a.glb', scale: 0 }, 'x')[0]).toMatch(/positive number/)
    expect(validateShipModelConfig({ url: 'a.glb', yOffset: Number.NaN }, 'x')[0]).toMatch(/finite/)
    expect(validateShipModelConfig({ url: 'a.glb', attachmentSocketMap: { n: 1 } }, 'x')).toHaveLength(1)
    expect(validateShipModelConfig({ url: 'a.glb', attachmentSocketMap: [] }, 'x')).toHaveLength(1)
  })
})

describe('attachment socket map', () => {
  it('maps arbitrary GLB node names onto blueprint attachment ids', () => {
    const root = new THREE.Group()
    const empty = new THREE.Object3D()
    empty.name = 'Empty_017'
    empty.position.set(7, 8, 9)
    root.add(empty)

    const poses = extractAttachmentPoints(root, ['funnel1'], { Empty_017: 'funnel1' })
    expect(poses.funnel1?.position).toEqual([7, 8, 9])
  })

  it('still falls back to name conventions when the map misses', () => {
    const root = new THREE.Group()
    const node = new THREE.Object3D()
    node.name = 'attach_stack1'
    node.position.set(1, 0, 0)
    root.add(node)

    const poses = extractAttachmentPoints(root, ['stack1'], { Nope: 'other' })
    expect(poses.stack1?.position).toEqual([1, 0, 0])
  })
})

describe('quality gating', () => {
  it('renders GLB hulls only at medium and above', () => {
    expect(isGlbAllowedForQuality('low')).toBe(false)
    expect(isGlbAllowedForQuality('medium')).toBe(true)
    expect(isGlbAllowedForQuality('high')).toBe(true)
  })
})

describe('markShipModelUnavailable', () => {
  beforeEach(() => clearShipModelCache())

  it('flips a loaded model to procedural without throwing', () => {
    setShipModelCacheEntry('cruise', {
      available: true,
      url: './models/cruise_liner.glb',
      attachments: { funnel1: { position: [0, 1, 2], rotation: [0, 0, 0] } },
    })
    markShipModelUnavailable('cruise')
    expect(isShipModelAvailable('cruise')).toBe(false)
    // URL is kept so diagnostics can report what was attempted.
    expect(getShipModelCacheEntry('cruise')?.url).toBe('./models/cruise_liner.glb')
  })

  it('is safe for a type that was never cached', () => {
    expect(() => markShipModelUnavailable('bulk')).not.toThrow()
    expect(isShipModelAvailable('bulk')).toBe(false)
  })
})

describe('emissive slot naming', () => {
  it('opts in meshes named emissive_/glow_ only', () => {
    expect(isEmissiveSlotName('emissive_windows')).toBe(true)
    expect(isEmissiveSlotName('Glow_Funnel')).toBe(true)
    expect(isEmissiveSlotName('hull')).toBe(false)
    expect(isEmissiveSlotName('')).toBe(false)
  })

  it('clones MeshStandardMaterial slots used by both WebGL and WebGPU paths', () => {
    const root = new THREE.Group()
    const original = new THREE.MeshStandardMaterial({ name: 'emissive_windows', emissive: 0xffaa00 })
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), original)
    mesh.name = 'emissive_windows'
    root.add(mesh)

    const slots = collectEmissiveSlots(root)
    expect(slots).toHaveLength(1)
    expect(slots[0]).toBeInstanceOf(THREE.MeshStandardMaterial)
    expect(slots[0]).not.toBe(original)
    expect(mesh.material).toBe(slots[0])
    // Shared scene graph: same material type both renderers consume via GlbShipModel.
    expect((mesh.material as THREE.MeshStandardMaterial).type).toBe('MeshStandardMaterial')
  })
})
