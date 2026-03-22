import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Box, Plane, MeshReflectorMaterial, Text } from '@react-three/drei'
import MonitorSystem from './MonitorSystem'

// =============================================================================
// CONTROL BOOTH WITH MONITOR SYSTEM INTEGRATION
// Drop-in replacement for ControlBooth.tsx that uses MonitorSystem
// =============================================================================

interface ControlBoothWithMonitorSystemProps {
  /** The main scene content (water, dock, crane, ships) */
  children: React.ReactNode
  /** Harbor theme for booth appearance */
  harborTheme?: 'industrial' | 'arctic' | 'tropical'
  /** Monitor quality preset */
  quality?: 'low' | 'medium' | 'high' | 'ultra'
  /** Show debug helpers */
  debug?: boolean
  /** Enable monitor interactions (click to enlarge) */
  interactive?: boolean
}

export default function ControlBoothWithMonitorSystem({
  children,
  harborTheme = 'industrial',
  quality = 'high',
  debug = false,
  interactive = true
}: ControlBoothWithMonitorSystemProps) {
  const { camera } = useThree()
  const boothRef = useRef<THREE.Group>(null)
  
  // ================================================================
  // PLAYER CAMERA SETUP - Inside booth looking out window
  // ================================================================
  useEffect(() => {
    camera.position.set(0, 2.2, 3.2)
    camera.lookAt(0, 2.5, -20)
    camera.fov = 65
    camera.updateProjectionMatrix()
    
    return () => {
      camera.position.set(10, 10, 10)
      camera.lookAt(0, 0, 0)
      camera.fov = 50
      camera.updateProjectionMatrix()
    }
  }, [camera])
  
  // ================================================================
  // THEME CONFIGURATION
  // ================================================================
  const theme = getTheme(harborTheme)
  
  return (
    <group ref={boothRef}>
      {/* ============================================================ */}
      {/* ROOM STRUCTURE */}
      {/* ============================================================ */}
      
      {/* Floor */}
      <Box args={[8, 0.1, 8]} position={[0, 0.05, 0]} receiveShadow>
        <meshStandardMaterial color={theme.floor} metalness={0.6} roughness={0.7} />
      </Box>
      
      {/* Floor strips */}
      {Array.from({ length: 7 }, (_, i) => (
        <Box 
          key={`strip-${i}`}
          args={[8, 0.02, 0.05]} 
          position={[0, 0.11, -3.5 + i]}
        >
          <meshStandardMaterial color={0x333333} metalness={0.8} roughness={0.4} />
        </Box>
      ))}
      
      {/* Ceiling */}
      <Box args={[8, 0.2, 8]} position={[0, 4.1, 0]} castShadow>
        <meshStandardMaterial color={theme.wall} metalness={0.7} roughness={0.6} />
      </Box>
      
      {/* Ceiling lights */}
      <CeilingLights />
      
      {/* Walls */}
      <Box args={[0.3, 4, 8]} position={[-3.85, 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={theme.wall} metalness={0.7} roughness={0.6} />
      </Box>
      
      <Box args={[0.3, 4, 8]} position={[3.85, 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={theme.wall} metalness={0.7} roughness={0.6} />
      </Box>
      
      <Box args={[8, 4, 0.3]} position={[0, 2, 3.85]} castShadow receiveShadow>
        <meshStandardMaterial color={theme.wall} metalness={0.7} roughness={0.6} />
      </Box>
      
      {/* ============================================================ */}
      {/* FRONT WINDOW */}
      {/* ============================================================ */}
      
      {/* Window Frame */}
      <WindowFrame />
      
      {/* Window Glass */}
      <Plane args={[5, 3.5]} position={[0, 2.5, -3.85]}>
        <MeshReflectorMaterial
          resolution={1024}
          args={[5, 3.5]}
          mirror={0.05}
          mixBlur={0.8}
          mixStrength={0.2}
          color="#88ccff"
          metalness={0.1}
          roughness={0.15}
        />
      </Plane>
      
      {/* ============================================================ */}
      {/* CONTROL DESK */}
      {/* ============================================================ */}
      
      <ControlDesk theme={theme} />
      
      {/* ============================================================ */}
      {/* MONITOR SYSTEM - The main feature! */}
      {/* ============================================================ */}
      
      <MonitorSystem 
        quality={quality}
        interactive={interactive}
      >
        {children}
      </MonitorSystem>
      
      {/* ============================================================ */}
      {/* MAIN SCENE CONTENT (visible through window) */}
      {/* Positioned outside, behind the window */}
      {/* ============================================================ */}
      <group position={[0, 0, -15]}>
        {children}
      </group>
      
      {/* ============================================================ */}
      {/* BOOTH LIGHTING */}
      {/* ============================================================ */}
      
      <pointLight position={[0, 3.5, 1]} intensity={0.4} color={0x88ccff} distance={8} decay={2} />
      <pointLight position={[-3.3, 2.5, 0]} intensity={0.4} color={theme.accent} distance={4} decay={2} />
      <pointLight position={[3.3, 2.5, 0]} intensity={0.4} color={theme.accent} distance={4} decay={2} />
      <pointLight position={[0, 2.5, 3.3]} intensity={0.3} color={0x00aaff} distance={5} decay={2} />
      
      {/* Debug */}
      {debug && (
        <>
          <axesHelper args={[2]} position={[0, 2, 0]} />
          <gridHelper args={[10, 10]} position={[0, 0.01, 0]} />
        </>
      )}
    </group>
  )
}

// =============================================================================
// THEME HELPER
// =============================================================================

function getTheme(harborTheme: string) {
  switch (harborTheme) {
    case 'arctic':
      return {
        wall: 0xc5d5e0,
        floor: 0xa0b0c0,
        accent: 0x00aaff,
        desk: 0xd0e0f0
      }
    case 'tropical':
      return {
        wall: 0xd4c4a8,
        floor: 0xc0b090,
        accent: 0xff9500,
        desk: 0xe8dcc0
      }
    default: // industrial
      return {
        wall: 0x2a2a35,
        floor: 0x1a1a20,
        accent: 0xff6600,
        desk: 0x3a3a45
      }
  }
}

// =============================================================================
// CEILING LIGHTS
// =============================================================================

function CeilingLights() {
  const positions = [[-2, -2], [2, -2], [-2, 2], [2, 2]]
  
  return (
    <group position={[0, 3.95, 0]}>
      {positions.map(([x, z], i) => (
        <group key={`light-${i}`} position={[x, 0, z]}>
          <Box args={[0.8, 0.05, 0.8]}>
            <meshStandardMaterial 
              color={0xffffee} 
              emissive={0xffffee}
              emissiveIntensity={0.3}
            />
          </Box>
          <pointLight 
            position={[0, -0.5, 0]} 
            intensity={0.8} 
            color="#ffffee" 
            distance={6}
            decay={2}
          />
        </group>
      ))}
    </group>
  )
}

// =============================================================================
// WINDOW FRAME
// =============================================================================

function WindowFrame() {
  const material = (
    <meshStandardMaterial 
      color={0x3a3a45}
      metalness={0.9}
      roughness={0.3}
    />
  )
  
  return (
    <>
      <Box args={[1.5, 3.5, 0.2]} position={[-3.25, 2.25, -3.9]} castShadow>
        {material}
      </Box>
      <Box args={[1.5, 3.5, 0.2]} position={[3.25, 2.25, -3.9]} castShadow>
        {material}
      </Box>
      <Box args={[5, 0.75, 0.2]} position={[0, 4.125, -3.9]} castShadow>
        {material}
      </Box>
      <Box args={[5, 0.25, 0.2]} position={[0, 0.875, -3.9]} castShadow>
        {material}
      </Box>
    </>
  )
}

// =============================================================================
// CONTROL DESK
// =============================================================================

function ControlDesk({ theme }: { theme: any }) {
  return (
    <group position={[0, 0, 1.5]}>
      {/* Main surface */}
      <Box args={[3.5, 0.08, 1.2]} position={[0, 1.1, 0]} castShadow>
        <meshStandardMaterial color={theme.desk} metalness={0.7} roughness={0.5} />
      </Box>
      
      {/* Edge trim */}
      <Box args={[3.5, 0.02, 0.05]} position={[0, 1.16, -0.58]}>
        <meshStandardMaterial 
          color={theme.accent}
          emissive={theme.accent}
          emissiveIntensity={0.2}
        />
      </Box>
      
      {/* Control panels */}
      <Box args={[0.8, 0.05, 0.6]} position={[-1.2, 1.18, -0.2]}>
        <meshStandardMaterial color={0x1a1a1a} metalness={0.5} roughness={0.6} />
      </Box>
      
      <Box args={[0.8, 0.05, 0.6]} position={[1.2, 1.18, -0.2]}>
        <meshStandardMaterial color={0x1a1a1a} metalness={0.5} roughness={0.6} />
      </Box>
      
      {/* Central display */}
      <Box args={[1.2, 0.4, 0.05]} position={[0, 1.4, -0.55]}>
        <meshStandardMaterial 
          color={0x0a0a0a}
          emissive={theme.accent}
          emissiveIntensity={0.15}
          metalness={0.8}
          roughness={0.2}
        />
      </Box>
      
      {/* Legs */}
      <Box args={[0.15, 1.1, 1]} position={[-1.5, 0.55, 0]}>
        <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.5} />
      </Box>
      <Box args={[0.15, 1.1, 1]} position={[1.5, 0.55, 0]}>
        <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.5} />
      </Box>
    </group>
  )
}

// =============================================================================
// USAGE EXAMPLE
// =============================================================================

/*
import { Canvas } from '@react-three/fiber'
import ControlBoothWithMonitorSystem from './scenes/ControlBoothWithMonitorSystem'
import Water from './scenes/Water'
import Dock from './scenes/Dock'
import Crane from './scenes/Crane'
import Ship from './scenes/Ship'

function App() {
  return (
    <Canvas
      camera={{ position: [0, 2.2, 3.2], fov: 65 }}
      shadows
      dpr={[1, 2]}
    >
      <ControlBoothWithMonitorSystem
        harborTheme="industrial"
        quality="high"
        interactive={true}
      >
        <Water />
        <Dock />
        <Crane />
        <Ships />
      </ControlBoothWithMonitorSystem>
    </Canvas>
  )
}
*/
