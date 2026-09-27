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


// SSGI Configuration - available for future use
// const SSGI_CONFIG = {
//   maxSteps: 32,
//   stepSize: 0.5,
//   maxDistance: 16,
//   thickness: 0.5,
//   sampleCount: 4
// }

// Hash helper used by irradiance sampling

// Irradiance sampling function — loop uses compile-time constant bound (GLSL ES 1.0 safe)

interface GlobalIlluminationProps {
  enabled?: boolean
  quality?: 'low' | 'medium' | 'high'
}

export default function GlobalIllumination({ 
  enabled = true, 
  quality = 'high' 
}: GlobalIlluminationProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  useThree()
  const giStrength = enabled ? 1 : 0
  
  const timeOfDay = useGameStore(state => state.timeOfDay)
  const ships = useGameStore(state => state.ships)
  
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
  
  // Vertex shader
  
  // Fragment shader with SSGI + irradiance
  
  useFrame((state) => {
    if (materialRef.current) {
      const pulse = 0.9 + Math.sin(state.clock.elapsedTime * 0.35) * 0.1
      materialRef.current.opacity = Math.max(0.02, 0.12 * giStrength * pulse)
    }
    updateProbes()
  })
  
  if (!enabled) return null
  
  return (
    <group>
      {/* GI Overlay Mesh */}
      <mesh ref={meshRef} frustumCulled={false}>
        <planeGeometry args={[200, 200, 64, 64]} />
        <meshBasicMaterial
          ref={materialRef}
          color="#6a9bd4"
          opacity={0.12 * giStrength}
          toneMapped={false}
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
  
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshBasicMaterial
      const pulse = 0.9 + Math.sin(state.clock.elapsedTime * 3.0) * 0.1
      material.opacity = Math.max(0.02, 0.24 * intensity * pulse)
    }
  })
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius * 0.3, 16, 16]} />
      <meshBasicMaterial
        color={color}
        toneMapped={false}
        opacity={0.24 * intensity}
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
