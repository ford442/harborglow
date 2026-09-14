// =============================================================================
// ATTACHMENT POINT EXTRACTION — map named GLB nodes to blueprint poses
// =============================================================================

import * as THREE from 'three'
import type { ShipModelAttachmentPose } from './shipModelContract'
import { socketCandidateNames } from './shipSocketResolution.mjs'

/**
 * Resolve one blueprint attachment id to a scene node using the shared
 * candidate order (socket map → exact name → `attach_` prefix). The order lives
 * in `shipSocketResolution.mjs` so `verify-ship-glb.mjs` gates exactly what the
 * runtime accepts.
 */
function resolveAttachmentNode(
  root: THREE.Object3D,
  attachmentId: string,
  /** GLB node name → blueprint attachment id. */
  socketMap: Record<string, string> = {},
): THREE.Object3D | null {
  for (const name of socketCandidateNames(attachmentId, socketMap)) {
    const node = root.getObjectByName(name)
    if (node) return node
  }
  return null
}

/**
 * Read local-space attachment poses from a loaded GLTF scene.
 * Node names must match blueprint `attachmentPoints` ids (optional `attach_` prefix),
 * or be listed in the blueprint's `model.attachmentSocketMap`.
 */
export function extractAttachmentPoints(
  root: THREE.Object3D,
  attachmentIds: readonly string[],
  socketMap: Record<string, string> = {},
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
    const node = resolveAttachmentNode(root, id, socketMap)
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
