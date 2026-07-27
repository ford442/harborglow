// =============================================================================
// EMISSIVE SLOTS — opt-in GLB surfaces driven by harbor night lighting
// =============================================================================

import * as THREE from 'three'
import { isEmissiveSlotName } from './shipModelContract'

/**
 * Clone materials on emissive-slot meshes so each ship instance can be lit
 * independently. Slots are opt-in by name (`emissive_*` / `glow_*` on the mesh
 * or on its material) — see the authoring contract in CONTRIBUTING_SHIPS.md.
 */
export function collectEmissiveSlots(root: THREE.Object3D): THREE.MeshStandardMaterial[] {
  const slots: THREE.MeshStandardMaterial[] = []

  root.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh || !mesh.material) return

    const isArray = Array.isArray(mesh.material)
    const materials = (isArray ? mesh.material : [mesh.material]) as THREE.Material[]

    let clonedAny = false
    const next = materials.map((material) => {
      const isSlot = isEmissiveSlotName(mesh.name) || isEmissiveSlotName(material.name)
      if (!isSlot) return material

      const clone = material.clone()
      clonedAny = true
      if ('emissive' in clone) slots.push(clone as THREE.MeshStandardMaterial)
      return clone
    })

    if (clonedAny) {
      mesh.material = isArray ? next : next[0]
    }
  })

  return slots
}
