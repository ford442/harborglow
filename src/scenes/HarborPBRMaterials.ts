// =============================================================================
// HARBOR PBR MATERIALS — TSL MeshStandardNodeMaterial (wetness / rust / wood)
// GLSL onBeforeCompile path retired; HARBOR_NOISE_GLSL is reference only.
// =============================================================================

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { MeshStandardNodeMaterial } from 'three/webgpu'
import { abs, atan, clamp, float, fract, mix, positionWorld, sin, smoothstep, step, uniform, vec2, vec3 } from 'three/tsl'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import type { WeatherState } from '../store/gameStoreTypes'
import {
  getLookDevSettings,
  METAL_HARBOR_KINDS,
  WOOD_HARBOR_KINDS,
} from '../utils/lookDevControls'
import { tsl } from '../shaders/tslCast'
import { harborFbm, harborSnoise } from './harborNoiseTsl'

/** Reference simplex/fbm GLSL (not compiled). Live noise is harborNoiseTsl.ts. */
export const HARBOR_NOISE_GLSL = /* glsl */ `
  // harborSnoise / harborFbm — see git history. TSL uses mx_noise_float.
`

export type HarborMaterialKind =
  | 'weatheredWood'
  | 'weatheredWoodDeck'
  | 'corrodedSteel'
  | 'pilingTimber'
  | 'wetRubber'
  | 'cautionStripe'
  | 'railSteel'

export interface HarborMaterialOptions {
  baseColor?: string
  roughness?: number
  metalness?: number
  weathering?: number
}

export interface HarborEnvironment {
  wetness: number
  nightFactor: number
  weather: WeatherState
  isNight: boolean
}

export function computeHarborWetness(weather: WeatherState, isNight: boolean): number {
  switch (weather) {
    case 'storm':
      return 1.0
    case 'rain':
      return 0.78
    case 'fog':
      return isNight ? 0.42 : 0.22
    default:
      return isNight ? 0.32 : 0.06
  }
}

export function useHarborEnvironment(): HarborEnvironment {
  const weather = useGameStore((s) => s.weather)
  const isNight = useGameStore((s) => s.isNight)
  const wetness = computeHarborWetness(weather, isNight)
  return { wetness, nightFactor: isNight ? 1 : 0, weather, isNight }
}

function createHarborUniforms(weathering: number) {
  return {
    uWetness: uniform(0),
    uNightFactor: uniform(0),
    uWeathering: uniform(weathering),
    uTime: uniform(0),
    uPuddleStrength: uniform(1),
  }
}

type HarborUniforms = ReturnType<typeof createHarborUniforms>

const DEFAULTS: Record<HarborMaterialKind, Required<HarborMaterialOptions>> = {
  weatheredWood: { baseColor: '#6b4423', roughness: 0.92, metalness: 0.04, weathering: 0.55 },
  weatheredWoodDeck: { baseColor: '#7a4f28', roughness: 0.88, metalness: 0.06, weathering: 0.65 },
  corrodedSteel: { baseColor: '#4a4a4a', roughness: 0.48, metalness: 0.72, weathering: 0.75 },
  pilingTimber: { baseColor: '#4a3728', roughness: 0.94, metalness: 0.02, weathering: 0.7 },
  wetRubber: { baseColor: '#141414', roughness: 0.96, metalness: 0, weathering: 0.5 },
  cautionStripe: { baseColor: '#c9a800', roughness: 0.82, metalness: 0.08, weathering: 0.6 },
  railSteel: { baseColor: '#5a5a5a', roughness: 0.38, metalness: 0.68, weathering: 0.65 },
}

function bindHarborKind(
  mat: MeshStandardNodeMaterial,
  kind: HarborMaterialKind,
  u: HarborUniforms,
  baseRough: number,
  baseMetal: number,
) {
  const wp = positionWorld
  let color = tsl(mat.colorNode ?? vec3(mat.color.r, mat.color.g, mat.color.b))
  let roughness = tsl(float(baseRough))
  let metalnessN = tsl(float(baseMetal))

  if (kind === 'weatheredWoodDeck') {
    const plankU = wp.x.mul(0.5)
    const plankFrac = fract(plankU)
    const plankId = plankU.sub(plankFrac)
    const gap = float(1).sub(smoothstep(float(0.02), float(0.05), abs(plankFrac.sub(0.5)).sub(0.44)))
    const grain = harborFbm(vec2(wp.x.mul(0.15), wp.z.mul(6)))
    const plankTone = float(0.88).add(fract(plankId.mul(0.173)).mul(0.18)).add(grain.mul(0.12))
    color = color.mul(plankTone)
    color = mix(color, color.mul(0.35), gap)
    const boltGrid = step(float(0.92), fract(plankU)).mul(
      step(float(0.85), float(1).sub(abs(fract(wp.z.mul(0.14)).sub(0.5)).mul(2))),
    )
    color = mix(color, color.mul(0.55), boltGrid.mul(0.7))
    const puddle = gap.mul(u.uWetness).mul(u.uPuddleStrength).mul(float(0.55).add(harborSnoise(wp.xz.mul(0.4)).mul(0.25)))
    color = color.mul(float(1).sub(puddle.mul(0.35)))
    color = color.mul(float(1).sub(u.uNightFactor.mul(0.18)))
    roughness = clamp(roughness.sub(puddle.mul(0.55)).add(gap.mul(0.08)), float(0.04), float(1))
    metalnessN = mix(metalnessN, float(0.18), puddle.mul(0.35))
  } else if (kind === 'weatheredWood') {
    const grain = harborFbm(vec2(wp.x.mul(0.2), wp.z.mul(4)))
    color = color.mul(float(0.82).add(grain.mul(0.22)))
    const scuff = smoothstep(float(0.45), float(0.75), harborFbm(wp.xz.mul(0.35))).mul(u.uWeathering)
    color = mix(color, color.mul(0.65), scuff.mul(0.35))
    const wet = u.uWetness.mul(float(0.35).add(grain.mul(0.35)))
    color = color.mul(float(1).sub(wet.mul(0.28)))
    roughness = clamp(roughness.sub(wet.mul(0.45)), float(0.08), float(1))
  } else if (kind === 'corrodedSteel') {
    const uvn = vec2(wp.x.mul(0.35), wp.y.mul(1.8).add(wp.z.mul(0.25)))
    const rust = harborFbm(uvn.mul(vec2(0.6, 2.4)))
    const streaks = harborFbm(vec2(uvn.x.mul(0.25), uvn.y.mul(8)))
    const rustAmt = smoothstep(float(0.35), float(0.72), rust.mul(streaks)).mul(u.uWeathering)
    color = mix(color, vec3(0.52, 0.28, 0.12), rustAmt.mul(0.65))
    const salt = smoothstep(float(0.55), float(0.85), harborSnoise(uvn.mul(6))).mul(u.uWetness).mul(0.35)
    color = mix(color, vec3(0.82, 0.84, 0.78), salt)
    let ropeWear = tsl(smoothstep(float(0.15), float(0.35), wp.y).mul(float(1).sub(smoothstep(float(1.2), float(1.8), wp.y))))
    ropeWear = ropeWear.mul(float(0.5).add(harborSnoise(vec2(wp.x.mul(3), wp.z.mul(3))).mul(0.5)))
    color = mix(color, color.mul(0.55), ropeWear.mul(0.45))
    roughness = clamp(roughness.add(rustAmt.mul(0.25)).sub(salt.mul(0.12)).sub(u.uWetness.mul(0.18)), float(0.12), float(0.95))
    metalnessN = clamp(metalnessN.sub(rustAmt.mul(0.45)).add(salt.mul(0.05)), float(0.05), float(0.9))
  } else if (kind === 'pilingTimber') {
    const grain = harborFbm(vec2(atan(wp.z, wp.x).mul(2), wp.y.mul(0.8)))
    color = color.mul(float(0.78).add(grain.mul(0.28)))
    const waterline = smoothstep(float(-0.2), float(-1.4), wp.y)
    const algae = harborSnoise(vec2(wp.x.mul(2), wp.y.mul(4))).mul(waterline)
    color = mix(color, vec3(0.18, 0.28, 0.22), algae.mul(0.45))
    const rustBand = waterline.mul(harborFbm(vec2(wp.x.mul(0.5), wp.y.mul(3))))
    color = mix(color, vec3(0.45, 0.24, 0.1), rustBand.mul(0.35).mul(u.uWeathering))
    const wet = u.uWetness.mul(waterline)
    color = color.mul(float(1).sub(wet.mul(0.32)))
    roughness = clamp(roughness.sub(wet.mul(0.35)).add(waterline.mul(0.12)), float(0.2), float(1))
  } else if (kind === 'wetRubber') {
    const uvn = vec2(wp.x, wp.z).mul(vec2(0.5, 2))
    const ribs = float(0.85).add(sin(uvn.y.mul(28).add(harborSnoise(uvn.mul(2)).mul(0.5))).mul(0.15))
    const scuff = smoothstep(float(0.3), float(0.75), harborFbm(uvn.mul(4))).mul(u.uWeathering)
    color = color.mul(ribs)
    color = mix(color, vec3(0.22, 0.22, 0.22), scuff.mul(0.55))
    const wet = u.uWetness.mul(0.85)
    color = color.mul(float(1).sub(wet.mul(0.22)))
    roughness = clamp(roughness.sub(wet.mul(0.35)).add(scuff.mul(0.15)), float(0.55), float(1))
  } else if (kind === 'cautionStripe') {
    const chip = harborFbm(wp.xz.mul(3.5))
    const wear = smoothstep(float(0.42), float(0.78), chip).mul(u.uWeathering)
    color = mix(color, vec3(0.08, 0.08, 0.06), wear.mul(0.7))
    const wet = u.uWetness.mul(0.5)
    color = color.mul(float(1).sub(wet.mul(0.18)))
    roughness = clamp(roughness.sub(wet.mul(0.2)).add(wear.mul(0.25)), float(0.25), float(0.95))
  } else {
    const topWear = smoothstep(float(0.15), float(0.45), wp.y).mul(harborFbm(wp.xz.mul(0.8)))
    color = mix(color, color.mul(1.15), topWear.mul(0.35))
    const oil = smoothstep(float(0.55), float(0.82), harborFbm(wp.xz.mul(1.6).add(2.7)))
    color = mix(color, vec3(0.04, 0.04, 0.03), oil.mul(0.55).mul(u.uWeathering))
    const scuff = harborSnoise(wp.xz.mul(2.2)).mul(topWear)
    color = mix(color, vec3(0.35, 0.34, 0.32), scuff.mul(0.25))
    const wet = u.uWetness.mul(float(0.4).add(topWear.mul(0.35)))
    color = color.mul(float(1).sub(wet.mul(0.2)))
    roughness = clamp(roughness.sub(topWear.mul(0.22)).sub(wet.mul(0.25)).add(oil.mul(0.18)), float(0.1), float(0.85))
    metalnessN = clamp(metalnessN.add(topWear.mul(0.12)).sub(oil.mul(0.35)), float(0.15), float(0.85))
  }

  mat.colorNode = color
  mat.roughnessNode = roughness
  mat.metalnessNode = metalnessN
}

export function createHarborMaterial(
  kind: HarborMaterialKind,
  options: HarborMaterialOptions = {},
): MeshStandardNodeMaterial {
  const defaults = DEFAULTS[kind]
  const baseColor = options.baseColor ?? defaults.baseColor
  const roughness = options.roughness ?? defaults.roughness
  const metalnessVal = options.metalness ?? defaults.metalness
  const weathering = options.weathering ?? defaults.weathering

  const material = new MeshStandardNodeMaterial()
  material.color.set(baseColor)
  material.roughness = roughness
  material.metalness = metalnessVal

  const uniforms = createHarborUniforms(weathering)

  material.colorNode = vec3(material.color.r, material.color.g, material.color.b)
  bindHarborKind(material, kind, uniforms, roughness, metalnessVal)

  material.userData.harborKind = kind
  material.userData.harborUniforms = uniforms

  return material
}

function applyEnvironmentToMaterial(
  material: MeshStandardNodeMaterial,
  env: HarborEnvironment,
  elapsed: number,
  dayColor: string,
  nightColor: string,
  kind: HarborMaterialKind,
  baseWeathering: number,
) {
  const lookDev = getLookDevSettings()
  const wetness = env.wetness * lookDev.surfaceWetness
  const uniforms = material.userData.harborUniforms as HarborUniforms | undefined
  if (uniforms) {
    uniforms.uWetness.value = wetness
    uniforms.uNightFactor.value = env.nightFactor
    uniforms.uTime.value = elapsed
    uniforms.uPuddleStrength.value = lookDev.puddleStrength
    const weatheringScale = METAL_HARBOR_KINDS.has(kind) ? lookDev.metalScuff : 1
    uniforms.uWeathering.value = baseWeathering * weatheringScale
  }

  const base = env.isNight ? nightColor : dayColor
  const c = new THREE.Color(base)
  if (wetness > 0.05) {
    c.multiplyScalar(1 - wetness * 0.12)
  }
  material.color.copy(c)
  const roughMult = WOOD_HARBOR_KINDS.has(kind) ? lookDev.dockWoodRoughness : 1
  material.roughness = THREE.MathUtils.clamp(
    (material.userData.baseRoughness as number) * roughMult - wetness * 0.22,
    0.05,
    1,
  )
  material.envMapIntensity = (env.isNight ? 0.45 : 0.85) * lookDev.envMapIntensity
}

export function useHarborMaterial(
  kind: HarborMaterialKind,
  options: HarborMaterialOptions = {},
  dayNightColors?: { day: string; night: string },
): MeshStandardNodeMaterial {
  const env = useHarborEnvironment()
  const defaults = DEFAULTS[kind]
  const dayColor = dayNightColors?.day ?? options.baseColor ?? defaults.baseColor
  const nightColor = dayNightColors?.night ?? adjustHex(dayColor, -28)

  const material = useMemo(
    () => createHarborMaterial(kind, options),
    [kind, options.baseColor, options.roughness, options.metalness, options.weathering],
  )

  useEffect(() => {
    material.userData.baseRoughness = options.roughness ?? defaults.roughness
  }, [material, options.roughness, defaults.roughness])

  useFrame((state) => {
    applyEnvironmentToMaterial(
      material,
      env,
      state.clock.elapsedTime,
      dayColor,
      nightColor,
      kind,
      options.weathering ?? defaults.weathering,
    )
  })

  return material
}

function adjustHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`
}

export function buildDeckBoltTransforms(count = 36): THREE.Matrix4[] {
  const matrices: THREE.Matrix4[] = []
  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const x = -38 + (i % 18) * 4.2 + (Math.floor(i / 18) % 2) * 2.1
    const z = -5 + Math.floor(i / 18) * 10
    dummy.position.set(x, 0.58, z)
    dummy.scale.set(0.07, 0.025, 0.07)
    dummy.updateMatrix()
    matrices.push(dummy.matrix.clone())
  }
  return matrices
}
