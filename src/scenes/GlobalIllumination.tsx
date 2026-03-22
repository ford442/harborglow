import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// REAL-TIME GLOBAL ILLUMINATION SYSTEM - HarborGlow
// SSGI + Irradiance Volumes + Emissive Light Propagation
// =============================================================================

interface GIProbe {
  position: THREE.Vector3
  irradiance: THREE.Color
  influence: number
  lastUpdate: number
}

interface EmissiveSource {
  position: THREE.Vector3
  color: THREE.Color
  intensity: number
  radius: number
  type: 'ship' | 'crane' | 'dock' | 'upgrade'
}

// GLSL array size constants — must match shader declarations
const MAX_PROBES = 32
const MAX_EMISSIVE = 16
const _ZERO_VEC3 = new THREE.Vector3(0, 0, 0)
const _ZERO_COLOR = new THREE.Color(0, 0, 0)

function padVec3(arr: THREE.Vector3[], size: number): THREE.Vector3[] {
  const padded = arr.slice(0, size)
  while (padded.length < size) padded.push(_ZERO_VEC3)
  return padded
}
function padColor(arr: THREE.Color[], size: number): THREE.Color[] {
  const padded = arr.slice(0, size)
  while (padded.length < size) padded.push(_ZERO_COLOR)
  return padded
}

// SSGI Configuration - available for future use
// const SSGI_CONFIG = {
//   maxSteps: 32,
//   stepSize: 0.5,
//   maxDistance: 16,
//   thickness: 0.5,
//   sampleCount: 4
// }

// SSGI shader functions
const ssgiFunctions = `
  // Hash function for random sampling
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  // Screen-space ray marching for bounce lighting
  vec3 ssgiTrace(vec3 worldPos, vec3 worldNormal, vec3 viewDir, sampler2D depthTexture, sampler2D colorTexture, mat4 projectionMatrix, mat4 viewMatrix, vec2 resolution) {
    vec3 accumulatedLight = vec3(0.0);
    float totalWeight = 0.0;
    
    // Sample directions in hemisphere
    for (int i = 0; i < 4; i++) {
      // Generate random direction in hemisphere
      float angle = hash(worldPos.xy + vec2(float(i), uTime)) * 6.28318;
      float radius = hash(worldPos.yz + vec2(float(i), uTime * 0.5));
      
      vec3 sampleDir = normalize(vec3(
        cos(angle) * radius,
        sin(angle) * radius,
        sqrt(1.0 - radius * radius)
      ));
      
      // Transform to world space
      vec3 tangent = normalize(cross(worldNormal, vec3(0.0, 1.0, 0.0)));
      if (length(tangent) < 0.001) tangent = normalize(cross(worldNormal, vec3(1.0, 0.0, 0.0)));
      vec3 bitangent = cross(worldNormal, tangent);
      
      sampleDir = tangent * sampleDir.x + bitangent * sampleDir.y + worldNormal * sampleDir.z;
      
      // Ray march in screen space
      vec3 rayPos = worldPos + sampleDir * 0.1;
      float stepSize = 0.5;
      
      for (int step = 0; step < 32; step++) {
        rayPos += sampleDir * stepSize;
        
        // Project to screen space
        vec4 clipPos = projectionMatrix * viewMatrix * vec4(rayPos, 1.0);
        vec2 screenPos = clipPos.xy / clipPos.w * 0.5 + 0.5;
        
        // Check bounds
        if (screenPos.x < 0.0 || screenPos.x > 1.0 || screenPos.y < 0.0 || screenPos.y > 1.0) break;
        
        // Sample depth
        float sceneDepth = texture2D(depthTexture, screenPos).r;
        float rayDepth = clipPos.w;
        
        // Hit detection
        if (rayDepth > sceneDepth * 1.1) {
          // We hit something, accumulate color
          vec3 hitColor = texture2D(colorTexture, screenPos).rgb;
          float weight = max(0.0, dot(sampleDir, worldNormal));
          accumulatedLight += hitColor * weight;
          totalWeight += weight;
          break;
        }
        
        stepSize *= 1.1; // Exponential step size
      }
    }
    
    return totalWeight > 0.0 ? accumulatedLight / totalWeight * 0.3 : vec3(0.0);
  }
`

// Irradiance sampling function
const irradianceFunctions = `
  // Sample irradiance from probe grid
  vec3 sampleIrradiance(vec3 worldPos, vec3 normal) {
    vec3 irradiance = vec3(0.0);
    float totalWeight = 0.0;
    
    // Sample nearby probes (simplified - would use actual probe grid)
    for (int i = 0; i < uNumProbes; i++) {
      vec3 probePos = uProbePositions[i];
      vec3 probeIrradiance = uProbeIrradiance[i];
      float probeRadius = uProbeRadii[i];
      
      float dist = length(worldPos - probePos);
      if (dist > probeRadius) continue;
      
      float weight = 1.0 - dist / probeRadius;
      weight *= max(0.0, dot(normal, normalize(probePos - worldPos)));
      
      irradiance += probeIrradiance * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0.0 ? irradiance / totalWeight : vec3(0.0);
  }
`

interface GlobalIlluminationProps {
  enabled?: boolean
  quality?: 'low' | 'medium' | 'high'
}

export default function GlobalIllumination({ 
  enabled = true, 
  quality = 'high' 
}: GlobalIlluminationProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { camera, size } = useThree()
  
  const timeOfDay = useGameStore(state => state.timeOfDay)
  const ships = useGameStore(state => state.ships)
  const lightIntensity = useGameStore(state => state.lightIntensity)
  
  // Create emissive sources from ships
  const emissiveSources = useMemo(() => {
    const sources: EmissiveSource[] = []
    
    // Ship lights
    ships.forEach(ship => {
      if (ship.version === '2.0') {
        // v2.0 ships have intense light shows
        sources.push({
          position: new THREE.Vector3(...ship.position),
          color: new THREE.Color('#ff00aa'),
          intensity: 2.0,
          radius: 30,
          type: 'ship'
        })
      } else if (ship.version === '1.5') {
        // v1.5 ships have moderate lighting
        sources.push({
          position: new THREE.Vector3(...ship.position),
          color: new THREE.Color('#00aaff'),
          intensity: 1.0,
          radius: 20,
          type: 'ship'
        })
      }
      
      // All ships have navigation lights
      sources.push({
        position: new THREE.Vector3(ship.position[0], ship.position[1] + 10, ship.position[2]),
        color: new THREE.Color('#ff0000'),
        intensity: 0.5,
        radius: 15,
        type: 'ship'
      })
    })
    
    // Crane cabin lights
    sources.push({
      position: new THREE.Vector3(1.5, 8, 0),
      color: new THREE.Color('#ffaa44'),
      intensity: 1.5,
      radius: 25,
      type: 'crane'
    })
    
    // Dock lamps
    for (let i = 0; i < 5; i++) {
      sources.push({
        position: new THREE.Vector3(-40 + i * 20, 5, -10),
        color: new THREE.Color('#ffdd88'),
        intensity: 1.0,
        radius: 20,
        type: 'dock'
      })
    }
    
    return sources
  }, [ships])
  
  // Create irradiance probes
  const probes = useMemo(() => {
    const probeList: GIProbe[] = []
    
    // Grid of probes around dock
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        probeList.push({
          position: new THREE.Vector3(x * 15, 0, z * 15),
          irradiance: new THREE.Color(0.1, 0.15, 0.2),
          influence: 20,
          lastUpdate: 0
        })
      }
    }
    
    // Additional probes near ships
    ships.forEach(ship => {
      probeList.push({
        position: new THREE.Vector3(ship.position[0], 0, ship.position[2]),
        irradiance: new THREE.Color(0.2, 0.1, 0.15),
        influence: 25,
        lastUpdate: 0
      })
    })
    
    return probeList
  }, [ships])
  
  // Update probes based on emissive sources
  const updateProbes = useCallback(() => {
    probes.forEach(probe => {
      const totalIrradiance = new THREE.Color(0, 0, 0)
      
      emissiveSources.forEach(source => {
        const dist = probe.position.distanceTo(source.position)
        if (dist < source.radius) {
          const attenuation = 1.0 - dist / source.radius
          const contribution = source.color.clone().multiplyScalar(source.intensity * attenuation * 0.1)
          totalIrradiance.add(contribution)
        }
      })
      
      // Time of day influence
      if (timeOfDay < 6 || timeOfDay > 18) {
        // Night - blue ambient
        totalIrradiance.add(new THREE.Color(0.02, 0.05, 0.1))
      } else {
        // Day - warm ambient
        totalIrradiance.add(new THREE.Color(0.1, 0.1, 0.08))
      }
      
      probe.irradiance.lerp(totalIrradiance, 0.1)
    })
  }, [probes, emissiveSources, timeOfDay])
  
  // SSGI uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCameraPos: { value: new THREE.Vector3() },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uGIOffset: { value: new THREE.Vector3(0, 0, 0) },
    uGIStrength: { value: enabled ? 1.0 : 0.0 },
    uProbePositions: { value: padVec3(probes.map(p => p.position), MAX_PROBES) },
    uProbeIrradiance: { value: padColor(probes.map(p => p.irradiance), MAX_PROBES) },
    uProbeRadii: { value: probes.map(p => p.influence) },
    uNumProbes: { value: probes.length },
    uEmissivePositions: { value: padVec3(emissiveSources.map(s => s.position), MAX_EMISSIVE) },
    uEmissiveColors: { value: padColor(emissiveSources.map(s => s.color), MAX_EMISSIVE) },
    uEmissiveIntensities: { value: emissiveSources.map(s => s.intensity) },
    uEmissiveRadii: { value: emissiveSources.map(s => s.radius) },
    uNumEmissive: { value: emissiveSources.length },
    uTimeOfDay: { value: timeOfDay },
    uLightIntensity: { value: lightIntensity }
  }), [probes, emissiveSources, enabled, size, timeOfDay, lightIntensity])
  
  // Vertex shader
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    
    void main() {
      vUv = uv;
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      vNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  
  // Fragment shader with SSGI + irradiance
  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uCameraPos;
    uniform vec2 uResolution;
    uniform float uGIStrength;
    uniform vec3 uProbePositions[32];
    uniform vec3 uProbeIrradiance[32];
    uniform float uProbeRadii[32];
    uniform int uNumProbes;
    uniform vec3 uEmissivePositions[16];
    uniform vec3 uEmissiveColors[16];
    uniform float uEmissiveIntensities[16];
    uniform float uEmissiveRadii[16];
    uniform int uNumEmissive;
    uniform float uTimeOfDay;
    uniform float uLightIntensity;
    
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    
    ${ssgiFunctions}
    ${irradianceFunctions}
    
    // Sample emissive lighting
    vec3 sampleEmissive(vec3 worldPos, vec3 normal) {
      vec3 emissive = vec3(0.0);
      
      for (int i = 0; i < 16; i++) {
        if (i >= uNumEmissive) break;
        
        vec3 toLight = uEmissivePositions[i] - worldPos;
        float dist = length(toLight);
        
        if (dist > uEmissiveRadii[i]) continue;
        
        toLight = normalize(toLight);
        float NdotL = max(0.0, dot(normal, toLight));
        
        float attenuation = 1.0 - dist / uEmissiveRadii[i];
        attenuation *= attenuation;
        
        emissive += uEmissiveColors[i] * uEmissiveIntensities[i] * NdotL * attenuation;
      }
      
      return emissive;
    }
    
    // Color bleeding approximation
    vec3 colorBleed(vec3 worldPos, vec3 normal) {
      vec3 bleed = vec3(0.0);
      
      // Sample nearby emissive sources for color bleeding
      for (int i = 0; i < 16; i++) {
        if (i >= uNumEmissive) break;
        
        vec3 toSource = uEmissivePositions[i] - worldPos;
        float dist = length(toSource);
        
        if (dist > uEmissiveRadii[i] * 0.5) continue;
        
        // Color bleeding is stronger on grazing angles
        float fresnel = 1.0 - abs(dot(normalize(toSource), normal));
        fresnel = pow(fresnel, 2.0);
        
        float attenuation = 1.0 - dist / (uEmissiveRadii[i] * 0.5);
        
        bleed += uEmissiveColors[i] * fresnel * attenuation * 0.5;
      }
      
      return bleed;
    }
    
    void main() {
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      
      // Base indirect lighting from probes
      vec3 indirectLight = sampleIrradiance(vWorldPos, vNormal) * uLightIntensity;
      
      // Emissive light propagation
      vec3 emissiveLight = sampleEmissive(vWorldPos, vNormal);
      
      // Color bleeding effect
      vec3 bleed = colorBleed(vWorldPos, vNormal);
      
      // Combine
      vec3 gi = (indirectLight + emissiveLight + bleed) * uGIStrength;
      
      // Output as additive light
      gl_FragColor = vec4(gi, 1.0);
    }
  `
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uCameraPos.value.copy(camera.position)
    }
    updateProbes()
  })
  
  if (!enabled) return null
  
  return (
    <group>
      {/* GI Overlay Mesh */}
      <mesh ref={meshRef} frustumCulled={false}>
        <planeGeometry args={[200, 200, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Emissive source visualizers */}
      {emissiveSources.map((source, i) => (
        <EmissiveGlow 
          key={i}
          position={source.position}
          color={source.color}
          intensity={source.intensity}
          radius={source.radius}
        />
      ))}
      
      {/* Probe visualizers (debug) */}
      {quality === 'high' && probes.map((probe, i) => (
        <ProbeVisualizer 
          key={i}
          position={probe.position}
          irradiance={probe.irradiance}
        />
      ))}
    </group>
  )
}

// Emissive glow component for light sources
function EmissiveGlow({ 
  position, 
  color, 
  intensity, 
  radius 
}: { 
  position: THREE.Vector3
  color: THREE.Color
  intensity: number
  radius: number 
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const uniforms = useMemo(() => ({
    uColor: { value: color },
    uIntensity: { value: intensity },
    uTime: { value: 0 }
  }), [color, intensity])
  
  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  
  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uTime;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
      
      // Pulsing effect
      float pulse = 0.9 + sin(uTime * 3.0) * 0.1;
      
      vec3 glow = uColor * uIntensity * fresnel * pulse;
      
      gl_FragColor = vec4(glow, fresnel * 0.5);
    }
  `
  
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius * 0.3, 16, 16]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  )
}

// Probe visualizer (for debug)
function ProbeVisualizer({ 
  position, 
  irradiance 
}: { 
  position: THREE.Vector3
  irradiance: THREE.Color
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial 
        color={irradiance} 
        transparent 
        opacity={0.3}
      />
    </mesh>
  )
}

// Hook for querying GI at a point
export function useGlobalIllumination() {
  const probes = useRef<GIProbe[]>([])
  
  const sampleGI = useCallback((position: THREE.Vector3, normal: THREE.Vector3): THREE.Color => {
    const result = new THREE.Color(0, 0, 0)
    let totalWeight = 0
    
    probes.current.forEach(probe => {
      const dist = position.distanceTo(probe.position)
      if (dist > probe.influence) return
      
      const weight = 1.0 - dist / probe.influence
      const NdotD = Math.max(0, normal.dot(position.clone().sub(probe.position).normalize()))
      
      result.add(probe.irradiance.clone().multiplyScalar(weight * NdotD))
      totalWeight += weight * NdotD
    })
    
    if (totalWeight > 0) {
      result.multiplyScalar(1 / totalWeight)
    }
    
    return result
  }, [])
  
  return { sampleGI, probes }
}
