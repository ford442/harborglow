// =============================================================================
// EMITTER ANCHORS — world-space poses of installed attachment points
//
// EmitterAnchors.tsx (mounted per ship inside ProceduralShip, so it inherits
// scale and bob) writes each installed point's world pose here every frame.
// Entries are mutated in place, like the rig flare registry in
// lightRigs/rigPolish.ts.
// =============================================================================

import * as THREE from 'three'
import type { RigType } from '../../systems/attachmentSystem'
import type { RigGroupId } from '../../systems/lightShows/types'

export interface EmitterAnchor {
  key: string
  shipId: string
  shipType: string
  partName: string
  rigType: RigType
  group: RigGroupId
  position: THREE.Vector3
  quaternion: THREE.Quaternion
}

const anchors = new Map<string, EmitterAnchor>()

export function emitterAnchorKey(shipId: string, partName: string): string {
  return `${shipId}:${partName}`
}

export function setEmitterAnchor(key: string, anchor: EmitterAnchor | null): void {
  if (anchor) anchors.set(key, anchor)
  else anchors.delete(key)
}

export function getEmitterAnchor(key: string): EmitterAnchor | undefined {
  return anchors.get(key)
}

export function forEachEmitterAnchor(visit: (anchor: EmitterAnchor) => void): void {
  anchors.forEach(visit)
}

export function emitterAnchorCount(): number {
  return anchors.size
}
