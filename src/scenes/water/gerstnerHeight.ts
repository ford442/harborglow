// =============================================================================
// GERSTNER HEIGHT — CPU reference matching Water TSL / archived GLSL
// =============================================================================

export const MAX_WAVE_LAYERS = 4
export const MAX_DYNAMIC_LIGHTS = 6

export interface GerstnerLayer {
  amplitude: number
  frequency: number
  speed: number
  direction: [number, number]
  steepness: number
}

/**
 * Wave height at world XZ. Same formula as the live TSL ocean (and the GLSL comment).
 */
export function gerstnerHeight(
  worldX: number,
  worldZ: number,
  t: number,
  layers: GerstnerLayer[],
  globalAmp: number,
  globalSpeed: number,
  stormIntensity: number,
): number {
  const stormAmp = 1 + stormIntensity * 2
  let height = 0
  const count = Math.min(MAX_WAVE_LAYERS, layers.length)
  for (let i = 0; i < count; i++) {
    const amp = layers[i].amplitude * globalAmp * stormAmp
    const freq = layers[i].frequency
    const spd = layers[i].speed * globalSpeed
    const dir = layers[i].direction
    const phase = worldX * dir[0] + worldZ * dir[1]
    height += amp * Math.sin(phase * freq + t * spd)
  }
  return height
}

export function gerstnerRippleDetail(
  worldX: number,
  worldZ: number,
  t: number,
  stormIntensity: number,
): number {
  if (stormIntensity < 0.1) return 0
  let ripple = 0
  ripple += Math.sin(worldX * 12 + t * 3) * Math.cos(worldZ * 12 + t * 2.5)
  ripple += Math.sin(worldX * 18 - t * 4) * Math.cos(worldZ * 16 + t * 3.5)
  return ripple * stormIntensity * 0.03
}
