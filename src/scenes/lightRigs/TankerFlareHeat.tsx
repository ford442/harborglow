// =============================================================================
// TANKER FLARE HEAT — heat shimmer at flare stack tips on lit tankers
// =============================================================================

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore, type Ship } from '../../store/useGameStore'
import { getAudioAnalysisData } from '../../systems/audioVisualSync'
import { lightingSystem } from '../../systems/lightingSystem'
import { HeatShimmer } from './RigPolishComponents'
import { getRigPolishScales } from './rigPolish'

function isShipFullyLit(
  ship: Ship,
  installedUpgrades: Array<{ shipId: string; partName: string }>
): boolean {
  if (ship.version === '2.0') return true
  const installed = installedUpgrades.filter((u) => u.shipId === ship.id).length
  return installed >= Math.max(1, ship.attachmentPoints.length)
}

function flareTipPosition(ship: Ship): [number, number, number] {
  return [
    ship.position[0] - 2.5,
    ship.position[1] + 10.5,
    ship.position[2] - ship.length * 0.22,
  ]
}

function TankerFlareHeatStack({ ship }: { ship: Ship }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!groupRef.current) return
    const audio = getAudioAnalysisData()
    const musicActive = audio.energy > 0.08 || lightingSystem.isShowActive()
    groupRef.current.visible = musicActive
  })

  return (
    <group ref={groupRef} position={flareTipPosition(ship)}>
      <HeatShimmer scale={1.35} intensity={0.85} />
    </group>
  )
}

export default function TankerFlareHeat() {
  const ships = useGameStore((s) => s.ships)
  const installedUpgrades = useGameStore((s) => s.installedUpgrades)

  const hotTankers = ships.filter(
    (s) => s.type === 'tanker' && isShipFullyLit(s, installedUpgrades)
  )

  if (hotTankers.length === 0 || getRigPolishScales().shimmer <= 0) return null

  return (
    <group name="tanker-flare-heat">
      {hotTankers.map((ship) => (
        <TankerFlareHeatStack key={`flare-heat-${ship.id}`} ship={ship} />
      ))}
    </group>
  )
}
