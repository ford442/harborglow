// =============================================================================
// GLB SHIP MODEL — LOD0 hull rendered from public/models/*.glb
// Lazy-imported by ProceduralShip so GLB code stays out of the main scene chunk.
// =============================================================================

import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

function applyShadowFlags(object: THREE.Object3D): void {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })
}

function GlbShipModelInner({ url }: { url: string }) {
  const { scene } = useGLTF(url, true, true)

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    applyShadowFlags(clone)
    return clone
  }, [scene])

  return <primitive object={clonedScene} />
}

export interface GlbShipModelProps {
  shipType: string
  url: string
}

/** Parent must only mount when cache reports the model is available. */
export function GlbShipModel({ url }: GlbShipModelProps) {
  return <GlbShipModelInner url={url} />
}

export default GlbShipModel
