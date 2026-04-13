import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// SHIP UPGRADE CELEBRATION SYSTEM - HarborGlow
// Fireworks, confetti, streamers, and light show finale
// =============================================================================

interface CelebrationEffectsProps {
  shipId: string
  position: [number, number, number]
  shipType: 'cruise' | 'container' | 'tanker'
  active: boolean
  onComplete?: () => void
}

// Color themes by ship type
const SHIP_THEMES = {
  cruise: {
    primary: '#ff6b9d',
    secondary: '#c44569',
    accent: '#f8b500',
    lasers: ['#ff00ff', '#00ffff', '#ffff00']
  },
  container: {
    primary: '#3498db',
    secondary: '#2980b9',
    accent: '#e74c3c',
    lasers: ['#ff0000', '#00ff00', '#0000ff']
  },
  tanker: {
    primary: '#f39c12',
    secondary: '#d35400',
    accent: '#2c3e50',
    lasers: ['#ff6600', '#ffcc00', '#6600ff']
  }
}

// ============================================================================
// FIREWORKS SYSTEM
// ============================================================================

interface Firework {
  id: number
  phase: 'rocket' | 'burst' | 'fade'
  position: THREE.Vector3
  velocity: THREE.Vector3
  color: THREE.Color
  particles: Array<{
    pos: THREE.Vector3
    vel: THREE.Vector3
    life: number
  }>
  age: number
  maxAge: number
}

function FireworksDisplay({ position, theme, active }: {
  position: [number, number, number]
  theme: typeof SHIP_THEMES.cruise
  active: boolean
}) {
  const rocketsRef = useRef<THREE.Points>(null)
  const burstRef = useRef<THREE.Points>(null)
  const [fireworks, setFireworks] = useState<Firework[]>([])
  const launchTimerRef = useRef(0)

  // Launch a new firework
  const launchFirework = useCallback(() => {
    const colors = [theme.primary, theme.secondary, theme.accent]
    const fireworkColor = new THREE.Color(colors[Math.floor(Math.random() * colors.length)])

    const launchPos = new THREE.Vector3(
      position[0] + (Math.random() - 0.5) * 40,
      position[1],
      position[2] + (Math.random() - 0.5) * 40
    )

    const targetHeight = 30 + Math.random() * 20
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.sqrt(2 * 9.8 * targetHeight) * 0.5,
      (Math.random() - 0.5) * 2
    )

    const newFirework: Firework = {
      id: Date.now() + Math.random(),
      phase: 'rocket',
      position: launchPos.clone(),
      velocity: velocity,
      color: fireworkColor,
      particles: [],
      age: 0,
      maxAge: 3
    }

    setFireworks(prev => [...prev, newFirework])
  }, [position, theme])

  // Create burst particles
  const createBurst = (pos: THREE.Vector3, _color: THREE.Color) => {
    const particleCount = 80 + Math.floor(Math.random() * 40)
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 5 + Math.random() * 10

      particles.push({
        pos: pos.clone(),
        vel: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed,
          Math.sin(phi) * Math.sin(theta) * speed
        ),
        life: 1.0
      })
    }

    return particles
  }

  useFrame((_, delta) => {
    if (!active) return

    // Launch new rockets
    launchTimerRef.current -= delta
    if (launchTimerRef.current <= 0) {
      if (Math.random() > 0.3) launchFirework()
      launchTimerRef.current = 0.2 + Math.random() * 0.5
    }

    // Update fireworks
    setFireworks(prev => {
      return prev.map(fw => {
        fw.age += delta

        if (fw.phase === 'rocket') {
          // Physics for rocket ascent
          fw.velocity.y -= 9.8 * delta * 0.5
          fw.position.add(fw.velocity.clone().multiplyScalar(delta))

          // Burst at apex
          if (fw.velocity.y <= 0 || fw.age > 2) {
            fw.phase = 'burst'
            fw.particles = createBurst(fw.position, fw.color)
          }
        } else if (fw.phase === 'burst') {
          // Update particles
          fw.particles.forEach(p => {
            p.vel.y -= 9.8 * delta * 0.3 // Gravity
            p.vel.multiplyScalar(0.98) // Air resistance
            p.pos.add(p.vel.clone().multiplyScalar(delta))
            p.life -= delta * 0.4
          })

          // Remove dead particles
          fw.particles = fw.particles.filter(p => p.life > 0)

          if (fw.particles.length === 0 || fw.age > fw.maxAge) {
            fw.phase = 'fade'
          }
        }

        return fw
      }).filter(fw => fw.phase !== 'fade' || fw.age < fw.maxAge + 1)
    })
  })

  // Prepare rocket positions for rendering
  const rocketPositions = useMemo(() => {
    const rockets = fireworks.filter(fw => fw.phase === 'rocket')
    const positions = new Float32Array(rockets.length * 3)
    const colors = new Float32Array(rockets.length * 3)

    rockets.forEach((fw, i) => {
      positions[i * 3] = fw.position.x
      positions[i * 3 + 1] = fw.position.y
      positions[i * 3 + 2] = fw.position.z

      colors[i * 3] = fw.color.r
      colors[i * 3 + 1] = fw.color.g
      colors[i * 3 + 2] = fw.color.b
    })

    return { positions, colors, count: rockets.length }
  }, [fireworks])

  // Prepare burst particles for rendering
  const burstParticles = useMemo(() => {
    const bursts = fireworks.filter(fw => fw.phase === 'burst')
    const allParticles: Array<{ pos: THREE.Vector3; color: THREE.Color; life: number }> = []

    bursts.forEach(fw => {
      fw.particles.forEach(p => {
        allParticles.push({ pos: p.pos, color: fw.color, life: p.life })
      })
    })

    const positions = new Float32Array(allParticles.length * 3)
    const colors = new Float32Array(allParticles.length * 3)
    const sizes = new Float32Array(allParticles.length)

    allParticles.forEach((p, i) => {
      positions[i * 3] = p.pos.x
      positions[i * 3 + 1] = p.pos.y
      positions[i * 3 + 2] = p.pos.z

      colors[i * 3] = p.color.r
      colors[i * 3 + 1] = p.color.g
      colors[i * 3 + 2] = p.color.b

      sizes[i] = p.life * 0.3
    })

    return { positions, colors, sizes, count: allParticles.length }
  }, [fireworks])

  if (!active) return null

  return (
    <group>
      {/* Rocket trails */}
      {rocketPositions.count > 0 && (
        <points ref={rocketsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={rocketPositions.count}
              array={rocketPositions.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={rocketPositions.count}
              array={rocketPositions.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.8}
            vertexColors
            transparent
            opacity={0.9}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Burst particles */}
      {burstParticles.count > 0 && (
        <points ref={burstRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={burstParticles.count}
              array={burstParticles.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={burstParticles.count}
              array={burstParticles.colors}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={burstParticles.count}
              array={burstParticles.sizes}
              itemSize={1}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.5}
            vertexColors
            transparent
            opacity={0.8}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Smoke trails */}
      {fireworks.filter(fw => fw.phase === 'rocket').map(fw => (
        <SmokeTrail key={fw.id} position={fw.position} />
      ))}
    </group>
  )
}

// Smoke trail effect for rockets
function SmokeTrail({ position }: { position: THREE.Vector3 }) {
  const particlesRef = useRef<THREE.Points>(null)
  const [particles] = useState(() => {
    const arr = []
    for (let i = 0; i < 20; i++) {
      arr.push({
        x: position.x + (Math.random() - 0.5) * 2,
        y: position.y - i * 0.5,
        z: position.z + (Math.random() - 0.5) * 2,
        size: 0.5 + Math.random(),
        life: 1 - i / 20
      })
    }
    return arr
  })

  const positions = useMemo(() => {
    const arr = new Float32Array(particles.length * 3)
    particles.forEach((p, i) => {
      arr[i * 3] = p.x
      arr[i * 3 + 1] = p.y
      arr[i * 3 + 2] = p.z
    })
    return arr
  }, [particles])

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1}
        color="#888888"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ============================================================================
// CONFETTI AND STREAMERS
// ============================================================================

function ConfettiSystem({ position, theme, active }: {
  position: [number, number, number]
  theme: typeof SHIP_THEMES.cruise
  active: boolean
}) {
  const confettiRef = useRef<THREE.InstancedMesh>(null)
  const CONFETTI_COUNT = 500

  const confettiData = useMemo(() => {
    const data = []
    const colors = [theme.primary, theme.secondary, theme.accent, '#ffffff']

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      data.push({
        position: new THREE.Vector3(
          position[0] + (Math.random() - 0.5) * 30,
          position[1] + 20 + Math.random() * 15,
          position[2] + (Math.random() - 0.5) * 30
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          -2 - Math.random() * 3,
          (Math.random() - 0.5) * 3
        ),
        rotation: new THREE.Vector3(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5
        ),
        color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
        scale: 0.3 + Math.random() * 0.4,
        life: 1.0
      })
    }

    return data
  }, [position, theme])

  useFrame((state, delta) => {
    if (!active || !confettiRef.current) return

    const dummy = new THREE.Object3D()

    confettiData.forEach((c, i) => {
      // Apply physics
      c.velocity.y -= 2 * delta // Gravity
      c.velocity.x += Math.sin(state.clock.elapsedTime + i) * 0.5 * delta // Air turbulence
      c.velocity.z += Math.cos(state.clock.elapsedTime + i * 0.7) * 0.3 * delta

      c.position.add(c.velocity.clone().multiplyScalar(delta))
      c.rotation.x += c.rotSpeed.x * delta
      c.rotation.y += c.rotSpeed.y * delta
      c.rotation.z += c.rotSpeed.z * delta

      // Reset if below water
      if (c.position.y < -5) {
        c.position.y = position[1] + 20 + Math.random() * 10
        c.position.x = position[0] + (Math.random() - 0.5) * 20
        c.position.z = position[2] + (Math.random() - 0.5) * 20
        c.velocity.set(
          (Math.random() - 0.5) * 3,
          -2 - Math.random() * 3,
          (Math.random() - 0.5) * 3
        )
      }

      dummy.position.copy(c.position)
      dummy.rotation.set(c.rotation.x, c.rotation.y, c.rotation.z)
      dummy.scale.set(c.scale, c.scale * 0.6, c.scale)
      dummy.updateMatrix()

      confettiRef.current!.setMatrixAt(i, dummy.matrix)
      confettiRef.current!.setColorAt(i, c.color)
    })

    confettiRef.current.instanceMatrix.needsUpdate = true
    if (confettiRef.current.instanceColor) {
      confettiRef.current.instanceColor.needsUpdate = true
    }
  })

  if (!active) return null

  return (
    <instancedMesh
      ref={confettiRef}
      args={[undefined, undefined, CONFETTI_COUNT]}
    >
      <planeGeometry args={[1, 0.6]} />
      <meshStandardMaterial
        side={THREE.DoubleSide}
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  )
}

// Metallic streamers
function StreamerSystem({ position, theme, active }: {
  position: [number, number, number]
  theme: typeof SHIP_THEMES.cruise
  active: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const STREAMER_COUNT = 30

  const streamers = useMemo(() => {
    return Array.from({ length: STREAMER_COUNT }, (_, i) => ({
      id: i,
      startPos: new THREE.Vector3(
        position[0] + (Math.random() - 0.5) * 25,
        position[1] + 25 + Math.random() * 10,
        position[2] + (Math.random() - 0.5) * 25
      ),
      color: new THREE.Color(
        i % 3 === 0 ? theme.primary : i % 3 === 1 ? theme.secondary : theme.accent
      ),
      width: 0.1 + Math.random() * 0.2,
      length: 5 + Math.random() * 10
    }))
  }, [position, theme])

  useFrame((state, delta) => {
    if (!active || !groupRef.current) return

    // Animate streamers with sine wave motion
    groupRef.current.children.forEach((child, i) => {
      const streamer = streamers[i]
      const time = state.clock.elapsedTime

      // Falling with sway
      child.position.y -= 3 * delta
      child.position.x += Math.sin(time * 2 + i) * 0.02
      child.position.z += Math.cos(time * 1.5 + i) * 0.02
      child.rotation.z = Math.sin(time * 3 + i) * 0.3

      // Reset if too low
      if (child.position.y < -10) {
        child.position.copy(streamer.startPos)
      }
    })
  })

  if (!active) return null

  return (
    <group ref={groupRef}>
      {streamers.map(s => (
        <mesh key={s.id} position={s.startPos}>
          <cylinderGeometry args={[s.width, s.width, s.length, 8]} />
          <meshStandardMaterial
            color={s.color}
            metalness={0.9}
            roughness={0.1}
            emissive={s.color}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================================
// LIGHT SHOW FINALE
// ============================================================================

function LightShowFinale({ position, theme, active }: {
  position: [number, number, number]
  theme: typeof SHIP_THEMES.cruise
  active: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const bpm = useGameStore(state => state.bpm)

  // Spotlight beams converging
  useFrame((state) => {
    if (!active || !groupRef.current) return

    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatPhase = (time % beatDuration) / beatDuration

    // Strobe all lights on beat
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.SpotLight) {
        child.intensity = beatPhase < 0.2 ? 20 : 2

        // Rotate beams
        const angle = (i / 6) * Math.PI * 2 + time * 0.5
        child.target.position.set(
          position[0] + Math.cos(angle) * 10,
          position[1],
          position[2] + Math.sin(angle) * 10
        )
        child.target.updateMatrixWorld()
      }
    })
  })

  if (!active) return null

  return (
    <group ref={groupRef}>
      {/* Converging spotlights */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2
        return (
          <group key={i}>
            <spotLight
              position={[
                position[0] + Math.cos(angle) * 20,
                position[1] + 15,
                position[2] + Math.sin(angle) * 20
              ]}
              intensity={10}
              distance={50}
              angle={0.3}
              penumbra={0.5}
              color={theme.lasers[i % 3]}
            />
            <VolumetricBeam
              position={[
                position[0] + Math.cos(angle) * 20,
                position[1] + 15,
                position[2] + Math.sin(angle) * 20
              ]}
              target={position}
              color={theme.lasers[i % 3]}
            />
          </group>
        )
      })}

      {/* Sweeping laser beams */}
      {theme.lasers.map((color, i) => (
        <SweepingLaser
          key={i}
          position={[position[0], position[1] + 20, position[2]]}
          color={color}
          offset={i * (Math.PI * 2 / 3)}
        />
      ))}

      {/* Water projection effects */}
      <WaterProjection position={position} color={theme.primary} />
    </group>
  )
}

// Volumetric beam effect
function VolumetricBeam({ position, target, color }: {
  position: [number, number, number]
  target: [number, number, number]
  color: string
}) {
  const beamRef = useRef<THREE.Mesh>(null)
  const direction = new THREE.Vector3(...target).sub(new THREE.Vector3(...position))
  const length = direction.length()
  const rotation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, -1, 0),
    direction.normalize()
  )

  return (
    <mesh
      ref={beamRef}
      position={position}
      quaternion={rotation}
    >
      <coneGeometry args={[2, length, 32, 1, true]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform float uIntensity;
          varying vec2 vUv;

          void main() {
            float fade = (1.0 - vUv.y) * 0.5;
            float radial = 1.0 - abs(vUv.x - 0.5) * 2.0;
            gl_FragColor = vec4(uColor, fade * radial * uIntensity * 0.3);
          }
        `}
        uniforms={{
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: 1 }
        }}
      />
    </mesh>
  )
}

// Sweeping laser beam
function SweepingLaser({ position, color, offset }: {
  position: [number, number, number]
  color: string
  offset: number
}) {
  const beamRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!beamRef.current) return

    const time = state.clock.elapsedTime
    const angle = Math.sin(time * 2 + offset) * 0.8
    beamRef.current.rotation.y = angle
  })

  return (
    <group position={position}>
      <mesh ref={beamRef} rotation={[Math.PI / 2, offset, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 100]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

// Water projection effect
function WaterProjection({ position, color }: {
  position: [number, number, number]
  color: string
}) {
  const projectionRef = useRef<THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>>(null)

  useFrame((state) => {
    if (!projectionRef.current) return

    const time = state.clock.elapsedTime
    projectionRef.current.rotation.z = time * 0.2
    if (projectionRef.current.material) {
      projectionRef.current.material.opacity = 0.3 + Math.sin(time * 3) * 0.1
    }
  })

  return (
    <mesh
      ref={projectionRef}
      position={[position[0], -2.3, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[15, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

// ============================================================================
// MAIN CELEBRATION COMPONENT
// ============================================================================

export default function UpgradeCelebration({
  shipId,
  position,
  shipType,
  active,
  onComplete
}: CelebrationEffectsProps) {
  const theme = SHIP_THEMES[shipType]

  // Auto-complete after 10 seconds
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        onComplete?.()
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [active, onComplete])

  return (
    <group key={shipId}>
      <FireworksDisplay
        position={position}
        theme={theme}
        active={active}
      />

      <ConfettiSystem
        position={position}
        theme={theme}
        active={active}
      />

      <StreamerSystem
        position={position}
        theme={theme}
        active={active}
      />

      <LightShowFinale
        position={position}
        theme={theme}
        active={active}
      />
    </group>
  )
}

// Hook to trigger celebrations
export function useCelebration() {
  const [activeCelebrations, setActiveCelebrations] = useState<Set<string>>(new Set())

  const startCelebration = useCallback((shipId: string) => {
    setActiveCelebrations(prev => new Set([...prev, shipId]))
  }, [])

  const endCelebration = useCallback((shipId: string) => {
    setActiveCelebrations(prev => {
      const next = new Set(prev)
      next.delete(shipId)
      return next
    })
  }, [])

  return {
    activeCelebrations,
    startCelebration,
    endCelebration,
    isCelebrating: (shipId: string) => activeCelebrations.has(shipId)
  }
}
