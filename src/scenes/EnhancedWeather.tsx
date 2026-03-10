import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { useAudioVisualSync } from '../systems/audioVisualSync'

// =============================================================================
// PHASE 9.3: ENHANCED WEATHER SYSTEM
// Rain droplets on camera lens, lightning with shadows, wind effects
// =============================================================================

interface EnhancedWeatherProps {
  enabled?: boolean
}

// Rain droplets on camera lens effect
function CameraLensRain({ intensity = 0.5 }: { intensity?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  
  // Generate raindrop texture
  const rainTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    
    // Clear with transparency
    ctx.clearRect(0, 0, 512, 512)
    
    // Draw random raindrops
    const dropCount = Math.floor(50 * intensity)
    for (let i = 0; i < dropCount; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const size = 5 + Math.random() * 20
      
      // Draw drop shadow/depth
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
      gradient.addColorStop(0, 'rgba(200, 220, 255, 0.9)')
      gradient.addColorStop(0.3, 'rgba(150, 180, 220, 0.5)')
      gradient.addColorStop(0.7, 'rgba(100, 140, 200, 0.2)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
      
      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.2, 0, Math.PI * 2)
      ctx.fill()
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [intensity])
  
  useFrame(() => {
    if (!meshRef.current) return
    
    // Keep rain overlay in front of camera
    meshRef.current.position.copy(camera.position)
    meshRef.current.quaternion.copy(camera.quaternion)
    meshRef.current.translateZ(-0.5) // Just in front of near plane
  })
  
  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial
        map={rainTexture}
        transparent
        opacity={0.6}
        depthTest={false}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
}

// Lightning flash effect
function LightningFlash({ active, intensity = 1 }: { active: boolean, intensity?: number }) {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  
  useEffect(() => {
    if (active && lightRef.current) {
      // Random lightning direction
      const angle = Math.random() * Math.PI * 2
      const distance = 50 + Math.random() * 50
      lightRef.current.position.set(
        Math.cos(angle) * distance,
        100 + Math.random() * 50,
        Math.sin(angle) * distance
      )
    }
  }, [active])
  
  useFrame(() => {
    if (!lightRef.current || !ambientRef.current) return
    
    if (active) {
      // Flash on with decay
      const flashIntensity = intensity * (0.5 + Math.random() * 0.5)
      lightRef.current.intensity = flashIntensity * 5
      ambientRef.current.intensity = flashIntensity * 0.5
    } else {
      // Quick fade out
      lightRef.current.intensity *= 0.3
      ambientRef.current.intensity *= 0.3
    }
  })
  
  return (
    <>
      <directionalLight
        ref={lightRef}
        intensity={0}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <ambientLight ref={ambientRef} intensity={0} color="#e0f0ff" />
    </>
  )
}

// Wind-swept rain particles
function WindSweptRain({ intensity = 1, windAngle = 0 }: { intensity?: number, windAngle?: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const count = Math.floor(2000 * intensity)
  
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Random positions in large volume
      pos[i * 3] = (Math.random() - 0.5) * 200
      pos[i * 3 + 1] = Math.random() * 100
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200
      
      // Velocities with wind angle
      const windStrength = 0.5 + Math.random() * 0.5
      vel[i * 3] = Math.cos(windAngle) * windStrength
      vel[i * 3 + 1] = -2 - Math.random() * 3 // Falling down
      vel[i * 3 + 2] = Math.sin(windAngle) * windStrength
    }
    
    return { positions: pos, velocities: vel }
  }, [count, windAngle])
  
  useFrame((_, delta) => {
    if (!pointsRef.current) return
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < count; i++) {
      // Update positions
      positions[i * 3] += velocities[i * 3] * delta * 10
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 10
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 10
      
      // Reset if below ground
      if (positions[i * 3 + 1] < -5) {
        positions[i * 3] = (Math.random() - 0.5) * 200
        positions[i * 3 + 1] = 100
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#a0c0e0"
        size={0.3}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Mist/fog bank effect
function MistBanks({ intensity: _intensity = 0.5 }: { intensity?: number }) {
  const mistRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!mistRef.current) return
    
    // Slowly drift
    mistRef.current.rotation.y = state.clock.elapsedTime * 0.02
    
    // Pulse opacity with time
    const material = mistRef.current.material as THREE.MeshBasicMaterial
    material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05
  })
  
  return (
    <mesh ref={mistRef} position={[0, 5, 0]}>
      <boxGeometry args={[150, 10, 150]} />
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
            gl_FragColor = vec4(0.9, 0.95, 1.0, alpha);
          }
        `}
      />
    </mesh>
  )
}

// Main enhanced weather component
export default function EnhancedWeather({ enabled = true }: EnhancedWeatherProps) {
  const weather = useGameStore(state => state.weather)
  const { audioData } = useAudioVisualSync()
  
  const [lightningActive, setLightningActive] = useState(false)
  const lastLightningRef = useRef(0)
  
  // Trigger lightning during storms, potentially synced to audio
  useFrame((state) => {
    if (weather !== 'storm') return
    
    const now = state.clock.elapsedTime
    
    // Random lightning, more frequent during beats
    const baseChance = 0.01
    const beatBoost = audioData.beat ? 0.05 : 0
    const lightningChance = baseChance + beatBoost
    
    if (now - lastLightningRef.current > 2 && Math.random() < lightningChance) {
      setLightningActive(true)
      lastLightningRef.current = now
      
      setTimeout(() => setLightningActive(false), 150)
    }
  })
  
  if (!enabled) return null
  
  const weatherConfig = {
    clear: { rain: 0, mist: 0, wind: 0, lensDrops: 0 },
    rain: { rain: 0.5, mist: 0.3, wind: 0.2, lensDrops: 0.4 },
    fog: { rain: 0, mist: 0.8, wind: 0.1, lensDrops: 0.2 },
    storm: { rain: 1.0, mist: 0.5, wind: 0.8, lensDrops: 0.8 }
  }
  
  const config = weatherConfig[weather] || weatherConfig.clear
  
  if (weather === 'clear') return null
  
  return (
    <>
      {/* Wind-swept rain particles */}
      {config.rain > 0 && (
        <WindSweptRain 
          intensity={config.rain} 
          windAngle={weather === 'storm' ? 0.5 : 0.1}
        />
      )}
      
      {/* Mist banks */}
      {config.mist > 0 && (
        <MistBanks intensity={config.mist} />
      )}
      
      {/* Camera lens raindrops */}
      {config.lensDrops > 0 && (
        <CameraLensRain intensity={config.lensDrops} />
      )}
      
      {/* Lightning */}
      {weather === 'storm' && (
        <LightningFlash 
          active={lightningActive} 
          intensity={audioData.beat ? audioData.beatIntensity : 1}
        />
      )}
    </>
  )
}
