// =============================================================================
// PARTICLE BURST 3D - HarborGlow Phase 9
// 3D particle effects for installation feedback with sparks and confetti
// =============================================================================

import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RigType, RIG_TYPE_COLORS } from '../systems/attachmentSystem'

interface ParticleBurst3DProps {
  position: [number, number, number]
  rigType: RigType
  active: boolean
  onComplete?: () => void
}

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  color: THREE.Color
  type: 'spark' | 'confetti' | 'smoke'
}

// Generate random color variation
function varyColor(baseColor: string, variation: number = 0.2): THREE.Color {
  const color = new THREE.Color(baseColor)
  color.r += (Math.random() - 0.5) * variation
  color.g += (Math.random() - 0.5) * variation
  color.b += (Math.random() - 0.5) * variation
  return color
}

export default function ParticleBurst3D({ 
  position, 
  rigType, 
  active, 
  onComplete 
}: ParticleBurst3DProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const groupRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  
  const baseColor = useMemo(() => RIG_TYPE_COLORS[rigType].primary, [rigType])
  
  // Initialize particles when activated
  useEffect(() => {
    if (!active) {
      setParticles([])
      return
    }
    
    const newParticles: Particle[] = []
    
    // Sparks - fast, bright, short-lived
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2
      const elevation = (Math.random() - 0.5) * Math.PI
      const speed = 3 + Math.random() * 5
      
      newParticles.push({
        position: new THREE.Vector3(...position),
        velocity: new THREE.Vector3(
          Math.cos(angle) * Math.cos(elevation) * speed,
          Math.sin(elevation) * speed + 2,
          Math.sin(angle) * Math.cos(elevation) * speed
        ),
        life: 1.0,
        maxLife: 0.8 + Math.random() * 0.4,
        size: 0.05 + Math.random() * 0.1,
        color: varyColor('#ffffff'),
        type: 'spark',
      })
    }
    
    // Confetti - slower, colorful, longer-lived
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      
      newParticles.push({
        position: new THREE.Vector3(...position),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          3 + Math.random() * 3,
          Math.sin(angle) * speed
        ),
        life: 1.0,
        maxLife: 1.5 + Math.random() * 0.5,
        size: 0.1 + Math.random() * 0.15,
        color: varyColor(baseColor, 0.3),
        type: 'confetti',
      })
    }
    
    // Smoke - rises slowly
    for (let i = 0; i < 10; i++) {
      newParticles.push({
        position: new THREE.Vector3(
          position[0] + (Math.random() - 0.5) * 0.5,
          position[1],
          position[2] + (Math.random() - 0.5) * 0.5
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          1 + Math.random(),
          (Math.random() - 0.5) * 0.5
        ),
        life: 1.0,
        maxLife: 2.0,
        size: 0.2 + Math.random() * 0.3,
        color: new THREE.Color(0.5, 0.5, 0.5),
        type: 'smoke',
      })
    }
    
    setParticles(newParticles)
    
    // Auto-complete after animation
    const timeout = setTimeout(() => {
      onComplete?.()
    }, 2500)
    
    return () => clearTimeout(timeout)
  }, [active, position, rigType, baseColor, onComplete])
  
  // Animate particles
  useFrame((_, delta) => {
    if (particles.length === 0) return
    
    setParticles(prev => {
      const updated = prev.map(p => {
        // Update position
        p.position.add(p.velocity.clone().multiplyScalar(delta))
        
        // Apply forces based on type
        if (p.type === 'spark') {
          // Sparks affected by gravity
          p.velocity.y -= 9.8 * delta
        } else if (p.type === 'confetti') {
          // Confetti flutters
          p.velocity.x += Math.sin(Date.now() * 0.01 + p.position.y) * 0.5 * delta
          p.velocity.z += Math.cos(Date.now() * 0.008 + p.position.y) * 0.5 * delta
          p.velocity.y -= 2 * delta // Gentle gravity
        } else if (p.type === 'smoke') {
          // Smoke rises and expands
          p.velocity.multiplyScalar(0.98) // Drag
          p.size += delta * 0.1
        }
        
        // Decay life
        p.life -= delta / p.maxLife
        
        return p
      }).filter(p => p.life > 0)
      
      return updated
    })
    
    // Animate light flash
    if (lightRef.current) {
      const maxAge = 0.3 // Flash lasts 0.3s
      const age = 2.5 - (particles[0]?.life || 0) * 2.5
      if (age < maxAge) {
        lightRef.current.intensity = 5 * (1 - age / maxAge)
      } else {
        lightRef.current.intensity = 0
      }
    }
  })
  
  if (!active || particles.length === 0) return null
  
  return (
    <group ref={groupRef} position={position}>
      {/* Flash light */}
      <pointLight
        ref={lightRef}
        color={baseColor}
        intensity={5}
        distance={20}
        decay={2}
      />
      
      {/* Particles */}
      {particles.map((p, i) => (
        <mesh key={i} position={p.position}>
          {p.type === 'confetti' ? (
            <boxGeometry args={[p.size, p.size * 0.5, p.size * 0.1]} />
          ) : (
            <sphereGeometry args={[p.size]} />
          )}
          <meshBasicMaterial
            color={p.color}
            transparent
            opacity={p.life * (p.type === 'smoke' ? 0.3 : 1)}
            blending={p.type === 'spark' ? THREE.AdditiveBlending : THREE.NormalBlending}
          />
        </mesh>
      ))}
      
      {/* Shockwave ring */}
      <ShockwaveRing color={baseColor} />
    </group>
  )
}

// Expanding shockwave ring
function ShockwaveRing({ color }: { color: string }) {
  const ringRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!ringRef.current) return
    const age = state.clock.elapsedTime % 1 // 1 second cycle
    const scale = 1 + age * 5
    ringRef.current.scale.setScalar(scale)
    ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - age) * 0.5
  })
  
  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.5, 0.7, 32]} />
      <meshBasicMaterial 
        color={color}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
