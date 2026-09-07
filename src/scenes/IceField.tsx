// =============================================================================
// ICE FIELD — instanced floes + Rapier kinematic corridor colliders
// =============================================================================

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useGameStore } from '../store/useGameStore'
import {
  iceFieldSystem,
  ICE_CELL,
  ICE_MAX_CORRIDOR_BODIES,
} from '../systems/ice/IceFieldSystem'

const dummy = new THREE.Object3D()
const iceColor = new THREE.Color('#d8eefc')
const MAX_FLOES = ICE_CELL * 12 * 18

export default function IceField() {
  const active = useGameStore((s) => s.activeMission?.type === 'ice-escort' && s.activeMission.status === 'active')
  const clearanceBucket = useGameStore((s) => Math.round((s.activeMission?.channelClearance ?? 0) * 24))
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const generation = iceFieldSystem.getGeneration()

  const colliderCells = useMemo(() => {
    if (!active) return []
    return iceFieldSystem.getCorridorColliders()
  }, [active, generation, clearanceBucket])

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh || !active) return
    const floes = iceFieldSystem.getVisualFloes()
    const count = Math.min(floes.length, MAX_FLOES)
    for (let i = 0; i < count; i++) {
      const cell = floes[i]
      const h = 0.25 + cell.health * 0.9
      dummy.position.set(cell.x, h * 0.5, cell.z)
      dummy.scale.set(ICE_CELL * 0.92, h, ICE_CELL * 0.92)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    for (let i = count; i < mesh.count; i++) {
      dummy.position.set(0, -40, 0)
      dummy.scale.set(0.01, 0.01, 0.01)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  if (!active) return null

  const half = ICE_CELL * 0.46

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_FLOES]} frustumCulled={false} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={iceColor} roughness={0.35} metalness={0.05} />
      </instancedMesh>
      {colliderCells.slice(0, ICE_MAX_CORRIDOR_BODIES).map((cell) => (
        <RigidBody
          key={`${generation}-${cell.col}-${cell.row}`}
          type="kinematicPosition"
          position={[cell.x, 0.6, cell.z]}
          colliders={false}
          friction={0.9}
        >
          <CuboidCollider args={[half, 0.55, half]} />
        </RigidBody>
      ))}
    </>
  )
}
