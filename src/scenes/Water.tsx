// =============================================================================
// WATER COMPONENT — HarborGlow Premium Edition
// Gerstner wave displacement with PBR-style shading, caustics, foam, god rays.
// CPU/GPU wave math is kept in sync via WaveSystem uniform arrays.
// =============================================================================

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { waveSystem } from '../systems/WaveSystem'
import { tugboatWakeState, TUGBOAT_WAKE_GLSL } from '../systems/TugboatWakeSystem'
import { useMusicPulse } from '../hooks/useMusicPulse'

// -------------------------------------------------------------------------
// MAX WAVE LAYERS (must match WaveSystem.ts)
// -------------------------------------------------------------------------
const MAX_LAYERS = 4
const MAX_DYNAMIC_LIGHTS = 6

// -------------------------------------------------------------------------
// SHADER SNIPPETS
// -------------------------------------------------------------------------

const waveMath = `
  uniform float uTime;
  uniform float uGlobalAmp;
  uniform float uGlobalSpeed;
  uniform float uStormIntensity;
  uniform float uWaveAmplitudes[${MAX_LAYERS}];
  uniform float uWaveFrequencies[${MAX_LAYERS}];
  uniform float uWaveSpeeds[${MAX_LAYERS}];
  uniform vec2  uWaveDirections[${MAX_LAYERS}];
  uniform float uWaveSteepness[${MAX_LAYERS}];

  // Compute wave height at world xz
  float getWaveHeight(vec2 worldPos, float t) {
    float height = 0.0;
    float stormAmp = 1.0 + uStormIntensity * 2.0;

    for (int i = 0; i < ${MAX_LAYERS}; i++) {
      float amp = uWaveAmplitudes[i] * uGlobalAmp * stormAmp;
      float freq = uWaveFrequencies[i];
      float spd = uWaveSpeeds[i] * uGlobalSpeed;
      vec2 dir = uWaveDirections[i];
      float steep = uWaveSteepness[i];

      float dotProd = worldPos.x * dir.x + worldPos.y * dir.y;
      float phase = dotProd * freq + t * spd;

      height += amp * sin(phase);
    }
    return height;
  }

  // Compute normal via partial derivatives
  vec3 getWaveNormal(vec2 worldPos, float t) {
    float delta = 0.3;
    float hL = getWaveHeight(worldPos + vec2(-delta, 0.0), t);
    float hR = getWaveHeight(worldPos + vec2( delta, 0.0), t);
    float hD = getWaveHeight(worldPos + vec2(0.0, -delta), t);
    float hU = getWaveHeight(worldPos + vec2(0.0,  delta), t);
    return normalize(vec3(hL - hR, 2.0 * delta, hD - hU));
  }

  // Foam proxy: derivative magnitude + crest bias
  float getFoam(vec2 worldPos, float t, float h) {
    float delta = 0.5;
    float hL = getWaveHeight(worldPos + vec2(-delta, 0.0), t);
    float hR = getWaveHeight(worldPos + vec2( delta, 0.0), t);
    float hD = getWaveHeight(worldPos + vec2(0.0, -delta), t);
    float hU = getWaveHeight(worldPos + vec2(0.0,  delta), t);

    float dx = abs(hR - hL);
    float dz = abs(hU - hD);
    float slope = sqrt(dx*dx + dz*dz);

    float foam = 1.0 - smoothstep(0.4, 1.2, slope);
    float crest = smoothstep(0.0, 1.5, h);
    return max(0.0, foam * crest * (0.3 + uStormIntensity * 0.7));
  }

  // Rain / storm ripple detail
  float getRippleDetail(vec2 worldPos, float t) {
    if (uStormIntensity < 0.1) return 0.0;
    float ripple = 0.0;
    ripple += sin(worldPos.x * 12.0 + t * 3.0) * cos(worldPos.y * 12.0 + t * 2.5);
    ripple += sin(worldPos.x * 18.0 - t * 4.0) * cos(worldPos.y * 16.0 + t * 3.5);
    ripple *= uStormIntensity * 0.03;
    return ripple;
  }
`

const causticsMath = `
  float caustics(vec2 pos, float time) {
    float c = 0.0;
    c += sin(pos.x * 10.0 + time) * sin(pos.y * 10.0 + time * 0.8);
    c += sin(pos.x * 15.0 - time * 1.2) * sin(pos.y * 12.0 + time);
    c += sin(pos.x * 8.0 + time * 0.5) * sin(pos.y * 18.0 - time * 0.7);
    c = pow(abs(c) * 0.5, 2.0);
    return c;
  }
`

// -------------------------------------------------------------------------
// PROPS
// -------------------------------------------------------------------------

interface WaterProps {
  isNight?: boolean
}

interface DynamicLightSource {
  position: THREE.Vector3
  color: THREE.Color
  intensity: number
  radius: number
}

// -------------------------------------------------------------------------
// COMPONENT
// -------------------------------------------------------------------------

export default function Water({ isNight = true }: WaterProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { camera } = useThree()

  const weather = useGameStore((s) => s.weather)
  const quality = useGameStore((s) => s.qualityPreset)
  const waveParams = useGameStore((s) => s.waveParams)
  const stormIntensity = useGameStore((s) => s.stormIntensity)
  const lightIntensity = useGameStore((s) => s.lightIntensity)
  const timeOfDay = useGameStore((s) => s.timeOfDay)
  const bpm = useGameStore((s) => s.bpm)
  const musicPlaying = useGameStore((s) => s.musicPlaying)
  const ships = useGameStore((s) => s.ships)
  const installedUpgrades = useGameStore((s) => s.installedUpgrades)
  const spreaderPos = useGameStore((s) => s.spreaderPos)
  const musicPulse = useMusicPulse(bpm)
  const musicActive = Array.from(musicPlaying.values()).some(Boolean)

  // Determine active layer count by quality
  const activeLayers = quality === 'high' ? 4 : quality === 'medium' ? 3 : 2
  const segments = quality === 'high' ? 512 : quality === 'medium' ? 256 : 128

  // Build uniforms
  const uniforms = useMemo(() => {
    const layers = waveSystem.getLayersForShader()
    const uWaveAmplitudes = new Float32Array(MAX_LAYERS)
    const uWaveFrequencies = new Float32Array(MAX_LAYERS)
    const uWaveSpeeds = new Float32Array(MAX_LAYERS)
    const uWaveDirections = new Float32Array(MAX_LAYERS * 2)
    const uWaveSteepness = new Float32Array(MAX_LAYERS)

    for (let i = 0; i < MAX_LAYERS; i++) {
      if (i < layers.length) {
        uWaveAmplitudes[i] = layers[i].amplitude
        uWaveFrequencies[i] = layers[i].frequency
        uWaveSpeeds[i] = layers[i].speed
        uWaveDirections[i * 2] = layers[i].direction[0]
        uWaveDirections[i * 2 + 1] = layers[i].direction[1]
        uWaveSteepness[i] = layers[i].steepness
      } else {
        uWaveAmplitudes[i] = 0
        uWaveFrequencies[i] = 1
        uWaveSpeeds[i] = 0
        uWaveDirections[i * 2] = 1
        uWaveDirections[i * 2 + 1] = 0
        uWaveSteepness[i] = 0
      }
    }

    return {
      uTime: { value: 0 },
      uCameraPos: { value: new THREE.Vector3() },
      uSunDir: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
      uSunColor: { value: new THREE.Color(isNight ? '#6688ff' : '#fff8e0') },
      uWaterColor: { value: new THREE.Color(isNight ? '#001a33' : '#006994') },
      uDeepColor: { value: new THREE.Color(isNight ? '#000814' : '#003d5c') },
      uReflectionTint: { value: new THREE.Color(isNight ? '#112244' : '#88ccff') },
      uFoamStrength: { value: weather === 'storm' ? 1.2 : weather === 'rain' ? 0.6 : 0.35 },
      uRoughness: { value: weather === 'storm' ? 0.45 : weather === 'rain' ? 0.3 : 0.12 },
      uCausticsStrength: { value: isNight ? 0.25 : 0.7 },
      uGodRayIntensity: { value: isNight ? 0.15 : 0.05 },
      uChromaticAberration: { value: 0.008 },
      uGlobalAmp: { value: waveParams.amplitude },
      uGlobalSpeed: { value: waveParams.speed },
      uStormIntensity: { value: stormIntensity },
      uWaveAmplitudes: { value: uWaveAmplitudes },
      uWaveFrequencies: { value: uWaveFrequencies },
      uWaveSpeeds: { value: uWaveSpeeds },
      uWaveDirections: { value: uWaveDirections },
      uWaveSteepness: { value: uWaveSteepness },
      uActiveLayers: { value: activeLayers },
      uIsNight: { value: isNight },
      uNightBlend: { value: isNight ? 1 : 0 },
      uDynLightPositions: { value: Array.from({ length: MAX_DYNAMIC_LIGHTS }, () => new THREE.Vector3()) },
      uDynLightColors: { value: Array.from({ length: MAX_DYNAMIC_LIGHTS }, () => new THREE.Color('#000000')) },
      uDynLightIntensities: { value: new Float32Array(MAX_DYNAMIC_LIGHTS) },
      uDynLightRadii: { value: new Float32Array(MAX_DYNAMIC_LIGHTS) },
      uDynLightCount: { value: 0 },
      // --- Tugboat wake uniforms (updated per-frame from TugboatWakeSystem) ---
      uTugActive: { value: false },
      uTugPos: { value: new THREE.Vector3() },
      uTugDir: { value: new THREE.Vector3(0, 0, 1) },
      uPropWashPower: { value: 0 },
      uWashAsymmetry: { value: 0 },
    }
  }, [isNight, weather, activeLayers, waveParams.amplitude, waveParams.speed, stormIntensity])

  // Vertex shader
  const vertexShader = `
    ${waveMath}
    ${TUGBOAT_WAKE_GLSL}

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vElevation;
    varying float vFoam;

    void main() {
      vUv = uv;
      vec2 worldPos = (modelMatrix * vec4(position, 1.0)).xz;

      float elevation = getWaveHeight(worldPos, uTime);
      elevation += getRippleDetail(worldPos, uTime);
      // --- Tugboat Kelvin wake + stern wash displacement ---
      elevation += getTugWakeDisp(worldPos, uTime);
      vElevation = elevation;

      vec3 normal = getWaveNormal(worldPos, uTime);
      vNormal = normalize(mat3(modelMatrix) * normal);
      // Blend ocean foam with tugboat wake foam
      vFoam = getFoam(worldPos, uTime, elevation) + getTugWakeFoam(worldPos, uTime);

      vec3 newPos = position + vec3(0.0, elevation, 0.0);
      vWorldPos = (modelMatrix * vec4(newPos, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
  `

  // Fragment shader
  const fragmentShader = `
    uniform vec3 uCameraPos;
    uniform vec3 uSunDir;
    uniform vec3 uSunColor;
    uniform vec3 uWaterColor;
    uniform vec3 uDeepColor;
    uniform vec3 uReflectionTint;
    uniform float uFoamStrength;
    uniform float uRoughness;
    uniform float uCausticsStrength;
    uniform float uGodRayIntensity;
    uniform float uChromaticAberration;
    uniform float uStormIntensity;
    uniform float uTime;
    uniform bool uIsNight;
    uniform float uNightBlend;
    uniform vec3 uDynLightPositions[${MAX_DYNAMIC_LIGHTS}];
    uniform vec3 uDynLightColors[${MAX_DYNAMIC_LIGHTS}];
    uniform float uDynLightIntensities[${MAX_DYNAMIC_LIGHTS}];
    uniform float uDynLightRadii[${MAX_DYNAMIC_LIGHTS}];
    uniform int uDynLightCount;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vElevation;
    varying float vFoam;

    ${causticsMath}

    void main() {
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      vec3 normal = normalize(vNormal);
      float NdotV = max(dot(normal, viewDir), 0.0);

      // --- Fresnel ---
      float fresnel = pow(1.0 - NdotV, 3.0);

      // --- PBR-style specular ---
      vec3 halfDir = normalize(uSunDir + viewDir);
      float NdotH = max(dot(normal, halfDir), 0.0);
      // GGX-like distribution simplified
      float specular = pow(NdotH, 128.0 * (1.0 - uRoughness));
      specular *= (1.0 + uStormIntensity * 0.3); // storm boosts sparkle

      // --- Base color (depth + fresnel) ---
      vec3 color = mix(uDeepColor, uWaterColor, fresnel * 0.6 + 0.4);

      // --- Reflection tint (environment + local lights) ---
      vec3 reflectColor = mix(uReflectionTint, uSunColor, fresnel * 0.5);
      color += reflectColor * fresnel * 0.4;

      // --- Specular highlight ---
      color += uSunColor * specular * 0.6;

      // --- Caustics ---
      float causticPattern = caustics(vWorldPos.xz * 0.5, uTime * 0.5);
      vec3 causticsColor = vec3(0.7, 0.9, 1.0) * causticPattern * uCausticsStrength * max(0.0, dot(normal, uSunDir));
      color += causticsColor;

      // --- Subsurface scattering ---
      float subsurface = pow(1.0 - NdotV, 3.0) * 0.5;
      color += mix(vec3(0.0, 0.1, 0.2), vec3(0.1, 0.3, 0.5), uIsNight ? 0.0 : 1.0) * subsurface;

      // --- Foam ---
      float foam = vFoam * uFoamStrength;
      // Add noise to foam edges
      foam *= (0.8 + 0.2 * sin(vWorldPos.x * 3.0 + uTime) * sin(vWorldPos.z * 3.0 + uTime * 0.7));
      vec3 foamColor = mix(vec3(0.95, 0.95, 1.0), vec3(0.8, 0.9, 1.0), uIsNight ? 1.0 : 0.0);
      color = mix(color, foamColor, clamp(foam, 0.0, 1.0));

      // --- God ray contribution on surface ---
      float godRay = pow(max(0.0, dot(viewDir, -uSunDir)), 8.0) * uGodRayIntensity;
      color += uSunColor * godRay;

      // --- Dynamic harbor lights (ships, dock, crane) ---
      vec3 dynSpec = vec3(0.0);
      vec3 dynCaustics = vec3(0.0);
      vec3 dynGlow = vec3(0.0);
      for (int i = 0; i < ${MAX_DYNAMIC_LIGHTS}; i++) {
        if (i >= uDynLightCount) break;
        vec3 lightVec = uDynLightPositions[i] - vWorldPos;
        float dist = length(lightVec);
        vec3 lightDir = lightVec / max(dist, 0.0001);
        float radius = max(1.0, uDynLightRadii[i]);
        float atten = uDynLightIntensities[i] * exp(-dist / radius) / (1.0 + dist * 0.12);
        float NdotL = max(dot(normal, lightDir), 0.0);

        vec3 dynHalfDir = normalize(lightDir + viewDir);
        float dynSpecPow = mix(36.0, 120.0, clamp(1.0 - uRoughness, 0.0, 1.0));
        float spec = pow(max(dot(normal, dynHalfDir), 0.0), dynSpecPow) * atten;
        dynSpec += uDynLightColors[i] * spec * 0.8;

        float localPattern = caustics(vWorldPos.xz * 0.65 + lightDir.xz * 3.0 + float(i) * 0.13, uTime * 0.9 + float(i) * 1.37);
        dynCaustics += uDynLightColors[i] * localPattern * atten * NdotL * 0.5;
        dynGlow += uDynLightColors[i] * atten * (0.08 + NdotL * 0.18);
      }
      color += dynSpec * uNightBlend;
      color += dynCaustics * (0.5 + uCausticsStrength) * uNightBlend;
      color += dynGlow * 0.35 * uNightBlend;

      // --- Chromatic aberration at glancing angles ---
      float abStrength = (1.0 - NdotV) * uChromaticAberration;
      vec2 refractDir = refract(-viewDir, normal, 0.75).xz * abStrength;
      // Fake chroma shift by tinting
      color.r += refractDir.x * 0.5;
      color.b -= refractDir.x * 0.5;

      // --- Alpha ---
      float alpha = 0.88 + foam * 0.12;

      gl_FragColor = vec4(color, alpha);
    }
  `

  // Update uniforms each frame
  useFrame(() => {
    if (!materialRef.current) return

    const mat = materialRef.current
    const nightBlend = isNight
      ? 1
      : timeOfDay < 8
        ? (8 - timeOfDay) / 3
        : timeOfDay > 18
          ? (timeOfDay - 18) / 5
          : 0
    const clampedNightBlend = Math.max(0, Math.min(1, nightBlend))

    const shipTypeColor: Record<string, string> = {
      cruise: '#ffc27d',
      container: '#66d7ff',
      tanker: '#ff9c4f',
      bulk: '#e6b87f',
      lng: '#7bd6ff',
      roro: '#ff9e6e',
      research: '#87bbff',
      droneship: '#a3d8ff',
      ferry: '#9dd9ff',
      trawler: '#d8b07a',
      horizon: '#95beff',
    }

    const upgradeByShip = new Map<string, number>()
    installedUpgrades.forEach((upgrade) => {
      upgradeByShip.set(upgrade.shipId, (upgradeByShip.get(upgrade.shipId) ?? 0) + 1)
    })

    const dynamicSources: DynamicLightSource[] = []

    // Dock pools and beacons
    const dockBase = Math.max(0.25, lightIntensity)
    dynamicSources.push(
      { position: new THREE.Vector3(-20, 8, -8), color: new THREE.Color('#ffb15a'), intensity: 2.4 * dockBase, radius: 30 },
      { position: new THREE.Vector3(20, 8, -8), color: new THREE.Color('#ffb15a'), intensity: 2.4 * dockBase, radius: 30 },
      { position: new THREE.Vector3(-30, -3, 10), color: new THREE.Color('#38b6ff'), intensity: 1.8 * dockBase, radius: 34 },
      { position: new THREE.Vector3(30, -3, 10), color: new THREE.Color('#38b6ff'), intensity: 1.8 * dockBase, radius: 34 },
    )

    // Crane hook / work light source
    dynamicSources.push({
      position: new THREE.Vector3(spreaderPos.x, spreaderPos.y + 0.8, spreaderPos.z),
      color: new THREE.Color('#ffd99a'),
      intensity: (2.2 + Math.max(0, 8 - spreaderPos.y) * 0.2) * lightIntensity,
      radius: 14,
    })

    ships.forEach((ship) => {
      const installedCount = upgradeByShip.get(ship.id) ?? 0
      const maxPoints = Math.max(1, ship.attachmentPoints.length)
      const progress = Math.min(1, installedCount / maxPoints)
      const baseColor = new THREE.Color(shipTypeColor[ship.type] ?? '#a5ceff')
      const shipCenter = new THREE.Vector3(ship.position[0], ship.position[1] + 4.5, ship.position[2])

      // Persistent ship glow (baseline + progress)
      dynamicSources.push({
        position: shipCenter,
        color: baseColor,
        intensity: (0.7 + progress * 1.6) * lightIntensity,
        radius: Math.max(12, ship.length * 0.7),
      })

      // Tanker flare style hotspot
      if (ship.type === 'tanker') {
        dynamicSources.push({
          position: new THREE.Vector3(ship.position[0] - 2.4, ship.position[1] + 9.5, ship.position[2] - ship.length * 0.22),
          color: new THREE.Color('#ff7f35'),
          intensity: (1.4 + progress * 2.0) * lightIntensity,
          radius: 20,
        })
      }

      // Use a subset of installed upgrade points as local reflected highlights
      let usedPoints = 0
      for (const upgrade of installedUpgrades) {
        if (upgrade.shipId !== ship.id || usedPoints >= 2) continue
        const part = ship.attachmentPoints.find((p) => p.partName === upgrade.partName)
        if (!part) continue
        dynamicSources.push({
          position: new THREE.Vector3(
            ship.position[0] + part.position[0],
            ship.position[1] + part.position[1] + 1.2,
            ship.position[2] + part.position[2]
          ),
          color: baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.35),
          intensity: (1.1 + progress * 1.3) * lightIntensity,
          radius: 12,
        })
        usedPoints += 1
      }
    })

    const scored = dynamicSources
      .map((source) => {
        const distance = source.position.distanceTo(camera.position)
        const score = source.intensity / (1 + distance * 0.05)
        return { source, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_DYNAMIC_LIGHTS)

    mat.uniforms.uTime.value = waveSystem.getTime()
    mat.uniforms.uCameraPos.value.copy(camera.position)
    mat.uniforms.uGlobalAmp.value = waveParams.amplitude * (musicActive ? 1 + musicPulse * 0.12 : 1)
    mat.uniforms.uGlobalSpeed.value = waveParams.speed
    mat.uniforms.uStormIntensity.value = stormIntensity
    mat.uniforms.uNightBlend.value = clampedNightBlend

    // Sync wave layer directions (they drift with chaos)
    const layers = waveSystem.getLayersForShader()
    for (let i = 0; i < MAX_LAYERS; i++) {
      if (i < layers.length) {
        mat.uniforms.uWaveAmplitudes.value[i] = layers[i].amplitude
        mat.uniforms.uWaveSpeeds.value[i] = layers[i].speed
        mat.uniforms.uWaveDirections.value[i * 2] = layers[i].direction[0]
        mat.uniforms.uWaveDirections.value[i * 2 + 1] = layers[i].direction[1]
      }
    }

    mat.uniforms.uDynLightCount.value = scored.length
    for (let i = 0; i < MAX_DYNAMIC_LIGHTS; i++) {
      const current = scored[i]?.source
      const pos = mat.uniforms.uDynLightPositions.value[i] as THREE.Vector3
      const col = mat.uniforms.uDynLightColors.value[i] as THREE.Color
      mat.uniforms.uDynLightIntensities.value[i] = current ? current.intensity * clampedNightBlend : 0
      mat.uniforms.uDynLightRadii.value[i] = current ? current.radius : 1
      if (current) {
        pos.copy(current.position)
        col.copy(current.color)
      } else {
        pos.set(0, -1000, 0)
        col.set('#000000')
      }
    }

    // --- Sync tugboat wake uniforms (zero-copy from module-level state) ---
    mat.uniforms.uTugActive.value = tugboatWakeState.active
    if (tugboatWakeState.active) {
      mat.uniforms.uTugPos.value.copy(tugboatWakeState.position)
      mat.uniforms.uTugDir.value.copy(tugboatWakeState.direction)
      mat.uniforms.uPropWashPower.value = tugboatWakeState.propWashPower
      mat.uniforms.uWashAsymmetry.value = tugboatWakeState.washAsymmetry
    } else {
      mat.uniforms.uPropWashPower.value = 0
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={[0, -2.5, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[1000, 1000, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
