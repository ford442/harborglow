import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// HARBOR AMBIANCE
// Atmospheric effects when no ships are docked — fireflies, fog glow,
// and a lonely flickering dock light.
// =============================================================================

interface FireflyData {
  position: THREE.Vector3
  speed: number
  phase: number
  amplitude: number
}

export default function HarborAmbiance() {
  const ships = useGameStore(s => s.ships)
  const isNight = useGameStore(s => s.isNight)

  // ---------------------------------------------------------------------------
  // Fireflies
  // ---------------------------------------------------------------------------
  const fireflies = useMemo<FireflyData[]>(() => {
    const data: FireflyData[] = []
    const count = 18 // 15-20 range
    for (let i = 0; i < count; i++) {
      data.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 80, // x: -40 to 40
          2 + Math.random() * 6,      // y: 2 to 8
          (Math.random() - 0.5) * 20  // z: -10 to 10
        ),
        speed: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        amplitude: 0.5 + Math.random() * 1.5,
      })
    }
    return data
  }, [])

  const fireflyGroupRef = useRef<THREE.Group>(null)
  const fogGlowRef = useRef<THREE.Mesh>(null)
  const lonelyLightRef = useRef<THREE.PointLight>(null)

  // Shared geometry, individual materials so each firefly can pulse independently
  const fireflyGeometry = useMemo(() => new THREE.SphereGeometry(0.08, 6, 6), [])
  const fireflyMaterials = useMemo(() => {
    return fireflies.map(() =>
      new THREE.MeshBasicMaterial({
        color: '#ffffaa',
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
  }, [fireflies])

  const fogGeometry = useMemo(() => new THREE.SphereGeometry(60, 16, 16), [])
  const fogMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00d4aa',
        transparent: true,
        opacity: 0.02,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      }),
    []
  )

  const showFireflies = ships.length === 0
  const showFogGlow = ships.length === 0 && isNight
  const showLonelyLight = ships.length === 0

  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Firefly gentle sine-wave motion and pulsing opacity
    if (fireflyGroupRef.current && showFireflies) {
      fireflyGroupRef.current.children.forEach((child, i) => {
        const fly = fireflies[i]
        if (!fly) return
        const mesh = child as THREE.Mesh
        mesh.position.x = fly.position.x + Math.sin(time * fly.speed + fly.phase) * fly.amplitude
        mesh.position.y = fly.position.y + Math.cos(time * fly.speed * 0.7 + fly.phase) * fly.amplitude * 0.5
        mesh.position.z = fly.position.z + Math.sin(time * fly.speed * 0.5 + fly.phase + 1) * fly.amplitude * 0.3

        const pulse = 0.3 + (Math.sin(time * 2 + fly.phase) * 0.5 + 0.5) * 0.5
        const mat = fireflyMaterials[i]
        if (mat) mat.opacity = pulse
      })
    }

    // Harbor fog glow slow pulse
    if (fogGlowRef.current && showFogGlow) {
      const pulse = 0.015 + Math.sin(time * 0.4) * 0.005
      const mat = fogGlowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = pulse
    }

    // Lonely dock light subtle flicker (multi-sine for organic randomness)
    if (lonelyLightRef.current && showLonelyLight) {
      const flicker =
        0.8 +
        Math.sin(time * 3) * 0.1 +
        Math.sin(time * 7.3) * 0.05 +
        Math.sin(time * 13.7) * 0.03
      lonelyLightRef.current.intensity = flicker
    }
  })

  if (!showFireflies && !showFogGlow && !showLonelyLight) return null

  return (
    <group>
      {/* Firefly particles */}
      {showFireflies && (
        <group ref={fireflyGroupRef}>
          {fireflies.map((fly, i) => (
            <mesh
              key={i}
              position={fly.position}
              geometry={fireflyGeometry}
              material={fireflyMaterials[i]}
            />
          ))}
        </group>
      )}

      {/* Harbor fog glow */}
      {showFogGlow && (
        <mesh
          ref={fogGlowRef}
          position={[0, 5, 0]}
          geometry={fogGeometry}
          material={fogMaterial}
        />
      )}

      {/* Lonely dock light flicker */}
      {showLonelyLight && (
        <pointLight
          ref={lonelyLightRef}
          position={[5, 3, 5]}
          intensity={0.8}
          color="#ffcc88"
          distance={15}
          decay={2}
        />
      )}
    </group>
  )
}
