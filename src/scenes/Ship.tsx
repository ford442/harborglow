import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Ship as ShipData } from '../store/useGameStore'
import { useGameStore } from '../store/useGameStore'

interface ShipProps {
  ship: ShipData
}

/**
 * Ship — procedural ship model built from Box + Cylinder primitives.
 * Different ship types produce different hull proportions.
 * Installed upgrades are visualised as glowing panels / projectors.
 */
export default function Ship({ ship }: ShipProps) {
  const groupRef = useRef<THREE.Group>(null)
  const phase = useGameStore((s) => s.phase)
  const musicPlaying = useGameStore((s) => s.musicPlaying)
  const musicBPM = useGameStore((s) => s.musicBPM)

  // Hull dimensions per ship type
  const dims = useMemo(() => {
    switch (ship.type) {
      case 'CRUISE_LINER':
        return { length: 80, beam: 18, draft: 8, decks: 5, color: '#e8e4d8' }
      case 'CONTAINER_VESSEL':
        return { length: 100, beam: 20, draft: 10, decks: 2, color: '#c0a060' }
      case 'OIL_TANKER':
        return { length: 90, beam: 16, draft: 12, decks: 1, color: '#555560' }
    }
  }, [ship.type])

  const hasRGB = ship.installedUpgrades.includes('RGB_MATRIX')
  const hasProjector = ship.installedUpgrades.includes('PROJECTOR_RIG')

  // Animate light show
  const rgbRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (hasRGB && rgbRef.current && lightRef.current) {
      const t = clock.getElapsedTime()
      const bps = musicBPM / 60
      const beat = Math.abs(Math.sin(t * bps * Math.PI))
      const hue = (t * 0.1) % 1
      const color = new THREE.Color().setHSL(hue, 1, 0.5)
      ;(rgbRef.current.material as THREE.MeshStandardMaterial).emissive = color
      ;(rgbRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.5 + beat * 2.5
      lightRef.current.color = color
      lightRef.current.intensity = 2 + beat * 10
    }
    // Gentle dock sway
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.3) * 0.008
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.15
    }
  })

  return (
    <group ref={groupRef} position={[30, 0, -10]}>
      {/* ── Hull ─────────────────────────────────────────────────── */}
      <mesh position={[0, dims.draft / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[dims.length, dims.draft, dims.beam]} />
        <meshStandardMaterial color={dims.color} roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Hull bottom (darker keel) */}
      <mesh position={[0, -1, 0]} castShadow>
        <boxGeometry args={[dims.length - 2, 2, dims.beam - 2]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.9} />
      </mesh>

      {/* ── Superstructure / decks ─────────────────────────────── */}
      {Array.from({ length: dims.decks }).map((_, i) => (
        <Deck
          key={i}
          index={i}
          baseHeight={dims.draft}
          shipType={ship.type}
          beam={dims.beam}
        />
      ))}

      {/* ── Ship name plate ────────────────────────────────────── */}
      <mesh position={[0, dims.draft / 2 + 1, dims.beam / 2 + 0.05]}>
        <planeGeometry args={[20, 2]} />
        <meshStandardMaterial color="#001133" emissive="#0055aa" emissiveIntensity={0.8} />
      </mesh>

      {/* ── Installed upgrades ─────────────────────────────────── */}
      {hasRGB && (
        <>
          {/* RGB Matrix panels along sides */}
          <mesh ref={rgbRef} position={[0, dims.draft + dims.decks * 3.5, dims.beam / 2 + 0.1]} castShadow>
            <planeGeometry args={[dims.length * 0.8, 3]} />
            <meshStandardMaterial
              color="#111"
              emissive="#00ff88"
              emissiveIntensity={1}
              side={THREE.FrontSide}
            />
          </mesh>
          <pointLight
            ref={lightRef}
            position={[0, dims.draft + dims.decks * 4, dims.beam / 2 + 2]}
            intensity={5}
            distance={80}
            color="#00ff88"
          />
        </>
      )}

      {hasProjector && (
        /* Projector rig on bow */
        <group position={[dims.length / 2 - 5, dims.draft + dims.decks * 3, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.4, 0.4, 3, 8]} />
            <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
          </mesh>
          <spotLight
            position={[0, 3, 0]}
            target-position={[0, -20, 40]}
            angle={0.25}
            penumbra={0.4}
            intensity={30}
            color="#ffffff"
            castShadow
          />
        </group>
      )}
    </group>
  )
}

/** One superstructure deck level */
function Deck({
  index,
  baseHeight,
  shipType,
  beam,
}: {
  index: number
  baseHeight: number
  shipType: string
  beam: number
}) {
  const deckHeight = 3.5
  const y = baseHeight + index * deckHeight + deckHeight / 2
  const shrink = index * 4

  let width = 30
  if (shipType === 'CONTAINER_VESSEL') width = 20
  if (shipType === 'OIL_TANKER') width = 15

  return (
    <mesh position={[0, y, 0]} castShadow receiveShadow>
      <boxGeometry args={[width - shrink, deckHeight - 0.2, beam - 1]} />
      <meshStandardMaterial color="#ccc8b8" roughness={0.6} metalness={0.15} />
    </mesh>
  )
}
