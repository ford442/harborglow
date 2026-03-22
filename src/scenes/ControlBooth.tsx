import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree, createPortal } from '@react-three/fiber'
import { 
  RenderTexture, 
  PerspectiveCamera as DreiPerspectiveCamera,
  Box,
  Plane,
  Cylinder,
  Sphere,
  MeshReflectorMaterial,
  useTexture,
  shaderMaterial,
  Billboard,
  Text
} from '@react-three/drei'
import { useGameStore } from '../store/useGameStore'
import { useAudioVisualSync } from '../systems/audioVisualSync'
import { extend } from '@react-three/fiber'

// =============================================================================
// SHADERS FOR REALISTIC MONITOR EFFECTS
// =============================================================================

// CRT Scanline + Flicker Shader
const CRTShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uTexture: null,
    uFlickerIntensity: 0.02,
    uScanlineIntensity: 0.15,
    uVignetteIntensity: 0.3,
    uRgbShift: 0.002,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform sampler2D uTexture;
    uniform float uFlickerIntensity;
    uniform float uScanlineIntensity;
    uniform float uVignetteIntensity;
    uniform float uRgbShift;
    
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      
      // Subtle screen flicker (power fluctuation)
      float flicker = 1.0 + sin(uTime * 10.0) * uFlickerIntensity * 0.5;
      flicker += sin(uTime * 23.7) * uFlickerIntensity * 0.3;
      
      // RGB Channel shift (chromatic aberration)
      float r = texture2D(uTexture, uv + vec2(uRgbShift, 0.0)).r;
      float g = texture2D(uTexture, uv).g;
      float b = texture2D(uTexture, uv - vec2(uRgbShift, 0.0)).b;
      
      vec3 color = vec3(r, g, b) * flicker;
      
      // Scanlines
      float scanline = sin(uv.y * 800.0) * 0.5 + 0.5;
      scanline = pow(scanline, 2.0) * uScanlineIntensity;
      color -= scanline;
      
      // Vignette (darker edges)
      float vignette = distance(uv, vec2(0.5));
      vignette = smoothstep(0.3, 0.9, vignette) * uVignetteIntensity;
      color *= (1.0 - vignette);
      
      // Slight color grading (warmer industrial monitors)
      color.r *= 1.05;
      color.b *= 0.95;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ CRTShaderMaterial })

// Glass distortion shader for window
const FoggedGlassMaterial = shaderMaterial(
  {
    uTime: 0,
    uFogDensity: 0.3,
    uOpacity: 0.15,
  },
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform float uFogDensity;
    uniform float uOpacity;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      // Subtle fog pattern on glass
      float fog = sin(vUv.x * 20.0 + uTime * 0.1) * cos(vUv.y * 15.0 + uTime * 0.15);
      fog = fog * 0.5 + 0.5;
      fog = pow(fog, 3.0) * uFogDensity;
      
      // Industrial tint
      vec3 color = vec3(0.85, 0.9, 0.95) * (0.9 + fog * 0.2);
      
      gl_FragColor = vec4(color, uOpacity + fog * 0.1);
    }
  `
)

extend({ FoggedGlassMaterial })

// =============================================================================
// TYPES
// =============================================================================

interface ControlBoothProps {
  /** The main scene content to render (dock, water, crane, ships) */
  children: React.ReactNode
  /** Harbor theme affecting booth appearance */
  harborTheme?: 'industrial' | 'arctic' | 'tropical'
  /** Whether to show debug helpers */
  debug?: boolean
  /** Monitor quality preset */
  quality?: 'low' | 'medium' | 'high'
}

interface MonitorConfig {
  position: [number, number, number]
  rotation: [number, number, number]
  size: [number, number] // width, height in meters
  curveRadius?: number // for curved screens
  label: string
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
  cameraFov: number
  type: 'hook' | 'drone' | 'underwater'
}

// =============================================================================
// MAIN CONTROL BOOTH COMPONENT
// =============================================================================

export default function ControlBooth({ 
  children, 
  harborTheme = 'industrial',
  debug = false,
  quality = 'high'
}: ControlBoothProps) {
  const { camera, scene } = useThree()
  const boothRef = useRef<THREE.Group>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Get state for camera positioning
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
  
  // ================================================================
  // PLAYER CAMERA SETUP - Inside booth looking out window
  // ================================================================
  useEffect(() => {
    // Position player inside booth, facing the window
    camera.position.set(0, 2.2, 3.2)
    camera.lookAt(0, 2.5, -20)
    camera.fov = 65
    camera.updateProjectionMatrix()
    setIsInitialized(true)
    
    return () => {
      // Reset camera on unmount
      camera.position.set(10, 10, 10)
      camera.lookAt(0, 0, 0)
      camera.fov = 50
      camera.updateProjectionMatrix()
    }
  }, [camera])
  
  // ================================================================
  // MATERIALS - Dark industrial metal with proper PBR
  // ================================================================
  const materials = useMemo(() => {
    const theme = harborTheme === 'arctic' 
      ? { wall: 0xc5d5e0, accent: 0x00aaff, metal: 0x4a5568 }
      : harborTheme === 'tropical'
      ? { wall: 0xd4c4a8, accent: 0xff9500, metal: 0x5a5a5a }
      : { wall: 0x2a2a35, accent: 0xff6600, metal: 0x3a3a45 }
    
    return {
      wall: new THREE.MeshStandardMaterial({
        color: theme.wall,
        metalness: 0.7,
        roughness: 0.6,
        side: THREE.DoubleSide
      }),
      floor: new THREE.MeshStandardMaterial({
        color: 0x1a1a20,
        metalness: 0.5,
        roughness: 0.8,
        side: THREE.DoubleSide
      }),
      metalFrame: new THREE.MeshStandardMaterial({
        color: theme.metal,
        metalness: 0.9,
        roughness: 0.3
      }),
      darkMetal: new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.8,
        roughness: 0.4
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.05,
        transmission: 0.95,
        thickness: 0.1,
        transparent: true,
        opacity: 0.1,
        envMapIntensity: 1
      }),
      foggedGlass: new THREE.MeshPhysicalMaterial({
        color: 0xe8f4f8,
        metalness: 0.1,
        roughness: 0.2,
        transmission: 0.7,
        thickness: 0.05,
        transparent: true,
        opacity: 0.3,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: theme.accent,
        emissive: theme.accent,
        emissiveIntensity: 0.2,
        metalness: 0.6,
        roughness: 0.4
      }),
      buttonActive: new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.8,
        metalness: 0.5,
        roughness: 0.3
      }),
      buttonInactive: new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.5,
        roughness: 0.5
      })
    }
  }, [harborTheme])
  
  // ================================================================
  // MONITOR CONFIGURATIONS
  // ================================================================
  const monitorConfigs: MonitorConfig[] = useMemo(() => {
    // Calculate curved positions
    const leftWallX = -3.8
    const rearWallZ = 3.8
    
    return [
      // Left Wall - Hook Cam (upper)
      {
        position: [leftWallX, 3.0, -0.5],
        rotation: [0, Math.PI / 2 + 0.15, 0], // Tilted toward player
        size: [2.0, 1.25],
        curveRadius: 5,
        label: 'HOOK CAM',
        cameraPosition: [0, 10, 0],
        cameraTarget: [0, 0, 0],
        cameraFov: 75,
        type: 'hook'
      },
      // Left Wall - Drone Cam (lower)
      {
        position: [leftWallX, 1.2, -0.5],
        rotation: [0, Math.PI / 2 + 0.15, 0],
        size: [2.0, 1.25],
        curveRadius: 5,
        label: 'DRONE',
        cameraPosition: [30, 20, 30],
        cameraTarget: [0, 0, 0],
        cameraFov: 50,
        type: 'drone'
      },
      // Rear Wall - Underwater Cam (large center)
      {
        position: [0, 2.5, rearWallZ],
        rotation: [0, Math.PI, 0],
        size: [2.8, 1.8],
        curveRadius: 8,
        label: 'UNDERWATER',
        cameraPosition: [0, -8, 20],
        cameraTarget: [0, 0, 0],
        cameraFov: 70,
        type: 'underwater'
      }
    ]
  }, [])
  
  // ================================================================
  // CAMERA ANIMATION REFS
  // ================================================================
  const craneCamRef = useRef<THREE.PerspectiveCamera>(null)
  const hookCamRef = useRef<THREE.PerspectiveCamera>(null)
  const droneCamRef = useRef<THREE.PerspectiveCamera>(null)
  const underwaterCamRef = useRef<THREE.PerspectiveCamera>(null)
  
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
  // ANIMATION LOOP
  // ================================================================
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
  
  // Shader time update
  const crtRef = useRef<THREE.ShaderMaterial>(null)
  const glassRef = useRef<THREE.ShaderMaterial>(null)
  
  useFrame((state) => {
    if (crtRef.current) {
      crtRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
    if (glassRef.current) {
      glassRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  // ================================================================
  // RENDER
  // ================================================================
  return (
    <group ref={boothRef}>
      {/* ============================================================ */}
      {/* ROOM STRUCTURE - Dark Industrial Metal */}
      {/* ============================================================ */}
      
      {/* Floor - Metal grating look */}
      <Box args={[8, 0.1, 8]} position={[0, 0.05, 0]} receiveShadow>
        <meshStandardMaterial 
          color={0x1a1a20} 
          metalness={0.6}
          roughness={0.7}
        />
      </Box>
      
      {/* Floor detail - metal strips */}
      {Array.from({ length: 7 }, (_, i) => (
        <Box 
          key={`floor-strip-${i}`}
          args={[8, 0.02, 0.05]} 
          position={[0, 0.11, -3.5 + i]}
        >
          <meshStandardMaterial color={0x333333} metalness={0.8} roughness={0.4} />
        </Box>
      ))}
      
      {/* Ceiling */}
      <Box args={[8, 0.2, 8]} position={[0, 4.1, 0]} castShadow>
        <meshStandardMaterial 
          color={0x2a2a35}
          metalness={0.7}
          roughness={0.6}
        />
      </Box>
      
      {/* Ceiling lights */}
      <group position={[0, 3.95, 0]}>
        {[[-2, -2], [2, -2], [-2, 2], [2, 2]].map(([x, z], i) => (
          <group key={`ceiling-light-${i}`} position={[x, 0, z]}>
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
      
      {/* Left Wall with monitor cutouts (conceptually - we place monitors in front) */}
      <Box args={[0.3, 4, 8]} position={[-3.85, 2, 0]} castShadow receiveShadow>
        <primitive object={materials.wall} attach="material" />
      </Box>
      
      {/* Right Wall */}
      <Box args={[0.3, 4, 8]} position={[3.85, 2, 0]} castShadow receiveShadow>
        <primitive object={materials.wall} attach="material" />
      </Box>
      
      {/* Rear Wall */}
      <Box args={[8, 4, 0.3]} position={[0, 2, 3.85]} castShadow receiveShadow>
        <primitive object={materials.wall} attach="material" />
      </Box>
      
      {/* ============================================================ */}
      {/* FRONT WINDOW - Large panoramic opening with frame */}
      {/* ============================================================ */}
      
      {/* Window Frame - Metal surround */}
      {/* Left frame */}
      <Box args={[1.5, 3.5, 0.2]} position={[-3.25, 2.25, -3.9]} castShadow>
        <primitive object={materials.metalFrame} attach="material" />
      </Box>
      {/* Right frame */}
      <Box args={[1.5, 3.5, 0.2]} position={[3.25, 2.25, -3.9]} castShadow>
        <primitive object={materials.metalFrame} attach="material" />
      </Box>
      {/* Top frame */}
      <Box args={[5, 0.75, 0.2]} position={[0, 4.125, -3.9]} castShadow>
        <primitive object={materials.metalFrame} attach="material" />
      </Box>
      {/* Bottom frame */}
      <Box args={[5, 0.25, 0.2]} position={[0, 0.875, -3.9]} castShadow>
        <primitive object={materials.metalFrame} attach="material" />
      </Box>
      
      {/* Window Glass - Slightly fogged for atmosphere */}
      <Plane args={[5, 3.5]} position={[0, 2.5, -3.85]}>
        <primitive object={materials.foggedGlass} attach="material" />
      </Plane>
      
      {/* Window detail - corner bolts */}
      {[[-2.9, 4], [2.9, 4], [-2.9, 1], [2.9, 1]].map(([x, y], i) => (
        <Cylinder 
          key={`bolt-${i}`}
          args={[0.04, 0.04, 0.1]} 
          position={[x, y, -3.8]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color={0x444444} metalness={0.9} roughness={0.2} />
        </Cylinder>
      ))}
      
      {/* ============================================================ */}
      {/* CONTROL DESK/CONSOLE - In front of player */}
      {/* ============================================================ */}
      
      <group position={[0, 0, 1.5]}>
        {/* Main desk surface */}
        <Box args={[3.5, 0.08, 1.2]} position={[0, 1.1, 0]} castShadow>
          <meshStandardMaterial color={0x2a2a35} metalness={0.7} roughness={0.5} />
        </Box>
        
        {/* Desk edge trim */}
        <Box args={[3.5, 0.02, 0.05]} position={[0, 1.16, -0.58]}>
          <primitive object={materials.accent} attach="material" />
        </Box>
        
        {/* Control panels - left side */}
        <Box args={[0.8, 0.05, 0.6]} position={[-1.2, 1.18, -0.2]}>
          <meshStandardMaterial color={0x1a1a1a} metalness={0.5} roughness={0.6} />
        </Box>
        
        {/* Control panels - right side */}
        <Box args={[0.8, 0.05, 0.6]} position={[1.2, 1.18, -0.2]}>
          <meshStandardMaterial color={0x1a1a1a} metalness={0.5} roughness={0.6} />
        </Box>
        
        {/* Glowing buttons - music reactive */}
        <MusicReactiveButtons audioData={audioData} />
        
        {/* Joysticks */}
        <Joystick position={[-0.8, 1.2, 0.1]} audioData={audioData} />
        <Joystick position={[0.8, 1.2, 0.1]} audioData={audioData} />
        
        {/* Central display panel */}
        <Box args={[1.2, 0.4, 0.05]} position={[0, 1.4, -0.55]}>
          <meshStandardMaterial 
            color={0x0a0a0a} 
            emissive={0x00d4aa}
            emissiveIntensity={0.1 + audioData.bass * 0.3}
            metalness={0.8}
            roughness={0.2}
          />
        </Box>
        
        {/* Desk legs/supports */}
        <Box args={[0.15, 1.1, 1]} position={[-1.5, 0.55, 0]}>
          <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.5} />
        </Box>
        <Box args={[0.15, 1.1, 1]} position={[1.5, 0.55, 0]}>
          <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.5} />
        </Box>
      </group>
      
      {/* ============================================================ */}
      {/* MONITOR SCREENS - Curved and tilted toward player */}
      {/* ============================================================ */}
      
      {/* Hook Cam Monitor - Left wall upper */}
      <Monitor
        position={[-3.6, 3.0, -0.5]}
        rotation={[0, Math.PI / 2 + 0.2, 0]}
        size={[1.8, 1.1]}
        curveRadius={4}
        label="HOOK CAM"
        materials={materials}
        quality={quality}
      >
        <DreiPerspectiveCamera
          ref={hookCamRef}
          makeDefault={false}
          position={[0, 10, 0]}
          fov={75}
          near={0.1}
          far={1000}
        />
        {children}
        {/* HUD overlay */}
        <MonitorHUD label="HOOK CAM" type="hook" />
      </Monitor>
      
      {/* Drone Monitor - Left wall lower */}
      <Monitor
        position={[-3.6, 1.3, -0.5]}
        rotation={[0, Math.PI / 2 + 0.2, 0]}
        size={[1.8, 1.1]}
        curveRadius={4}
        label="DRONE"
        materials={materials}
        quality={quality}
      >
        <DreiPerspectiveCamera
          ref={droneCamRef}
          makeDefault={false}
          position={[30, 20, 30]}
          fov={50}
          near={0.1}
          far={1000}
        />
        {children}
        <MonitorHUD label="DRONE CAM" type="drone" />
      </Monitor>
      
      {/* Underwater Monitor - Rear wall large */}
      <Monitor
        position={[0, 2.5, 3.6]}
        rotation={[0, Math.PI, 0]}
        size={[2.4, 1.5]}
        curveRadius={6}
        label="UNDERWATER"
        materials={materials}
        quality={quality}
      >
        <DreiPerspectiveCamera
          ref={underwaterCamRef}
          makeDefault={false}
          position={[0, -8, 20]}
          fov={70}
          near={0.1}
          far={500}
        />
        {children}
        <MonitorHUD label="DEEP CAM" type="underwater" />
      </Monitor>
      
      {/* ============================================================ */}
      {/* MAIN SCENE CONTENT - Visible through window */}
      {/* ============================================================ */}
      <group position={[0, 0, -15]}>
        {children}
      </group>
      
      {/* ============================================================ */}
      {/* BOOTH LIGHTING - Ambient and accent */}
      {/* ============================================================ */}
      
      {/* Ambient booth light */}
      <pointLight
        position={[0, 3.5, 1]}
        intensity={0.4}
        color={0x88ccff}
        distance={8}
        decay={2}
      />
      
      {/* Monitor glow lights */}
      <pointLight
        position={[-3.3, 3, -0.5]}
        intensity={0.5}
        color={0x00d4aa}
        distance={4}
        decay={2}
      />
      <pointLight
        position={[-3.3, 1.3, -0.5]}
        intensity={0.5}
        color={0x00d4aa}
        distance={4}
        decay={2}
      />
      <pointLight
        position={[0, 2.5, 3.3]}
        intensity={0.4}
        color={0x00aaff}
        distance={5}
        decay={2}
      />
      
      {/* Window edge light (simulating outside) */}
      <rectAreaLight
        position={[0, 2.5, -3.5]}
        width={5}
        height={3.5}
        intensity={0.3}
        color={0xffffff}
        lookAt={[0, 2.5, 0]}
      />
      
      {/* Debug helpers */}
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
// MONITOR COMPONENT - Curved screen with RenderTexture
// =============================================================================

interface MonitorProps {
  position: [number, number, number]
  rotation: [number, number, number]
  size: [number, number]
  curveRadius?: number
  label: string
  materials: Record<string, THREE.Material>
  quality: 'low' | 'medium' | 'high'
  children: React.ReactNode
}

function Monitor({ 
  position, 
  rotation, 
  size, 
  curveRadius = 5,
  label,
  materials,
  quality,
  children 
}: MonitorProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [width, height] = size
  
  // Calculate segments based on quality
  const segments = quality === 'high' ? 32 : quality === 'medium' ? 16 : 8
  const textureSize = quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512
  
  // Create curved geometry
  const curvedGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(width, height, segments, 1)
    const positions = geometry.attributes.position.array as Float32Array
    
    // Curve the vertices
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      // Curve along X axis
      const angle = x / curveRadius
      positions[i] = Math.sin(angle) * curveRadius
      positions[i + 2] = Math.cos(angle) * curveRadius - curveRadius
    }
    
    geometry.computeVertexNormals()
    return geometry
  }, [width, height, curveRadius, segments])
  
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Monitor housing/bezel */}
      <mesh geometry={curvedGeometry} position={[0, 0, -0.05]}>
        <Box args={[width + 0.15, height + 0.15, 0.1]}>
          <meshStandardMaterial 
            color={0x1a1a1a}
            metalness={0.8}
            roughness={0.3}
          />
        </Box>
      </mesh>
      
      {/* Screen with RenderTexture */}
      <mesh geometry={curvedGeometry} castShadow>
        <meshPhysicalMaterial
          metalness={0.2}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
        >
          <RenderTexture
            attach="map"
            width={textureSize}
            height={textureSize * (height / width)}
            frames={1}
            stencilBuffer={false}
            depthBuffer={true}
          >
            {children}
          </RenderTexture>
        </meshPhysicalMaterial>
      </mesh>
      
      {/* Glass cover with reflections */}
      <mesh geometry={curvedGeometry} position={[0, 0, 0.005]}>
        <meshPhysicalMaterial
          color={0xffffff}
          metalness={0}
          roughness={0.05}
          transmission={0.9}
          thickness={0.01}
          transparent
          opacity={0.05}
          envMapIntensity={2}
        />
      </mesh>
      
      {/* Label plate */}
      <group position={[0, -height/2 - 0.12, 0]}>
        <Box args={[width * 0.5, 0.08, 0.02]}>
          <meshStandardMaterial color={0x2a2a2a} metalness={0.6} roughness={0.5} />
        </Box>
        {/* Label text as glowing strip */}
        <Plane args={[width * 0.4, 0.03]} position={[0, 0, 0.015]}>
          <meshBasicMaterial 
            color={0x00d4aa}
            transparent
            opacity={0.8}
          />
        </Plane>
      </group>
      
      {/* Status LED */}
      <Sphere args={[0.03]} position={[width/2 - 0.1, height/2 - 0.1, 0.05]}>
        <meshStandardMaterial 
          color={0x00ff00}
          emissive={0x00ff00}
          emissiveIntensity={0.8}
        />
      </Sphere>
    </group>
  )
}

// =============================================================================
// MONITOR HUD - Overlay inside each monitor view
// =============================================================================

interface MonitorHUDProps {
  label: string
  type: 'hook' | 'drone' | 'underwater'
}

function MonitorHUD({ label, type }: MonitorHUDProps) {
  const color = type === 'underwater' ? '#00aaff' : type === 'drone' ? '#ff9500' : '#00d4aa'
  
  return (
    <>
      {/* Corner brackets */}
      <group position={[-3.5, 2.5, -10]}>
        <mesh>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI/2]}>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
      
      <group position={[3.5, 2.5, -10]}>
        <mesh>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI/2]}>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
      
      <group position={[-3.5, -2.5, -10]}>
        <mesh>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.15, 0]} rotation={[0, 0, Math.PI/2]}>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
      
      <group position={[3.5, -2.5, -10]}>
        <mesh>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.15, 0]} rotation={[0, 0, Math.PI/2]}>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
      
      {/* Recording dot */}
      <mesh position={[3.2, 2.8, -10]}>
        <circleGeometry args={[0.08]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      {/* Crosshair */}
      <group position={[0, 0, -10]}>
        <mesh>
          <planeGeometry args={[0.4, 0.02]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <planeGeometry args={[0.4, 0.02]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.15, 0.17, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      </group>
    </>
  )
}

// =============================================================================
// MUSIC REACTIVE BUTTONS
// =============================================================================

function MusicReactiveButtons({ audioData }: { audioData: { bass: number; mid: number; treble: number } }) {
  const buttonCount = 8
  
  return (
    <>
      {/* Left panel buttons */}
      {Array.from({ length: 4 }, (_, i) => {
        const row = Math.floor(i / 2)
        const col = i % 2
        const isActive = audioData.bass > 0.3 + i * 0.1
        
        return (
          <Cylinder
            key={`btn-left-${i}`}
            args={[0.04, 0.04, 0.02]}
            position={[-1.4 + col * 0.15, 1.22, -0.35 + row * 0.15]}
          >
            <meshStandardMaterial
              color={isActive ? 0x00ff00 : 0x333333}
              emissive={isActive ? 0x00ff00 : 0x000000}
              emissiveIntensity={isActive ? 0.8 : 0}
              metalness={0.5}
              roughness={0.4}
            />
          </Cylinder>
        )
      })}
      
      {/* Right panel buttons */}
      {Array.from({ length: 4 }, (_, i) => {
        const row = Math.floor(i / 2)
        const col = i % 2
        const isActive = audioData.treble > 0.2 + i * 0.15
        
        return (
          <Cylinder
            key={`btn-right-${i}`}
            args={[0.04, 0.04, 0.02]}
            position={[1.25 + col * 0.15, 1.22, -0.35 + row * 0.15]}
          >
            <meshStandardMaterial
              color={isActive ? 0xff6600 : 0x333333}
              emissive={isActive ? 0xff6600 : 0x000000}
              emissiveIntensity={isActive ? 0.8 : 0}
              metalness={0.5}
              roughness={0.4}
            />
          </Cylinder>
        )
      })}
    </>
  )
}

// =============================================================================
// JOYSTICK COMPONENT
// =============================================================================

function Joystick({ position, audioData }: { position: [number, number, number]; audioData: any }) {
  const stickRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (stickRef.current) {
      // Subtle idle animation
      const time = state.clock.elapsedTime
      stickRef.current.rotation.x = Math.sin(time * 0.5) * 0.05 + audioData.bass * 0.02
      stickRef.current.rotation.z = Math.cos(time * 0.3) * 0.05
    }
  })
  
  return (
    <group position={position}>
      {/* Base */}
      <Cylinder args={[0.12, 0.15, 0.08]} position={[0, -0.04, 0]}>
        <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.4} />
      </Cylinder>
      
      {/* Stick */}
      <group ref={stickRef}>
        <Cylinder args={[0.04, 0.04, 0.25]} position={[0, 0.125, 0]}>
          <meshStandardMaterial color={0x555555} metalness={0.6} roughness={0.5} />
        </Cylinder>
        
        {/* Handle */}
        <Sphere args={[0.08]} position={[0, 0.28, 0]}>
          <meshStandardMaterial 
            color={0x2a2a35}
            metalness={0.5}
            roughness={0.6}
          />
        </Sphere>
        
        {/* Grip texture */}
        <Cylinder args={[0.082, 0.082, 0.1]} position={[0, 0.28, 0]}>
          <meshStandardMaterial 
            color={0x1a1a1a}
            metalness={0.3}
            roughness={0.9}
          />
        </Cylinder>
      </group>
    </group>
  )
}
