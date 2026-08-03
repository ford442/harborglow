/**
 * MINIMAL MONITOR EXAMPLE
 * Copy-paste this into your ControlBooth for quick integration
 */

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RenderTexture, PerspectiveCamera, Box, Plane } from '@react-three/drei'
import { useGameStore } from '../store/useGameStore'
import { useAudioVisualSync } from '../systems/audioVisualSync'

// =============================================================================
// MINIMAL MONITOR - Single camera example
// Copy this pattern for each monitor
// =============================================================================

interface MinimalMonitorProps {
  /** Monitor position in booth */
  position: [number, number, number]
  /** Monitor rotation */
  rotation: [number, number, number]
  /** Monitor size [width, height] in meters */
  size: [number, number]
  /** Camera type determines positioning logic */
  type: 'hook' | 'drone' | 'underwater' | 'crane'
  /** Scene content to render */
  children: React.ReactNode
}

export function MinimalMonitor({ position, rotation, size, type, children }: MinimalMonitorProps) {
  const camRef = useRef<THREE.PerspectiveCamera>(null)
  const craneState = useGameStore(s => s.craneRotation ?? 0.2)
  const ships = useGameStore(s => s.ships)
  const currentShipId = useGameStore(s => s.currentShipId)
  const { audioData } = useAudioVisualSync()
  
  const currentShip = ships.find(s => s.id === currentShipId)
  
  // Aspect ratio calculation
  const [width, height] = size
  const aspect = width / height
  
  // Animate camera based on type
  useFrame((state) => {
    if (!camRef.current || !currentShip) return
    
    const time = state.clock.elapsedTime
    const shipPos = new THREE.Vector3(...currentShip.position)
    
    switch (type) {
      case 'hook':
        // Follow crane hook
        camRef.current.position.set(
          Math.sin(craneState) * 5,
          8,
          Math.cos(craneState) * 2
        )
        camRef.current.lookAt(shipPos)
        camRef.current.fov = 75 + audioData.bass * 5
        break
        
      case 'drone':
        // Orbit around ship
        camRef.current.position.set(
          shipPos.x + Math.cos(time * 0.2) * 40,
          shipPos.y + 20,
          shipPos.z + Math.sin(time * 0.2) * 40
        )
        camRef.current.lookAt(shipPos)
        break
        
      case 'underwater':
        // Below water looking up
        camRef.current.position.set(
          shipPos.x + Math.sin(time * 0.1) * 10,
          -5,
          shipPos.z + 15
        )
        camRef.current.lookAt(shipPos.x, 0, shipPos.z)
        break
        
      case 'crane':
        // Crane cab view
        camRef.current.position.set(
          Math.sin(craneState) * 18,
          24,
          Math.cos(craneState) * 8
        )
        camRef.current.lookAt(shipPos)
        break
    }
    
    camRef.current.updateProjectionMatrix()
  })
  
  return (
    <group position={position} rotation={rotation}>
      {/* Bezel */}
      <Box args={[width + 0.1, height + 0.1, 0.05]} position={[0, 0, -0.03]}>
        <meshStandardMaterial color={0x1a1a1a} metalness={0.8} roughness={0.3} />
      </Box>
      
      {/* Screen with RenderTexture */}
      <Plane args={size}>
        <meshPhysicalMaterial
          metalness={0.1}
          roughness={0.2}
          clearcoat={1}
        >
          <RenderTexture
            attach="map"
            width={2048}
            height={Math.round(2048 / aspect)}
            frames={1}
          >
            {/* Camera */}
            <PerspectiveCamera
              ref={camRef}
              makeDefault={false}
              fov={type === 'hook' ? 75 : type === 'underwater' ? 70 : 60}
              near={0.1}
              far={2000}
              aspect={aspect}
            />
            
            {/* Scene content */}
            {children}
            
            {/* Simple HUD */}
            <MonitorOverlay type={type} />
          </RenderTexture>
        </meshPhysicalMaterial>
      </Plane>
      
      {/* Glass cover */}
      <Plane args={size} position={[0, 0, 0.002]}>
        <meshPhysicalMaterial
          color={0xffffff}
          transparent
          opacity={0.05}
          roughness={0.02}
          metalness={0}
          transmission={0.95}
        />
      </Plane>
    </group>
  )
}

// Simple HUD overlay
function MonitorOverlay({ type }: { type: string }) {
  const colors: Record<string, string> = {
    hook: '#ff6600',
    drone: '#00d4aa',
    underwater: '#00aaff',
    crane: '#ffcc00'
  }
  const color = colors[type] || '#ffffff'
  const c = new THREE.Color(color)
  
  return (
    <>
      {/* Corner */}
      <mesh position={[-3, 2, -5]}>
        <planeGeometry args={[0.3, 0.03]} />
        <meshBasicMaterial color={c} />
      </mesh>
      <mesh position={[-3, 2, -5]} rotation={[0, 0, Math.PI/2]}>
        <planeGeometry args={[0.3, 0.03]} />
        <meshBasicMaterial color={c} />
      </mesh>
      
      {/* Recording dot */}
      <mesh position={[2.8, 2.2, -5]}>
        <circleGeometry args={[0.05]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>
      
      {/* Crosshair */}
      <group position={[0, 0, -5]}>
        <mesh><planeGeometry args={[0.2, 0.01]} /></mesh>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <planeGeometry args={[0.2, 0.01]} />
        </mesh>
      </group>
    </>
  )
}

// =============================================================================
// USAGE - Drop this into your ControlBooth
// =============================================================================

/*
import { MinimalMonitor } from './MonitorMinimalExample'

// Inside ControlBooth component:
<>
  <MinimalMonitor
    position={[-3.6, 3, -0.5]}
    rotation={[0, Math.PI/2 + 0.15, 0]}
    size={[1.6, 0.9]}
    type="hook"
  >
    {children}
  </MinimalMonitor>
  
  <MinimalMonitor
    position={[-3.6, 1.5, -0.5]}
    rotation={[0, Math.PI/2 + 0.15, 0]}
    size={[1.6, 0.9]}
    type="drone"
  >
    {children}
  </MinimalMonitor>
  
  <MinimalMonitor
    position={[0, 2.5, 3.6]}
    rotation={[0, Math.PI, 0]}
    size={[2.4, 1.35]}
    type="underwater"
  >
    {children}
  </MinimalMonitor>
  
  <MinimalMonitor
    position={[3.6, 2.5, 0]}
    rotation={[0, -Math.PI/2 - 0.15, 0]}
    size={[1.6, 0.9]}
    type="crane"
  >
    {children}
  </MinimalMonitor>
</>
*/
