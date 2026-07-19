// =============================================================================
// ATTACHMENT POINT EXTRACTION — map named GLB nodes to blueprint poses
// =============================================================================

import * as THREE from 'three'
import type { ShipModelAttachmentPose } from './shipModelContract'
import { SHIP_ATTACH_PREFIX } from './shipModelContract'

function resolveAttachmentNode(root: THREE.Object3D, attachmentId: string): THREE.Object3D | null {
  const direct = root.getObjectByName(attachmentId)
  if (direct) return direct

  const prefixed = root.getObjectByName(`${SHIP_ATTACH_PREFIX}${attachmentId}`)
  if (prefixed) return prefixed

  let found: THREE.Object3D | null = null
  root.traverse((child) => {
    if (found) return
    if (child.name === attachmentId || child.name === `${SHIP_ATTACH_PREFIX}${attachmentId}`) {
      found = child
    }
  })
  return found
}

/**
 * Read local-space attachment poses from a loaded GLTF scene.
 * Node names must match blueprint `attachmentPoints` ids (optional `attach_` prefix).
 */
export function extractAttachmentPoints(
  root: THREE.Object3D,
  attachmentIds: readonly string[],
): Record<string, ShipModelAttachmentPose> {
  const result: Record<string, ShipModelAttachmentPose> = {}
  const pos = new THREE.Vector3()
  const quat = new THREE.Quaternion()
  const scale = new THREE.Vector3()
  const euler = new THREE.Euler()
  const rootInverse = new THREE.Matrix4()
  const localMatrix = new THREE.Matrix4()

  root.updateWorldMatrix(true, true)
  rootInverse.copy(root.matrixWorld).invert()

  for (const id of attachmentIds) {
    const node = resolveAttachmentNode(root, id)
    if (!node) continue

    node.updateWorldMatrix(true, false)
    localMatrix.multiplyMatrices(rootInverse, node.matrixWorld)
    localMatrix.decompose(pos, quat, scale)
    euler.setFromQuaternion(quat)

    result[id] = {
      position: [pos.x, pos.y, pos.z],
      rotation: [euler.x, euler.y, euler.z],
    }
  }

  return result
}
