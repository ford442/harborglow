// =============================================================================
// EMITTER ANCHORS — world-space poses of ship attachment points
//
// EmitterAnchors.tsx (mounted per ship inside ProceduralShip, so it inherits
// scale and bob) writes every attachment point's world pose here each frame.
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
  /** A rig is installed here (only installed points emit during shows). */
  installed: boolean
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

/** Live iterator over registered anchors (do not mutate the registry while iterating). */
export function emitterAnchors(): IterableIterator<EmitterAnchor> {
  return anchors.values()
}

export function emitterAnchorCount(): number {
  return anchors.size
}
