// =============================================================================
// TUGBOAT TARGET SHIP — HarborGlow Tugboat Mode
// Dynamic physics ship with Rapier buoyancy that can be pushed into berths.
// =============================================================================

import { useRef, useEffect, useMemo, useState } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useGameStore, ShipType } from '../store/useGameStore'
import { ProceduralShip } from './ProceduralShip'
import { stormSystem } from '../systems/StormSystem'
import { waveSystem } from '../systems/WaveSystem'
import { tugboatWakeState } from '../systems/TugboatWakeSystem'
import { towLineState } from '../systems/TowLineSystem'

// =============================================================================
// CONSTANTS
// =============================================================================

// High-mass freighter dynamics — feels like a real 50 000-tonne vessel.
// Buoyancy/damping constants are scaled to match the new mass so the ship
// still floats correctly and doesn't spin out of control.
const SHIP_MASS            = 50000
const SHIP_LINEAR_DAMPING  = 0.8    // slow to accelerate AND slow to stop
const SHIP_ANGULAR_DAMPING = 1.2    // inhibits endless spin
const BUOYANCY_SCALE       = 30000  // scaled from 35 to keep ship afloat
const DAMPING_SCALE        = 1500   // vertical-velocity damping
const RESTORING_TORQUE     = 5000   // upright-restoring torque (scaled with I)
const MAX_SPEED            = 2      // m/s — heavy ships are slow

// Tow-line physics
const MAX_TOW_LENGTH   = 12       // metres of rope before tension builds
const TOW_SPRING_K     = 200000   // impulse spring constant (N·s/m)

// 6 probe points for longer hulls
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

interface TugboatTargetShipProps {
  id: string
  shipType: ShipType
  startPosition: [number, number, number]
  startRotation?: number
  berthCenter: [number, number, number]
  berthRadius: number
  onDocked: (id: string) => void
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function TugboatTargetShip({
  id,
  shipType,
  startPosition,
  startRotation = 0,
  berthCenter,
  berthRadius,
  onDocked,
}: TugboatTargetShipProps) {
  const rbRef = useRef<RapierRigidBody>(null)
  const groupRef = useRef<THREE.Group>(null)

  const [isDocked, setIsDocked] = useState(false)
  const dockTimerRef = useRef(0)
  const hasDockedRef = useRef(false)

  const operationMode = useGameStore((s) => s.operationMode)
  const towingUnlocked = useGameStore((s) => s.towingUnlocked)

  const berthVec = useMemo(
    () => new THREE.Vector3(berthCenter[0], berthCenter[1], berthCenter[2]),
    [berthCenter]
  )

  // Reusable vectors — allocated once, mutated in useFrame
  const _toTug = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    if (!rbRef.current || !groupRef.current) return
    if (operationMode !== 'tugboat') return
    if (hasDockedRef.current) {
      // Freeze in place when docked
      rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    const rb = rbRef.current
    const time = waveSystem.getTime()

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
    const stormInt = stormSystem.getIntensity()
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

    // --- Tow-line spring constraint ---
    // Read store state directly (no subscription) to avoid 60 fps React renders.
    const storeState = useGameStore.getState()
    if (storeState.towLineAttached && storeState.activeTowedShipId === id) {
      const tugPos = storeState.tugboatState.position
      _toTug.set(tugPos[0] - pos.x, 0, tugPos[2] - pos.z)
      const towDist = _toTug.length()
      const excess = towDist - MAX_TOW_LENGTH
      if (excess > 0) {
        _toTug.normalize()
        const impulse = excess * TOW_SPRING_K * delta
        rb.applyImpulse({ x: _toTug.x * impulse, y: 0, z: _toTug.z * impulse }, true)
      }
      // Update singleton state for visual rope
      towLineState.active = true
      towLineState.shipPosition.set(pos.x, pos.y + 1, pos.z)
    } else {
      towLineState.active = false
    }

    // --- Docking detection ---
    const dist = Math.sqrt(
      (pos.x - berthCenter[0]) ** 2 +
      (pos.z - berthCenter[2]) ** 2
    )

    if (towingUnlocked && dist < berthRadius && speed < 1.0) {
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
    }
  }, [operationMode, id])

  if (operationMode !== 'tugboat') return null

  return (
    <>
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

          {isDocked && (
            <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[berthRadius - 0.5, berthRadius, 64]} />
              <meshBasicMaterial color="#00ff88" transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      </RigidBody>

      {/* Tow-line visual rope — rendered at scene level (world space) */}
      <TowLineVisual shipRbRef={rbRef} shipId={id} />
    </>
  )
}

// =============================================================================
// TOW LINE VISUAL
// Renders a rope between the towed ship's stern and the tugboat bow.
// Updates BufferGeometry vertices directly inside useFrame — zero React cost.
// =============================================================================

function TowLineVisual({
  shipRbRef,
  shipId,
}: {
  shipRbRef: RefObject<RapierRigidBody>
  shipId: string
}) {
  const posArray = useMemo(() => new Float32Array(6), [])
  const attrRef = useRef<THREE.BufferAttribute>(null)

  useFrame(() => {
    if (!attrRef.current || !shipRbRef.current) return
    const { towLineAttached, activeTowedShipId } = useGameStore.getState()
    if (!towLineAttached || activeTowedShipId !== shipId) return

    const s = shipRbRef.current.translation()
    const t = tugboatWakeState.position

    posArray[0] = s.x;  posArray[1] = s.y + 0.5;  posArray[2] = s.z
    posArray[3] = t.x;  posArray[4] = t.y + 0.5;  posArray[5] = t.z
    attrRef.current.needsUpdate = true
  })

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          ref={attrRef}
          attach="attributes-position"
          array={posArray}
          count={2}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#cc8800" />
    </line>
  )
}
