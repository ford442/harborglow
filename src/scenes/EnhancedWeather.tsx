// =============================================================================
// ENHANCED WEATHER SYSTEM - HarborGlow
// Intensity-scaled rain, lightning synced to StormSystem, mist banks.
// =============================================================================

import { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { stormSystem } from '../systems/StormSystem'

// =============================================================================
// PROPS
// =============================================================================

interface EnhancedWeatherProps {
  enabled?: boolean
}

// =============================================================================
// CAMERA LENS RAIN
// =============================================================================

function CameraLensRain({ intensity = 0.5 }: { intensity?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  const rainTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 512, 512)

    const dropCount = Math.floor(80)
    for (let i = 0; i < dropCount; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const size = 4 + Math.random() * 16

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
      gradient.addColorStop(0, 'rgba(200, 220, 255, 0.9)')
      gradient.addColorStop(0.3, 'rgba(150, 180, 220, 0.5)')
      gradient.addColorStop(0.7, 'rgba(100, 140, 200, 0.2)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.2, 0, Math.PI * 2)
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [])

  useFrame(() => {
    if (!meshRef.current) return
    meshRef.current.position.copy(camera.position)
    meshRef.current.quaternion.copy(camera.quaternion)
    meshRef.current.translateZ(-0.5)
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2.2, 2.2]} />
      <meshBasicMaterial
        map={rainTexture}
        transparent
        opacity={intensity * 0.7}
        depthTest={false}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
}

// =============================================================================
// LIGHTNING FLASH
// =============================================================================

function LightningFlash({ active, intensity = 1 }: { active: boolean; intensity?: number }) {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const flashRef = useRef(0)

  useFrame((_, delta) => {
    if (!lightRef.current || !ambientRef.current) return

    if (active) {
      flashRef.current = intensity * (0.6 + Math.random() * 0.4)
      lightRef.current.intensity = flashRef.current * 8
      ambientRef.current.intensity = flashRef.current * 0.8
    } else {
      lightRef.current.intensity *= 0.2 ** delta
      ambientRef.current.intensity *= 0.2 ** delta
    }
  })

  return (
    <>
      <directionalLight
        ref={lightRef}
        intensity={0}
        color="#d0e8ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <ambientLight ref={ambientRef} intensity={0} color="#c8dff8" />
    </>
  )
}

// =============================================================================
// WIND-SWEPT RAIN PARTICLES
// =============================================================================

const MAX_RAIN_PARTICLES = 6000

function WindSweptRain({
  intensity = 1,
  windAngle = 0,
  stormIntensity = 0,
}: {
  intensity?: number
  windAngle?: number
  stormIntensity?: number
}) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(MAX_RAIN_PARTICLES * 3)
    const vel = new Float32Array(MAX_RAIN_PARTICLES * 3)

    for (let i = 0; i < MAX_RAIN_PARTICLES; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200
      pos[i * 3 + 1] = Math.random() * 120
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200

      const windStrength = 0.5 + Math.random() * 0.5
      vel[i * 3] = Math.cos(windAngle) * windStrength
      vel[i * 3 + 1] = -3 - Math.random() * 4
      vel[i * 3 + 2] = Math.sin(windAngle) * windStrength
    }

    return { positions: pos, velocities: vel }
  }, [windAngle])

  useFrame((_, delta) => {
    if (!pointsRef.current?.geometry?.attributes?.position) return

    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array
    const speedMult = 1 + stormIntensity * 1.5

    for (let i = 0; i < MAX_RAIN_PARTICLES; i++) {
      posArray[i * 3] += velocities[i * 3] * delta * 10 * speedMult
      posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta * 10 * speedMult
      posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta * 10 * speedMult

      if (posArray[i * 3 + 1] < -5) {
        posArray[i * 3] = (Math.random() - 0.5) * 200
        posArray[i * 3 + 1] = 80 + Math.random() * 40
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 200
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  const activeCount = Math.floor(MAX_RAIN_PARTICLES * intensity)

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={activeCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#9ab8d8"
        size={0.25 + stormIntensity * 0.15}
        transparent
        opacity={0.5 + stormIntensity * 0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// =============================================================================
// MIST / FOG BANKS
// =============================================================================

function MistBanks({ intensity = 0.5 }: { intensity?: number }) {
  const mistRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!mistRef.current) return
    mistRef.current.rotation.y = state.clock.elapsedTime * 0.02
    const material = mistRef.current.material as THREE.MeshBasicMaterial
    material.opacity = intensity * (0.08 + Math.sin(state.clock.elapsedTime * 0.5) * 0.04)
  })

  return (
    <mesh ref={mistRef} position={[0, 4, 0]}>
      <boxGeometry args={[180, 12, 180]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }
          void main() {
            float n = noise(vUv * 10.0);
            float alpha = n * 0.15 * (1.0 - abs(vUv.y - 0.5) * 2.0);
            gl_FragColor = vec4(0.85, 0.92, 1.0, alpha);
          }
        `}
      />
    </mesh>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function EnhancedWeather({ enabled = true }: EnhancedWeatherProps) {
  const weather = useGameStore((state) => state.weather)
  const stormIntensity = useGameStore((state) => state.stormIntensity)
  const stormState = stormSystem.getState()

  const [lightningActive, setLightningActive] = useState(false)

  // Sync lightning to StormSystem's lightningFlash flag
  useFrame(() => {
    const flash = stormSystem.isLightningFlash()
    if (flash) {
      setLightningActive(true)
      setTimeout(() => setLightningActive(false), 120)
    }
  })

  if (!enabled) return null

  // Base weather config scaled by storm intensity when in storm mode
  const isStorm = weather === 'storm'
  const effectiveIntensity = isStorm ? Math.max(stormIntensity, 0.1) : 0

  const rainIntensity = isStorm ? effectiveIntensity : weather === 'rain' ? 0.4 : 0
  const mistIntensity = isStorm ? effectiveIntensity * 0.6 : weather === 'fog' ? 0.7 : 0
  const lensIntensity = isStorm ? effectiveIntensity * 0.9 : weather === 'rain' ? 0.3 : 0
  const windAngle = isStorm ? stormState.windDirection : 0.2

  if (!isStorm && weather !== 'rain' && weather !== 'fog') return null

  return (
    <>
      {/* Wind-swept rain particles — intensity scales count and speed */}
      {rainIntensity > 0 && (
        <WindSweptRain
          intensity={rainIntensity}
          windAngle={windAngle}
          stormIntensity={effectiveIntensity}
        />
      )}

      {/* Mist banks */}
      {mistIntensity > 0 && <MistBanks intensity={mistIntensity} />}

      {/* Camera lens raindrops */}
      {lensIntensity > 0 && <CameraLensRain intensity={lensIntensity} />}

      {/* Lightning — synced to StormSystem */}
      {isStorm && (
        <LightningFlash active={lightningActive} intensity={effectiveIntensity} />
      )}
    </>
  )
}
