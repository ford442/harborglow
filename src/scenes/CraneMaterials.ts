// =============================================================================
// CRANE MATERIALS — procedural industrial surfaces (paint, steel, glass, cable)
// Reuses harbor noise; tuned via Visual Polish → Crane & Cable controls.
// =============================================================================

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { computeHarborWetness, HARBOR_NOISE_GLSL } from './HarborPBRMaterials'
import { getLookDevSettings } from '../utils/lookDevControls'

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

function injectWorldPos(shader: THREE.Shader) {
  if (!shader.vertexShader.includes('vCraneWorldPos')) {
    shader.vertexShader = `varying vec3 vCraneWorldPos;\n${shader.vertexShader}`
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
       vCraneWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
    )
  }
  if (!shader.fragmentShader.includes('vCraneWorldPos')) {
    shader.fragmentShader = `varying vec3 vCraneWorldPos;\n${shader.fragmentShader}`
  }
}

function injectCraneUniforms(shader: THREE.Shader, weathering: number): CraneUniforms {
  const uniforms: CraneUniforms = {
    uWetness: { value: 0 },
    uWeathering: { value: weathering },
    uWearAccum: { value: 0 },
    uTime: { value: 0 },
    uRain: { value: 0 },
  }
  Object.assign(shader.uniforms, uniforms)
  return uniforms
}

function patchColor(shader: THREE.Shader, body: string) {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <color_fragment>',
    `#include <color_fragment>\n${body}`
  )
}

function buildPaintedSteelPatch(): string {
  return `
    ${HARBOR_NOISE_GLSL}
    {
      vec3 wp = vCraneWorldPos;
      float panelY = 1.0 - smoothstep(0.02, 0.06, abs(fract(wp.y * 0.22) - 0.5));
      float panelX = 1.0 - smoothstep(0.02, 0.06, abs(fract(wp.x * 0.28) - 0.5));
      float panel = max(panelY, panelX);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.62, panel * 0.45);
      float chip = harborFbm(wp.xz * 1.8 + wp.y * 0.4);
      float chipAmt = smoothstep(0.52, 0.8, chip) * uWeathering;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.38, 0.36, 0.34), chipAmt * 0.55);
      float grease = smoothstep(0.35, 0.65, harborFbm(vec2(wp.x * 0.4, wp.y * 2.8))) * (0.35 + uWearAccum * 0.65);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.06, 0.05), grease * 0.5);
      float grime = harborSnoise(wp.xz * 0.6) * uWearAccum * 0.35;
      diffuseColor.rgb *= 1.0 - grime;
      float wet = uWetness * (0.35 + panel * 0.25);
      diffuseColor.rgb *= 1.0 - wet * 0.22;
      roughnessFactor = clamp(roughnessFactor + chipAmt * 0.18 - wet * 0.28 + grease * 0.12, 0.12, 0.95);
      metalnessFactor = clamp(metalnessFactor - chipAmt * 0.2 + wet * 0.08, 0.05, 0.75);
    }
  `
}

function buildStructuralSteelPatch(): string {
  return `
    ${HARBOR_NOISE_GLSL}
    {
      vec3 wp = vCraneWorldPos;
      float weld = smoothstep(0.44, 0.5, abs(fract(wp.y * 0.35) - 0.5));
      weld += smoothstep(0.44, 0.5, abs(fract(wp.z * 0.35) - 0.5)) * 0.6;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.12, weld * 0.35);
      float rust = harborFbm(vec2(wp.x * 0.3, wp.y * 1.4 + wp.z * 0.2));
      float rustAmt = smoothstep(0.48, 0.78, rust) * uWeathering * (0.5 + uWearAccum * 0.5);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.48, 0.26, 0.11), rustAmt * 0.5);
      float rivet = step(0.94, fract(wp.y * 1.1)) * step(0.88, 1.0 - abs(fract(wp.x * 0.9) - 0.5) * 2.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.75, rivet * 0.6);
      float wet = uWetness * 0.55;
      diffuseColor.rgb *= 1.0 - wet * 0.18;
      roughnessFactor = clamp(roughnessFactor + rustAmt * 0.22 - wet * 0.2, 0.15, 0.92);
      metalnessFactor = clamp(metalnessFactor - rustAmt * 0.35 + weld * 0.05, 0.1, 0.88);
    }
  `
}

function buildMachinedSteelPatch(): string {
  return `
    ${HARBOR_NOISE_GLSL}
    {
      vec3 wp = vCraneWorldPos;
      float tool = sin(wp.y * 42.0) * sin(wp.x * 38.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.08, tool * 0.06);
      float scuff = smoothstep(0.4, 0.75, harborFbm(wp.xz * 2.5)) * (0.25 + uWearAccum * 0.75);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.28, 0.27, 0.26), scuff * 0.45);
      float contact = smoothstep(0.0, 0.25, 0.25 - wp.y) * harborSnoise(wp.xz * 4.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.18, 0.17, 0.16), contact * 0.35);
      float wet = uWetness * 0.45;
      diffuseColor.rgb *= 1.0 - wet * 0.12;
      roughnessFactor = clamp(roughnessFactor + scuff * 0.15 - wet * 0.35 + tool * 0.02, 0.08, 0.72);
      metalnessFactor = clamp(metalnessFactor + 0.12 - scuff * 0.25 + wet * 0.15, 0.35, 0.95);
    }
  `
}

function buildCabinGlassPatch(): string {
  return `
    ${HARBOR_NOISE_GLSL}
    {
      vec3 wp = vCraneWorldPos;
      float dirt = harborFbm(wp.xy * 1.2) * 0.35 + harborFbm(wp.yz * 0.8) * 0.25;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.12, 0.14, 0.16), dirt * (0.45 + uWearAccum * 0.25));
      float streak = smoothstep(0.55, 0.95, harborFbm(vec2(wp.x * 0.5, wp.y * 6.0 + uTime * 0.05)));
      streak *= uRain;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.22, 0.28, 0.34), streak * 0.55);
      float wiper = smoothstep(0.08, 0.02, abs(fract(atan(wp.y, wp.z) / 3.14159 + uTime * 0.15) - 0.5));
      wiper *= uRain * 0.85;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.15, wiper * 0.4);
      float wet = uWetness * uRain;
      roughnessFactor = clamp(roughnessFactor - wet * 0.55 + dirt * 0.25, 0.02, 0.65);
      metalnessFactor = clamp(metalnessFactor + wet * 0.35, 0.2, 0.98);
    }
  `
}

function buildCautionStripePatch(): string {
  return `
    ${HARBOR_NOISE_GLSL}
    {
      vec3 wp = vCraneWorldPos;
      float stripe = step(0.5, fract(wp.x * 2.8 + wp.z * 0.1));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.08, 0.08, 0.06), stripe * 0.85);
      float chip = harborFbm(wp.xz * 4.0);
      float wear = smoothstep(0.42, 0.78, chip) * uWeathering * (0.6 + uWearAccum * 0.4);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.15, 0.14, 0.12), wear * 0.65);
      float wet = uWetness * 0.35;
      diffuseColor.rgb *= 1.0 - wet * 0.15;
      roughnessFactor = clamp(roughnessFactor + wear * 0.2 - wet * 0.12, 0.28, 0.95);
    }
  `
}

const CRANE_PATCHES: Record<CraneMaterialKind, string> = {
  paintedSteel: buildPaintedSteelPatch(),
  structuralSteel: buildStructuralSteelPatch(),
  machinedSteel: buildMachinedSteelPatch(),
  cabinGlass: buildCabinGlassPatch(),
  cautionStripe: buildCautionStripePatch(),
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
  options: CraneMaterialOptions = {}
): THREE.MeshStandardMaterial {
  const defaults = CRANE_DEFAULTS[kind]
  const material = new THREE.MeshStandardMaterial({
    color: options.baseColor ?? defaults.baseColor,
    roughness: options.roughness ?? defaults.roughness,
    metalness: options.metalness ?? defaults.metalness,
    transparent: kind === 'cabinGlass',
    opacity: kind === 'cabinGlass' ? 0.82 : 1,
  })

  material.userData.craneKind = kind
  material.customProgramCacheKey = () => `crane-${kind}-v1`

  material.onBeforeCompile = (shader) => {
    injectWorldPos(shader)
    const uniforms = injectCraneUniforms(shader, options.weathering ?? defaults.weathering)
    patchColor(shader, CRANE_PATCHES[kind])
    material.userData.craneUniforms = uniforms
  }

  return material
}

export function createCraneCableMaterial(): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: '#cccccc',
    metalness: 0.78,
    roughness: 0.32,
  })

  material.customProgramCacheKey = () => 'crane-cable-strand-v1'

  material.onBeforeCompile = (shader) => {
    if (!shader.vertexShader.includes('vCableUv')) {
      shader.vertexShader = `varying vec2 vCableUv;\n${shader.vertexShader}`
      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
         vCableUv = uv;`
      )
    }
    if (!shader.fragmentShader.includes('vCableUv')) {
      shader.fragmentShader = `varying vec2 vCableUv;\n${shader.fragmentShader}`
    }

    const uniforms: CableUniforms = {
      uTension: { value: 0 },
      uTime: { value: 0 },
      uWetness: { value: 0 },
      uTwistlock: { value: 0 },
      uHighlight: { value: 1 },
      uTravel: { value: 0 },
    }
    Object.assign(shader.uniforms, uniforms)
    material.userData.cableUniforms = uniforms

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
       ${HARBOR_NOISE_GLSL}
       {
         float helix = sin(vCableUv.x * 95.0 + vCableUv.y * 18.0 * 3.14159);
         float strand = 0.88 + helix * 0.12;
         diffuseColor.rgb *= strand;
         float sweep = pow(max(0.0, sin(vCableUv.x * 48.0 - uTravel)), 3.0);
         diffuseColor.rgb += vec3(0.35, 0.38, 0.42) * sweep * (0.25 + uTension * 0.45) * uHighlight;
         float stretch = 1.0 + uTension * 0.35 + uTwistlock * 0.15;
         diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.08, uTension * 0.25);
         float wet = uWetness;
         diffuseColor.rgb *= 1.0 - wet * 0.1;
         roughnessFactor = clamp(roughnessFactor - sweep * 0.18 - wet * 0.25 + uTension * 0.08, 0.08, 0.72);
         metalnessFactor = clamp(metalnessFactor + sweep * 0.15 + wet * 0.2 - uTension * 0.05, 0.45, 0.98);
       }`
    )
  }

  return material
}

function computeWearAccum(): number {
  const count = useGameStore.getState().installedUpgrades.length
  return THREE.MathUtils.clamp(count / 40, 0, 1)
}

function applyCraneUniforms(
  material: THREE.MeshStandardMaterial,
  elapsed: number,
  rainIntensity: number
) {
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
  options: CraneMaterialOptions = {}
): THREE.MeshStandardMaterial {
  const weather = useGameStore((s) => s.weather)
  const defaults = CRANE_DEFAULTS[kind]

  const material = useMemo(
    () => createCraneMaterial(kind, options),
    [kind, options.baseColor, options.metalness, options.roughness, options.weathering]
  )

  useEffect(() => {
    material.userData.baseWeathering = options.weathering ?? defaults.weathering
    material.userData.baseRoughness = options.roughness ?? defaults.roughness
  }, [material, options.weathering, options.roughness, defaults])

  useFrame((state) => {
    applyCraneUniforms(
      material,
      state.clock.elapsedTime,
      weather === 'rain' || weather === 'storm' ? 1 : 0
    )
  })

  return material
}

export function useCraneCableMaterial(): THREE.MeshStandardMaterial {
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
  material: THREE.MeshStandardMaterial,
  args: {
    tension: number
    twistlockEngaged: boolean
    elapsed: number
  }
): void {
  const uniforms = material.userData.cableUniforms as CableUniforms | undefined
  if (!uniforms) return
  uniforms.uTension.value = args.tension
  uniforms.uTwistlock.value = args.twistlockEngaged ? 1 : 0
  uniforms.uTravel.value = args.elapsed * (1.2 + args.tension * 2.5)
}
