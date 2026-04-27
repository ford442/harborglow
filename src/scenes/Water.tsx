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

// -------------------------------------------------------------------------
// MAX WAVE LAYERS (must match WaveSystem.ts)
// -------------------------------------------------------------------------
const MAX_LAYERS = 4

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
    }
  }, [isNight, weather, activeLayers, waveParams.amplitude, waveParams.speed, stormIntensity])

  // Vertex shader
  const vertexShader = `
    ${waveMath}

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
      vElevation = elevation;

      vec3 normal = getWaveNormal(worldPos, uTime);
      vNormal = normalize(mat3(modelMatrix) * normal);
      vFoam = getFoam(worldPos, uTime, elevation);

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
      float alpha = uRoughness * uRoughness;
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
    mat.uniforms.uTime.value = waveSystem.getTime()
    mat.uniforms.uCameraPos.value.copy(camera.position)
    mat.uniforms.uGlobalAmp.value = waveParams.amplitude
    mat.uniforms.uGlobalSpeed.value = waveParams.speed
    mat.uniforms.uStormIntensity.value = stormIntensity

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
