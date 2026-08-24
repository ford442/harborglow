// =============================================================================
// GOD RAYS TSL — radial blur + depth occlusion (port of GodRaysShader GLSL)
// =============================================================================

import * as THREE from 'three'
import {
  Break,
  Fn,
  If,
  Loop,
  float,
  int,
  luminance,
  smoothstep,
  uniform,
  uv,
  vec3,
  vec4,
} from 'three/tsl'

/**
 * GLSL ShaderPass reference (not executed):
 * radial blur toward uLightPos, occlusion via depth delta, luminance gate.
 */

export function createGodRaysUniforms() {
  return {
    uLightPos: uniform(new THREE.Vector2(0.5, 0.5)),
    uExposure: uniform(0.35),
    uDecay: uniform(0.96),
    uDensity: uniform(0.92),
    uWeight: uniform(0.12),
    uSamples: uniform(32),
    uEnabled: uniform(1),
  }
}

export type GodRaysUniforms = ReturnType<typeof createGodRaysUniforms>

export function applyGodRays(colorTex: any, depthTex: any, u: GodRaysUniforms) {
  return Fn(() => {
    const uvCoord = uv()
    const baseColor = colorTex.sample(uvCoord)
    const result = baseColor.toVar()

    If(u.uEnabled.greaterThan(0.5), () => {
      const texCoord = uvCoord.toVar()
      const deltaTexCoord = texCoord.sub(u.uLightPos).mul(u.uDensity).div(u.uSamples)
      const centerDepth = depthTex.sample(uvCoord).r
      const illuminationDecay = float(1).toVar()
      const godRayColor = vec3(0, 0, 0).toVar()

      Loop({ start: int(0), end: int(64), type: 'int', condition: '<' }, ({ i }) => {
        If(float(i).greaterThanEqual(u.uSamples), () => {
          Break()
        })
        texCoord.subAssign(deltaTexCoord)
        const sampleColor = colorTex.sample(texCoord).rgb.toVar()
        const sampleDepth = depthTex.sample(texCoord).r
        const occlusion = smoothstep(float(0.002), float(0.018), sampleDepth.sub(centerDepth))
        const bright = smoothstep(float(0.42), float(0.88), luminance(sampleColor))
        sampleColor.assign(sampleColor.mul(occlusion).mul(bright))
        sampleColor.mulAssign(illuminationDecay.mul(u.uWeight))
        godRayColor.addAssign(sampleColor)
        illuminationDecay.mulAssign(u.uDecay)
      })

      result.assign(vec4(baseColor.rgb.add(godRayColor.mul(u.uExposure)), baseColor.a))
    })

    return result
  })()
}
