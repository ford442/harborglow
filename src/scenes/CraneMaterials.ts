// =============================================================================
// CRANE MATERIALS — TSL industrial surfaces (paint, steel, glass, cable)
// =============================================================================

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { MeshStandardNodeMaterial } from 'three/webgpu'
import {
  abs,
  atan,
  clamp,
  float,
  fract,
  max,
  mix,
  positionWorld,
  pow,
  sin,
  smoothstep,
  step,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { computeHarborWetness } from './HarborPBRMaterials'
import { harborFbm, harborSnoise } from './harborNoiseTsl'
import { getLookDevSettings } from '../utils/lookDevControls'
import { tsl } from '../shaders/tslCast'

export type CraneMaterialKind =
  | 'paintedSteel'
  | 'structuralSteel'
  | 'machinedSteel'
  | 'cabinGlass'
  | 'cautionStripe'

export interface CraneMaterialOptions {
  baseColor?: string
  roughness?: number
  metalness?: number
  weathering?: number
}

interface CraneUniforms {
  uWetness: { value: number }
  uWeathering: { value: number }
  uWearAccum: { value: number }
  uTime: { value: number }
  uRain: { value: number }
}

interface CableUniforms {
  uTension: { value: number }
  uTime: { value: number }
  uWetness: { value: number }
  uTwistlock: { value: number }
  uHighlight: { value: number }
  uTravel: { value: number }
}

const CRANE_DEFAULTS: Record<CraneMaterialKind, Required<CraneMaterialOptions>> = {
  paintedSteel: { baseColor: '#d97818', roughness: 0.58, metalness: 0.38, weathering: 0.72 },
  structuralSteel: { baseColor: '#52565c', roughness: 0.52, metalness: 0.62, weathering: 0.78 },
  machinedSteel: { baseColor: '#3a3d42', roughness: 0.28, metalness: 0.88, weathering: 0.55 },
  cabinGlass: { baseColor: '#1a2030', roughness: 0.08, metalness: 0.92, weathering: 0.4 },
  cautionStripe: { baseColor: '#c9a800', roughness: 0.78, metalness: 0.1, weathering: 0.65 },
}

export function createCraneMaterial(
  kind: CraneMaterialKind,
  options: CraneMaterialOptions = {},
): MeshStandardNodeMaterial {
  const defaults = CRANE_DEFAULTS[kind]
  const material = new MeshStandardNodeMaterial()
  material.color.set(options.baseColor ?? defaults.baseColor)
  material.roughness = options.roughness ?? defaults.roughness
  material.metalness = options.metalness ?? defaults.metalness
  material.transparent = kind === 'cabinGlass'
  material.opacity = kind === 'cabinGlass' ? 0.82 : 1

  const uWetness = uniform(0)
  const uWeathering = uniform(options.weathering ?? defaults.weathering)
  const uWearAccum = uniform(0)
  const uTime = uniform(0)
  const uRain = uniform(0)
  material.userData.craneKind = kind
  material.userData.craneUniforms = {
    uWetness,
    uWeathering,
    uWearAccum,
    uTime,
    uRain,
  } satisfies CraneUniforms
  material.userData.baseWeathering = options.weathering ?? defaults.weathering

  const wp = positionWorld
  let color = tsl(vec3(material.color.r, material.color.g, material.color.b))
  let roughness = tsl(float(material.roughness))
  let metalnessN = tsl(float(material.metalness))

  if (kind === 'paintedSteel') {
    const panelY = float(1).sub(smoothstep(float(0.02), float(0.06), abs(fract(wp.y.mul(0.22)).sub(0.5))))
    const panelX = float(1).sub(smoothstep(float(0.02), float(0.06), abs(fract(wp.x.mul(0.28)).sub(0.5))))
    const panel = max(panelY, panelX)
    color = mix(color, color.mul(0.62), panel.mul(0.45))
    const chip = harborFbm(wp.xz.mul(1.8).add(wp.y.mul(0.4)))
    const chipAmt = smoothstep(float(0.52), float(0.8), chip).mul(uWeathering)
    color = mix(color, vec3(0.38, 0.36, 0.34), chipAmt.mul(0.55))
    const grease = smoothstep(float(0.35), float(0.65), harborFbm(vec2(wp.x.mul(0.4), wp.y.mul(2.8)))).mul(
      float(0.35).add(uWearAccum.mul(0.65)),
    )
    color = mix(color, vec3(0.07, 0.06, 0.05), grease.mul(0.5))
    const grime = harborSnoise(wp.xz.mul(0.6)).mul(uWearAccum).mul(0.35)
    color = color.mul(float(1).sub(grime))
    const wet = uWetness.mul(float(0.35).add(panel.mul(0.25)))
    color = color.mul(float(1).sub(wet.mul(0.22)))
    roughness = clamp(roughness.add(chipAmt.mul(0.18)).sub(wet.mul(0.28)).add(grease.mul(0.12)), float(0.12), float(0.95))
    metalnessN = clamp(metalnessN.sub(chipAmt.mul(0.2)).add(wet.mul(0.08)), float(0.05), float(0.75))
  } else if (kind === 'structuralSteel') {
    let weld = tsl(smoothstep(float(0.44), float(0.5), abs(fract(wp.y.mul(0.35)).sub(0.5))))
    weld = weld.add(smoothstep(float(0.44), float(0.5), abs(fract(wp.z.mul(0.35)).sub(0.5))).mul(0.6))
    color = mix(color, color.mul(1.12), weld.mul(0.35))
    const rust = harborFbm(vec2(wp.x.mul(0.3), wp.y.mul(1.4).add(wp.z.mul(0.2))))
    const rustAmt = smoothstep(float(0.48), float(0.78), rust).mul(uWeathering).mul(float(0.5).add(uWearAccum.mul(0.5)))
    color = mix(color, vec3(0.48, 0.26, 0.11), rustAmt.mul(0.5))
    const rivet = step(float(0.94), fract(wp.y.mul(1.1))).mul(
      step(float(0.88), float(1).sub(abs(fract(wp.x.mul(0.9)).sub(0.5)).mul(2))),
    )
    color = mix(color, color.mul(0.75), rivet.mul(0.6))
    const wet = uWetness.mul(0.55)
    color = color.mul(float(1).sub(wet.mul(0.18)))
    roughness = clamp(roughness.add(rustAmt.mul(0.22)).sub(wet.mul(0.2)), float(0.15), float(0.92))
    metalnessN = clamp(metalnessN.sub(rustAmt.mul(0.35)).add(weld.mul(0.05)), float(0.1), float(0.88))
  } else if (kind === 'machinedSteel') {
    const tool = sin(wp.y.mul(42)).mul(sin(wp.x.mul(38)))
    color = mix(color, color.mul(1.08), tool.mul(0.06))
    const scuff = smoothstep(float(0.4), float(0.75), harborFbm(wp.xz.mul(2.5))).mul(float(0.25).add(uWearAccum.mul(0.75)))
    color = mix(color, vec3(0.28, 0.27, 0.26), scuff.mul(0.45))
    const contact = smoothstep(float(0), float(0.25), float(0.25).sub(wp.y)).mul(harborSnoise(wp.xz.mul(4)))
    color = mix(color, vec3(0.18, 0.17, 0.16), contact.mul(0.35))
    const wet = uWetness.mul(0.45)
    color = color.mul(float(1).sub(wet.mul(0.12)))
    roughness = clamp(roughness.add(scuff.mul(0.15)).sub(wet.mul(0.35)).add(tool.mul(0.02)), float(0.08), float(0.72))
    metalnessN = clamp(metalnessN.add(0.12).sub(scuff.mul(0.25)).add(wet.mul(0.15)), float(0.35), float(0.95))
  } else if (kind === 'cabinGlass') {
    const dirt = harborFbm(wp.xy.mul(1.2)).mul(0.35).add(harborFbm(wp.yz.mul(0.8)).mul(0.25))
    color = mix(color, vec3(0.12, 0.14, 0.16), dirt.mul(float(0.45).add(uWearAccum.mul(0.25))))
    let streak = tsl(smoothstep(float(0.55), float(0.95), harborFbm(vec2(wp.x.mul(0.5), wp.y.mul(6).add(uTime.mul(0.05))))))
    streak = streak.mul(uRain)
    color = mix(color, vec3(0.22, 0.28, 0.34), streak.mul(0.55))
    let wiper = tsl(smoothstep(float(0.08), float(0.02), abs(fract(atan(wp.y, wp.z).div(3.14159).add(uTime.mul(0.15))).sub(0.5))))
    wiper = wiper.mul(uRain).mul(0.85)
    color = mix(color, color.mul(1.15), wiper.mul(0.4))
    const wet = uWetness.mul(uRain)
    roughness = clamp(roughness.sub(wet.mul(0.55)).add(dirt.mul(0.25)), float(0.02), float(0.65))
    metalnessN = clamp(metalnessN.add(wet.mul(0.35)), float(0.2), float(0.98))
  } else {
    const stripe = step(float(0.5), fract(wp.x.mul(2.8).add(wp.z.mul(0.1))))
    color = mix(color, vec3(0.08, 0.08, 0.06), stripe.mul(0.85))
    const chip = harborFbm(wp.xz.mul(4))
    const wear = smoothstep(float(0.42), float(0.78), chip).mul(uWeathering).mul(float(0.6).add(uWearAccum.mul(0.4)))
    color = mix(color, vec3(0.15, 0.14, 0.12), wear.mul(0.65))
    const wet = uWetness.mul(0.35)
    color = color.mul(float(1).sub(wet.mul(0.15)))
    roughness = clamp(roughness.add(wear.mul(0.2)).sub(wet.mul(0.12)), float(0.28), float(0.95))
  }

  material.colorNode = color
  material.roughnessNode = roughness
  material.metalnessNode = metalnessN
  return material
}

export function createCraneCableMaterial(): MeshStandardNodeMaterial {
  const material = new MeshStandardNodeMaterial()
  material.color.set('#cccccc')
  material.metalness = 0.78
  material.roughness = 0.32

  const uTension = uniform(0)
  const uTime = uniform(0)
  const uWetness = uniform(0)
  const uTwistlock = uniform(0)
  const uHighlight = uniform(1)
  const uTravel = uniform(0)
  material.userData.cableUniforms = {
    uTension,
    uTime,
    uWetness,
    uTwistlock,
    uHighlight,
    uTravel,
  } satisfies CableUniforms

  const vUv = uv()
  const helix = sin(vUv.x.mul(95).add(vUv.y.mul(18).mul(3.14159)))
  const strand = float(0.88).add(helix.mul(0.12))
  let color = tsl(vec3(material.color.r, material.color.g, material.color.b).mul(strand))
  const sweep = pow(max(float(0), sin(vUv.x.mul(48).sub(uTravel))), float(3))
  color = color.add(vec3(0.35, 0.38, 0.42).mul(sweep).mul(float(0.25).add(uTension.mul(0.45))).mul(uHighlight))
  color = mix(color, color.mul(1.08), uTension.mul(0.25))
  color = color.mul(float(1).sub(uWetness.mul(0.1)))
  const roughness = clamp(
    float(0.32).sub(sweep.mul(0.18)).sub(uWetness.mul(0.25)).add(uTension.mul(0.08)),
    float(0.08),
    float(0.72),
  )
  const metalnessN = clamp(
    float(0.78).add(sweep.mul(0.15)).add(uWetness.mul(0.2)).sub(uTension.mul(0.05)),
    float(0.45),
    float(0.98),
  )
  material.colorNode = color
  material.roughnessNode = roughness
  material.metalnessNode = metalnessN
  return material
}

function computeWearAccum(): number {
  const count = useGameStore.getState().installedUpgrades.length
  return THREE.MathUtils.clamp(count / 40, 0, 1)
}

function applyCraneUniforms(material: MeshStandardNodeMaterial, elapsed: number, rainIntensity: number) {
  const lookDev = getLookDevSettings()
  const weather = useGameStore.getState().weather
  const isNight = useGameStore.getState().isNight
  const wetness = computeHarborWetness(weather, isNight) * lookDev.surfaceWetness
  const wear = computeWearAccum()
  const uniforms = material.userData.craneUniforms as CraneUniforms | undefined
  if (!uniforms) return
  uniforms.uWetness.value = wetness
  uniforms.uWeathering.value =
    (material.userData.baseWeathering as number) * lookDev.craneWear * lookDev.metalScuff
  uniforms.uWearAccum.value = wear
  uniforms.uTime.value = elapsed
  uniforms.uRain.value = rainIntensity
}

export function useCraneMaterial(
  kind: CraneMaterialKind,
  options: CraneMaterialOptions = {},
): MeshStandardNodeMaterial {
  const weather = useGameStore((s) => s.weather)
  const defaults = CRANE_DEFAULTS[kind]

  const material = useMemo(
    () => createCraneMaterial(kind, options),
    [kind, options.baseColor, options.metalness, options.roughness, options.weathering],
  )

  useEffect(() => {
    material.userData.baseWeathering = options.weathering ?? defaults.weathering
    material.userData.baseRoughness = options.roughness ?? defaults.roughness
  }, [material, options.weathering, options.roughness, defaults])

  useFrame((state) => {
    applyCraneUniforms(material, state.clock.elapsedTime, weather === 'rain' || weather === 'storm' ? 1 : 0)
  })

  return material
}

export function useCraneCableMaterial(): MeshStandardNodeMaterial {
  const weather = useGameStore((s) => s.weather)
  const isNight = useGameStore((s) => s.isNight)

  const material = useMemo(() => createCraneCableMaterial(), [])

  useFrame((state) => {
    const lookDev = getLookDevSettings()
    const wetness = computeHarborWetness(weather, isNight) * lookDev.surfaceWetness
    const uniforms = material.userData.cableUniforms as CableUniforms | undefined
    if (!uniforms) return
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uWetness.value = wetness
    uniforms.uTravel.value = state.clock.elapsedTime * (1.2 + uniforms.uTension.value * 2.5)
    uniforms.uHighlight.value = lookDev.cableTensionHighlight
  })

  return material
}

export function updateCraneCableUniforms(
  material: MeshStandardNodeMaterial,
  args: {
    tension: number
    twistlockEngaged: boolean
    elapsed: number
  },
): void {
  const uniforms = material.userData.cableUniforms as CableUniforms | undefined
  if (!uniforms) return
  uniforms.uTension.value = args.tension
  uniforms.uTwistlock.value = args.twistlockEngaged ? 1 : 0
  uniforms.uTravel.value = args.elapsed * (1.2 + args.tension * 2.5)
}
