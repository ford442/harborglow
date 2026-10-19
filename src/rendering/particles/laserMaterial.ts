// =============================================================================
// VOLUMETRIC LASERS — additive TSL cylinders, depth-faded against the
// viewport depth copy (the same scene depth the god-ray pass reads later).
// =============================================================================

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  float,
  linearDepth,
  smoothstep,
  uv,
  vec3,
  viewportDepthTexture,
} from 'three/tsl'
import type { Node } from 'three/webgpu'

export function createLaserMaterial(
  uTreble: Node<'float'>,
  uBeatPhase: Node<'float'>,
): MeshBasicNodeMaterial {
  const vUv = uv()
  const along = smoothstep(float(0), float(0.08), vUv.y).mul(smoothstep(float(1), float(0.72), vUv.y))
  const fragDepth = linearDepth()
  const sceneDepth = linearDepth(viewportDepthTexture())
  const depthFade = smoothstep(float(0), float(2), sceneDepth.sub(fragDepth))
  const pulse = float(0.35).add(uTreble.mul(0.9)).mul(float(1).sub(uBeatPhase.mul(0.35)))
  const alpha = depthFade.mul(pulse).mul(along)

  const material = new MeshBasicNodeMaterial()
  material.transparent = true
  material.depthWrite = false
  material.depthTest = true
  material.blending = THREE.AdditiveBlending
  material.toneMapped = false
  material.side = THREE.DoubleSide
  // InstancedMesh multiplies `instanceColor` into colorNode when the attribute is set.
  material.colorNode = vec3(pulse)
  material.opacityNode = alpha
  return material
}
