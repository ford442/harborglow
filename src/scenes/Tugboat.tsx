// =============================================================================
// TUGBOAT COMPONENT — HarborGlow Tugboat Mode
// Physics-based tugboat with Rapier buoyancy, helm camera, and dashboard.
// Now supports realistic pitch/roll on waves via WaveSystem buoyancy probes.
// =============================================================================

import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useGameStore } from '../store/useGameStore'
import { stormSystem } from '../systems/StormSystem'
import { waveSystem } from '../systems/WaveSystem'

// =============================================================================
// CONSTANTS
// =============================================================================

const TUGBOAT_MASS = 15
const TUGBOAT_LINEAR_DAMPING = 2.2
const TUGBOAT_ANGULAR_DAMPING = 2.5
const MAX_SPEED = 12
const THROTTLE_FORCE = 45
const STEER_TORQUE = 8
const BOOST_MULTIPLIER = 2.0
const BOOST_COOLDOWN = 5

// Buoyancy
const BUOYANCY_SCALE = 18.0   // upward force per meter submerged
const DAMPING_SCALE = 2.5     // vertical velocity damping
const RESTORING_TORQUE = 4.0  // metacentric stability
const PROBE_OFFSETS = [
  { x: 0, z: 2.5 },   // bow
  { x: 0, z: -2.5 },  // stern
  { x: -1.2, z: 0 },  // port
  { x: 1.2, z: 0 },   // starboard
]

// =============================================================================
// RADAR SWEEP LINE
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
// TUGBOAT COMPONENT
// =============================================================================

export default function Tugboat() {
  const rbRef = useRef<RapierRigidBody>(null)
  const groupRef = useRef<THREE.Group>(null)

  const keysRef = useRef<Set<string>>(new Set())
  const boostRef = useRef({ active: false, cooldown: 0 })

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

    // Get current heading from rotation (Yaw around Y)
    const rot = rb.rotation()
    // quaternion to euler y — robust extraction
    const sy = 2.0 * (rot.w * rot.y + rot.z * rot.x)
    const heading = Math.abs(sy) >= 1.0
      ? Math.sign(sy) * (Math.PI / 2)
      : Math.asin(sy)

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

    // Apply surface current drift
    const pos = rb.translation()
    const current = waveSystem.getSurfaceCurrent(pos.x, pos.z)
    if (current.lengthSq() > 0) {
      rb.applyImpulse(
        { x: current.x * delta * 0.5, y: 0, z: current.z * delta * 0.5 },
        true
      )
    }

    // -----------------------------------------------------------------
    // BUOYANCY: sample wave height at hull probe points
    // -----------------------------------------------------------------
    const time = waveSystem.getTime()
    const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)
    let totalSubmerged = 0

    for (const offset of PROBE_OFFSETS) {
      // Transform local probe offset to world space
      const localOff = new THREE.Vector3(offset.x, 0, offset.z)
      localOff.applyQuaternion(quat)

      const probeX = pos.x + localOff.x
      const probeZ = pos.z + localOff.z
      const waterH = waveSystem.getWaterHeight(probeX, probeZ, time)
      const probeY = pos.y + localOff.y
      const submerged = waterH - 2.5 - probeY // water plane at -2.5 + wave height

      if (submerged > 0) {
        // Archimedes: upward force proportional to submerged depth
        const force = submerged * BUOYANCY_SCALE * delta
        rb.applyImpulseAtPoint(
          { x: 0, y: force, z: 0 },
          { x: probeX, y: probeY, z: probeZ },
          true
        )
        totalSubmerged += submerged
      }
    }

    // Vertical damping (prevent infinite oscillation)
    const vel = rb.linvel()
    if (vel.y !== 0) {
      rb.applyImpulse(
        { x: 0, y: -vel.y * DAMPING_SCALE * delta, z: 0 },
        true
      )
    }

    // Metacentric restoring torque (keep upright)
    const angVel = rb.angvel()
    // Dampen angular velocity on X and Z axes
    rb.applyTorqueImpulse(
      { x: -angVel.x * TUGBOAT_ANGULAR_DAMPING * delta, y: 0, z: -angVel.z * TUGBOAT_ANGULAR_DAMPING * delta },
      true
    )

    // Additional restoring torque based on tilt angle
    const euler = new THREE.Euler().setFromQuaternion(quat)
    rb.applyTorqueImpulse(
      {
        x: -euler.x * RESTORING_TORQUE * delta,
        y: 0,
        z: -euler.z * RESTORING_TORQUE * delta,
      },
      true
    )

    // Clamp max speed
    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed
      rb.setLinvel({ x: vel.x * scale, y: vel.y, z: vel.z * scale }, true)
    }

    // Sync visual group to physics body
    groupRef.current.position.set(pos.x, pos.y, pos.z)
    groupRef.current.quaternion.set(rot.x, rot.y, rot.z, rot.w)

    // Update store
    updateTugboatState({
      position: [pos.x, pos.y, pos.z],
      velocity: [vel.x, vel.y, vel.z],
      throttle,
      steering,
      heading,
    })
  })

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
      {/* Physics body — allow pitch/roll for wave riding */}
      <RigidBody
        ref={rbRef}
        type="dynamic"
        mass={TUGBOAT_MASS}
        linearDamping={TUGBOAT_LINEAR_DAMPING}
        angularDamping={TUGBOAT_ANGULAR_DAMPING}
        position={[20, 0.5, 10]}
        enabledRotations={[true, true, true]}
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

          {/* === DASHBOARD SCREENS === */}
          <mesh position={[0, 2.05, 0.45]} rotation={[-0.3, 0, 0]}>
            <planeGeometry args={[0.6, 0.4]} />
            <meshBasicMaterial color="#001122" />
          </mesh>
          <mesh position={[0, 2.05, 0.46]} rotation={[-0.3, 0, 0]}>
            <ringGeometry args={[0.15, 0.16, 32]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.8} />
          </mesh>
          <RadarSweepLine position={[0, 2.05, 0.465]} />

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
    </>
  )
}
