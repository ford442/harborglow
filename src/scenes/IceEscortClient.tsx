// =============================================================================
// ICE ESCORT CLIENT — kinematic hull that follows IceFieldSystem transit
// =============================================================================

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ProceduralShip } from './ProceduralShip'
import { iceFieldSystem } from '../systems/ice/IceFieldSystem'
import { useGameStore } from '../store/useGameStore'

export default function IceEscortClient() {
  const groupRef = useRef<THREE.Group>(null)
  const active = useGameStore((s) => s.activeMission?.type === 'ice-escort')

  useFrame(() => {
    if (!groupRef.current || !iceFieldSystem.isActive()) return
    const [x, y, z] = iceFieldSystem.getClientPosition()
    groupRef.current.position.set(x, y, z)
    groupRef.current.rotation.y = iceFieldSystem.getClientHeading()
  })

  if (!active) return null

  const spawn = iceFieldSystem.getClientPosition()

  return (
    <group ref={groupRef} position={spawn}>
      <ProceduralShip blueprintId="container" position={[0, 0, 0]} />
    </group>
  )
}
