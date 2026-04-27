// =============================================================================
// TUGBOAT TARGET SHIP - HarborGlow Tugboat Mode
// Dynamic physics ship that can be pushed by the tugboat into berths
// =============================================================================

import { useRef, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useGameStore, ShipType } from '../store/useGameStore'
import { ProceduralShip } from './ProceduralShip'
import { stormSystem } from '../systems/StormSystem'

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

  // Berth center as Vector3 for distance checks
  const berthVec = useMemo(
    () => new THREE.Vector3(berthCenter[0], berthCenter[1], berthCenter[2]),
    [berthCenter]
  )

  useFrame((state, delta) => {
    if (!rbRef.current || !groupRef.current) return
    if (operationMode !== 'tugboat') return
    if (hasDockedRef.current) return

    const rb = rbRef.current

    // Apply wind force
    const windForce = stormSystem.getWindForce()
    if (windForce.lengthSq() > 0) {
      rb.applyImpulse(
        { x: windForce.x * delta, y: 0, z: windForce.z * delta },
        true
      )
    }

    // Bob on water
    const bob = Math.sin(state.clock.elapsedTime * 0.8 + startPosition[0]) * 0.03
    const pos = rb.translation()
    rb.setTranslation({ x: pos.x, y: startPosition[1] + bob, z: pos.z }, true)

    // Sync visual group
    groupRef.current.position.set(pos.x, startPosition[1] + bob, pos.z)
    const rot = rb.rotation()
    const heading = 2 * Math.atan2(rot.y, rot.w)
    groupRef.current.rotation.set(0, heading, 0)

    // Clamp max speed
    const vel = rb.linvel()
    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
    if (speed > 4) {
      const scale = 4 / speed
      rb.setLinvel({ x: vel.x * scale, y: vel.y, z: vel.z * scale }, true)
    }

    // Docking detection
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
    }
  }, [operationMode, id])

  if (operationMode !== 'tugboat') return null

  return (
    <RigidBody
      ref={rbRef}
      type="dynamic"
      mass={40}
      linearDamping={1.2}
      angularDamping={2.0}
      position={startPosition}
      rotation={[0, startRotation, 0]}
      enabledRotations={[false, true, false]}
      colliders="cuboid"
    >
      <group ref={groupRef}>
        <ProceduralShip blueprintId={shipType} version="1.0" />

        {/* Docking indicator ring (only visible when close) */}
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
