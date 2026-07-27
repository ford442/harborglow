// =============================================================================
// GLB SHIP MODEL — LOD0 hull rendered from public/models/*.glb
// Lazy-imported by ProceduralShip so GLB code stays out of the main scene chunk.
// =============================================================================

import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useGameStore } from '../store/useGameStore'
import { collectEmissiveSlots } from './emissiveSlots'

function applyShadowFlags(object: THREE.Object3D): void {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })
}

function GlbShipModelInner({ url, scale, yOffset }: { url: string; scale: number; yOffset: number }) {
  const { scene } = useGLTF(url, true, true)
  const isNight = useGameStore((state) => state.isNight)
  const lightIntensity = useGameStore((state) => state.lightIntensity)

  const { clonedScene, emissiveSlots } = useMemo(() => {
    const clone = scene.clone(true)
    applyShadowFlags(clone)
    return { clonedScene: clone, emissiveSlots: collectEmissiveSlots(clone) }
  }, [scene])

  // Same night curve the procedural body uses, so a GLB hull and its procedural
  // neighbours read as the same harbor at the same hour.
  useMemo(() => {
    const intensity = (isNight ? 0.3 : 0.07) * lightIntensity
    for (const material of emissiveSlots) {
      material.emissiveIntensity = intensity
      material.needsUpdate = true
    }
  }, [emissiveSlots, isNight, lightIntensity])

  return <primitive object={clonedScene} position={[0, yOffset, 0]} scale={scale} />
}

export interface GlbShipModelProps {
  shipType: string
  url: string
  /** Multiplier on top of the blueprint scale (from ShipModelConfig). */
  scale?: number
  /** Vertical nudge in metres (from ShipModelConfig). */
  yOffset?: number
}

/** Parent must only mount when cache reports the model is available. */
export function GlbShipModel({ url, scale = 1, yOffset = 0 }: GlbShipModelProps) {
  return <GlbShipModelInner url={url} scale={scale} yOffset={yOffset} />
}

export default GlbShipModel
