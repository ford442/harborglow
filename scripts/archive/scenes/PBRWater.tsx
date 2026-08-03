import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// PBR WATER SHADER - HarborGlow
// Physically-based water rendering with BRDF, SSR, and caustics
// =============================================================================

// Schlick's Fresnel approximation
const fresnelSchlick = `
  vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
  }
  
  float fresnelSchlickScalar(float cosTheta, float F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
  }
`

// GGX/Trowbridge-Reitz normal distribution
const distributionGGX = `
  float distributionGGX(float NdotH, float roughness) {
    float alpha = roughness * roughness;
    float alpha2 = alpha * alpha;
    float NdotH2 = NdotH * NdotH;
    
    float denom = NdotH2 * (alpha2 - 1.0) + 1.0;
    return alpha2 / (3.14159265 * denom * denom);
  }
`

// Smith GGX geometric shadowing
const geometrySmith = `
  float geometrySchlickGGX(float NdotV, float roughness) {
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
  }
  
  float geometrySmith(float NdotV, float NdotL, float roughness) {
    return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
  }
`

// Wave functions with multiple octaves
const waveFunctions = `
  // Simplex noise for organic waves
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  // Multi-octave wave displacement
  vec3 getWaveDisplacement(vec2 pos, float time) {
    vec3 displacement = vec3(0.0);
    
    // Large swells
    displacement.y += snoise(pos * 0.02 + time * 0.1) * 2.0;
    displacement.x += snoise(pos * 0.015 + time * 0.08) * 0.5;
    displacement.z += snoise(pos * 0.018 + time * 0.09) * 0.5;
    
    // Medium waves
    displacement.y += snoise(pos * 0.05 + time * 0.2) * 1.0;
    displacement.y += snoise(pos * 0.08 + time * 0.25) * 0.5;
    
    // Small detail waves
    displacement.y += snoise(pos * 0.15 + time * 0.4) * 0.25;
    displacement.y += snoise(pos * 0.3 + time * 0.6) * 0.1;
    
    return displacement;
  }
  
  // Calculate normal from wave displacement
  vec3 getWaveNormal(vec2 pos, float time) {
    float delta = 0.1;
    float hL = getWaveDisplacement(pos + vec2(-delta, 0.0), time).y;
    float hR = getWaveDisplacement(pos + vec2(delta, 0.0), time).y;
    float hD = getWaveDisplacement(pos + vec2(0.0, -delta), time).y;
    float hU = getWaveDisplacement(pos + vec2(0.0, delta), time).y;
    
    return normalize(vec3(hL - hR, 2.0 * delta, hD - hU));
  }
`

// Caustics calculation
const causticsFunction = `
  float caustics(vec2 pos, float time) {
    float caustic = 0.0;
    
    // Multiple overlapping sine waves create caustic pattern
    caustic += sin(pos.x * 10.0 + time) * sin(pos.y * 10.0 + time * 0.8);
    caustic += sin(pos.x * 15.0 - time * 1.2) * sin(pos.y * 12.0 + time);
    caustic += sin(pos.x * 8.0 + time * 0.5) * sin(pos.y * 18.0 - time * 0.7);
    
    // Sharpen the pattern
    caustic = pow(abs(caustic) * 0.5, 2.0);
    
    return caustic;
  }
`

// SSR (Screen-Space Reflections)
const ssrFunction = `
  vec4 getSSR(vec3 worldPos, vec3 viewDir, vec3 normal, sampler2D sceneDepth, vec2 resolution) {
    // View-space ray marching for reflections
    vec3 reflectDir = reflect(-viewDir, normal);
    
    // Simple SSR approximation
    float maxDistance = 50.0;
    float stepSize = 0.5;
    
    vec3 rayPos = worldPos;
    vec4 reflectionColor = vec4(0.0);
    
    for(float i = 0.0; i < 50.0; i++) {
      rayPos += reflectDir * stepSize;
      
      // Check if ray is below water
      if(rayPos.y < 0.0) {
        // Sample would be underwater - fade out
        reflectionColor.a = 1.0 - (i / 50.0);
        reflectionColor.rgb = vec3(0.1, 0.2, 0.4); // Deep water color
        break;
      }
    }
    
    return reflectionColor;
  }
`

// Chromatic aberration for refraction
const chromaticAberration = `
  vec3 getChromaticAberration(vec2 uv, vec2 refractDir, float strength) {
    float r = texture2D(uSceneDepth, uv + refractDir * (1.0 + strength)).r;
    float g = texture2D(uSceneDepth, uv + refractDir).r;
    float b = texture2D(uSceneDepth, uv + refractDir * (1.0 - strength)).r;
    
    return vec3(r, g, b);
  }
`

interface PBRWaterProps {
  isNight?: boolean
}

export default function PBRWater({ isNight = true }: PBRWaterProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { camera, size } = useThree()
  
  const weather = useGameStore(state => state.weather)
  const quality = useGameStore(state => state.qualityPreset)
  
  // Water uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCameraPos: { value: new THREE.Vector3() },
    uSunDir: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
    uSunColor: { value: new THREE.Color(isNight ? '#4488ff' : '#ffffee') },
    uWaterColor: { value: new THREE.Color(isNight ? '#001a33' : '#006994') },
    uDeepColor: { value: new THREE.Color(isNight ? '#000814' : '#003d5c') },
    uRoughness: { value: weather === 'storm' ? 0.4 : weather === 'rain' ? 0.3 : 0.1 },
    uF0: { value: 0.02 }, // Water's base reflectance
    uWaveHeight: { value: weather === 'storm' ? 3.0 : weather === 'rain' ? 1.5 : 0.8 },
    uChromaticAberration: { value: 0.01 },
    uSSRStrength: { value: quality === 'high' ? 1.0 : 0.5 },
    uCausticsStrength: { value: isNight ? 0.3 : 0.8 },
    uSubsurfaceStrength: { value: 0.5 },
    uFoamStrength: { value: weather === 'storm' ? 1.0 : 0.3 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uSceneDepth: { value: null },
    uReflectionTexture: { value: null },
    uEnvironmentMap: { value: null }
  }), [isNight, weather, quality, size])
  
  // Vertex shader
  const vertexShader = `
    uniform float uTime;
    uniform float uWaveHeight;
    
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vWaveHeight;
    
    ${waveFunctions}
    
    void main() {
      vUv = uv;
      
      vec2 worldPos = (modelMatrix * vec4(position, 1.0)).xz;
      
      // Get wave displacement
      vec3 displacement = getWaveDisplacement(worldPos, uTime) * uWaveHeight;
      
      vWaveHeight = displacement.y;
      
      // Calculate normal from wave derivatives
      vec3 normal = getWaveNormal(worldPos, uTime);
      vNormal = normalize(mat3(modelMatrix) * normal);
      
      // Apply displacement
      vec3 newPos = position + displacement;
      vWorldPos = (modelMatrix * vec4(newPos, 1.0)).xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
  `
  
  // Fragment shader with full PBR
  const fragmentShader = `
    uniform vec3 uCameraPos;
    uniform vec3 uSunDir;
    uniform vec3 uSunColor;
    uniform vec3 uWaterColor;
    uniform vec3 uDeepColor;
    uniform float uRoughness;
    uniform float uF0;
    uniform float uChromaticAberration;
    uniform float uSSRStrength;
    uniform float uCausticsStrength;
    uniform float uSubsurfaceStrength;
    uniform float uFoamStrength;
    uniform float uTime;
    uniform sampler2D uSceneDepth;
    uniform sampler2D uReflectionTexture;
    uniform samplerCube uEnvironmentMap;
    
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vWaveHeight;
    
    ${fresnelSchlick}
    ${distributionGGX}
    ${geometrySmith}
    ${causticsFunction}
    ${ssrFunction}
    ${chromaticAberration}
    
    void main() {
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      vec3 normal = normalize(vNormal);
      
      // Fresnel term
      float NdotV = max(dot(normal, viewDir), 0.0);
      vec3 F0 = vec3(uF0);
      vec3 F = fresnelSchlick(NdotV, F0);
      
      // Half vector for specular
      vec3 halfDir = normalize(uSunDir + viewDir);
      float NdotH = max(dot(normal, halfDir), 0.0);
      float NdotL = max(dot(normal, uSunDir), 0.0);
      float HdotV = max(dot(halfDir, viewDir), 0.0);
      
      // GGX Distribution
      float D = distributionGGX(NdotH, uRoughness);
      
      // Smith Geometry
      float G = geometrySmith(NdotV, NdotL, uRoughness);
      
      // Specular BRDF (Cook-Torrance)
      vec3 numerator = D * G * F;
      float denominator = 4.0 * NdotV * NdotL + 0.001;
      vec3 specular = numerator / denominator;
      
      // Diffuse base color
      vec3 diffuse = mix(uDeepColor, uWaterColor, NdotV) * (1.0 - F);
      
      // Caustics projection
      float causticPattern = caustics(vWorldPos.xz * 0.5, uTime * 0.5);
      vec3 causticsColor = vec3(0.8, 0.9, 1.0) * causticPattern * uCausticsStrength * NdotL;
      
      // Subsurface scattering approximation
      float subsurface = pow(1.0 - NdotV, 3.0) * uSubsurfaceStrength;
      vec3 subsurfaceColor = uSunColor * subsurface * 0.3;
      
      // Reflection from environment map (IBL)
      vec3 reflectDir = reflect(-viewDir, normal);
      vec3 envReflection = textureCube(uEnvironmentMap, reflectDir).rgb;
      
      // SSR approximation
      vec4 ssrColor = getSSR(vWorldPos, viewDir, normal, uSceneDepth, vec2(1920.0, 1080.0));
      
      // Blend reflections
      vec3 reflection = mix(envReflection, ssrColor.rgb, ssrColor.a * uSSRStrength);
      reflection = mix(reflection, uDeepColor, uRoughness);
      
      // Combine specular with reflection
      vec3 finalSpecular = specular * uSunColor * NdotL + reflection * F;
      
      // Foam at wave crests
      float foam = smoothstep(0.6, 1.0, vWaveHeight / uWaveHeight) * uFoamStrength;
      vec3 foamColor = vec3(0.95, 0.95, 1.0) * foam;
      
      // Combine all components
      vec3 finalColor = diffuse + finalSpecular + causticsColor + subsurfaceColor + foamColor;
      
      // Chromatic aberration at glancing angles
      float aberrationStrength = (1.0 - NdotV) * uChromaticAberration;
      vec2 refractDir = refract(-viewDir, normal, 0.75).xy * aberrationStrength;
      
      // Output with proper alpha for blending
      float alpha = 0.9 + foam * 0.1;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
  
  // Update uniforms each frame
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += 0.016
      materialRef.current.uniforms.uCameraPos.value.copy(camera.position)
    }
  })
  
  // Quality-based geometry segments
  const segments = quality === 'high' ? 512 : quality === 'medium' ? 256 : 128
  
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

// Foam trail particle system for ships
export function FoamTrails({ ships }: { ships: { id: string; position: [number, number, number]; velocity: number }[] }) {
  const pointsRef = useRef<THREE.Points>(null)
  const maxParticles = 2000
  
  const { positions, ages } = useMemo(() => {
    const positions = new Float32Array(maxParticles * 3)
    const ages = new Float32Array(maxParticles)
    return { positions, ages }
  }, [])
  
  useFrame(() => {
    if (!pointsRef.current?.geometry?.attributes?.position) return

    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array

    // Update existing particles
    for (let i = 0; i < maxParticles; i++) {
      ages[i] += 0.016

      // Fade out old particles
      if (ages[i] > 5.0) {
        posArray[i * 3 + 1] = -1000 // Hide below water
      }
    }

    // Spawn new particles behind ships
    ships.forEach((ship, shipIndex) => {
      const spawnRate = Math.floor(ship.velocity * 10)

      for (let j = 0; j < spawnRate; j++) {
        const idx = (shipIndex * 100 + j) % maxParticles

        // Position behind ship
        posArray[idx * 3] = ship.position[0] - 10 - Math.random() * 20
        posArray[idx * 3 + 1] = -2.3 + Math.random() * 0.3 // Just above water
        posArray[idx * 3 + 2] = ship.position[2] + (Math.random() - 0.5) * 10

        ages[idx] = 0
      }
    })

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={maxParticles}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={4}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Caustics projector for ship hulls and dock
export function CausticsProjector() {
  const lightRef = useRef<THREE.SpotLight>(null)
  
  useFrame((state) => {
    if (lightRef.current) {
      // Animate caustics pattern
      const time = state.clock.elapsedTime
      lightRef.current.intensity = 0.5 + Math.sin(time * 2) * 0.1
    }
  })
  
  return (
    <spotLight
      ref={lightRef}
      position={[0, 10, 0]}
      target-position={[0, -10, 0]}
      intensity={0.5}
      color="#88ccff"
      angle={Math.PI / 3}
      penumbra={0.5}
      distance={100}
      castShadow
    >
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Custom caustics map could be applied here
            // For now using standard spotLight with blue tint
          `
        }}
      />
    </spotLight>
  )
}
