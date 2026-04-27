// =============================================================================
// DISTRESSED SHIP — HarborGlow Storm Rescue Mission
// A damaged ship that drifts, takes damage over time, and must be rescued.
// =============================================================================

import { useRef, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useGameStore, ShipType } from '../store/useGameStore'
import { ProceduralShip } from './ProceduralShip'
import { stormSystem } from '../systems/StormSystem'
import { waveSystem } from '../systems/WaveSystem'

// =============================================================================
// CONSTANTS
// =============================================================================

const SHIP_MASS = 60
const SHIP_LINEAR_DAMPING = 0.3
const SHIP_ANGULAR_DAMPING = 2.0
const BUOYANCY_SCALE = 35.0
const DAMPING_SCALE = 1.8
const RESTORING_TORQUE = 6.0
const MAX_SPEED = 4
const DAMAGE_RATE = 3.5 // damage per second

const PROBE_OFFSETS = [
  { x: 0, z: 4 },
  { x: 0, z: -4 },
  { x: -1.5, z: 2 },
  { x: 1.5, z: 2 },
  { x: -1.5, z: -2 },
  { x: 1.5, z: -2 },
]

// =============================================================================
// TYPES
// =============================================================================

interface DistressedShipProps {
  id: string
  shipType: ShipType
  startPosition: [number, number, number]
  startRotation?: number
  berthCenter: [number, number, number]
  berthRadius: number
  timeLimit: number
  maxDamage: number
  onDamageUpdate: (damage: number) => void
  onDocked: (id: string) => void
  onDestroyed: (id: string) => void
}

// =============================================================================
// SMOKE PARTICLES
// =============================================================================

function SmokeParticles({ position, intensity }: { position: [number, number, number]; intensity: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 30

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2
      pos[i * 3 + 1] = Math.random() * 3
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2
      vel[i * 3] = (Math.random() - 0.5) * 0.3
      vel[i * 3 + 1] = 0.5 + Math.random() * 1.5
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.3
    }
    return { positions: pos, velocities: vel }
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current?.geometry?.attributes?.position) return
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      posArray[i * 3] += velocities[i * 3] * delta
      posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta
      posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta
      if (posArray[i * 3 + 1] > 8) {
        posArray[i * 3] = (Math.random() - 0.5) * 2
        posArray[i * 3 + 1] = 0
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 2
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  if (intensity < 0.1) return null

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#555555"
        size={0.4 + intensity * 0.4}
        transparent
        opacity={intensity * 0.5}
        depthWrite={false}
      />
    </points>
  )
}

// =============================================================================
// DAMAGE LIGHT
// =============================================================================

function DamageLight({ intensity }: { intensity: number }) {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (!lightRef.current) return
    lightRef.current.intensity = intensity * 3 + Math.sin(state.clock.elapsedTime * 3) * 0.5
  })

  return <pointLight ref={lightRef} color="#ff3300" distance={15} decay={2} position={[0, 3, 0]} />
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function DistressedShip({
  id,
  shipType,
  startPosition,
  startRotation = 0,
  berthCenter,
  berthRadius,
  timeLimit,
  maxDamage,
  onDamageUpdate,
  onDocked,
  onDestroyed,
}: DistressedShipProps) {
  const rbRef = useRef<RapierRigidBody>(null)
  const groupRef = useRef<THREE.Group>(null)

  const [isDocked, setIsDocked] = useState(false)
  const [damage, setDamage] = useState(0)
  const dockTimerRef = useRef(0)
  const hasDockedRef = useRef(false)
  const damageRef = useRef(0)
  const timeRemainingRef = useRef(timeLimit)

  const operationMode = useGameStore((s) => s.operationMode)
  const activeMission = useGameStore((s) => s.activeMission)
  const updateMission = useGameStore((s) => s.updateMission)

  const berthVec = useMemo(
    () => new THREE.Vector3(berthCenter[0], berthCenter[1], berthCenter[2]),
    [berthCenter]
  )

  useFrame((_, delta) => {
    if (!rbRef.current || !groupRef.current) return
    if (operationMode !== 'tugboat') return
    if (hasDockedRef.current) {
      rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    const rb = rbRef.current
    const time = waveSystem.getTime()

    // --- Damage accumulation ---
    const stormInt = stormSystem.getIntensity()
    const damageMultiplier = 1 + stormInt * 1.5
    damageRef.current += DAMAGE_RATE * delta * damageMultiplier
    timeRemainingRef.current -= delta

    // Sync damage to local state and parent
    if (Math.floor(damageRef.current) !== Math.floor(damage)) {
      setDamage(damageRef.current)
      onDamageUpdate(damageRef.current)
      updateMission({ damage: damageRef.current, timeRemaining: timeRemainingRef.current })
    }

    // Check destroy conditions
    if (damageRef.current >= maxDamage || timeRemainingRef.current <= 0) {
      hasDockedRef.current = true
      onDestroyed(id)
      return
    }

    // --- Wind force ---
    const windForce = stormSystem.getWindForce()
    if (windForce.lengthSq() > 0) {
      rb.applyImpulse(
        { x: windForce.x * delta, y: 0, z: windForce.z * delta },
        true
      )
    }

    // --- Surface current ---
    const pos = rb.translation()
    const current = waveSystem.getSurfaceCurrent(pos.x, pos.z)
    if (current.lengthSq() > 0) {
      rb.applyImpulse(
        { x: current.x * delta * 0.3, y: 0, z: current.z * delta * 0.3 },
        true
      )
    }

    // --- Buoyancy probes ---
    const rot = rb.rotation()
    const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)

    for (const offset of PROBE_OFFSETS) {
      const localOff = new THREE.Vector3(offset.x, 0, offset.z)
      localOff.applyQuaternion(quat)

      const probeX = pos.x + localOff.x
      const probeZ = pos.z + localOff.z
      const waterH = waveSystem.getWaterHeight(probeX, probeZ, time)
      const probeY = pos.y + localOff.y
      const submerged = waterH - 2.5 - probeY

      if (submerged > 0) {
        const force = submerged * BUOYANCY_SCALE * delta
        rb.applyImpulseAtPoint(
          { x: 0, y: force, z: 0 },
          { x: probeX, y: probeY, z: probeZ },
          true
        )
      }
    }

    // --- Storm buoyancy chaos ---
    if (stormInt > 0) {
      const chaosForce = (Math.random() - 0.5) * stormInt * 20 * delta
      rb.applyImpulse({ x: 0, y: chaosForce, z: 0 }, true)
    }

    // --- Vertical damping ---
    const vel = rb.linvel()
    if (vel.y !== 0) {
      rb.applyImpulse(
        { x: 0, y: -vel.y * DAMPING_SCALE * delta, z: 0 },
        true
      )
    }

    // --- Angular damping & restoring torque ---
    const angVel = rb.angvel()
    rb.applyTorqueImpulse(
      { x: -angVel.x * SHIP_ANGULAR_DAMPING * delta, y: 0, z: -angVel.z * SHIP_ANGULAR_DAMPING * delta },
      true
    )

    const euler = new THREE.Euler().setFromQuaternion(quat)
    rb.applyTorqueImpulse(
      {
        x: -euler.x * RESTORING_TORQUE * delta,
        y: 0,
        z: -euler.z * RESTORING_TORQUE * delta,
      },
      true
    )

    // --- Clamp max speed ---
    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed
      rb.setLinvel({ x: vel.x * scale, y: vel.y, z: vel.z * scale }, true)
    }

    // --- Sync visual group ---
    groupRef.current.position.set(pos.x, pos.y, pos.z)
    groupRef.current.quaternion.set(rot.x, rot.y, rot.z, rot.w)

    // --- Docking detection ---
    const dist = Math.sqrt(
      (pos.x - berthCenter[0]) ** 2 +
      (pos.z - berthCenter[2]) ** 2
    )

    if (dist < berthRadius && speed < 1.0) {
      dockTimerRef.current += delta
      if (dockTimerRef.current > 3.0) {
        hasDockedRef.current = true
        setIsDocked(true)
        onDocked(id)
      }
    } else {
      dockTimerRef.current = Math.max(0, dockTimerRef.current - delta * 0.5)
    }
  })

  // Reset on mode switch
  useEffect(() => {
    if (operationMode === 'tugboat') {
      hasDockedRef.current = false
      setIsDocked(false)
      dockTimerRef.current = 0
      damageRef.current = 0
      setDamage(0)
      timeRemainingRef.current = timeLimit
    }
  }, [operationMode, id, timeLimit])

  if (operationMode !== 'tugboat') return null

  const damageRatio = Math.min(1, damage / maxDamage)

  return (
    <RigidBody
      ref={rbRef}
      type="dynamic"
      mass={SHIP_MASS}
      linearDamping={SHIP_LINEAR_DAMPING}
      angularDamping={SHIP_ANGULAR_DAMPING}
      position={startPosition}
      rotation={[0, startRotation, 0]}
      enabledRotations={[true, true, true]}
      colliders="cuboid"
    >
      <group ref={groupRef}>
        <ProceduralShip blueprintId={shipType} version="1.0" />

        {/* Damage overlay - red tint */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[3.5, 2.5, 7]} />
          <meshStandardMaterial
            color="#ff0000"
            emissive="#ff2200"
            emissiveIntensity={damageRatio * 0.4}
            transparent
            opacity={damageRatio * 0.15}
            depthWrite={false}
          />
        </mesh>

        {/* Smoke from damage */}
        <SmokeParticles position={[0, 2, 2]} intensity={damageRatio} />

        {/* Damage warning light */}
        <DamageLight intensity={damageRatio} />

        {/* Docked indicator */}
        {isDocked && (
          <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[berthRadius - 0.5, berthRadius, 64]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </RigidBody>
  )
}
