import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree, createPortal } from '@react-three/fiber'
import { 
  PerspectiveCamera as DreiPerspectiveCamera,
  Box,
  Plane,
  MeshReflectorMaterial,
  View,
  useFBO
} from '@react-three/drei'
import { useGameStore } from '../store/useGameStore'
import { useAudioVisualSync } from '../systems/audioVisualSync'

// =============================================================================
// CONTROL BOOTH - OPTIMIZED VERSION
// Uses drei/View for more efficient monitor rendering
// 
// PERFORMANCE NOTES:
// - Each RenderTexture renders the full scene => expensive
// - View uses scissor testing => much faster
// - Use this version if experiencing frame drops
// =============================================================================

interface ControlBoothOptimizedProps {
  /** The main scene content to render (dock, water, crane, ships) */
  children: React.ReactNode
  /** Harbor theme affecting booth appearance */
  harborTheme?: 'industrial' | 'arctic' | 'tropical'
  /** Whether to show monitor bezels/debug frames */
  debug?: boolean
}

export default function ControlBoothOptimized({ 
  children, 
  harborTheme = 'industrial',
  debug = false 
}: ControlBoothOptimizedProps) {
  const { camera } = useThree()
  const boothRef = useRef<THREE.Group>(null)
  
  // Get crane state for camera positioning
  const craneState = useGameStore(state => ({
    rotation: state.craneRotation ?? 0.2,
    height: state.craneHeight ?? 15.5,
    spreaderPos: state.spreaderPos ?? { x: 0, y: 10, z: 0 }
  }))
  const ships = useGameStore(state => state.ships)
  const currentShipId = useGameStore(state => state.currentShipId)
  const bpm = useGameStore(state => state.bpm)
  const { audioData } = useAudioVisualSync()
  
  const currentShip = ships.find(s => s.id === currentShipId)
  
  // Set main camera to be inside booth looking out the window
  useEffect(() => {
    camera.position.set(0, 2.5, 4.5)
    camera.lookAt(0, 2, -10)
  }, [camera])
  
  // Camera refs for each monitor
  const craneCamRef = useRef<THREE.PerspectiveCamera>(null)
  const hookCamRef = useRef<THREE.PerspectiveCamera>(null)
  const droneCamRef = useRef<THREE.PerspectiveCamera>(null)
  const underwaterCamRef = useRef<THREE.PerspectiveCamera>(null)
  
  // Monitor refs for View component
  const craneMonitorRef = useRef<HTMLDivElement>(null)
  const hookMonitorRef = useRef<HTMLDivElement>(null)
  const droneMonitorRef = useRef<HTMLDivElement>(null)
  const underwaterMonitorRef = useRef<HTMLDivElement>(null)
  
  // Animation refs
  const droneProgressRef = useRef(0)
  const hookShakeRef = useRef({ x: 0, y: 0, intensity: 0 })
  const craneShakeRef = useRef({ x: 0, y: 0, intensity: 0 })
  
  // Drone orbit path
  const dronePath = useMemo(() => {
    if (!currentShip) return null
    
    const shipPos = new THREE.Vector3(...currentShip.position)
    const points: THREE.Vector3[] = []
    const segments = 12
    const radius = currentShip.type === 'tanker' ? 50 : currentShip.type === 'container' ? 40 : 35
    const height = 20
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const variation = Math.sin(i * 0.5) * 5
      
      points.push(new THREE.Vector3(
        shipPos.x + Math.cos(angle) * (radius + variation),
        shipPos.y + height + Math.cos(i * 0.3) * 8,
        shipPos.z + Math.sin(angle) * (radius + variation)
      ))
    }
    
    points.push(points[0].clone())
    return new THREE.CatmullRomCurve3(points, true)
  }, [currentShip])
  
  // Animate monitor cameras
  useFrame((state) => {
    if (!currentShip) return
    
    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatPhase = (time % beatDuration) / beatDuration
    const shipPos = new THREE.Vector3(...currentShip.position)
    
    // === CRANE CAM ===
    if (craneCamRef.current) {
      const craneBaseX = Math.sin(craneState.rotation) * 18
      const craneBaseZ = Math.cos(craneState.rotation) * 8
      
      if (beatPhase < 0.15) craneShakeRef.current.intensity = 0.2
      else craneShakeRef.current.intensity *= 0.9
      
      craneShakeRef.current.x = (Math.random() - 0.5) * craneShakeRef.current.intensity
      craneShakeRef.current.y = (Math.random() - 0.5) * craneShakeRef.current.intensity
      
      craneCamRef.current.position.set(
        craneBaseX + craneShakeRef.current.x,
        24 + craneShakeRef.current.y,
        craneBaseZ
      )
      craneCamRef.current.lookAt(shipPos.x, shipPos.y + 5, shipPos.z)
      craneCamRef.current.fov = 60 + audioData.bass * 3
      craneCamRef.current.updateProjectionMatrix()
    }
    
    // === HOOK CAM ===
    if (hookCamRef.current) {
      const hookPos = new THREE.Vector3(
        craneState.spreaderPos.x,
        craneState.spreaderPos.y - 5,
        craneState.spreaderPos.z
      )
      
      if (beatPhase < 0.15) hookShakeRef.current.intensity = 0.15
      else hookShakeRef.current.intensity *= 0.9
      
      hookShakeRef.current.x = (Math.random() - 0.5) * hookShakeRef.current.intensity
      hookShakeRef.current.y = (Math.random() - 0.5) * hookShakeRef.current.intensity
      
      hookCamRef.current.position.set(
        hookPos.x + hookShakeRef.current.x,
        hookPos.y + hookShakeRef.current.y,
        hookPos.z
      )
      hookCamRef.current.lookAt(hookPos.x, hookPos.y - 10, hookPos.z)
      hookCamRef.current.fov = 75 + audioData.bass * 5
      hookCamRef.current.updateProjectionMatrix()
    }
    
    // === DRONE CAM ===
    if (droneCamRef.current && dronePath) {
      droneProgressRef.current += 0.001 + audioData.treble * 0.005
      if (droneProgressRef.current > 1) droneProgressRef.current = 0
      
      const dronePos = dronePath.getPoint(droneProgressRef.current)
      const droneTarget = dronePath.getPoint((droneProgressRef.current + 0.1) % 1)
      
      droneCamRef.current.position.copy(dronePos)
      droneCamRef.current.lookAt(droneTarget)
      droneCamRef.current.updateProjectionMatrix()
    }
    
    // === UNDERWATER CAM ===
    if (underwaterCamRef.current) {
      underwaterCamRef.current.position.set(
        shipPos.x + Math.sin(time * 0.1) * 10,
        -8,
        shipPos.z + 20 + Math.cos(time * 0.08) * 5
      )
      underwaterCamRef.current.lookAt(shipPos.x, -2, shipPos.z)
      underwaterCamRef.current.updateProjectionMatrix()
    }
  })
  
  // Theme-based materials
  const theme = useMemo(() => {
    switch (harborTheme) {
      case 'arctic':
        return {
          wallColor: '#e8f4f8',
          floorColor: '#c5d5e0',
          accentColor: '#00aaff',
          monitorGlow: '#00ffff',
          metalness: 0.3,
          roughness: 0.4
        }
      case 'tropical':
        return {
          wallColor: '#f5e6d3',
          floorColor: '#d4c4a8',
          accentColor: '#ff9500',
          monitorGlow: '#ffaa00',
          metalness: 0.1,
          roughness: 0.6
        }
      default:
        return {
          wallColor: '#2a2a35',
          floorColor: '#1a1a20',
          accentColor: '#ff6600',
          monitorGlow: '#00d4aa',
          metalness: 0.6,
          roughness: 0.7
        }
    }
  }, [harborTheme])
  
  return (
    <group ref={boothRef}>
      {/* BOOTH GEOMETRY */}
      <Box args={[8, 0.2, 8]} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial 
          color={theme.floorColor} 
          metalness={theme.metalness}
          roughness={theme.roughness}
        />
      </Box>
      
      <Box args={[8, 0.2, 8]} position={[0, 4, 0]} castShadow>
        <meshStandardMaterial 
          color={theme.wallColor} 
          metalness={theme.metalness}
          roughness={theme.roughness}
        />
      </Box>
      
      <Box args={[0.2, 4, 8]} position={[-4, 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={theme.wallColor} metalness={theme.metalness} roughness={theme.roughness} />
      </Box>
      
      <Box args={[0.2, 4, 8]} position={[4, 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={theme.wallColor} metalness={theme.metalness} roughness={theme.roughness} />
      </Box>
      
      <Box args={[8, 4, 0.2]} position={[0, 2, 4]} castShadow receiveShadow>
        <meshStandardMaterial color={theme.wallColor} metalness={theme.metalness} roughness={theme.roughness} />
      </Box>
      
      {/* Window Frame */}
      <Box args={[2.5, 4, 0.3]} position={[-2.75, 2, -4]} castShadow>
        <meshStandardMaterial color={theme.wallColor} metalness={theme.metalness} roughness={theme.roughness} />
      </Box>
      <Box args={[2.5, 4, 0.3]} position={[2.75, 2, -4]} castShadow>
        <meshStandardMaterial color={theme.wallColor} metalness={theme.metalness} roughness={theme.roughness} />
      </Box>
      <Box args={[3, 1.5, 0.3]} position={[0, 3.25, -4]} castShadow>
        <meshStandardMaterial color={theme.wallColor} metalness={theme.metalness} roughness={theme.roughness} />
      </Box>
      
      {/* Window Glass */}
      <Plane args={[3, 2.5]} position={[0, 1.75, -3.85]}>
        <MeshReflectorMaterial
          resolution={1024}
          mirror={0.1}
          mixBlur={0.8}
          mixStrength={0.3}
          color="#88ccff"
          metalness={0.1}
          roughness={0.1}
        />
      </Plane>
      
      {/* Control Desk */}
      <Box args={[4, 0.1, 1.5]} position={[0, 1.2, -3]} castShadow>
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </Box>
      
      {/* MONITOR SCREENS WITH HTML OVERLAYS */}
      <MonitorWithView
        position={[-3.9, 3, -1]}
        rotation={[0, Math.PI / 2, 0]}
        size={[2, 1.5]}
        theme={theme}
        label="HOOK CAM"
      >
        <DreiPerspectiveCamera ref={hookCamRef} makeDefault={false} fov={75} />
        {children}
      </MonitorWithView>
      
      <MonitorWithView
        position={[-3.9, 1.2, -1]}
        rotation={[0, Math.PI / 2, 0]}
        size={[2, 1.5]}
        theme={theme}
        label="DRONE"
      >
        <DreiPerspectiveCamera ref={droneCamRef} makeDefault={false} fov={50} />
        {children}
      </MonitorWithView>
      
      <MonitorWithView
        position={[-2, 2.5, 3.9]}
        rotation={[0, Math.PI, 0]}
        size={[2.5, 1.8]}
        theme={theme}
        label="UNDERWATER"
      >
        <DreiPerspectiveCamera ref={underwaterCamRef} makeDefault={false} fov={70} />
        {children}
      </MonitorWithView>
      
      <MonitorWithView
        position={[2, 2.5, 3.9]}
        rotation={[0, Math.PI, 0]}
        size={[2.5, 1.8]}
        theme={theme}
        label="RADAR"
      >
        <DreiPerspectiveCamera makeDefault={false} position={[40, 50, 40]} fov={45} />
        {children}
      </MonitorWithView>
      
      {/* MAIN SCENE CONTENT (visible through window) */}
      <group position={[0, 0, -15]}>
        {children}
      </group>
      
      {/* BOOTH LIGHTING */}
      <pointLight position={[0, 3.5, 2]} intensity={0.5} color={theme.accentColor} distance={10} decay={2} />
      <pointLight position={[-3.5, 3, -1]} intensity={0.3} color={theme.monitorGlow} distance={5} decay={2} />
      <pointLight position={[-3.5, 1.2, -1]} intensity={0.3} color={theme.monitorGlow} distance={5} decay={2} />
    </group>
  )
}

// =============================================================================
// MONITOR WITH VIEW COMPONENT
// Uses drei/View for efficient rendering
// =============================================================================

interface MonitorWithViewProps {
  position: [number, number, number]
  rotation: [number, number, number]
  size: [number, number]
  theme: {
    wallColor: string
    accentColor: string
    monitorGlow: string
  }
  label: string
  children: React.ReactNode
}

function MonitorWithView({ position, rotation, size, theme, label, children }: MonitorWithViewProps) {
  const [width, height] = size
  const frameRef = useRef<HTMLDivElement>(null)
  
  return (
    <group position={position} rotation={rotation}>
      {/* Physical monitor frame */}
      <Box args={[width + 0.15, height + 0.15, 0.05]} position={[0, 0, -0.03]}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
      </Box>
      
      {/* Screen plane where View will project */}
      <Plane args={size}>
        <meshStandardMaterial color="#000000" />
      </Plane>
      
      {/* Glass cover */}
      <Plane args={size} position={[0, 0, 0.01]}>
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
          roughness={0.1}
          metalness={0.9}
          clearcoat={1}
        />
      </Plane>
      
      {/* HTML overlay for HUD */}
      <group position={[0, 0, 0.02]}>
        {/* Corner brackets */}
        <CornerBracket position={[-width/2 + 0.1, height/2 - 0.1, 0]} rotation={0} color={theme.accentColor} />
        <CornerBracket position={[width/2 - 0.1, height/2 - 0.1, 0]} rotation={Math.PI/2} color={theme.accentColor} />
        <CornerBracket position={[width/2 - 0.1, -height/2 + 0.1, 0]} rotation={Math.PI} color={theme.accentColor} />
        <CornerBracket position={[-width/2 + 0.1, -height/2 + 0.1, 0]} rotation={-Math.PI/2} color={theme.accentColor} />
        
        {/* Label */}
        <mesh position={[0, -height/2 - 0.15, 0]}>
          <planeGeometry args={[width * 0.6, 0.08]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
      </group>
    </group>
  )
}

function CornerBracket({ position, rotation, color }: { 
  position: [number, number, number]
  rotation: number
  color: string 
}) {
  return (
    <group position={position} rotation={[0, 0, rotation]}>
      <mesh position={[0.1, 0, 0]}>
        <planeGeometry args={[0.2, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <planeGeometry args={[0.02, 0.2]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}
