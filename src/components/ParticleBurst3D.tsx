// =============================================================================
// PARTICLE BURST 3D - HarborGlow Phase 9
// 3D particle effects for installation feedback with sparks, confetti, smoke,
// shockwave, starburst, directional light flash, and floating sparkles.
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
  type: 'spark' | 'confetti' | 'smoke' | 'sparkle'
}

// Special rig types get an extra color boost
const SPECIAL_RIG_TYPES: RigType[] = ['emergency_strobe', 'searchlight']

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
  onComplete,
}: ParticleBurst3DProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const groupRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const dirLightRef = useRef<THREE.DirectionalLight>(null)
  const startTimeRef = useRef<number>(0)

  const baseColor = useMemo(() => RIG_TYPE_COLORS[rigType].primary, [rigType])
  const isSpecial = useMemo(() => SPECIAL_RIG_TYPES.includes(rigType), [rigType])

  // Memoized geometries — reused for every instance
  const sparkGeometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), [])
  const confettiGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const smokeGeometry = useMemo(() => new THREE.SphereGeometry(1, 6, 6), [])
  const sparkleGeometry = useMemo(() => new THREE.SphereGeometry(1, 6, 6), [])

  // Initialize particles when activated
  useEffect(() => {
    if (!active) {
      setParticles([])
      return
    }

    startTimeRef.current = performance.now()
    const newParticles: Particle[] = []
    const colorBoost = isSpecial ? 0.4 : 0.3
    const confettiScale = isSpecial ? 1.4 : 1.0

    // Sparks — fast, bright, short-lived (50 instead of 30)
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2
      const elevation = (Math.random() - 0.5) * Math.PI
      const speed = 5 + Math.random() * 7 // faster

      newParticles.push({
        position: new THREE.Vector3(...position),
        velocity: new THREE.Vector3(
          Math.cos(angle) * Math.cos(elevation) * speed,
          Math.sin(elevation) * speed + 3,
          Math.sin(angle) * Math.cos(elevation) * speed
        ),
        life: 1.0,
        maxLife: 0.6 + Math.random() * 0.4,
        size: (0.06 + Math.random() * 0.12) * 1.2, // brighter / larger
        color: varyColor('#ffffff', 0.1),
        type: 'spark',
      })
    }

    // Confetti — slower, colorful, longer-lived (larger when special)
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
        size: (0.12 + Math.random() * 0.18) * confettiScale,
        color: varyColor(baseColor, colorBoost),
        type: 'confetti',
      })
    }

    // Smoke — rises slowly
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

    // Floating sparkles — tiny, upward, long lifetime
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2
      newParticles.push({
        position: new THREE.Vector3(
          position[0] + (Math.random() - 0.5) * 0.3,
          position[1] + Math.random() * 0.3,
          position[2] + (Math.random() - 0.5) * 0.3
        ),
        velocity: new THREE.Vector3(
          Math.cos(angle) * 0.2,
          0.5 + Math.random() * 0.8,
          Math.sin(angle) * 0.2
        ),
        life: 1.0,
        maxLife: 3.0,
        size: 0.03 + Math.random() * 0.04,
        color: varyColor(baseColor, 0.2),
        type: 'sparkle',
      })
    }

    setParticles(newParticles)

    // Auto-complete after animation
    const timeout = setTimeout(() => {
      onComplete?.()
    }, 3000)

    return () => clearTimeout(timeout)
  }, [active, position, rigType, baseColor, isSpecial, onComplete])

  // Precompute elapsed time for light flash without creating objects each frame
  useFrame((_, delta) => {
    if (particles.length === 0) return

    setParticles((prev) => {
      const updated: Particle[] = []
      for (let i = 0; i < prev.length; i++) {
        const p = prev[i]
        // Update position
        p.position.x += p.velocity.x * delta
        p.position.y += p.velocity.y * delta
        p.position.z += p.velocity.z * delta

        // Apply forces based on type
        if (p.type === 'spark') {
          p.velocity.y -= 9.8 * delta
        } else if (p.type === 'confetti') {
          p.velocity.x += Math.sin(performance.now() * 0.01 + p.position.y) * 0.5 * delta
          p.velocity.z += Math.cos(performance.now() * 0.008 + p.position.y) * 0.5 * delta
          p.velocity.y -= 2 * delta
        } else if (p.type === 'smoke') {
          p.velocity.x *= 0.98
          p.velocity.y *= 0.98
          p.velocity.z *= 0.98
          p.size += delta * 0.1
        } else if (p.type === 'sparkle') {
          // Sparkles drift gently upward with slight wobble
          p.velocity.x += Math.sin(performance.now() * 0.005 + i) * 0.02 * delta
          p.velocity.z += Math.cos(performance.now() * 0.004 + i) * 0.02 * delta
        }

        // Decay life
        p.life -= delta / p.maxLife
        if (p.life > 0) {
          updated.push(p)
        }
      }
      return updated
    })

    // Animate point light flash
    if (lightRef.current) {
      const maxAge = 0.3
      const age = (performance.now() - startTimeRef.current) / 1000
      if (age < maxAge) {
        lightRef.current.intensity = 8 * (1 - age / maxAge)
      } else {
        lightRef.current.intensity = 0
      }
    }

    // Animate directional light flash (0.2s)
    if (dirLightRef.current) {
      const maxAge = 0.2
      const age = (performance.now() - startTimeRef.current) / 1000
      if (age < maxAge) {
        dirLightRef.current.intensity = 12 * (1 - age / maxAge)
      } else {
        dirLightRef.current.intensity = 0
      }
    }
  })

  if (!active || particles.length === 0) return null

  return (
    <group ref={groupRef} position={position}>
      {/* Point flash light */}
      <pointLight
        ref={lightRef}
        color={baseColor}
        intensity={8}
        distance={25}
        decay={2}
      />

      {/* Directional light flash — casts shadows on the ship */}
      <directionalLight
        ref={dirLightRef}
        color={baseColor}
        intensity={12}
        position={[2, 5, 2]}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {/* Particles */}
      {particles.map((p, i) => {
        const opacity = p.life * (p.type === 'smoke' ? 0.3 : p.type === 'sparkle' ? 0.8 : 1)
        const blending = p.type === 'spark' || p.type === 'sparkle' ? THREE.AdditiveBlending : THREE.NormalBlending
        const geometry =
          p.type === 'confetti'
            ? confettiGeometry
            : p.type === 'smoke'
              ? smokeGeometry
              : p.type === 'sparkle'
                ? sparkleGeometry
                : sparkGeometry
        const scale: [number, number, number] =
          p.type === 'confetti'
            ? [p.size, p.size * 0.5, p.size * 0.1]
            : [p.size, p.size, p.size]

        return (
          <mesh key={i} position={p.position} scale={scale} geometry={geometry}>
            <meshBasicMaterial
              color={p.color}
              transparent
              opacity={opacity}
              blending={blending}
            />
          </mesh>
        )
      })}

      {/* Shockwave ring */}
      <ShockwaveRing color={baseColor} />

      {/* Starburst ring — cyan, faster, high opacity that fades quickly */}
      <StarburstRing />
    </group>
  )
}

// Expanding shockwave ring
function ShockwaveRing({ color }: { color: string }) {
  const ringRef = useRef<THREE.Mesh>(null)
  const ringGeometry = useMemo(() => new THREE.RingGeometry(0.5, 0.7, 32), [])

  useFrame((state) => {
    if (!ringRef.current) return
    const age = state.clock.elapsedTime % 1 // 1 second cycle
    const scale = 1 + age * 5
    ringRef.current.scale.setScalar(scale)
    const mat = ringRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = (1 - age) * 0.5
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} geometry={ringGeometry}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Fast cyan starburst ring — scale 1→10 over 0.6s with quick fade
function StarburstRing() {
  const ringRef = useRef<THREE.Mesh>(null)
  const startTimeRef = useRef<number>(0)
  const ringGeometry = useMemo(() => new THREE.RingGeometry(0.3, 0.5, 48), [])

  useEffect(() => {
    startTimeRef.current = performance.now()
  }, [])

  useFrame(() => {
    if (!ringRef.current) return
    const age = (performance.now() - startTimeRef.current) / 1000
    if (age > 0.6) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0
      return
    }
    const t = age / 0.6
    const scale = 1 + t * 9 // 1 → 10
    ringRef.current.scale.setScalar(scale)
    const mat = ringRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = (1 - t) * 0.85
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} geometry={ringGeometry}>
      <meshBasicMaterial
        color="#00ffff"
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
