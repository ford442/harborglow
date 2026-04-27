// =============================================================================
// TUGBOAT COMPONENT - HarborGlow Tugboat Mode
// Physics-based tugboat with helm camera, wake particles, and dashboard
// =============================================================================

import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useGameStore } from '../store/useGameStore'
import { stormSystem } from '../systems/StormSystem'

// =============================================================================
// CONSTANTS
// =============================================================================

const TUGBOAT_MASS = 8
const TUGBOAT_LINEAR_DAMPING = 2.5
const TUGBOAT_ANGULAR_DAMPING = 3.0
const MAX_SPEED = 12
const THROTTLE_FORCE = 35
const STEER_TORQUE = 8
const BOOST_MULTIPLIER = 2.0
const BOOST_COOLDOWN = 5

// =============================================================================
// RADAR SWEEP LINE (animated)
// =============================================================================

function RadarSweepLine({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 2
    }
  })
  return (
    <mesh ref={meshRef} position={position} rotation={[-0.3, 0, 0]}>
      <planeGeometry args={[0.3, 0.01]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
    </mesh>
  )
}

// =============================================================================
// WAKE PARTICLE SYSTEM
// =============================================================================

interface WakeParticle {
  id: number
  position: THREE.Vector3
  scale: number
  opacity: number
  life: number
  maxLife: number
}

function useWakeParticles() {
  const particlesRef = useRef<WakeParticle[]>([])
  const nextIdRef = useRef(0)
  const meshRefs = useRef<THREE.Mesh[]>([])

  const spawn = (position: THREE.Vector3) => {
    const id = nextIdRef.current++
    particlesRef.current.push({
      id,
      position: position.clone(),
      scale: 0.2 + Math.random() * 0.3,
      opacity: 0.6,
      life: 0,
      maxLife: 2.0 + Math.random() * 1.0,
    })
  }

  const update = (delta: number) => {
    particlesRef.current = particlesRef.current.filter((p) => {
      p.life += delta
      const progress = p.life / p.maxLife
      p.scale += delta * 0.5
      p.opacity = 0.6 * (1 - progress)
      return p.life < p.maxLife
    })
  }

  return { particlesRef, meshRefs, spawn, update }
}

// =============================================================================
// TUGBOAT COMPONENT
// =============================================================================

export default function Tugboat() {
  const rbRef = useRef<RapierRigidBody>(null)
  const groupRef = useRef<THREE.Group>(null)

  const keysRef = useRef<Set<string>>(new Set())
  const boostRef = useRef({ active: false, cooldown: 0 })
  const spawnTimerRef = useRef(0)

  const { particlesRef, spawn, update: updateWake } = useWakeParticles()

  const operationMode = useGameStore((s) => s.operationMode)
  const updateTugboatState = useGameStore((s) => s.updateTugboatState)

  // ---------------------------------------------------------------------------
  // Keyboard input
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
      if (e.key === 'Shift') {
        if (boostRef.current.cooldown <= 0) {
          boostRef.current.active = true
          boostRef.current.cooldown = BOOST_COOLDOWN
        }
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
      if (e.key === 'Shift') {
        boostRef.current.active = false
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Physics & animation loop
  // ---------------------------------------------------------------------------

  useFrame((state, delta) => {
    if (!rbRef.current || !groupRef.current) return

    const rb = rbRef.current
    const keys = keysRef.current

    // Throttle
    let throttle = 0
    if (keys.has('w') || keys.has('arrowup')) throttle += 1
    if (keys.has('s') || keys.has('arrowdown')) throttle -= 1

    // Steering
    let steering = 0
    if (keys.has('a') || keys.has('arrowleft')) steering += 1
    if (keys.has('d') || keys.has('arrowright')) steering -= 1

    // Boost cooldown
    if (boostRef.current.cooldown > 0) {
      boostRef.current.cooldown -= delta
    }

    const boostMult = boostRef.current.active ? BOOST_MULTIPLIER : 1.0

    // Get current heading from rotation
    const rot = rb.rotation()
    const heading = 2 * Math.atan2(rot.y, rot.w)

    // Apply throttle force along heading
    if (throttle !== 0) {
      const force = throttle * THROTTLE_FORCE * boostMult * delta
      rb.applyImpulse(
        { x: Math.cos(heading) * force, y: 0, z: Math.sin(heading) * force },
        true
      )
    }

    // Apply steering torque
    if (steering !== 0 && throttle !== 0) {
      const torque = steering * STEER_TORQUE * delta * Math.sign(throttle)
      rb.applyTorqueImpulse({ x: 0, y: torque, z: 0 }, true)
    }

    // Apply wind force from storm
    const windForce = stormSystem.getWindForce()
    if (windForce.lengthSq() > 0) {
      rb.applyImpulse(
        { x: windForce.x * delta, y: 0, z: windForce.z * delta },
        true
      )
    }

    // Clamp max speed
    const vel = rb.linvel()
    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed
      rb.setLinvel({ x: vel.x * scale, y: vel.y, z: vel.z * scale }, true)
    }

    // Sync group to physics body
    const pos = rb.translation()
    groupRef.current.position.set(pos.x, pos.y, pos.z)
    groupRef.current.rotation.set(0, heading, 0)

    // Update store
    updateTugboatState({
      position: [pos.x, pos.y, pos.z],
      velocity: [vel.x, vel.y, vel.z],
      throttle,
      steering,
      heading,
    })

    // Wake particles
    spawnTimerRef.current += delta
    const spawnInterval = throttle !== 0 ? 0.15 : 0.3
    if (spawnTimerRef.current >= spawnInterval) {
      spawnTimerRef.current = 0
      // Spawn wake behind stern
      const sternOffset = new THREE.Vector3(
        -Math.cos(heading) * 2.5,
        0.1,
        -Math.sin(heading) * 2.5
      )
      const spawnPos = new THREE.Vector3(pos.x, pos.y, pos.z).add(sternOffset)
      spawn(spawnPos)
    }

    updateWake(delta)

    // Screen shake from storm (applied to group)
    const stormIntensity = stormSystem.getIntensity()
    if (stormIntensity > 0.3 && groupRef.current) {
      const shake = stormIntensity * 0.04
      groupRef.current.position.x += (Math.random() - 0.5) * shake
      groupRef.current.position.y += (Math.random() - 0.5) * shake
    }
  })

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Geometry helpers
  // ---------------------------------------------------------------------------

  const hullColor = '#cc3300'
  const cabinColor = '#ffffff'
  const deckColor = '#8b4513'

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Physics body */}
      <RigidBody
        ref={rbRef}
        type="dynamic"
        mass={TUGBOAT_MASS}
        linearDamping={TUGBOAT_LINEAR_DAMPING}
        angularDamping={TUGBOAT_ANGULAR_DAMPING}
        position={[20, 0.5, 10]}
        enabledRotations={[false, true, false]}
        colliders="cuboid"
      >
        <group ref={groupRef}>
          {/* === HULL === */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[3, 1.2, 6]} />
            <meshStandardMaterial color={hullColor} roughness={0.7} metalness={0.3} />
          </mesh>

          {/* Hull bow slope */}
          <mesh position={[0, 0.6, 3.2]} rotation={[0.4, 0, 0]} castShadow>
            <boxGeometry args={[2.8, 0.8, 1.2]} />
            <meshStandardMaterial color={hullColor} roughness={0.7} metalness={0.3} />
          </mesh>

          {/* Hull stern */}
          <mesh position={[0, 0.4, -3.2]} castShadow>
            <boxGeometry args={[2.8, 0.8, 0.8]} />
            <meshStandardMaterial color={hullColor} roughness={0.7} metalness={0.3} />
          </mesh>

          {/* === DECK === */}
          <mesh position={[0, 0.95, 0]} castShadow>
            <boxGeometry args={[2.6, 0.1, 5.6]} />
            <meshStandardMaterial color={deckColor} roughness={0.9} />
          </mesh>

          {/* === WHEELHOUSE === */}
          <mesh position={[0, 1.8, -0.5]} castShadow>
            <boxGeometry args={[2, 1.4, 2]} />
            <meshStandardMaterial color={cabinColor} roughness={0.5} metalness={0.1} />
          </mesh>

          {/* Wheelhouse windows */}
          <mesh position={[0, 2.0, 0.51]}>
            <boxGeometry args={[1.6, 0.6, 0.05]} />
            <meshBasicMaterial color="#88ccff" transparent opacity={0.7} />
          </mesh>
          <mesh position={[1.01, 2.0, -0.5]}>
            <boxGeometry args={[0.05, 0.6, 1.4]} />
            <meshBasicMaterial color="#88ccff" transparent opacity={0.7} />
          </mesh>
          <mesh position={[-1.01, 2.0, -0.5]}>
            <boxGeometry args={[0.05, 0.6, 1.4]} />
            <meshBasicMaterial color="#88ccff" transparent opacity={0.7} />
          </mesh>

          {/* === FUNNEL === */}
          <mesh position={[0, 2.6, -1.2]} castShadow>
            <cylinderGeometry args={[0.25, 0.35, 0.8, 16]} />
            <meshStandardMaterial color="#333333" roughness={0.8} />
          </mesh>
          {/* Funnel top rim */}
          <mesh position={[0, 3.05, -1.2]}>
            <torusGeometry args={[0.3, 0.05, 8, 16]} />
            <meshStandardMaterial color="#555555" roughness={0.6} metalness={0.5} />
          </mesh>

          {/* === DECK RAILS === */}
          {[
            [-1.2, 1.2, 2.5], [1.2, 1.2, 2.5],
            [-1.2, 1.2, -2.5], [1.2, 1.2, -2.5],
          ].map((pos, i) => (
            <mesh key={`rail-${i}`} position={pos as [number, number, number]}>
              <boxGeometry args={[0.05, 0.5, 0.05]} />
              <meshStandardMaterial color="#cccccc" metalness={0.6} />
            </mesh>
          ))}

          {/* === SEARCHLIGHT === */}
          <mesh position={[0.8, 2.3, 0.6]}>
            <cylinderGeometry args={[0.15, 0.2, 0.3, 12]} />
            <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.7} />
          </mesh>
          <spotLight
            position={[0.8, 2.3, 0.8]}
            angle={0.4}
            penumbra={0.5}
            intensity={3}
            distance={40}
            castShadow
            color="#fff8e0"
            target-position={[0.8, 1.0, 5]}
          />

          {/* Helm camera marker (visual only, actual camera is outside RigidBody) */}
          <mesh position={[0, 2.3, 0.2]} visible={false}>
            <boxGeometry args={[0.01, 0.01, 0.01]} />
          </mesh>

          {/* === DASHBOARD SCREENS === */}
          {/* Main radar screen */}
          <mesh position={[0, 2.05, 0.45]} rotation={[-0.3, 0, 0]}>
            <planeGeometry args={[0.6, 0.4]} />
            <meshBasicMaterial color="#001122" />
          </mesh>
          <mesh position={[0, 2.05, 0.46]} rotation={[-0.3, 0, 0]}>
            <ringGeometry args={[0.15, 0.16, 32]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.8} />
          </mesh>
          {/* Radar sweep line */}
          <RadarSweepLine position={[0, 2.05, 0.465]} />

          {/* Side gauges */}

          {/* Side gauges */}
          <mesh position={[-0.5, 2.05, 0.4]} rotation={[-0.3, 0, 0]}>
            <planeGeometry args={[0.25, 0.2]} />
            <meshBasicMaterial color="#220011" />
          </mesh>
          <mesh position={[0.5, 2.05, 0.4]} rotation={[-0.3, 0, 0]}>
            <planeGeometry args={[0.25, 0.2]} />
            <meshBasicMaterial color="#220011" />
          </mesh>

          {/* Helm wheel */}
          <mesh position={[0, 1.6, 0.6]} rotation={[0.5, 0, 0]}>
            <torusGeometry args={[0.25, 0.03, 8, 24]} />
            <meshStandardMaterial color="#8b4513" roughness={0.6} />
          </mesh>
        </group>
      </RigidBody>

      {/* === WAKE PARTICLES === */}
      {particlesRef.current.map((p, i) => (
        <mesh key={p.id} position={[p.position.x, p.position.y, p.position.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[p.scale, p.scale]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={p.opacity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  )
}
