// =============================================================================
// GERSTNER TSL — MeshStandardNodeMaterial ocean (WaveSystem uniforms)
// GLSL reference: waterGerstner.glsl.ts / TugboatWakeSystem TUGBOAT_WAKE_GLSL
// =============================================================================

import * as THREE from 'three'
import { MeshStandardNodeMaterial } from 'three/webgpu'
import {
  abs,
  clamp,
  cos,
  dot,
  exp,
  float,
  length,
  max,
  mix,
  modelWorldMatrix,
  normalize,
  positionLocal,
  pow,
  refract,
  sin,
  smoothstep,
  step,
  uniform,
  uniformArray,
  vec2,
  vec3,
  vec4,
} from 'three/tsl'
import { MAX_DYNAMIC_LIGHTS, MAX_WAVE_LAYERS } from './gerstnerHeight'
import { tsl } from '../../shaders/tslCast'

export type WaterTslUserData = {
  uTime: { value: number }
  uCameraPos: { value: THREE.Vector3 }
  uSunDir: { value: THREE.Vector3 }
  uSunColor: { value: THREE.Color }
  uWaterColor: { value: THREE.Color }
  uDeepColor: { value: THREE.Color }
  uReflectionTint: { value: THREE.Color }
  uFoamStrength: { value: number }
  uRoughness: { value: number }
  uCausticsStrength: { value: number }
  uGodRayIntensity: { value: number }
  uChromaticAberration: { value: number }
  uGlobalAmp: { value: number }
  uGlobalSpeed: { value: number }
  uStormIntensity: { value: number }
  uWaveAmplitudes: { array: number[] }
  uWaveFrequencies: { array: number[] }
  uWaveSpeeds: { array: number[] }
  uWaveDirections: { array: THREE.Vector2[] }
  uWaveSteepness: { array: number[] }
  uNightBlend: { value: number }
  uIsNight: { value: number }
  uDynLightPositions: { array: THREE.Vector3[] }
  uDynLightColors: { array: THREE.Color[] }
  uDynLightIntensities: { array: number[] }
  uDynLightRadii: { array: number[] }
  uDynLightCount: { value: number }
  uTugActive: { value: number }
  uTugPos: { value: THREE.Vector3 }
  uTugDir: { value: THREE.Vector3 }
  uPropWashPower: { value: number }
  uWashAsymmetry: { value: number }
}

function initWaveArrays() {
  const amps = new Array<number>(MAX_WAVE_LAYERS).fill(0)
  const freqs = new Array<number>(MAX_WAVE_LAYERS).fill(1)
  const speeds = new Array<number>(MAX_WAVE_LAYERS).fill(0)
  const steep = new Array<number>(MAX_WAVE_LAYERS).fill(0)
  const dirs = Array.from({ length: MAX_WAVE_LAYERS }, () => new THREE.Vector2(1, 0))
  return { amps, freqs, speeds, steep, dirs }
}

export function createWaterNodeMaterial(opts: {
  isNight: boolean
  weather: string
  waveAmp: number
  waveSpeed: number
  stormIntensity: number
}): MeshStandardNodeMaterial {
  const { amps, freqs, speeds, steep, dirs } = initWaveArrays()

  const uTime = uniform(0)
  const uCameraPos = uniform(new THREE.Vector3())
  const uSunDir = uniform(new THREE.Vector3(0.5, 0.8, 0.3).normalize())
  const uSunColor = uniform(new THREE.Color(opts.isNight ? '#6688ff' : '#fff8e0'))
  const uWaterColor = uniform(new THREE.Color(opts.isNight ? '#001a33' : '#006994'))
  const uDeepColor = uniform(new THREE.Color(opts.isNight ? '#000814' : '#003d5c'))
  const uReflectionTint = uniform(new THREE.Color(opts.isNight ? '#112244' : '#88ccff'))
  const uFoamStrength = uniform(opts.weather === 'storm' ? 1.2 : opts.weather === 'rain' ? 0.6 : 0.35)
  const uRoughness = uniform(opts.weather === 'storm' ? 0.45 : opts.weather === 'rain' ? 0.3 : 0.12)
  const uCausticsStrength = uniform(opts.isNight ? 0.25 : 0.7)
  const uGodRayIntensity = uniform(opts.isNight ? 0.15 : 0.05)
  const uChromaticAberration = uniform(0.008)
  const uGlobalAmp = uniform(opts.waveAmp)
  const uGlobalSpeed = uniform(opts.waveSpeed)
  const uStormIntensity = uniform(opts.stormIntensity)
  const uWaveAmplitudes = uniformArray(amps, 'float')
  const uWaveFrequencies = uniformArray(freqs, 'float')
  const uWaveSpeeds = uniformArray(speeds, 'float')
  const uWaveDirections = uniformArray(dirs, 'vec2')
  const uWaveSteepness = uniformArray(steep, 'float')
  const uNightBlend = uniform(opts.isNight ? 1 : 0)
  const uIsNight = uniform(opts.isNight ? 1 : 0)
  const uDynLightPositions = uniformArray(
    Array.from({ length: MAX_DYNAMIC_LIGHTS }, () => new THREE.Vector3()),
    'vec3',
  )
  const uDynLightColors = uniformArray(
    Array.from({ length: MAX_DYNAMIC_LIGHTS }, () => new THREE.Color('#000000')),
    'vec3',
  )
  const uDynLightIntensities = uniformArray(new Array(MAX_DYNAMIC_LIGHTS).fill(0), 'float')
  const uDynLightRadii = uniformArray(new Array(MAX_DYNAMIC_LIGHTS).fill(1), 'float')
  const uDynLightCount = uniform(0)
  const uTugActive = uniform(0)
  const uTugPos = uniform(new THREE.Vector3())
  const uTugDir = uniform(new THREE.Vector3(0, 0, 1))
  const uPropWashPower = uniform(0)
  const uWashAsymmetry = uniform(0)

  const getWaveHeight = (worldPos: any, t: any) => {
    const stormAmp = float(1).add(uStormIntensity.mul(2))
    let height = tsl(float(0))
    for (let i = 0; i < MAX_WAVE_LAYERS; i++) {
      const amp = tsl(uWaveAmplitudes.element(i)).mul(uGlobalAmp).mul(stormAmp)
      const freq = tsl(uWaveFrequencies.element(i))
      const spd = tsl(uWaveSpeeds.element(i)).mul(uGlobalSpeed)
      const dir = tsl(uWaveDirections.element(i))
      const steepness = tsl(uWaveSteepness.element(i))
      const dotProd = worldPos.x.mul(dir.x).add(worldPos.y.mul(dir.y))
      const phase = tsl(dotProd.mul(freq).add(t.mul(spd)))
      height = tsl(height.add(amp.mul(sin(phase)).add(steepness.mul(0))))
    }
    return height
  }

  const getRippleDetail = (worldPos: any, t: any) => {
    const gate = step(float(0.1), uStormIntensity)
    const r0 = sin(worldPos.x.mul(12).add(t.mul(3))).mul(cos(worldPos.y.mul(12).add(t.mul(2.5))))
    const r1 = sin(worldPos.x.mul(18).sub(t.mul(4))).mul(cos(worldPos.y.mul(16).add(t.mul(3.5))))
    return r0.add(r1).mul(uStormIntensity).mul(0.03).mul(gate)
  }

  const getTugWakeDisp = (worldPos: any, t: any) => {
    const active = uTugActive.mul(step(float(0.01), uPropWashPower))
    const tugPos2d = vec2(uTugPos.x, uTugPos.z)
    const tugFwd2d = normalize(vec2(uTugDir.x, uTugDir.z))
    const tugRgt2d = vec2(tugFwd2d.y.negate(), tugFwd2d.x)
    const delta = worldPos.sub(tugPos2d)
    const behind = dot(delta, tugFwd2d).negate()
    const sideways = dot(delta, tugRgt2d)
    const aheadMask = step(float(0), behind)
    const kelvinEdge = behind.mul(0.364).add(0.5)
    const insideV = float(1).sub(smoothstep(float(0), kelvinEdge, abs(sideways)))
    const decay = exp(behind.mul(-0.06))
    const tFreq = float(0.65).add(uPropWashPower.mul(0.25))
    const transWave = sin(behind.mul(tFreq).sub(t.mul(2.4))).mul(insideV).mul(0.55)
    const divOuter = abs(sideways).mul(0.55).add(behind.mul(0.18)).sub(t.mul(1.7))
    const divInner = abs(sideways).mul(0.35).sub(behind.mul(0.22)).sub(t.mul(2.0))
    let divWave = tsl(sin(divOuter).mul(0.4).add(sin(divInner).mul(0.3)).mul(insideV))
    divWave = divWave.mul(float(1).add(signSide(sideways).mul(uWashAsymmetry).mul(0.25)))
    const washHalfW = float(1.5).add(behind.mul(0.2))
    let washInside = tsl(max(float(0), float(1).sub(abs(sideways).div(washHalfW))))
    washInside = pow(washInside, float(2))
    const washDecay = exp(behind.mul(-0.14))
    const sternWash = sin(behind.mul(3.2).sub(t.mul(8.5)))
      .mul(cos(sideways.mul(1.5).add(t.mul(3.8))))
      .mul(washInside)
      .mul(washDecay)
      .mul(0.9)
    const disp = transWave
      .mul(0.55)
      .add(divWave.mul(0.35))
      .add(sternWash.mul(0.55))
      .mul(uPropWashPower)
      .mul(decay)
    return disp.mul(active).mul(aheadMask)
  }

  const getTugWakeFoam = (worldPos: any, t: any) => {
    const active = uTugActive.mul(step(float(0.01), uPropWashPower))
    const tugPos2d = vec2(uTugPos.x, uTugPos.z)
    const tugFwd2d = normalize(vec2(uTugDir.x, uTugDir.z))
    const tugRgt2d = vec2(tugFwd2d.y.negate(), tugFwd2d.x)
    const delta = worldPos.sub(tugPos2d)
    const behind = dot(delta, tugFwd2d).negate()
    const sideways = dot(delta, tugRgt2d)
    const aheadMask = step(float(0), behind)
    const kelvinEdge = behind.mul(0.364).add(0.5)
    const insideV = float(1).sub(smoothstep(float(0), kelvinEdge, abs(sideways)))
    const washHalfW = float(1.3).add(behind.mul(0.15))
    let sternFoam = max(float(0), float(1).sub(abs(sideways).div(washHalfW))).mul(exp(behind.mul(-0.11)))
    sternFoam = pow(sternFoam, float(1.5))
    const edgeFoam = insideV.mul(exp(behind.mul(-0.05))).mul(0.35)
    return sternFoam.mul(0.85).add(edgeFoam).mul(uPropWashPower).mul(active).mul(aheadMask).mul(float(1).add(t.mul(0)))
  }

  const getFoam = (worldPos: any, t: any, h: any) => {
    const delta = float(0.5)
    const hL = getWaveHeight(worldPos.add(vec2(delta.negate(), 0)), t)
    const hR = getWaveHeight(worldPos.add(vec2(delta, 0)), t)
    const hD = getWaveHeight(worldPos.add(vec2(0, delta.negate())), t)
    const hU = getWaveHeight(worldPos.add(vec2(0, delta)), t)
    const dx = abs(hR.sub(hL))
    const dz = abs(hU.sub(hD))
    const slope = dx.mul(dx).add(dz.mul(dz)).sqrt()
    const foam = float(1).sub(smoothstep(float(0.4), float(1.2), slope))
    const crest = smoothstep(float(0), float(1.5), h)
    return max(float(0), foam.mul(crest).mul(float(0.3).add(uStormIntensity.mul(0.7))))
  }

  const getWaveNormal = (worldPos: any, t: any) => {
    const delta = float(0.3)
    const hL = getWaveHeight(worldPos.add(vec2(delta.negate(), 0)), t)
    const hR = getWaveHeight(worldPos.add(vec2(delta, 0)), t)
    const hD = getWaveHeight(worldPos.add(vec2(0, delta.negate())), t)
    const hU = getWaveHeight(worldPos.add(vec2(0, delta)), t)
    return normalize(vec3(hL.sub(hR), delta.mul(2), hD.sub(hU)))
  }

  const caustics = (pos: any, time: any) => {
    let c = tsl(sin(pos.x.mul(10).add(time)).mul(sin(pos.y.mul(10).add(time.mul(0.8)))))
    c = c.add(sin(pos.x.mul(15).sub(time.mul(1.2))).mul(sin(pos.y.mul(12).add(time))))
    c = c.add(sin(pos.x.mul(8).add(time.mul(0.5))).mul(sin(pos.y.mul(18).sub(time.mul(0.7)))))
    return pow(abs(c).mul(0.5), float(2))
  }

  const undeformedWorld = modelWorldMatrix.mul(vec4(positionLocal, 1))
  const worldPos2d = vec2(undeformedWorld.x, undeformedWorld.z)
  const elevation = getWaveHeight(worldPos2d, uTime)
    .add(getRippleDetail(worldPos2d, uTime))
    .add(getTugWakeDisp(worldPos2d, uTime))

  const mat = new MeshStandardNodeMaterial()
  mat.transparent = true
  mat.depthWrite = true
  mat.side = THREE.DoubleSide
  mat.lights = false
  mat.positionNode = positionLocal.add(vec3(0, elevation, 0))

  const displacedWorld = modelWorldMatrix.mul(vec4(positionLocal.add(vec3(0, elevation, 0)), 1))
  const vWorldPos = vec3(displacedWorld.x, displacedWorld.y, displacedWorld.z)
  const vNormal = normalize(getWaveNormal(worldPos2d, uTime))
  const vFoam = getFoam(worldPos2d, uTime, elevation).add(getTugWakeFoam(worldPos2d, uTime))

  const viewDir = normalize(uCameraPos.sub(vWorldPos))
  const normal = normalize(vNormal)
  const NdotV = max(dot(normal, viewDir), float(0))
  const fresnel = pow(float(1).sub(NdotV), float(3))
  const halfDir = normalize(uSunDir.add(viewDir))
  const NdotH = max(dot(normal, halfDir), float(0))
  let specular = tsl(pow(NdotH, float(128).mul(float(1).sub(uRoughness))))
  specular = specular.mul(float(1).add(uStormIntensity.mul(0.3)))

  let color = tsl(mix(uDeepColor, uWaterColor, fresnel.mul(0.6).add(0.4)))
  const reflectColor = mix(uReflectionTint, uSunColor, fresnel.mul(0.5))
  color = color.add(reflectColor.mul(fresnel).mul(0.4))
  color = color.add(uSunColor.mul(specular).mul(0.6))

  const causticPattern = caustics(vec2(vWorldPos.x, vWorldPos.z).mul(0.5), uTime.mul(0.5))
  const causticsColor = vec3(0.7, 0.9, 1.0)
    .mul(causticPattern)
    .mul(uCausticsStrength)
    .mul(max(float(0), dot(normal, uSunDir)))
  color = color.add(causticsColor)

  const subsurface = pow(float(1).sub(NdotV), float(3)).mul(0.5)
  const subColor = mix(vec3(0.0, 0.1, 0.2), vec3(0.1, 0.3, 0.5), float(1).sub(uIsNight))
  color = color.add(subColor.mul(subsurface))

  let foam = tsl(vFoam.mul(uFoamStrength))
  foam = foam.mul(
    float(0.8).add(
      float(0.2)
        .mul(sin(vWorldPos.x.mul(3).add(uTime)))
        .mul(sin(vWorldPos.z.mul(3).add(uTime.mul(0.7)))),
    ),
  )
  const foamColor = mix(vec3(0.95, 0.95, 1.0), vec3(0.8, 0.9, 1.0), uIsNight)
  color = mix(color, foamColor, clamp(foam, float(0), float(1)))

  const godRay = pow(max(float(0), dot(viewDir, uSunDir.negate())), float(8)).mul(uGodRayIntensity)
  color = color.add(uSunColor.mul(godRay))

  let dynSpec = tsl(vec3(0, 0, 0))
  let dynCaustics = tsl(vec3(0, 0, 0))
  let dynGlow = tsl(vec3(0, 0, 0))
  for (let i = 0; i < MAX_DYNAMIC_LIGHTS; i++) {
    const active = step(float(i + 0.5), uDynLightCount)
    const lightVec = tsl(uDynLightPositions.element(i)).sub(vWorldPos)
    const dist = length(lightVec)
    const lightDir = lightVec.div(max(dist, float(0.0001)))
    const radius = max(float(1), tsl(uDynLightRadii.element(i)))
    const atten = tsl(uDynLightIntensities.element(i)).mul(exp(dist.negate().div(radius))).div(float(1).add(dist.mul(0.12)))
    const NdotL = max(dot(normal, lightDir), float(0))
    const dynHalfDir = normalize(lightDir.add(viewDir))
    const dynSpecPow = mix(float(36), float(120), clamp(float(1).sub(uRoughness), float(0), float(1)))
    const spec = pow(max(dot(normal, dynHalfDir), float(0)), dynSpecPow).mul(atten)
    const col = tsl(uDynLightColors.element(i))
    dynSpec = dynSpec.add(col.mul(spec).mul(0.8).mul(active))
    const localPattern = caustics(
      vec2(vWorldPos.x, vWorldPos.z).mul(0.65).add(vec2(lightDir.x, lightDir.z).mul(3)).add(float(i * 0.13)),
      uTime.mul(0.9).add(float(i * 1.37)),
    )
    dynCaustics = dynCaustics.add(col.mul(localPattern).mul(atten).mul(NdotL).mul(0.5).mul(active))
    dynGlow = dynGlow.add(col.mul(atten).mul(float(0.08).add(NdotL.mul(0.18))).mul(active))
  }
  color = color.add(dynSpec.mul(uNightBlend))
  color = color.add(dynCaustics.mul(float(0.5).add(uCausticsStrength)).mul(uNightBlend))
  color = color.add(dynGlow.mul(0.35).mul(uNightBlend))

  const abStrength = float(1).sub(NdotV).mul(uChromaticAberration)
  const refracted = refract(viewDir.negate(), normal, float(0.75))
  const refractShift = vec3(refracted).x.mul(abStrength)
  color = vec3(color.x.add(refractShift.mul(0.5)), color.y, color.z.sub(refractShift.mul(0.5)))

  const alpha = float(0.88).add(foam.mul(0.12))
  mat.colorNode = color
  mat.opacityNode = alpha
  mat.metalnessNode = float(0.72)
  mat.roughnessNode = uRoughness
  mat.normalNode = vNormal

  mat.userData = {
    uTime,
    uCameraPos,
    uSunDir,
    uSunColor,
    uWaterColor,
    uDeepColor,
    uReflectionTint,
    uFoamStrength,
    uRoughness,
    uCausticsStrength,
    uGodRayIntensity,
    uChromaticAberration,
    uGlobalAmp,
    uGlobalSpeed,
    uStormIntensity,
    uWaveAmplitudes,
    uWaveFrequencies,
    uWaveSpeeds,
    uWaveDirections,
    uWaveSteepness,
    uNightBlend,
    uIsNight,
    uDynLightPositions,
    uDynLightColors,
    uDynLightIntensities,
    uDynLightRadii,
    uDynLightCount,
    uTugActive,
    uTugPos,
    uTugDir,
    uPropWashPower,
    uWashAsymmetry,
  } as unknown as WaterTslUserData

  return mat
}

function signSide(sideways: any) {
  return step(float(0), sideways).mul(2).sub(1)
}
