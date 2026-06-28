// =============================================================================
// LIGHT FLARE SYSTEM — collects bright harbor sources and renders lens flares
// Tuning lives in Leva → Visual Polish → Flares & Glow (lookDevControls.ts)
// =============================================================================

import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore, type Ship } from '../store/useGameStore'
import { weatherSystem } from '../systems/weatherSystem'
import { lightingSystem } from '../systems/lightingSystem'
import { getAudioAnalysisData } from '../systems/audioVisualSync'
import { getLookDevSettings } from '../utils/lookDevControls'
import { FLARE_MAX_BY_QUALITY, FLARE_QUALITY_SCALE } from '../systems/lightFlareSettings'
import { getSunPosition } from './mainScene/MainSceneHelpers'
import LightFlare, { type FlarePreset } from './LightFlare'
import { getRigFlares } from './lightRigs/rigPolish'

const DOCK_LIGHT_POSITIONS: [number, number, number][] = [
  [-20, 8, -8],
  [0, 8, -8],
  [20, 8, -8],
  [-35, 2.5, -4],
  [0, 2.5, -4],
  [35, 2.5, -4],
]

interface FlareSource {
  id: string
  position: [number, number, number]
  color: string
  preset: FlarePreset
  brightness: number
  priority: number
}

function shipFlarePosition(ship: Ship, yOffset: number): [number, number, number] {
  return [ship.position[0], ship.position[1] + yOffset, ship.position[2]]
}

function tankerStackPosition(ship: Ship): [number, number, number] {
  return [
    ship.position[0] - 2.5,
    ship.position[1] + 9.5,
    ship.position[2] - ship.length * 0.22,
  ]
}

function isShipFullyLit(
  ship: Ship,
  installedUpgrades: Array<{ shipId: string; partName: string }>
): boolean {
  if (ship.version === '2.0') return true
  const installed = installedUpgrades.filter((u) => u.shipId === ship.id).length
  return installed >= Math.max(1, ship.attachmentPoints.length)
}

function collectFlareSources(args: {
  isNight: boolean
  timeOfDay: number
  lightIntensity: number
  ships: Ship[]
  currentShipId: string | null
  installedUpgrades: Array<{ shipId: string; partName: string }>
  spreaderPos: { x: number; y: number; z: number }
  weatherLensFlare: boolean
  musicActive: boolean
  beatPulse: number
}): FlareSource[] {
  const {
    isNight,
    timeOfDay,
    lightIntensity,
    ships,
    currentShipId,
    installedUpgrades,
    spreaderPos,
    weatherLensFlare,
    musicActive,
    beatPulse,
  } = args

  const sources: FlareSource[] = []
  const pulse = 1 + beatPulse * 0.35

  if (weatherLensFlare && !isNight) {
    const [sx, sy, sz] = getSunPosition(timeOfDay)
    const far = 220
    const len = Math.hypot(sx, sy, sz) || 1
    sources.push({
      id: 'sun',
      position: [(sx / len) * far, Math.max(8, (sy / len) * far), (sz / len) * far],
      color: '#ffd080',
      preset: 'sun',
      brightness: 1.15,
      priority: 120,
    })
  }

  if (isNight) {
    const dockScale = Math.max(0.2, lightIntensity) * 0.42
    DOCK_LIGHT_POSITIONS.forEach((pos, i) => {
      sources.push({
        id: `dock-${i}`,
        position: pos,
        color: i >= 3 ? '#ffaa44' : '#ffcc66',
        preset: 'warm',
        brightness: dockScale * (i >= 3 ? 0.85 : 1),
        priority: 38 - i,
      })
    })

    sources.push({
      id: 'crane-spreader',
      position: [spreaderPos.x, spreaderPos.y + 0.55, spreaderPos.z],
      color: '#ffd79e',
      preset: 'warm',
      brightness: 0.28 * dockScale * pulse,
      priority: 34,
    })
  }

  for (const ship of ships) {
    const fullyLit = isShipFullyLit(ship, installedUpgrades)
    const upgradeCount = installedUpgrades.filter((u) => u.shipId === ship.id).length
    const progress = upgradeCount / Math.max(1, ship.attachmentPoints.length)
    const isCurrent = ship.id === currentShipId

    if (fullyLit || (musicActive && progress >= 1)) {
      sources.push({
        id: `ship-glow-${ship.id}`,
        position: shipFlarePosition(ship, 8.5),
        color: ship.type === 'tanker' ? '#ff9a55' : '#8fdcff',
        preset: fullyLit ? 'starburst' : musicActive ? 'starburst' : 'cool',
        brightness: (0.55 + (musicActive ? 0.45 : 0.2)) * pulse,
        priority: fullyLit ? 90 : 70,
      })
    } else if (isCurrent && progress > 0.35) {
      sources.push({
        id: `ship-partial-${ship.id}`,
        position: shipFlarePosition(ship, 7),
        color: '#7fc9ff',
        preset: 'cool',
        brightness: 0.22 + progress * 0.25,
        priority: 50,
      })
    }

    if (ship.type === 'tanker' && (fullyLit || progress > 0.5 || isCurrent)) {
      sources.push({
        id: `tanker-stack-${ship.id}`,
        position: tankerStackPosition(ship),
        color: '#ff7d38',
        preset: musicActive ? 'starburst' : 'warm',
        brightness: (0.45 + progress * 0.55) * pulse * (musicActive ? 1.2 : 1),
        priority: 95,
      })
    }
  }

  return sources.sort((a, b) => b.priority - a.priority)
}

function RigFlareFollower({
  id,
  qualityScale,
}: {
  id: string
  qualityScale: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const brightnessRef = useRef(0)
  const colorRef = useRef('#ffffff')
  const lookDev = getLookDevSettings()

  useFrame(() => {
    const entry = getRigFlares().find((f) => f.id === id)
    if (!entry || !groupRef.current) {
      brightnessRef.current = 0
      return
    }
    groupRef.current.position.copy(entry.position)
    colorRef.current = entry.color
    brightnessRef.current = entry.brightness * qualityScale * lookDev.flareIntensity
  })

  return (
    <group ref={groupRef}>
      <LightFlare
        position={[0, 0, 0]}
        color={colorRef.current}
        preset="cool"
        brightness={0}
        brightnessRef={brightnessRef}
      />
    </group>
  )
}

function RigFlareSources({ qualityScale }: { qualityScale: number }) {
  const lookDev = getLookDevSettings()
  const [ids, setIds] = useState<string[]>([])
  const idsRef = useRef<string[]>([])

  useFrame(() => {
    const next = getRigFlares()
      .filter((f) => f.brightness > 0.02)
      .sort((a, b) => b.priority - a.priority)
      .map((f) => f.id)

    if (
      next.length !== idsRef.current.length ||
      next.some((id, i) => id !== idsRef.current[i])
    ) {
      idsRef.current = next
      setIds(next)
    }
  })

  if (!lookDev.flaresEnabled || ids.length === 0) return null

  return (
    <>
      {ids.map((id) => (
        <RigFlareFollower key={id} id={id} qualityScale={qualityScale} />
      ))}
    </>
  )
}

export default function LightFlareSystem() {
  const lookDev = getLookDevSettings()

  const isNight = useGameStore((s) => s.isNight)
  const timeOfDay = useGameStore((s) => s.timeOfDay)
  const lightIntensity = useGameStore((s) => s.lightIntensity)
  const ships = useGameStore((s) => s.ships)
  const currentShipId = useGameStore((s) => s.currentShipId)
  const installedUpgrades = useGameStore((s) => s.installedUpgrades)
  const spreaderPos = useGameStore((s) => s.spreaderPos)
  const qualityPreset = useGameStore((s) => s.qualityPreset)

  const weatherLensFlare = weatherSystem.getWeatherEffects().lensFlare
  const beatPulse = lightingSystem.getBeatPulse()
  const audio = getAudioAnalysisData()
  const musicActive = audio.energy > 0.12 || audio.beat

  const maxFlares = FLARE_MAX_BY_QUALITY[qualityPreset] ?? 4
  const qualityScale = FLARE_QUALITY_SCALE[qualityPreset] ?? 1

  const activeFlares = useMemo(() => {
    if (!lookDev.flaresEnabled) return []

    const all = collectFlareSources({
      isNight,
      timeOfDay,
      lightIntensity,
      ships,
      currentShipId,
      installedUpgrades,
      spreaderPos,
      weatherLensFlare,
      musicActive,
      beatPulse,
    })

    return all.slice(0, maxFlares).map((src) => ({
      ...src,
      brightness: src.brightness * qualityScale * lookDev.flareIntensity,
    }))
  }, [
    lookDev.flaresEnabled,
    lookDev.flareIntensity,
    isNight,
    timeOfDay,
    lightIntensity,
    ships,
    currentShipId,
    installedUpgrades,
    spreaderPos,
    weatherLensFlare,
    musicActive,
    beatPulse,
    maxFlares,
    qualityScale,
  ])

  if (!lookDev.flaresEnabled || activeFlares.length === 0) return null

  return (
    <group name="light-flare-system">
      {activeFlares.map((flare) => (
        <LightFlare
          key={flare.id}
          position={flare.position}
          color={flare.color}
          preset={flare.preset}
          brightness={flare.brightness}
        />
      ))}
      <RigFlareSources qualityScale={qualityScale} />
    </group>
  )
}
