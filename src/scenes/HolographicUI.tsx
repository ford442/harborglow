import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { useAudioVisualSync } from '../systems/audioVisualSync'

// =============================================================================
// PHASE 9.1: HOLOGRAPHIC UI ELEMENTS
// Floating wireframe ship status, crane targeting HUD, control panels
// =============================================================================

interface HologramShipProps {
  shipId: string
  position: [number, number, number]
}

// Floating holographic ship status display
export function HolographicShipStatus({ shipId, position }: HologramShipProps) {
  const groupRef = useRef<THREE.Group>(null)
  const wireframeRef = useRef<THREE.LineSegments>(null)
  const { audioData } = useAudioVisualSync()
  
  const ships = useGameStore(state => state.ships)
  const installedUpgrades = useGameStore(state => state.installedUpgrades)
  const ship = ships.find(s => s.id === shipId)
  
  if (!ship) return null
  
  const shipUpgrades = installedUpgrades.filter(u => u.shipId === shipId)
  const progress = shipUpgrades.length / (ship.attachmentPoints?.length || 1)
  
  // Ship type color
  const shipColor = ship.type === 'cruise' ? '#ff6b9d' : 
                    ship.type === 'container' ? '#00d4aa' : '#ff9500'
  
  useFrame((state) => {
    if (!groupRef.current || !wireframeRef.current) return
    
    const time = state.clock.elapsedTime
    
    // Gentle floating animation
    groupRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.2
    groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.1
    
    // Hologram flicker effect
    const flicker = 0.9 + Math.sin(time * 10) * 0.05 + Math.random() * 0.05
    const material = wireframeRef.current.material as THREE.LineBasicMaterial
    material.opacity = flicker
    
    // Pulse with audio bass
    if (audioData.beat) {
      const scale = 1 + audioData.bass * 0.1
      groupRef.current.scale.setScalar(scale)
    } else {
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
    }
  })
  
  // Generate wireframe geometry based on ship type
  const wireframeGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    
    if (ship.type === 'cruise') {
      // Cruise ship silhouette
      shape.moveTo(-2, 0)
      shape.lineTo(2, 0)
      shape.lineTo(1.8, 0.8)
      shape.lineTo(-1.5, 1)
      shape.lineTo(-2, 0)
    } else if (ship.type === 'container') {
      // Container ship - boxy
      shape.moveTo(-2.5, 0)
      shape.lineTo(2.5, 0)
      shape.lineTo(2.5, 0.6)
      shape.lineTo(-2.5, 0.6)
      shape.lineTo(-2.5, 0)
    } else {
      // Tanker - rounded
      shape.absarc(0, 0.3, 1.5, 0, Math.PI * 2)
    }
    
    const extrudeSettings = { depth: 0.5, bevelEnabled: false }
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    return new THREE.WireframeGeometry(geometry)
  }, [ship.type])
  
  return (
    <group ref={groupRef} position={position}>
      {/* Wireframe hologram */}
      <lineSegments ref={wireframeRef} geometry={wireframeGeometry}>
        <lineBasicMaterial color={shipColor} transparent opacity={0.8} />
      </lineSegments>
      
      {/* Hologram base ring */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.8, 32]} />
        <meshBasicMaterial color={shipColor} transparent opacity={0.3} />
      </mesh>
      
      {/* Progress ring */}
      <mesh position={[0, -0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.8, 32, 1, 0, progress * Math.PI * 2]} />
        <meshBasicMaterial color={shipColor} transparent opacity={0.8} />
      </mesh>
      
      {/* Audio visualization bars */}
      <AudioVizBars position={[0, 2, 0]} color={shipColor} />
      
      {/* Status text billboard */}
      <StatusLabel 
        position={[0, 2.5, 0]} 
        text={`${Math.round(progress * 100)}%`}
        color={shipColor}
      />
    </group>
  )
}

// Audio visualization bars for hologram
function AudioVizBars({ position, color }: { position: [number, number, number], color: string }) {
  const barsRef = useRef<THREE.Group>(null)
  const { audioData } = useAudioVisualSync()
  
  const barCount = 8
  
  useFrame(() => {
    if (!barsRef.current) return
    
    barsRef.current.children.forEach((bar, i) => {
      // Map bar index to frequency band
      const freqValue = i < 2 ? audioData.bass : 
                        i < 4 ? audioData.mid : 
                        i < 6 ? audioData.highMid : audioData.treble
      
      const targetHeight = 0.2 + freqValue * 0.8
      bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, targetHeight, 0.2)
      bar.position.y = position[1] + bar.scale.y * 0.5
    })
  })
  
  return (
    <group ref={barsRef}>
      {Array.from({ length: barCount }).map((_, i) => (
        <mesh 
          key={i}
          position={[position[0] + (i - barCount/2) * 0.3, position[1], position[2]]}
        >
          <boxGeometry args={[0.15, 1, 0.15]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.6 + (i / barCount) * 0.4}
          />
        </mesh>
      ))}
    </group>
  )
}

// Holographic text label
function StatusLabel({ position, text, color }: { 
  position: [number, number, number]
  text: string
  color: string 
}) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 64
    const ctx = c.getContext('2d')!
    
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, 128, 64)
    
    ctx.font = 'bold 32px monospace'
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 64, 32)
    
    // Scanline effect
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    for (let i = 0; i < 64; i += 4) {
      ctx.fillRect(0, i, 128, 1)
    }
    
    return c
  }, [text, color])
  
  const texture = useMemo(() => new THREE.CanvasTexture(canvas), [canvas])
  
  return (
    <mesh position={position}>
      <planeGeometry args={[1.5, 0.75]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={0.9}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// =============================================================================
// PHASE 9.1: CRANE TARGETING HUD
// =============================================================================

interface CraneTargetingHUDProps {
  targetPosition: [number, number, number]
  cranePosition: [number, number, number]
}

export function CraneTargetingHUD({ targetPosition, cranePosition }: CraneTargetingHUDProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { audioData } = useAudioVisualSync()
  
  useFrame(() => {
    if (!groupRef.current) return
    
    // Pulse reticle on beat
    if (audioData.beat) {
      const scale = 1 + audioData.beatIntensity * 0.2
      groupRef.current.scale.setScalar(scale)
    } else {
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
    }
  })
  
  return (
    <group ref={groupRef} position={targetPosition}>
      {/* Target reticle - outer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.3, 32]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.8} />
      </mesh>
      
      {/* Inner rotating ring */}
      <RotatingRing radius={0.8} color="#00ff88" speed={2} />
      
      {/* Crosshair */}
      <Crosshair size={0.6} color="#00ff88" />
      
      {/* Distance indicator */}
      <DistanceLine 
        from={cranePosition} 
        to={targetPosition} 
        color="#00ff88"
      />
      
      {/* Trajectory prediction arc */}
      <TrajectoryArc 
        start={cranePosition} 
        end={targetPosition} 
        color="#00ff88"
      />
    </group>
  )
}

// Rotating ring component
function RotatingRing({ radius, color, speed }: { radius: number, color: string, speed: number }) {
  const ringRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * speed
    }
  })
  
  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.05, radius, 16, 1, 0, Math.PI * 1.5]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  )
}

// Crosshair component
function Crosshair({ size, color }: { size: number, color: string }) {
  return (
    <group>
      {/* Horizontal line */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[size, 0.02, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Vertical line */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.02, size, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Center dot */}
      <mesh>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

// Distance measurement line
function DistanceLine({ from, to, color }: { from: number[], to: number[], color: string }) {
  const points = useMemo(() => [
    new THREE.Vector3(...from),
    new THREE.Vector3(...to)
  ], [from, to])
  
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])
  
  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.3 
    }))} />
  )
}

// Trajectory prediction arc
function TrajectoryArc({ start, end, color }: { start: number[], end: number[], color: string }) {
  const curve = useMemo(() => {
    const midPoint = [
      (start[0] + end[0]) / 2,
      Math.max(start[1], end[1]) + 5, // Arc height
      (start[2] + end[2]) / 2
    ]
    
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...midPoint),
      new THREE.Vector3(...end)
    )
  }, [start, end])
  
  const points = useMemo(() => curve.getPoints(50), [curve])
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])
  
  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.4 
    }))} />
  )
}

// =============================================================================
// MAIN COMPONENT: All Holographic Elements
// =============================================================================

export function HolographicElements() {
  const ships = useGameStore(state => state.ships)
  
  return (
    <group>
      {ships.map(ship => (
        <HolographicShipStatus
          key={ship.id}
          shipId={ship.id}
          position={[ship.position[0], ship.position[1] + 8, ship.position[2]]}
        />
      ))}
    </group>
  )
}
