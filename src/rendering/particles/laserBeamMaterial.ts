// =============================================================================
// LASER BEAM MATERIAL — additive volumetric cylinders with depth fade (#248)
//
// Geometry: an open cylinder along local +Y from y=0 (rig) to y=1 (far end),
// scaled per instance. The look is three soft terms:
//   core   — view-angle falloff (bright where the surface faces the camera),
//            which reads as a glowing shaft instead of a hard tube
//   length — fades towards the far end (uv.y)
//   depth  — soft intersection with scene geometry (hull, dock, water)
//
// Depth fade samples `viewportDepthTexture()`, not the god-rays pass depth:
// beams render *inside* PostProcessing's scenePass, so that pass's depth is
// the attachment being written. viewportDepthTexture copies the opaque depth
// drawn so far (three handles the MSAA case with a multisampled depth binding).
// Beams don't write depth, so they still feed bloom and god rays through colour
// and never occlude the rays.
// =============================================================================

import * as THREE from 'three/webgpu'
import {
  abs,
  cameraFar,
  cameraNear,
  dot,
  float,
  normalView,
  normalize,
  perspectiveDepthToViewZ,
  positionView,
  pow,
  saturate,
  uniform,
  uv,
  viewportDepthTexture,
} from 'three/tsl'
import { fxUniforms } from './fxFrameUniforms'

export interface LaserBeamMaterialOptions {
  /** Soft-intersect with scene depth (skip on `low`: saves the depth copy). */
  depthFade: boolean
  /** Distance over which a beam fades into geometry it hits, m. */
  softnessM?: number
}

export interface LaserBeamUserData {
  /** 0..1 pattern gate written by LaserBeamLayer (strobe / blackout). */
  uGate: { value: number }
  depthFade: boolean
}

export function createLaserBeamMaterial({ depthFade, softnessM = 1.5 }: LaserBeamMaterialOptions): THREE.MeshBasicNodeMaterial {
  const uGate = uniform(1)
  const u = fxUniforms

  const facing = abs(dot(normalize(normalView), normalize(positionView.negate())))
  const core = pow(facing, 2.5)
  const along = saturate(uv().y)
  const lengthFade = pow(float(1).sub(along), 1.4)
  const audio = float(0.65).add(u.uTreble.mul(0.6)).add(u.uBeatPulse.mul(0.35))
  let alpha = core.mul(lengthFade).mul(audio).mul(u.uCueIntensity).mul(uGate)

  if (depthFade) {
    const sceneViewZ = perspectiveDepthToViewZ(viewportDepthTexture(), cameraNear, cameraFar)
    const soft = saturate(positionView.z.sub(sceneViewZ).div(softnessM))
    alpha = alpha.mul(soft)
  }

  const mat = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  // Every beam takes the active cue colour.
  mat.colorNode = u.uCueColor.mul(1.6)
  mat.opacityNode = alpha
  const userData: LaserBeamUserData = { uGate, depthFade }
  mat.userData = userData as unknown as Record<string, unknown>
  return mat
}

/** Unit beam: open cylinder from y=0 to y=1, radius 1 at the far end, 0.25 at the rig. */
export function createLaserBeamGeometry(): THREE.CylinderGeometry {
  const g = new THREE.CylinderGeometry(1, 0.25, 1, 12, 1, true)
  g.translate(0, 0.5, 0)
  return g
}
