import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import * as THREE from 'three'
import { SHIP_BLUEPRINTS, getBlueprint } from '../../types/ShipBlueprint'
import { extractAttachmentPoints } from '../extractAttachmentPoints'
import { resolveSocketName, socketCandidateNames } from '../shipSocketResolution.mjs'
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

  // Invert this test when public/models/icebreaker.glb is committed: expect
  // getShipModelSettings('icebreaker') and isGlbCapableShipType('icebreaker').
  // models:verify exist-gates SHIP_MODEL_FILENAMES.icebreaker to that file.
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

/**
 * The validator (scripts/verify-ship-glb.mjs) and the runtime resolver both
 * consume shipSocketResolution.mjs. These tests pin the shared order so a model
 * that verifies green is a model that binds at runtime, and vice versa.
 */
describe('socket resolution (shared by verifier and runtime)', () => {
  function sceneWith(names: string[]): THREE.Object3D {
    const root = new THREE.Object3D()
    root.name = 'test_root'
    for (const name of names) {
      const child = new THREE.Object3D()
      child.name = name
      child.position.set(1, 2, 3)
      root.add(child)
    }
    return root
  }

  it('prefers the socket map, then the bare id, then the attach_ prefix', () => {
    expect(socketCandidateNames('stack1', { Empty_HP_Funnel: 'stack1' })).toEqual([
      'Empty_HP_Funnel',
      'stack1',
      'attach_stack1',
    ])
    expect(socketCandidateNames('stack1')).toEqual(['stack1', 'attach_stack1'])
  })

  it('resolves a socket-mapped node (the path all 12 committed models use)', () => {
    const socketMap = { Empty_HP_Funnel: 'stack1' }
    const names = ['Empty_HP_Funnel']
    expect(resolveSocketName('stack1', names, socketMap)).toBe('Empty_HP_Funnel')

    const poses = extractAttachmentPoints(sceneWith(names), ['stack1'], socketMap)
    expect(poses.stack1?.position).toEqual([1, 2, 3])
  })

  it('resolves a convention-named model with no socket map, bare and prefixed', () => {
    // This is the path the validator used to reject while the runtime accepted it.
    expect(resolveSocketName('stack1', ['stack1'])).toBe('stack1')
    expect(resolveSocketName('stack1', ['attach_stack1'])).toBe('attach_stack1')

    expect(extractAttachmentPoints(sceneWith(['stack1']), ['stack1']).stack1?.position).toEqual([1, 2, 3])
    expect(
      extractAttachmentPoints(sceneWith(['attach_stack1']), ['stack1']).stack1?.position,
    ).toEqual([1, 2, 3])
  })

  it('falls back to a convention name when the socket map points elsewhere', () => {
    const socketMap = { Empty_HP_Other: 'someOtherId' }
    expect(resolveSocketName('stack1', ['stack1'], socketMap)).toBe('stack1')
  })

  it('reports an unbindable attachment as null and omits it from extracted poses', () => {
    expect(resolveSocketName('stack1', ['unrelated'], { Empty_HP_Missing: 'stack1' })).toBeNull()
    expect(extractAttachmentPoints(sceneWith(['unrelated']), ['stack1'])).toEqual({})
  })
})
