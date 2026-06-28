// =============================================================================
// HARBOR PBR MATERIALS — HarborGlow
// Procedural weathered wood / steel / rubber for static harbor geometry.
// Patches MeshStandardMaterial via onBeforeCompile (WebGL + WebGL2 fallback).
// Base roughness/color also driven from store each frame for WebGPU parity.
// =============================================================================

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import type { WeatherState } from '../store/gameStoreTypes'
import {
  getLookDevSettings,
  METAL_HARBOR_KINDS,
  WOOD_HARBOR_KINDS,
} from '../utils/lookDevControls'

export const HARBOR_NOISE_GLSL = /* glsl */ `
  vec3 harborMod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 harborMod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 harborPermute(vec3 x) { return harborMod289(((x * 34.0) + 1.0) * x); }

  float harborSnoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = harborMod289(i);
    vec3 p = harborPermute(harborPermute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float harborFbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * harborSnoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
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

interface HarborUniforms {
  uWetness: { value: number }
  uNightFactor: { value: number }
  uWeathering: { value: number }
  uTime: { value: number }
  uPuddleStrength: { value: number }
}

function injectWorldPosVarying(shader: THREE.Shader) {
  if (!shader.vertexShader.includes('vHarborWorldPos')) {
    shader.vertexShader = `varying vec3 vHarborWorldPos;\n${shader.vertexShader}`
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
       vHarborWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
    )
  }
  if (!shader.fragmentShader.includes('vHarborWorldPos')) {
    shader.fragmentShader = `varying vec3 vHarborWorldPos;\n${shader.fragmentShader}`
  }
}

function injectHarborUniforms(shader: THREE.Shader): HarborUniforms {
  const uniforms: HarborUniforms = {
    uWetness: { value: 0 },
    uNightFactor: { value: 0 },
    uWeathering: { value: 0.6 },
    uTime: { value: 0 },
    uPuddleStrength: { value: 1 },
  }
  shader.uniforms.uWetness = uniforms.uWetness
  shader.uniforms.uNightFactor = uniforms.uNightFactor
  shader.uniforms.uWeathering = uniforms.uWeathering
  shader.uniforms.uTime = uniforms.uTime
  shader.uniforms.uPuddleStrength = uniforms.uPuddleStrength
  return uniforms
}

function patchColorFragment(shader: THREE.Shader, body: string) {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <color_fragment>',
    `#include <color_fragment>
     ${body}`
  )
}

function buildWoodDeckPatch(): string {
  return `
    ${HARBOR_NOISE_GLSL}
    {
      vec3 wp = vHarborWorldPos;
      float plankU = wp.x * 0.5;
      float plankFrac = fract(plankU);
      float plankId = floor(plankU);
      float gap = 1.0 - smoothstep(0.02, 0.05, abs(plankFrac - 0.5) - 0.44);
      float grain = harborFbm(vec2(wp.x * 0.15, wp.z * 6.0));
      float plankTone = 0.88 + fract(plankId * 0.173) * 0.18 + grain * 0.12;
      diffuseColor.rgb *= plankTone;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.35, gap);
      float boltGrid = step(0.92, fract(plankU)) * step(0.85, 1.0 - abs(fract(wp.z * 0.14) - 0.5) * 2.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.55, boltGrid * 0.7);
      float puddle = gap * uWetness * uPuddleStrength * (0.55 + harborSnoise(wp.xz * 0.4) * 0.25);
      diffuseColor.rgb *= 1.0 - puddle * 0.35;
      diffuseColor.rgb *= 1.0 - uNightFactor * 0.18;
      roughnessFactor = clamp(roughnessFactor - puddle * 0.55 + gap * 0.08, 0.04, 1.0);
      metalnessFactor = mix(metalnessFactor, 0.18, puddle * 0.35);
    }
  `
}

function buildWeatheredWoodPatch(): string {
  return `
    ${HARBOR_NOISE_GLSL}
    {
      vec3 wp = vHarborWorldPos;
      float grain = harborFbm(vec2(wp.x * 0.2, wp.z * 4.0));
      diffuseColor.rgb *= 0.82 + grain * 0.22;
      float scuff = smoothstep(0.45, 0.75, harborFbm(wp.xz * 0.35)) * uWeathering;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.65, scuff * 0.35);
      float wet = uWetness * (0.35 + grain * 0.35);
      diffuseColor.rgb *= 1.0 - wet * 0.28;
      roughnessFactor = clamp(roughnessFactor - wet * 0.45, 0.08, 1.0);
    }
  `
}

function buildCorrodedSteelPatch(): string {
  return `
    ${HARBOR_NOISE_GLSL}
    {
      vec3 wp = vHarborWorldPos;
      vec2 uv = vec2(wp.x * 0.35, wp.y * 1.8 + wp.z * 0.25);
      float rust = harborFbm(uv * vec2(0.6, 2.4));
      float streaks = harborFbm(vec2(uv.x * 0.25, uv.y * 8.0));
      float rustAmt = smoothstep(0.35, 0.72, rust * streaks) * uWeathering;
      vec3 rustColor = vec3(0.52, 0.28, 0.12);
      diffuseColor.rgb = mix(diffuseColor.rgb, rustColor, rustAmt * 0.65);
      float salt = smoothstep(0.55, 0.85, harborSnoise(uv * 6.0)) * uWetness * 0.35;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.82, 0.84, 0.78), salt);
      float ropeWear = smoothstep(0.15, 0.35, wp.y) * (1.0 - smoothstep(1.2, 1.8, wp.y));
      ropeWear *= 0.5 + 0.5 * harborSnoise(vec2(wp.x * 3.0, wp.z * 3.0));
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.55, ropeWear * 0.45);
      roughnessFactor = clamp(roughnessFactor + rustAmt * 0.25 - salt * 0.12 - uWetness * 0.18, 0.12, 0.95);
      metalnessFactor = clamp(metalnessFactor - rustAmt * 0.45 + salt * 0.05, 0.05, 0.9);
    }
  `
}

function buildPilingTimberPatch(): string {
  return `
    ${HARBOR_NOISE_GLSL}
    {
      vec3 wp = vHarborWorldPos;
      float grain = harborFbm(vec2(atan(wp.z, wp.x) * 2.0, wp.y * 0.8));
      diffuseColor.rgb *= 0.78 + grain * 0.28;
      float waterline = smoothstep(-0.2, -1.4, wp.y);
      float algae = harborSnoise(vec2(wp.x * 2.0, wp.y * 4.0)) * waterline;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.18, 0.28, 0.22), algae * 0.45);
      float rustBand = waterline * harborFbm(vec2(wp.x * 0.5, wp.y * 3.0));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.45, 0.24, 0.1), rustBand * 0.35 * uWeathering);
      float wet = uWetness * waterline;
      diffuseColor.rgb *= 1.0 - wet * 0.32;
      roughnessFactor = clamp(roughnessFactor - wet * 0.35 + waterline * 0.12, 0.2, 1.0);
    }
  `
}

function buildWetRubberPatch(): string {
  return `
    ${HARBOR_NOISE_GLSL}
    {
      vec2 uv = vHarborWorldPos.xz * vec2(0.5, 2.0);
      float ribs = 0.85 + 0.15 * sin(uv.y * 28.0 + harborSnoise(uv * 2.0) * 0.5);
      float scuff = smoothstep(0.3, 0.75, harborFbm(uv * 4.0)) * uWeathering;
      diffuseColor.rgb *= ribs;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.22, 0.22, 0.22), scuff * 0.55);
      float wet = uWetness * 0.85;
      diffuseColor.rgb *= 1.0 - wet * 0.22;
      roughnessFactor = clamp(roughnessFactor - wet * 0.35 + scuff * 0.15, 0.55, 1.0);
    }
  `
}

function buildCautionStripePatch(): string {
  return `
    ${HARBOR_NOISE_GLSL}
    {
      float chip = harborFbm(vHarborWorldPos.xz * 3.5);
      float wear = smoothstep(0.42, 0.78, chip) * uWeathering;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.08, 0.08, 0.06), wear * 0.7);
      float wet = uWetness * 0.5;
      diffuseColor.rgb *= 1.0 - wet * 0.18;
      roughnessFactor = clamp(roughnessFactor - wet * 0.2 + wear * 0.25, 0.25, 0.95);
    }
  `
}

function buildRailSteelPatch(): string {
  return `
    ${HARBOR_NOISE_GLSL}
    {
      vec3 wp = vHarborWorldPos;
      float topWear = smoothstep(0.15, 0.45, wp.y) * harborFbm(wp.xz * 0.8);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.15, topWear * 0.35);
      float oil = smoothstep(0.55, 0.82, harborFbm(wp.xz * 1.6 + 2.7));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.04, 0.04, 0.03), oil * 0.55 * uWeathering);
      float scuff = harborSnoise(wp.xz * 2.2) * topWear;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.35, 0.34, 0.32), scuff * 0.25);
      float wet = uWetness * (0.4 + topWear * 0.35);
      diffuseColor.rgb *= 1.0 - wet * 0.2;
      roughnessFactor = clamp(roughnessFactor - topWear * 0.22 - wet * 0.25 + oil * 0.18, 0.1, 0.85);
      metalnessFactor = clamp(metalnessFactor + topWear * 0.12 - oil * 0.35, 0.15, 0.85);
    }
  `
}

const PATCH_BY_KIND: Record<HarborMaterialKind, string> = {
  weatheredWood: buildWeatheredWoodPatch(),
  weatheredWoodDeck: buildWoodDeckPatch(),
  corrodedSteel: buildCorrodedSteelPatch(),
  pilingTimber: buildPilingTimberPatch(),
  wetRubber: buildWetRubberPatch(),
  cautionStripe: buildCautionStripePatch(),
  railSteel: buildRailSteelPatch(),
}

const DEFAULTS: Record<HarborMaterialKind, Required<HarborMaterialOptions>> = {
  weatheredWood: { baseColor: '#6b4423', roughness: 0.92, metalness: 0.04, weathering: 0.55 },
  weatheredWoodDeck: { baseColor: '#7a4f28', roughness: 0.88, metalness: 0.06, weathering: 0.65 },
  corrodedSteel: { baseColor: '#4a4a4a', roughness: 0.48, metalness: 0.72, weathering: 0.75 },
  pilingTimber: { baseColor: '#4a3728', roughness: 0.94, metalness: 0.02, weathering: 0.7 },
  wetRubber: { baseColor: '#141414', roughness: 0.96, metalness: 0, weathering: 0.5 },
  cautionStripe: { baseColor: '#c9a800', roughness: 0.82, metalness: 0.08, weathering: 0.6 },
  railSteel: { baseColor: '#5a5a5a', roughness: 0.38, metalness: 0.68, weathering: 0.65 },
}

export function createHarborMaterial(
  kind: HarborMaterialKind,
  options: HarborMaterialOptions = {}
): THREE.MeshStandardMaterial {
  const defaults = DEFAULTS[kind]
  const baseColor = options.baseColor ?? defaults.baseColor
  const roughness = options.roughness ?? defaults.roughness
  const metalness = options.metalness ?? defaults.metalness
  const weathering = options.weathering ?? defaults.weathering

  const material = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness,
    metalness,
  })

  material.userData.harborKind = kind
  material.customProgramCacheKey = () => `harbor-${kind}-v1`

  material.onBeforeCompile = (shader) => {
    injectWorldPosVarying(shader)
    const uniforms = injectHarborUniforms(shader)
    uniforms.uWeathering.value = weathering
    patchColorFragment(shader, PATCH_BY_KIND[kind])
    material.userData.harborUniforms = uniforms
  }

  return material
}

function applyEnvironmentToMaterial(
  material: THREE.MeshStandardMaterial,
  env: HarborEnvironment,
  elapsed: number,
  dayColor: string,
  nightColor: string,
  kind: HarborMaterialKind,
  baseWeathering: number
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
    1
  )
  material.envMapIntensity = (env.isNight ? 0.45 : 0.85) * lookDev.envMapIntensity
}

export function useHarborMaterial(
  kind: HarborMaterialKind,
  options: HarborMaterialOptions = {},
  dayNightColors?: { day: string; night: string }
): THREE.MeshStandardMaterial {
  const env = useHarborEnvironment()
  const defaults = DEFAULTS[kind]
  const dayColor = dayNightColors?.day ?? options.baseColor ?? defaults.baseColor
  const nightColor = dayNightColors?.night ?? adjustHex(dayColor, -28)

  const material = useMemo(
    () => createHarborMaterial(kind, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- kind/options identity is intentional
    [kind, options.baseColor, options.roughness, options.metalness, options.weathering]
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
      options.weathering ?? defaults.weathering
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

/** Instanced bolt-head positions along deck plank seams (world-local to dock group). */
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
