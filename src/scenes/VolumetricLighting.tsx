import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { getLookDevSettings } from '../utils/lookDevControls'

// =============================================================================
// VOLUMETRIC LIGHTING SYSTEM - HarborGlow
// True volumetric fog with ray marching, god rays, and light scattering
// =============================================================================

interface VolumetricLightProps {
  position: [number, number, number]
  target?: [number, number, number]
  color: string
  intensity: number
  angle?: number
  distance?: number
  decay?: number
  type: 'spot' | 'point' | 'directional'
}

// Volumetric fog uniforms - removed unused interface

// Ray marching configuration

// GLSL array size constants — must match shader declarations


// Mie scattering phase function

// Rayleigh scattering phase function

// Volume density function (fog)

// Light contribution calculation

// Shadow sampling (simplified)

interface VolumetricFogProps {
  lights: VolumetricLightProps[]
}

export default function VolumetricLighting({ }: VolumetricFogProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  useThree()
  
  const timeOfDay = useGameStore(state => state.timeOfDay)
  const weather = useGameStore(state => state.weather)
  const fogDensity = weather === 'fog' ? 0.05 : weather === 'storm' ? 0.03 : 0.015
  
  // Calculate sun direction based on time
  
  // Sun color based on time
  
  // Fog color based on time and weather
  const fogColor = useMemo(() => {
    if (weather === 'fog') {
      return new THREE.Color('#888899')
    } else if (weather === 'storm') {
      return new THREE.Color('#223344')
    } else if (timeOfDay < 6 || timeOfDay > 20) {
      return new THREE.Color('#0a1520')
    } else if (timeOfDay < 8 || timeOfDay > 18) {
      return new THREE.Color('#2a2015')
    } else {
      return new THREE.Color('#4a5560')
    }
  }, [timeOfDay, weather])
  
  // Prepare light data for shader
  
  
  // Vertex shader - full screen quad
  
  // Fragment shader with ray marching
  
  useFrame((state) => {
    if (materialRef.current) {
      const drift = 0.85 + Math.sin(state.clock.elapsedTime * 0.25) * 0.15
      materialRef.current.opacity = Math.max(0.02, fogDensity * 5.2 * drift)
    }
  })
  
  return (
    <mesh ref={meshRef} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial
        ref={materialRef}
        color={fogColor}
        opacity={fogDensity * 5.2}
        toneMapped={false}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Individual volumetric light cone for spotlights
export function VolumetricLightCone({ 
  position, 
  target, 
  color, 
  intensity, 
  angle = Math.PI / 6,
  distance = 50 
}: VolumetricLightProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const direction = useMemo(() => {
    if (target) {
      return new THREE.Vector3(...target).sub(new THREE.Vector3(...position)).normalize()
    }
    return new THREE.Vector3(0, -1, 0)
  }, [position, target])
  
  const rotation = useMemo(() => {
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), direction)
    return new THREE.Euler().setFromQuaternion(quaternion)
  }, [direction])
  
  
  
  
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshBasicMaterial
      const sparkle = 0.85 + Math.sin(state.clock.elapsedTime * 2.5) * 0.15
      material.opacity = Math.max(0.02, intensity * getLookDevSettings().godRayDensity * 0.3 * sparkle)
    }
  })
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
    >
      <coneGeometry args={[Math.tan(angle) * distance, distance, 32, 1, true]} />
      <meshBasicMaterial
        color={color}
        toneMapped={false}
        opacity={intensity * 0.3}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// God rays from bright lights
export function GodRays({ 
  lightPosition, 
  lightColor, 
  intensity = 1.0,
  numRays = 8 
}: { 
  lightPosition: [number, number, number]
  lightColor: string
  intensity?: number
  numRays?: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  
  const rays = useMemo(() => {
    return Array.from({ length: numRays }, (_, i) => {
      const angle = (i / numRays) * Math.PI * 2
      const length = 20 + Math.random() * 30
      const width = 0.5 + Math.random() * 1.5
      return { angle, length, width }
    })
  }, [numRays])
  
  return (
    <group ref={groupRef} position={lightPosition}>
      {rays.map((ray, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(ray.angle) * ray.length * 0.5,
            Math.sin(ray.angle * 0.3) * 5,
            Math.sin(ray.angle) * ray.length * 0.5
          ]}
          rotation={[0, -ray.angle, Math.PI / 2]}
        >
          <planeGeometry args={[ray.width, ray.length]} />
          <meshBasicMaterial
            color={lightColor}
            transparent
            opacity={0.1 * intensity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// Ship volumetric glow for upgraded ships
export function ShipVolumetricGlow({ 
  position, 
  radius = 10,
  intensity = 0.5,
  color = '#ffaa44'
}: { 
  position: [number, number, number]
  radius?: number
  intensity?: number
  color?: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  
  
  
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshBasicMaterial
      const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 2.0) * 0.2
      material.opacity = Math.max(0.02, intensity * 0.45 * pulse)
    }
  })
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshBasicMaterial
        color={color}
        toneMapped={false}
        opacity={intensity * 0.45}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  )
}
