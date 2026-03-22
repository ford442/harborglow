import { useRef, useMemo, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { 
  RenderTexture, 
  PerspectiveCamera,
  Box,
  Plane,
  useCursor
} from '@react-three/drei'
import { useGameStore } from '../store/useGameStore'
import { useAudioVisualSync } from '../systems/audioVisualSync'

// =============================================================================
// MONITOR SYSTEM - Modular multi-camera setup for ControlBooth
// Integrates with existing MultiviewSystem cameras
// =============================================================================

interface MonitorSystemProps {
  /** The scene content to render in all monitors */
  children: React.ReactNode
  /** Quality preset for render textures */
  quality?: 'low' | 'medium' | 'high' | 'ultra'
  /** Enable hover/click interactions */
  interactive?: boolean
  /** Harbor theme for monitor colors */
  theme?: any
}

// =============================================================================
// MAIN MONITOR SYSTEM COMPONENT
// =============================================================================

export default function MonitorSystem({ 
  children, 
  quality = 'high',
  interactive = true 
}: MonitorSystemProps) {
  // Get existing camera states from your MultiviewSystem or store
  const ships = useGameStore(state => state.ships)
  const currentShipId = useGameStore(state => state.currentShipId)
  const craneState = useGameStore(state => ({
    rotation: state.craneRotation ?? 0.2,
    spreaderPos: state.spreaderPos ?? { x: 0, y: 10, z: 0 },
    height: state.craneHeight ?? 15.5
  }))
  const bpm = useGameStore(state => state.bpm)
  const { audioData } = useAudioVisualSync()
  
  const currentShip = ships.find(s => s.id === currentShipId)
  
  // Camera refs for animation
  const craneCabCamRef = useRef<THREE.PerspectiveCamera>(null)
  const hookCamRef = useRef<THREE.PerspectiveCamera>(null)
  const droneCamRef = useRef<THREE.PerspectiveCamera>(null)
  const underwaterCamRef = useRef<THREE.PerspectiveCamera>(null)
  
  // Track which monitor is enlarged (for click interaction)
  const [enlargedMonitor, setEnlargedMonitor] = useState<string | null>(null)
  
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
  
  // ================================================================
  // CAMERA ANIMATION LOOP
  // ================================================================
  useFrame((state) => {
    if (!currentShip) return
    
    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatPhase = (time % beatDuration) / beatDuration
    const shipPos = new THREE.Vector3(...currentShip.position)
    
    // === CRANE CAB CAMERA (Primary crane view) ===
    if (craneCabCamRef.current) {
      const craneBaseX = Math.sin(craneState.rotation) * 18
      const craneBaseZ = Math.cos(craneState.rotation) * 8
      
      // Beat-reactive shake
      if (beatPhase < 0.15) craneShakeRef.current.intensity = 0.15
      else craneShakeRef.current.intensity *= 0.9
      
      craneShakeRef.current.x = (Math.random() - 0.5) * craneShakeRef.current.intensity
      craneShakeRef.current.y = (Math.random() - 0.5) * craneShakeRef.current.intensity
      
      craneCabCamRef.current.position.set(
        craneBaseX + craneShakeRef.current.x,
        24 + craneShakeRef.current.y,
        craneBaseZ
      )
      craneCabCamRef.current.lookAt(shipPos.x, shipPos.y + 5, shipPos.z)
      craneCabCamRef.current.fov = 60 + audioData.bass * 3
      craneCabCamRef.current.updateProjectionMatrix()
    }
    
    // === HOOK CAMERA ===
    if (hookCamRef.current) {
      const hookPos = new THREE.Vector3(
        craneState.spreaderPos.x,
        craneState.spreaderPos.y - 5,
        craneState.spreaderPos.z
      )
      
      if (beatPhase < 0.15) hookShakeRef.current.intensity = 0.12
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
    
    // === DRONE CAMERA ===
    if (droneCamRef.current && dronePath) {
      droneProgressRef.current += 0.001 + audioData.treble * 0.005
      if (droneProgressRef.current > 1) droneProgressRef.current = 0
      
      const dronePos = dronePath.getPoint(droneProgressRef.current)
      const droneTarget = dronePath.getPoint((droneProgressRef.current + 0.1) % 1)
      
      droneCamRef.current.position.copy(dronePos)
      droneCamRef.current.lookAt(droneTarget)
      droneCamRef.current.updateProjectionMatrix()
    }
    
    // === UNDERWATER CAMERA ===
    if (underwaterCamRef.current) {
      underwaterCamRef.current.position.set(
        shipPos.x + Math.sin(time * 0.1) * 12,
        -5, // Below water level
        shipPos.z + 15 + Math.cos(time * 0.08) * 8
      )
      underwaterCamRef.current.lookAt(shipPos.x, 0, shipPos.z) // Look up at ship
      underwaterCamRef.current.updateProjectionMatrix()
    }
  })
  
  // ================================================================
  // QUALITY SETTINGS
  // ================================================================
  const textureSize = useMemo(() => {
    switch (quality) {
      case 'low': return 512
      case 'medium': return 1024
      case 'ultra': return 4096
      case 'high':
      default: return 2048
    }
  }, [quality])
  
  // ================================================================
  // MONITOR CONFIGURATIONS
  // ================================================================
  
  // Left Wall - Vertical Stack
  const leftMonitors = [
    {
      id: 'hook',
      name: 'HOOK CAM',
      position: [-3.6, 3.2, -0.3] as [number, number, number],
      rotation: [0, Math.PI / 2 + 0.15, 0] as [number, number, number],
      size: [1.6, 0.9] as [number, number], // 16:9 aspect
      cameraRef: hookCamRef,
      fov: 75,
      accentColor: '#ff6600'
    },
    {
      id: 'drone',
      name: 'DRONE',
      position: [-3.6, 1.6, -0.3] as [number, number, number],
      rotation: [0, Math.PI / 2 + 0.15, 0] as [number, number, number],
      size: [1.6, 0.9] as [number, number],
      cameraRef: droneCamRef,
      fov: 50,
      accentColor: '#00d4aa'
    }
  ]
  
  // Rear Wall - Large Center
  const rearMonitors = [
    {
      id: 'underwater',
      name: 'UNDERWATER',
      position: [0, 2.5, 3.6] as [number, number, number],
      rotation: [0, Math.PI, 0] as [number, number, number],
      size: [2.4, 1.35] as [number, number], // 16:9 aspect
      cameraRef: underwaterCamRef,
      fov: 70,
      accentColor: '#00aaff'
    }
  ]
  
  // Right Wall - Optional fourth monitor (Crane Cab view)
  const rightMonitors = [
    {
      id: 'crane',
      name: 'CRANE CAB',
      position: [3.6, 2.4, 0] as [number, number, number],
      rotation: [0, -Math.PI / 2 - 0.15, 0] as [number, number, number],
      size: [1.6, 0.9] as [number, number],
      cameraRef: craneCabCamRef,
      fov: 60,
      accentColor: '#ffcc00'
    }
  ]
  
  const allMonitors = [...leftMonitors, ...rearMonitors, ...rightMonitors]
  
  // Handle monitor click (enlarge/switch view)
  const handleMonitorClick = useCallback((id: string) => {
    setEnlargedMonitor(prev => prev === id ? null : id)
  }, [])
  
  return (
    <>
      {/* Render all monitors */}
      {allMonitors.map((monitor) => (
        <MonitorScreen
          key={monitor.id}
          {...monitor}
          textureSize={textureSize}
          isEnlarged={enlargedMonitor === monitor.id}
          onClick={() => interactive && handleMonitorClick(monitor.id)}
          quality={quality}
        >
          {children}
        </MonitorScreen>
      ))}
      
      {/* Enlarged view overlay - renders the selected camera full-screen */}
      {enlargedMonitor && (
        <EnlargedView 
          monitorId={enlargedMonitor}
          onClose={() => setEnlargedMonitor(null)}
          allMonitors={allMonitors}
        >
          {children}
        </EnlargedView>
      )}
    </>
  )
}

// =============================================================================
// INDIVIDUAL MONITOR SCREEN COMPONENT
// =============================================================================

interface MonitorScreenProps {
  id: string
  name: string
  position: [number, number, number]
  rotation: [number, number, number]
  size: [number, number]
  cameraRef: React.RefObject<THREE.PerspectiveCamera>
  fov: number
  accentColor: string
  textureSize: number
  isEnlarged: boolean
  onClick: () => void
  quality: string
  children: React.ReactNode
}

function MonitorScreen({
  id,
  name,
  position,
  rotation,
  size,
  cameraRef,
  fov,
  accentColor,
  textureSize,
  isEnlarged,
  onClick,
  quality,
  children
}: MonitorScreenProps) {
  const [width, height] = size
  const [hovered, setHovered] = useState(false)
  const [isReady, setIsReady] = useState(false)
  
  // Aspect ratio calculation for texture
  // Monitor is 16:9, texture should match
  const aspectRatio = width / height // Should be ~1.777 for 16:9
  const texWidth = textureSize
  const texHeight = Math.round(textureSize / aspectRatio)
  
  // Set cursor on hover
  useCursor(hovered)
  
  // Mark as ready after first frame
  useFrame(() => {
    if (!isReady && cameraRef.current) {
      setIsReady(true)
    }
  })
  
  return (
    <group 
      position={position} 
      rotation={rotation}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={isEnlarged ? 1.1 : hovered ? 1.02 : 1}
    >
      {/* Monitor Housing/Bezel */}
      <Box args={[width + 0.12, height + 0.12, 0.08]} position={[0, 0, -0.04]}>
        <meshStandardMaterial 
          color={0x1a1a1a}
          metalness={0.8}
          roughness={0.3}
        />
      </Box>
      
      {/* Screen Surface with RenderTexture */}
      <Plane args={size}>
        <meshPhysicalMaterial
          metalness={0.1}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive={accentColor}
          emissiveIntensity={isReady ? 0.05 : 0}
        >
          <RenderTexture
            attach="map"
            width={texWidth}
            height={texHeight}
            frames={1} // Update every frame
            stencilBuffer={false}
            depthBuffer={true}
          >
            {/* Camera for this monitor */}
            <PerspectiveCamera
              ref={cameraRef}
              makeDefault={false}
              position={[0, 10, 0]}
              fov={fov}
              near={0.1}
              far={2000}
              aspect={aspectRatio}
            />
            
            {/* Scene content */}
            {children}
            
            {/* Monitor-specific HUD overlay */}
            <MonitorHUD label={name} color={accentColor} />
          </RenderTexture>
        </meshPhysicalMaterial>
      </Plane>
      
      {/* Glass Cover with reflections */}
      <Plane args={size} position={[0, 0, 0.003]}>
        <meshPhysicalMaterial
          color={0xffffff}
          metalness={0}
          roughness={0.02}
          transmission={0.95}
          thickness={0.005}
          transparent
          opacity={0.03}
          envMapIntensity={1.5}
        />
      </Plane>
      
      {/* Fallback / Loading State */}
      {!isReady && (
        <Plane args={[width * 0.9, height * 0.9]} position={[0, 0, 0.006]}>
          <meshBasicMaterial color={0x000000} />
        </Plane>
      )}
      
      {/* Hover highlight effect */}
      {hovered && (
        <Plane args={[width + 0.02, height + 0.02]} position={[0, 0, 0.007]}>
          <meshBasicMaterial 
            color={accentColor} 
            transparent 
            opacity={0.1}
          />
        </Plane>
      )}
      
      {/* Status LED */}
      <group position={[width/2 - 0.08, height/2 - 0.08, 0.05]}>
        <mesh>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial 
            color={isReady ? 0x00ff00 : 0xff0000}
            emissive={isReady ? 0x00ff00 : 0xff0000}
            emissiveIntensity={0.8}
          />
        </mesh>
        {/* Blink animation for recording */}
        <pointLight
          color={isReady ? 0x00ff00 : 0xff0000}
          intensity={0.5}
          distance={0.3}
          decay={2}
        />
      </group>
      
      {/* Label */}
      <group position={[0, -height/2 - 0.1, 0.02]}>
        <Box args={[width * 0.4, 0.06, 0.01]}>
          <meshStandardMaterial color={0x2a2a2a} />
        </Box>
        {/* Glowing label strip */}
        <Plane args={[width * 0.35, 0.03]} position={[0, 0, 0.008]}>
          <meshBasicMaterial 
            color={accentColor}
            transparent
            opacity={0.7}
          />
        </Plane>
      </group>
    </group>
  )
}

// =============================================================================
// MONITOR HUD OVERLAY
// Renders inside each monitor's RenderTexture
// =============================================================================

interface MonitorHUDProps {
  label: string
  color: string
}

function MonitorHUD({ label, color }: MonitorHUDProps) {
  const colorObj = useMemo(() => new THREE.Color(color), [color])
  
  return (
    <>
      {/* Corner brackets */}
      <CornerBracket position={[-3.2, 2.2, -5]} rotation={0} color={colorObj} />
      <CornerBracket position={[3.2, 2.2, -5]} rotation={Math.PI / 2} color={colorObj} />
      <CornerBracket position={[3.2, -2.2, -5]} rotation={Math.PI} color={colorObj} />
      <CornerBracket position={[-3.2, -2.2, -5]} rotation={-Math.PI / 2} color={colorObj} />
      
      {/* Recording dot */}
      <mesh position={[3, 2.5, -5]}>
        <circleGeometry args={[0.06]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>
      
      {/* Crosshair center */}
      <group position={[0, 0, -5]}>
        <mesh>
          <planeGeometry args={[0.3, 0.015]} />
          <meshBasicMaterial color={colorObj} transparent opacity={0.6} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[0.3, 0.015]} />
          <meshBasicMaterial color={colorObj} transparent opacity={0.6} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.12, 0.14, 32]} />
          <meshBasicMaterial color={colorObj} transparent opacity={0.3} />
        </mesh>
      </group>
    </>
  )
}

function CornerBracket({ position, rotation, color }: { 
  position: [number, number, number]
  rotation: number
  color: THREE.Color
}) {
  return (
    <group position={position} rotation={[0, 0, rotation]}>
      <mesh position={[0.15, 0, 0]}>
        <planeGeometry args={[0.3, 0.025]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.3, 0.025]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

// =============================================================================
// ENLARGED VIEW OVERLAY
// Shows selected monitor in full-screen when clicked
// =============================================================================

interface EnlargedViewProps {
  monitorId: string
  onClose: () => void
  allMonitors: Array<{ id: string; name: string; cameraRef: React.RefObject<THREE.PerspectiveCamera>; fov: number }>
  children: React.ReactNode
}

function EnlargedView({ monitorId, onClose, allMonitors, children }: EnlargedViewProps) {
  const { viewport } = useThree()
  const monitor = allMonitors.find(m => m.id === monitorId)
  
  if (!monitor) return null
  
  return (
    <group position={[0, 2.5, 2]}>
      {/* Backdrop */}
      <Plane 
        args={[viewport.width, viewport.height]} 
        position={[0, 0, -0.1]}
        onClick={onClose}
      >
        <meshBasicMaterial color={0x000000} transparent opacity={0.7} />
      </Plane>
      
      {/* Enlarged screen */}
      <group position={[0, 0, 0]}>
        <Box args={[4.8, 2.7, 0.1]} position={[0, 0, -0.05]}>
          <meshStandardMaterial color={0x1a1a1a} />
        </Box>
        
        <Plane args={[4.6, 2.5875]}>
          <meshPhysicalMaterial
            metalness={0.1}
            roughness={0.2}
            clearcoat={1}
          >
            <RenderTexture
              attach="map"
              width={4096}
              height={2304}
              frames={1}
            >
              <PerspectiveCamera
                makeDefault={false}
                position={monitor.cameraRef.current?.position || [0, 10, 0]}
                fov={monitor.fov}
                near={0.1}
                far={2000}
                aspect={16/9}
              />
              {children}
              <MonitorHUD label={monitor.name} color="#ffffff" />
            </RenderTexture>
          </meshPhysicalMaterial>
        </Plane>
        
        {/* Close hint */}
        <Text
          position={[0, -1.6, 0.1]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
        >
          Click anywhere to close
        </Text>
      </group>
    </group>
  )
}

// =============================================================================
// FALLBACK TEXTURE HOOK
// Use this to show static image or black screen while loading
// =============================================================================

export function useMonitorFallback() {
  const fallbackTexture = useMemo(() => {
    // Create a black texture as fallback
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 288
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 512, 288)
    
    // Add "NO SIGNAL" text
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 24px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('NO SIGNAL', 256, 144)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
  
  return fallbackTexture
}

// =============================================================================
// ASPECT RATIO HELPER
// Calculate correct dimensions for any aspect ratio
// =============================================================================

export function useMonitorAspect(
  width: number, 
  aspectRatio: number = 16/9
): [number, number] {
  return useMemo(() => {
    const height = width / aspectRatio
    return [width, height]
  }, [width, aspectRatio])
}

// Common aspect ratios
export const ASPECT_RATIOS = {
  '16:9': 16/9,
  '21:9': 21/9,
  '4:3': 4/3,
  '1:1': 1,
  '9:16': 9/16,
} as const
