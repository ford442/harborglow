import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// PHASE 10.1: LOD SYSTEM (Level of Detail)
// Adaptive quality based on distance from camera
// =============================================================================

export type LODLevel = 0 | 1 | 2 | 3 // Full, Medium, Low, Impostor

interface LODConfig {
  distances: [number, number, number] // Thresholds for LOD 1, 2, 3
  particleReduction: [number, number, number, number] // Multipliers for each LOD
  shaderComplexity: ['full', 'medium', 'low', 'unlit']
}

const DEFAULT_LOD_CONFIG: LODConfig = {
  distances: [50, 150, 300], // meters
  particleReduction: [1, 0.5, 0.25, 0],
  shaderComplexity: ['full', 'medium', 'low', 'unlit']
}

// Hook to determine LOD level based on distance
export function useLOD(position: THREE.Vector3 | [number, number, number], config: LODConfig = DEFAULT_LOD_CONFIG): LODLevel {
  const { camera } = useThree()
  const [lod, setLod] = useState<LODLevel>(0)
  
  const pos = useMemo(() => 
    Array.isArray(position) ? new THREE.Vector3(...position) : position,
    [position]
  )
  
  useFrame(() => {
    const distance = camera.position.distanceTo(pos)
    
    if (distance < config.distances[0]) {
      if (lod !== 0) setLod(0)
    } else if (distance < config.distances[1]) {
      if (lod !== 1) setLod(1)
    } else if (distance < config.distances[2]) {
      if (lod !== 2) setLod(2)
    } else {
      if (lod !== 3) setLod(3)
    }
  })
  
  return lod
}

// LOD Ship component - switches detail based on distance
interface LODShipProps {
  position: [number, number, number]
  type: 'cruise' | 'container' | 'tanker'
  children?: React.ReactNode
}

export function LODShip({ position, type, children }: LODShipProps) {
  const lod = useLOD(position)
  const groupRef = useRef<THREE.Group>(null)
  
  // Hide children (lights, particles) at low LOD
  useEffect(() => {
    if (!groupRef.current) return
    
    groupRef.current.traverse((child) => {
      // Cull lights at distance
      if (child instanceof THREE.Light) {
        child.visible = lod <= 1
      }
      
      // Simplify particle systems
      if ((child as any).isPoints) {
        child.visible = lod <= 2
      }
    })
  }, [lod])
  
  if (lod === 3) {
    // Impostor - simple billboard or box
    return (
      <group ref={groupRef} position={position}>
        <ImpostorMesh type={type} />
      </group>
    )
  }
  
  return (
    <group ref={groupRef} position={position}>
      {children}
    </group>
  )
}

// Impostor representation for distant ships
function ImpostorMesh({ type }: { type: 'cruise' | 'container' | 'tanker' }) {
  const color = type === 'cruise' ? '#ff6b9d' : type === 'container' ? '#00d4aa' : '#ff9500'
  
  // Different simple shapes for each ship type
  const size = useMemo(() => {
    switch (type) {
      case 'cruise': return [6, 2, 1.5]
      case 'container': return [10, 1.5, 2]
      case 'tanker': return [8, 2, 2.5]
    }
  }, [type])
  
  return (
    <mesh>
      <boxGeometry args={size as [number, number, number]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

// LOD Particle System
interface LODParticlesProps {
  position: THREE.Vector3 | [number, number, number]
  maxCount: number
  children: (count: number) => React.ReactNode
}

export function LODParticles({ position, maxCount, children }: LODParticlesProps) {
  const lod = useLOD(position)
  
  const particleCount = useMemo(() => {
    const reduction = DEFAULT_LOD_CONFIG.particleReduction[lod]
    return Math.floor(maxCount * reduction)
  }, [lod, maxCount])
  
  if (particleCount === 0) return null
  
  return <>{children(particleCount)}</>
}

// Adaptive shader complexity
export function useAdaptiveMaterial(
  baseMaterial: THREE.Material,
  position: THREE.Vector3 | [number, number, number]
) {
  const lod = useLOD(position)
  
  return useMemo(() => {
    if (lod === 3) {
      // Unlit for impostors
      return new THREE.MeshBasicMaterial({
        color: (baseMaterial as THREE.MeshStandardMaterial).color
      })
    }
    
    if (lod === 2) {
      // Simplified PBR
      const mat = baseMaterial.clone()
      if ((mat as any).roughness !== undefined) {
        (mat as any).roughness = 0.8 // Reduce specular calculations
      }
      return mat
    }
    
    return baseMaterial
  }, [lod, baseMaterial])
}

// =============================================================================
// PHASE 10.2: OCCLUSION CULLING
// Don't render objects blocked by others
// =============================================================================

interface OcclusionCullProps {
  bounds: THREE.Box3 | { min: [number, number, number], max: [number, number, number] }
  children: React.ReactNode
}

// Simple frustum + occlusion culling
export function OcclusionCulled({ bounds, children }: OcclusionCullProps) {
  const { camera } = useThree()
  const [visible, setVisible] = useState(true)
  const box = useMemo(() => 
    bounds instanceof THREE.Box3 ? bounds : new THREE.Box3(
      new THREE.Vector3(...bounds.min),
      new THREE.Vector3(...bounds.max)
    ),
    [bounds]
  )
  
  useFrame(() => {
    // Frustum check
    const frustum = new THREE.Frustum()
    const projScreenMatrix = new THREE.Matrix4()
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    frustum.setFromProjectionMatrix(projScreenMatrix)
    
    const isVisible = frustum.intersectsBox(box)
    
    if (isVisible !== visible) {
      setVisible(isVisible)
    }
  })
  
  if (!visible) return null
  
  return <>{children}</>
}

// Distance-based visibility toggle
interface DistanceCulledProps {
  position: THREE.Vector3 | [number, number, number]
  maxDistance: number
  children: React.ReactNode
}

export function DistanceCulled({ position, maxDistance, children }: DistanceCulledProps) {
  const { camera } = useThree()
  const [visible, setVisible] = useState(true)
  
  const pos = useMemo(() => 
    Array.isArray(position) ? new THREE.Vector3(...position) : position,
    [position]
  )
  
  useFrame(() => {
    const distance = camera.position.distanceTo(pos)
    const shouldBeVisible = distance < maxDistance
    
    if (shouldBeVisible !== visible) {
      setVisible(shouldBeVisible)
    }
  })
  
  if (!visible) return null
  
  return <>{children}</>
}

// =============================================================================
// PERFORMANCE MONITOR
// FPS counter and adaptive quality
// =============================================================================

interface PerformanceStats {
  fps: number
  frameTime: number
  drawCalls: number
  recommendedLOD: LODLevel
}

export function usePerformanceMonitor(): PerformanceStats {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    frameTime: 16.67,
    drawCalls: 0,
    recommendedLOD: 0
  })
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const frameTimesRef = useRef<number[]>([])
  
  useFrame(() => {
    const now = performance.now()
    const frameTime = now - lastTimeRef.current
    lastTimeRef.current = now
    
    frameCountRef.current++
    frameTimesRef.current.push(frameTime)
    
    // Update every second
    if (frameTimesRef.current.length >= 60) {
      const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
      const fps = 1000 / avgFrameTime
      
      // Recommend LOD based on performance
      let recommendedLOD: LODLevel = 0
      if (fps < 30) recommendedLOD = 2
      else if (fps < 45) recommendedLOD = 1
      else if (fps < 60) recommendedLOD = 0
      
      setStats({
        fps: Math.round(fps),
        frameTime: Math.round(avgFrameTime * 100) / 100,
        drawCalls: 0, // Would need WebGL introspection
        recommendedLOD
      })
      
      frameTimesRef.current = []
    }
  })
  
  return stats
}

// Performance overlay component (debug only)
export function PerformanceOverlay() {
  const stats = usePerformanceMonitor()
  const qualityPreset = useGameStore(state => state.qualityPreset)
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      padding: '12px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#fff',
      zIndex: 10000,
      minWidth: '150px'
    }}>
      <div style={{ color: stats.fps >= 55 ? '#00ff00' : stats.fps >= 30 ? '#ffff00' : '#ff0000' }}>
        FPS: {stats.fps}
      </div>
      <div style={{ color: '#888' }}>
        Frame: {stats.frameTime}ms
      </div>
      <div style={{ color: stats.recommendedLOD > 0 ? '#ff9500' : '#00ff00' }}>
        LOD: {['Full', 'Medium', 'Low', 'Impostor'][stats.recommendedLOD]}
      </div>
      <div style={{ color: '#00d4aa' }}>
        Quality: {qualityPreset}
      </div>
    </div>
  )
}

// =============================================================================
// GLOBAL PERFORMANCE SETTINGS
// =============================================================================

// Auto-adjust quality based on performance
export function useAdaptiveQuality() {
  const stats = usePerformanceMonitor()
  const setQualityPreset = useGameStore(state => state.setQualityPreset)
  const qualityPreset = useGameStore(state => state.qualityPreset)
  
  useEffect(() => {
    // Don't auto-adjust if user manually set to low
    if (qualityPreset === 'low') return
    
    // Auto-reduce quality if FPS drops consistently
    if (stats.fps < 30 && qualityPreset === 'high') {
      console.log('⚠️ Performance low, reducing quality to medium')
      setQualityPreset('medium')
    } else if (stats.fps < 25 && qualityPreset === 'medium') {
      console.log('⚠️ Performance very low, reducing quality to low')
      setQualityPreset('low')
    }
  }, [stats.fps, qualityPreset, setQualityPreset])
}
