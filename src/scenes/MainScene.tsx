import React, { useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Environment, Stars, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
import Water from './Water'
import Crane from './Crane'
import Ship from './Ship'
import Dock from './Dock'
import { useGameStore } from '../store/useGameStore'
import { useLightingSystem } from '../systems/lightingSystem'

/**
 * MainScene — assembles all 3-D objects for the night harbour.
 * Includes: water, quay, crane, ship(s), ambient/directional lighting.
 */
export default function MainScene() {
  const cameraMode = useGameStore((s) => s.cameraMode)
  const currentShip = useGameStore((s) => s.currentShip)
  const phase = useGameStore((s) => s.phase)

  // Leva controls for scene-wide tweaks
  const { windStrength, ambientIntensity } = useControls('Scene', {
    windStrength: { value: 3, min: 0, max: 20, step: 0.5, label: 'Wind (m/s)' },
    ambientIntensity: { value: 0.08, min: 0, max: 0.5, step: 0.01, label: 'Ambient' },
  })

  // Sync wind to store
  const setWindStore = useGameStore((s) => s.windStrength)

  // Lighting system drives dynamic ship lights
  useLightingSystem()

  return (
    <>
      {/* ── Cameras ─────────────────────────────────────────────────── */}
      {cameraMode === 'GOD_MODE' && (
        <>
          <PerspectiveCamera makeDefault position={[0, 60, 120]} fov={55} />
          <OrbitControls
            target={[0, 0, 0]}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={20}
            maxDistance={300}
          />
        </>
      )}
      {cameraMode === 'CRANE_CAB' && (
        <PerspectiveCamera makeDefault position={[-12, 55, 0]} fov={80} />
      )}
      {cameraMode === 'HOOK_CAM' && (
        <PerspectiveCamera makeDefault position={[0, 20, 0]} fov={90} />
      )}

      {/* ── Lighting ────────────────────────────────────────────────── */}
      <ambientLight intensity={ambientIntensity} color="#1a3a5c" />
      <directionalLight
        position={[-40, 80, 40]}
        intensity={0.3}
        color="#4a6fa5"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={300}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      {/* Dock spotlights */}
      <spotLight
        position={[-20, 30, 10]}
        angle={0.4}
        penumbra={0.6}
        intensity={2}
        color="#ffa040"
        castShadow
      />
      <spotLight
        position={[20, 30, 10]}
        angle={0.4}
        penumbra={0.6}
        intensity={2}
        color="#ffa040"
        castShadow
      />

      {/* ── Environment ─────────────────────────────────────────────── */}
      <Stars radius={300} depth={60} count={3000} factor={4} fade speed={0.5} />
      <fog attach="fog" args={['#060d18', 80, 400]} />

      {/* ── Scene objects ───────────────────────────────────────────── */}
      <Water windStrength={windStrength} />
      <Dock />
      <Crane />
      {(phase === 'SHIP_DOCKED' || phase === 'UPGRADING' || phase === 'LIGHT_SHOW') &&
        currentShip && <Ship ship={currentShip} />}

      {/* "Ship arriving" placeholder — animated approach */}
      {phase === 'SHIP_ARRIVING' && <ArrivingShipIndicator />}
    </>
  )
}

/** Flashing beacon shown while ship is arriving */
function ArrivingShipIndicator() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.z = 150 - clock.getElapsedTime() * 30
      ;(ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        Math.abs(Math.sin(clock.getElapsedTime() * 4)) * 2
    }
  })
  return (
    <mesh ref={ref} position={[0, 5, 150]} castShadow>
      <boxGeometry args={[40, 10, 80]} />
      <meshStandardMaterial color="#1a3a6c" emissive="#00aaff" emissiveIntensity={1} />
    </mesh>
  )
}
