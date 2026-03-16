import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// GPU PARTICLE SYSTEM - HarborGlow
// Weather, ambient, and interactive particles using instanced rendering
// =============================================================================

interface ParticleSystemProps {
  maxParticles?: number
}

// Weather Particles Component
function WeatherParticles({ maxCount = 10000 }: { maxCount?: number }) {
  const rainRef = useRef<THREE.Points>(null)
  const fogRef = useRef<THREE.Points>(null)
  
  const weather = useGameStore(state => state.weather)
  
  // Rain particles
  const rainData = useMemo(() => {
    const positions = new Float32Array(maxCount * 3)
    const velocities = new Float32Array(maxCount * 3)
    const life = new Float32Array(maxCount)
    
    for (let i = 0; i < maxCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200
      positions[i * 3 + 1] = Math.random() * 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200
      
      velocities[i * 3] = (Math.random() - 0.5) * 5
      velocities[i * 3 + 1] = -20 - Math.random() * 10
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 5
      
      life[i] = Math.random()
    }
    
    return { positions, velocities, life }
  }, [maxCount])
  
  /* Snow particles - disabled until winter weather type is implemented
  const snowData = useMemo(() => {
    const positions = new Float32Array(maxCount * 3)
    const velocities = new Float32Array(maxCount * 3)
    const life = new Float32Array(maxCount)
    
    for (let i = 0; i < maxCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200
      positions[i * 3 + 1] = Math.random() * 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200
      
      velocities[i * 3] = 0
      velocities[i * 3 + 1] = -2 - Math.random() * 2
      velocities[i * 3 + 2] = 0
      
      life[i] = Math.random()
    }
    
    return { positions, velocities, life }
  }, [maxCount])
  */
  
  // Fog particles
  const fogData = useMemo(() => {
    const positions = new Float32Array(maxCount * 3)
    const velocities = new Float32Array(maxCount * 3)
    
    for (let i = 0; i < maxCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200
      positions[i * 3 + 1] = Math.random() * 10 - 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200
      
      velocities[i * 3] = 2 + Math.random() * 3
      velocities[i * 3 + 1] = 0
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 1
    }
    
    return { positions, velocities }
  }, [maxCount])
  
  // Animate rain
  useFrame((_, delta) => {
    if (weather !== 'rain' || !rainRef.current?.geometry?.attributes?.position) return

    const positions = rainRef.current.geometry.attributes.position.array as Float32Array
    const velocities = rainData.velocities

    for (let i = 0; i < maxCount; i++) {
      positions[i * 3] += velocities[i * 3] * delta
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta

      // Reset if below water
      if (positions[i * 3 + 1] < -2) {
        positions[i * 3] = (Math.random() - 0.5) * 200
        positions[i * 3 + 1] = 80 + Math.random() * 20
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200
      }
    }

    rainRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  // Animate snow - disabled until winter weather type is implemented
  /*
  useFrame((state, delta) => {
    if (weather !== 'snow' || !snowRef.current) return
    
    const positions = snowRef.current.geometry.attributes.position.array as Float32Array
    const velocities = snowData.velocities
    const time = state.clock.elapsedTime
    
    for (let i = 0; i < maxCount; i++) {
      // Turbulent motion
      positions[i * 3] += Math.sin(time * 2 + positions[i * 3 + 1] * 0.1) * 0.5 * delta
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta
      positions[i * 3 + 2] += Math.cos(time * 1.5 + positions[i * 3 + 1] * 0.1) * 0.3 * delta
      
      if (positions[i * 3 + 1] < -2) {
        positions[i * 3] = (Math.random() - 0.5) * 200
        positions[i * 3 + 1] = 80 + Math.random() * 20
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200
      }
    }
    
    snowRef.current.geometry.attributes.position.needsUpdate = true
  })
  */
  
  // Animate fog
  useFrame((state, delta) => {
    if (!fogRef.current?.geometry?.attributes?.position) return

    const positions = fogRef.current.geometry.attributes.position.array as Float32Array
    const velocities = fogData.velocities
    const time = state.clock.elapsedTime

    for (let i = 0; i < maxCount; i++) {
      const noise = Math.sin(positions[i * 3] * 0.1 + time * 0.05) * Math.cos(positions[i * 3 + 2] * 0.1 + time * 0.03)

      positions[i * 3] += (velocities[i * 3] + noise * 2) * delta
      positions[i * 3 + 2] += (velocities[i * 3 + 2] + noise) * delta

      // Wrap around
      if (positions[i * 3] > 100) positions[i * 3] = -100
      if (positions[i * 3] < -100) positions[i * 3] = 100
      if (positions[i * 3 + 2] > 100) positions[i * 3 + 2] = -100
      if (positions[i * 3 + 2] < -100) positions[i * 3 + 2] = 100
    }

    fogRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  return (
    <>
      {/* Rain */}
      {weather === 'rain' && (
        <points ref={rainRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={maxCount}
              array={rainData.positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.15}
            color="#88aaff"
            transparent
            opacity={0.6}
            sizeAttenuation
          />
        </points>
      )}
      
      {/* Snow - winter mode */}
      {/* Disabled until winter weather type is implemented */}
      {/* {weather === 'snow' && (
        <points ref={snowRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={maxCount}
              array={snowData.positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.4}
            color="#ffffff"
            transparent
            opacity={0.8}
            sizeAttenuation
          />
        </points>
      )} */}
      
      {/* Fog banks */}
      {weather === 'fog' && (
        <points ref={fogRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={maxCount}
              array={fogData.positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={8}
            color="#ccddff"
            transparent
            opacity={0.15}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </>
  )
}

// Ambient Particles - Fireflies, seagulls, smoke
function AmbientParticles() {
  const firefliesRef = useRef<THREE.Points>(null)
  const sparklesRef = useRef<THREE.Points>(null)
  const smokeRef = useRef<THREE.Points>(null)
  
  const isNight = useGameStore(state => state.isNight)
  const ships = useGameStore(state => state.ships)
  
  // Fireflies (only at night)
  const fireflyCount = 100
  const fireflyData = useMemo(() => {
    const positions = new Float32Array(fireflyCount * 3)
    const colors = new Float32Array(fireflyCount * 3)
    
    for (let i = 0; i < fireflyCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60
      positions[i * 3 + 1] = 2 + Math.random() * 8
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
      
      // Yellow-green glow
      colors[i * 3] = 0.8 + Math.random() * 0.2
      colors[i * 3 + 1] = 1.0
      colors[i * 3 + 2] = 0.2 + Math.random() * 0.3
    }
    
    return { positions, colors }
  }, [])
  
  // Water sparkles
  const sparkleCount = 500
  const sparkleData = useMemo(() => {
    const positions = new Float32Array(sparkleCount * 3)
    
    for (let i = 0; i < sparkleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 150
      positions[i * 3 + 1] = -2.4
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150
    }
    
    return { positions }
  }, [])
  
  // Smoke from ships
  const smokeCount = 200
  const smokeData = useMemo(() => {
    const positions = new Float32Array(smokeCount * 3)
    const velocities = new Float32Array(smokeCount * 3)
    const sizes = new Float32Array(smokeCount)
    const life = new Float32Array(smokeCount)
    
    for (let i = 0; i < smokeCount; i++) {
      // Spawn near ship funnels
      const shipIndex = Math.floor(Math.random() * Math.max(1, ships.length))
      const ship = ships[shipIndex]
      const baseX = ship ? ship.position[0] : 0
      const baseZ = ship ? ship.position[2] : 0
      
      positions[i * 3] = baseX + (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = 15 + Math.random() * 5
      positions[i * 3 + 2] = baseZ + (Math.random() - 0.5) * 10
      
      velocities[i * 3] = (Math.random() - 0.5) * 2
      velocities[i * 3 + 1] = 2 + Math.random() * 3
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2
      
      sizes[i] = 1 + Math.random() * 3
      life[i] = Math.random()
    }
    
    return { positions, velocities, sizes, life }
  }, [ships])
  
  // Animate fireflies
  useFrame((state) => {
    if (!isNight || !firefliesRef.current) return
    
    const positions = firefliesRef.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime
    
    for (let i = 0; i < fireflyCount; i++) {
      // Erratic movement
      const idx = i * 3
      positions[idx] += Math.sin(time * 3 + i) * 0.05
      positions[idx + 1] += Math.sin(time * 2 + i * 0.5) * 0.03
      positions[idx + 2] += Math.cos(time * 2.5 + i) * 0.04
    }
    
    firefliesRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  // Animate smoke
  useFrame((_, delta) => {
    if (!smokeRef.current) return
    
    const positions = smokeRef.current.geometry.attributes.position.array as Float32Array
    const velocities = smokeData.velocities
    const sizes = smokeRef.current.geometry.attributes.size.array as Float32Array
    
    for (let i = 0; i < smokeCount; i++) {
      const idx = i * 3
      
      // Apply velocity with turbulence
      positions[idx] += velocities[idx] * delta
      positions[idx + 1] += velocities[idx + 1] * delta
      positions[idx + 2] += velocities[idx + 2] * delta
      
      // Grow
      sizes[i] += delta * 0.5
      
      // Reset if too high
      if (positions[idx + 1] > 40 || sizes[i] > 8) {
        const shipIdx = Math.floor(Math.random() * Math.max(1, ships.length))
        const ship = ships[shipIdx]
        const baseX = ship ? ship.position[0] : 0
        const baseZ = ship ? ship.position[2] : 0
        
        positions[idx] = baseX + (Math.random() - 0.5) * 8
        positions[idx + 1] = 12 + Math.random() * 3
        positions[idx + 2] = baseZ + (Math.random() - 0.5) * 8
        sizes[i] = 1 + Math.random()
      }
    }
    
    smokeRef.current.geometry.attributes.position.needsUpdate = true
    smokeRef.current.geometry.attributes.size.needsUpdate = true
  })
  
  return (
    <>
      {/* Fireflies - night only */}
      {isNight && (
        <points ref={firefliesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={fireflyCount}
              array={fireflyData.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={fireflyCount}
              array={fireflyData.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.3}
            vertexColors
            transparent
            opacity={0.9}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      )}
      
      {/* Water sparkles */}
      <points ref={sparklesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={sparkleCount}
            array={sparkleData.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          color="#ffffff"
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Smoke from ships */}
      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={smokeCount}
            array={smokeData.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={smokeCount}
            array={smokeData.sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={3}
          color="#aaaaaa"
          transparent
          opacity={0.3}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </>
  )
}

// Interactive particle effects
export function spawnSplash(position: [number, number, number], intensity: number = 1) {
  // This would emit particles from a pool
  console.log(`Splash at ${position} with intensity ${intensity}`)
}

export function spawnSparks(position: [number, number, number], count: number = 20) {
  console.log(`Sparks at ${position}, count: ${count}`)
}

// Main Particle System
export default function ParticleSystem({ maxParticles = 20000 }: ParticleSystemProps) {
  const weatherCount = Math.floor(maxParticles * 0.5)
  
  return (
    <group>
      {/* Weather effects */}
      <WeatherParticles maxCount={weatherCount} />
      
      {/* Ambient effects */}
      <AmbientParticles />
    </group>
  )
}

// Hook for spawning interactive particles
export function useParticleSpawner() {
  const spawnSplashCallback = useCallback((position: [number, number, number], intensity: number = 1) => {
    spawnSplash(position, intensity)
  }, [])
  
  const spawnSparksCallback = useCallback((position: [number, number, number], count: number = 20) => {
    spawnSparks(position, count)
  }, [])
  
  return {
    spawnSplash: spawnSplashCallback,
    spawnSparks: spawnSparksCallback
  }
}
