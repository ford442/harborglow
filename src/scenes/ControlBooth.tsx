import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree, createPortal } from '@react-three/fiber'
import { PerspectiveCamera as DreiPerspectiveCamera } from '@react-three/drei'
import { useGameStore } from '../store/useGameStore'
import { useAudioVisualSync } from '../systems/audioVisualSync'
import { 
  BoothRoom, 
  WindowFrame, 
  ControlDesk, 
  BoothLighting,
  createControlBoothMaterials,
  Monitor,
  MonitorHUD,
  MonitorConfigFactory
} from './controlBooth'

// =============================================================================
// CONTROL BOOTH - Main orchestrator component
// Thin wrapper composing all extracted modules
// =============================================================================

interface ControlBoothProps {
  children: React.ReactNode
  harborTheme?: 'industrial' | 'arctic' | 'tropical'
  debug?: boolean
  quality?: 'low' | 'medium' | 'high'
}

export default function ControlBooth({ 
  children, 
  harborTheme = 'industrial',
  debug = false,
  quality = 'high'
}: ControlBoothProps) {
  const { camera, scene } = useThree()
  const boothRef = useRef<THREE.Group>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
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
  // PLAYER CAMERA SETUP
  // ================================================================
  useEffect(() => {
    camera.position.set(0, 2.2, 3.2)
    camera.lookAt(0, 2.5, -20)
    ;(camera as THREE.PerspectiveCamera).fov = 65
    camera.updateProjectionMatrix()
    setIsInitialized(true)
    
    return () => {
      camera.position.set(10, 10, 10)
      camera.lookAt(0, 0, 0)
      ;(camera as THREE.PerspectiveCamera).fov = 50
      camera.updateProjectionMatrix()
    }
  }, [camera])
  
  // ================================================================
  // MATERIALS
  // ================================================================
  const materials = useMemo(() => {
    return createControlBoothMaterials(harborTheme)
  }, [harborTheme])
  
  // ================================================================
  // MONITOR CONFIGURATIONS AND CAMERA REFS
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
  // ANIMATION LOOP - Camera control
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
  
  return (
    <group ref={boothRef}>
      {/* ROOM STRUCTURE */}
      <BoothRoom materials={materials} />
      
      {/* FRONT WINDOW */}
      <WindowFrame materials={materials} />
      
      {/* CONTROL DESK */}
      <ControlDesk materials={materials} audioData={audioData} />
      
      {/* MONITOR SCREENS */}
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
        <MonitorHUD label="HOOK CAM" type="hook" />
      </Monitor>
      
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
      
      {/* MAIN SCENE CONTENT */}
      <group position={[0, 0, -15]}>
        {children}
      </group>
      
      {/* LIGHTING */}
      <BoothLighting />
      
      {/* DEBUG */}
      {debug && (
        <>
          <axesHelper args={[2]} position={[0, 2, 0]} />
          <gridHelper args={[10, 10]} position={[0, 0.01, 0]} />
        </>
      )}
    </group>
  )
}
