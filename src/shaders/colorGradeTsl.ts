// =============================================================================
// COLOR GRADE TSL — harbor LUT, vignette, grain
// ACES is applied by RenderPipeline outputColorTransform (renderer tone mapping).
// =============================================================================

import * as THREE from 'three'
import { clamp, dot, float, fract, hash, length, mix, sin, smoothstep, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { tsl } from './tslCast'

export type ColorGradeLut = {
  brightness: number
  contrast: number
  saturation: number
  warmth: number
  tint: [number, number, number]
  shadows: [number, number, number]
  highlights: [number, number, number]
}

export function createColorGradeUniforms(
  lut: ColorGradeLut,
  vignette: number,
  ca: number,
  grain: number,
) {
  return {
    uBrightness: uniform(lut.brightness),
    uContrast: uniform(lut.contrast),
    uSaturation: uniform(lut.saturation),
    uWarmth: uniform(lut.warmth),
    uTint: uniform(new THREE.Vector3(...lut.tint)),
    uShadows: uniform(new THREE.Vector3(...lut.shadows)),
    uHighlights: uniform(new THREE.Vector3(...lut.highlights)),
    uVignette: uniform(vignette),
    uChromaticAberration: uniform(ca),
    uFilmGrain: uniform(grain),
    uTime: uniform(0),
    uBeatPulse: uniform(0),
  }
}

export type ColorGradeUniforms = ReturnType<typeof createColorGradeUniforms>

export function applyColorGrade(input: ReturnType<typeof vec4>, u: ColorGradeUniforms) {
  const uvCoord = uv()
  const center = uvCoord.sub(vec2(0.5, 0.5))
  const dist = length(center)

  let color = tsl(input.rgb)
  const ab = u.uChromaticAberration.mul(float(1).add(u.uBeatPulse.mul(0.5)))
  color = tsl(vec3(color.x.add(ab), color.y, color.z.sub(ab)))

  const luma = dot(color, vec3(0.299, 0.587, 0.114))
  const shadowTint = mix(vec3(1, 1, 1), u.uShadows, float(1).sub(smoothstep(float(0), float(0.3), luma)))
  const highlightTint = mix(vec3(1, 1, 1), u.uHighlights, smoothstep(float(0.7), float(1), luma))
  color = tsl(color.mul(shadowTint).mul(highlightTint))

  const warmthTint = mix(vec3(0.9, 0.95, 1.0), vec3(1.0, 0.9, 0.8), u.uWarmth.mul(0.5).add(0.5))
  color = tsl(color.mul(warmthTint))

  const gray = dot(color, vec3(0.299, 0.587, 0.114))
  color = tsl(mix(vec3(gray, gray, gray), color, u.uSaturation))
  color = tsl(color.sub(0.5).mul(u.uContrast).add(0.5))
  color = tsl(color.mul(u.uBrightness))

  const vignetteAmt = float(1).sub(dist.mul(u.uVignette).mul(float(0.8).add(u.uBeatPulse.mul(0.3))))
  color = tsl(color.mul(vignetteAmt))

  const grain = hash(uvCoord.add(u.uTime.mul(0.01)))
  const grainB = fract(sin(dot(uvCoord.add(u.uTime.mul(0.01)), vec2(12.9898, 78.233))).mul(43758.5453))
  color = tsl(color.add(grain.add(grainB).mul(0.5).sub(0.5).mul(u.uFilmGrain).mul(float(1).add(u.uBeatPulse.mul(0.5)))))
  color = tsl(color.add(u.uTint.mul(0.1)))
  color = tsl(clamp(color, float(0), float(1)))

  return vec4(color, 1)
}
