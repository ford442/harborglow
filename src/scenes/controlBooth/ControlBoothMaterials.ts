import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { distance, float, pow, sin, cos, smoothstep, texture, time, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'

// =============================================================================
// TSL NODE MATERIALS FOR CONTROL BOOTH (replaces drei GLSL shaderMaterial, #208)
// =============================================================================

export interface CRTMaterialOptions {
  flickerIntensity?: number
  scanlineIntensity?: number
  vignetteIntensity?: number
  rgbShift?: number
}

// CRT scanline + flicker + RGB shift + vignette over a monitor feed texture.
export const createCRTMaterial = (map: THREE.Texture, opts: CRTMaterialOptions = {}) => {
  const uFlicker = uniform(opts.flickerIntensity ?? 0.02)
  const uScanline = uniform(opts.scanlineIntensity ?? 0.15)
  const uVignette = uniform(opts.vignetteIntensity ?? 0.3)
  const uRgbShift = uniform(opts.rgbShift ?? 0.002)

  const vUv = uv()
  const flicker = float(1)
    .add(sin(time.mul(10)).mul(uFlicker).mul(0.5))
    .add(sin(time.mul(23.7)).mul(uFlicker).mul(0.3))
  const shift = vec2(uRgbShift, 0)
  const r = texture(map, vUv.add(shift)).r
  const g = texture(map, vUv).g
  const b = texture(map, vUv.sub(shift)).b
  const scanline = pow(sin(vUv.y.mul(800)).mul(0.5).add(0.5), 2).mul(uScanline)
  const vignette = smoothstep(0.3, 0.9, distance(vUv, vec2(0.5))).mul(uVignette)
  const color = vec3(r, g, b).mul(flicker).sub(scanline).mul(float(1).sub(vignette)).mul(vec3(1.05, 1, 0.95))

  const material = new MeshBasicNodeMaterial()
  material.colorNode = vec4(color, 1)
  material.toneMapped = false
  return {
    material,
    uniforms: { flickerIntensity: uFlicker, scanlineIntensity: uScanline, vignetteIntensity: uVignette, rgbShift: uRgbShift },
  }
}

export interface FoggedGlassMaterialOptions {
  fogDensity?: number
  opacity?: number
}

// Animated condensation on the cab window.
export const createFoggedGlassMaterial = (opts: FoggedGlassMaterialOptions = {}) => {
  const uFogDensity = uniform(opts.fogDensity ?? 0.3)
  const uOpacity = uniform(opts.opacity ?? 0.15)

  const vUv = uv()
  const wave = sin(vUv.x.mul(20).add(time.mul(0.1))).mul(cos(vUv.y.mul(15).add(time.mul(0.15))))
  const fog = pow(wave.mul(0.5).add(0.5), 3).mul(uFogDensity)
  const color = vec3(0.85, 0.9, 0.95).mul(fog.mul(0.2).add(0.9))

  const material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
  material.colorNode = vec4(color, uOpacity.add(fog.mul(0.1)))
  return { material, uniforms: { fogDensity: uFogDensity, opacity: uOpacity } }
}

// Material factory
export interface ThemeConfig {
  wall: number
  accent: number
  metal: number
}

export const getThemeConfig = (harborTheme: 'industrial' | 'arctic' | 'tropical'): ThemeConfig => {
  switch (harborTheme) {
    case 'arctic':
      return { wall: 0xc5d5e0, accent: 0x00aaff, metal: 0x4a5568 }
    case 'tropical':
      return { wall: 0xd4c4a8, accent: 0xff9500, metal: 0x5a5a5a }
    default:
      return { wall: 0x2a2a35, accent: 0xff6600, metal: 0x3a3a45 }
  }
}

export const createControlBoothMaterials = (harborTheme: 'industrial' | 'arctic' | 'tropical') => {
  const theme = getThemeConfig(harborTheme)
  
  return {
    wall: new THREE.MeshStandardMaterial({
      color: theme.wall,
      metalness: 0.7,
      roughness: 0.6,
      side: THREE.DoubleSide
    }),
    floor: new THREE.MeshStandardMaterial({
      color: 0x1a1a20,
      metalness: 0.5,
      roughness: 0.8,
      side: THREE.DoubleSide
    }),
    metalFrame: new THREE.MeshStandardMaterial({
      color: theme.metal,
      metalness: 0.9,
      roughness: 0.3
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.4
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.05,
      transmission: 0.95,
      thickness: 0.1,
      transparent: true,
      opacity: 0.1,
      envMapIntensity: 1
    }),
    foggedGlass: new THREE.MeshPhysicalMaterial({
      color: 0xe8f4f8,
      metalness: 0.1,
      roughness: 0.2,
      transmission: 0.7,
      thickness: 0.05,
      transparent: true,
      opacity: 0.3,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: theme.accent,
      emissive: theme.accent,
      emissiveIntensity: 0.2,
      metalness: 0.6,
      roughness: 0.4
    }),
    buttonActive: new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.3
    }),
    buttonInactive: new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.5,
      roughness: 0.5
    })
  }
}
