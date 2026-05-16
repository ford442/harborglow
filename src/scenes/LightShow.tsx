import { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import {
  LEDStripArray,
  MovingHeadSpotlight,
  LaserProjector,
  StrobeBank,
  NeonTubeArrangement,
  FogEffect
} from './lightRigs'

// =============================================================================
// SPECTACULAR LIGHT RIG SYSTEM - HarborGlow
// Light rigs composed from modular components with installation animation
// =============================================================================

interface LightShowProps {
  enabled?: boolean
}

export default function LightShow({ enabled = true }: LightShowProps) {
  const [installedRigs, setInstalledRigs] = useState<Set<string>>(new Set())
  const ships = useGameStore(state => state.ships)
  const isNight = useGameStore(state => state.isNight)
  const timeOfDay = useGameStore(state => state.timeOfDay)

  // Install rigs on upgraded ships
  useEffect(() => {
    const upgradedShips = ships.filter(s => s.version === '2.0')

    upgradedShips.forEach((ship, index) => {
      if (!installedRigs.has(ship.id)) {
        // Stagger installation
        setTimeout(() => {
          setInstalledRigs(prev => new Set([...prev, ship.id]))
        }, index * 2000)
      }
    })
  }, [ships, installedRigs])

  // Only show at night
  if (!enabled || (!isNight && timeOfDay > 8 && timeOfDay < 18)) return null

  const upgradedShips = ships.filter(s => s.version === '2.0')

  return (
    <group>
      {upgradedShips.map((ship) => {
        const isInstalled = installedRigs.has(ship.id)
        const basePos = ship.position

        return (
          <group key={ship.id}>
            {/* LED Strips along deck edges */}
            <LEDStripArray
              position={[basePos[0] - 10, basePos[1] + 8, basePos[2] + 5]}
              rotation={[0, 0, 0]}
              shipId={ship.id}
              installed={isInstalled}
            />
            <LEDStripArray
              position={[basePos[0] + 10, basePos[1] + 8, basePos[2] - 5]}
              rotation={[0, Math.PI, 0]}
              shipId={ship.id}
              installed={isInstalled}
            />

            {/* Moving head spotlights on corners */}
            <MovingHeadSpotlight
              position={[basePos[0] - 12, basePos[1] + 12, basePos[2] + 8]}
              shipId={ship.id}
              installed={isInstalled}
            />
            <MovingHeadSpotlight
              position={[basePos[0] + 12, basePos[1] + 12, basePos[2] - 8]}
              shipId={ship.id}
              installed={isInstalled}
            />

            {/* Laser projector on mast */}
            <LaserProjector
              position={[basePos[0], basePos[1] + 15, basePos[2]]}
              shipId={ship.id}
              installed={isInstalled}
            />

            {/* Strobe bank on bridge */}
            <StrobeBank
              position={[basePos[0] + 5, basePos[1] + 10, basePos[2]]}
              rotation={[0, Math.PI / 4, 0]}
              shipId={ship.id}
              installed={isInstalled}
            />

            {/* Neon tubes on superstructure */}
            <NeonTubeArrangement
              position={[basePos[0] - 5, basePos[1] + 6, basePos[2] + 3]}
              shipId={ship.id}
              installed={isInstalled}
            />
          </group>
        )
      })}

      {/* Fog for laser visibility */}
      <FogEffect />
    </group>
  )
}

// Hook for light show state
export function useLightShow() {
  const isNight = useGameStore(state => state.isNight)
  const ships = useGameStore(state => state.ships)
  const upgradedCount = ships.filter(s => s.version === '2.0').length

  return {
    isActive: isNight && upgradedCount > 0,
    upgradedCount,
    totalLights: upgradedCount * 6 // Approx lights per ship
  }
}
