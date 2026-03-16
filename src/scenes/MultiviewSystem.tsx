import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { useAudioVisualSync } from '../systems/audioVisualSync'

// =============================================================================
// MULTIVIEW CAMERA SYSTEM
// 4 simultaneous live feeds in glassmorphism UI panels
// =============================================================================

export type MultiviewPanel = 'crane' | 'hook' | 'drone' | 'underwater' | 'none'

interface MultiviewSystemProps {
  enabled: boolean
  underwaterIntensity?: number
}

export default function MultiviewSystem({ enabled, underwaterIntensity = 1 }: MultiviewSystemProps) {
  const ships = useGameStore(state => state.ships)
  const currentShipId = useGameStore(state => state.currentShipId)
  const craneState = useGameStore(state => ({
    rotation: state.craneRotation ?? 0.2,
    height: state.craneHeight ?? 15.5,
    spreaderPos: state.spreaderPos ?? { x: 0, y: 10, z: 0 }
  }))
  const bpm = useGameStore(state => state.bpm)
  const spectatorState = useGameStore(state => state.spectatorState)
  
  const { audioData } = useAudioVisualSync()
  
  const currentShip = ships.find(s => s.id === currentShipId)
  
  // Virtual cameras
  const virtualCameras = useMemo(() => ({
    crane: new THREE.PerspectiveCamera(60, 1, 0.1, 1000),
    hook: new THREE.PerspectiveCamera(75, 1, 0.1, 1000),
    drone: new THREE.PerspectiveCamera(50, 1, 0.1, 1000),
    underwater: new THREE.PerspectiveCamera(70, 1, 0.1, 500)
  }), [])
  
  // Drone path
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
  
  // Camera update refs
  const droneProgressRef = useRef(0)
  const craneShakeRef = useRef({ x: 0, y: 0, intensity: 0 })
  const hookShakeRef = useRef({ x: 0, y: 0, intensity: 0 })
  
  // Update camera positions
  const updateCameras = useCallback((time: number, beatPhase: number) => {
    if (!currentShip) return
    
    const shipPos = new THREE.Vector3(...currentShip.position)
    
    // Crane camera
    const craneBaseX = Math.sin(craneState.rotation) * 18
    const craneBaseZ = Math.cos(craneState.rotation) * 8
    
    if (beatPhase < 0.15) {
      craneShakeRef.current.intensity = 0.2
    } else {
      craneShakeRef.current.intensity *= 0.9
    }
    craneShakeRef.current.x = (Math.random() - 0.5) * craneShakeRef.current.intensity
    craneShakeRef.current.y = (Math.random() - 0.5) * craneShakeRef.current.intensity
    
    virtualCameras.crane.position.set(
      craneBaseX + craneShakeRef.current.x,
      24 + craneShakeRef.current.y,
      craneBaseZ
    )
    virtualCameras.crane.lookAt(shipPos.x, shipPos.y + 5, shipPos.z)
    virtualCameras.crane.fov = 60 + audioData.bass * 3 // FOV zoom on bass
    virtualCameras.crane.updateProjectionMatrix()
    
    // Hook camera
    const hookPos = new THREE.Vector3(
      craneState.spreaderPos.x,
      craneState.spreaderPos.y - 5,
      craneState.spreaderPos.z
    )
    
    if (beatPhase < 0.15) {
      hookShakeRef.current.intensity = 0.15
    } else {
      hookShakeRef.current.intensity *= 0.9
    }
    hookShakeRef.current.x = (Math.random() - 0.5) * hookShakeRef.current.intensity
    hookShakeRef.current.y = (Math.random() - 0.5) * hookShakeRef.current.intensity
    
    virtualCameras.hook.position.set(
      hookPos.x + hookShakeRef.current.x,
      hookPos.y + hookShakeRef.current.y,
      hookPos.z
    )
    virtualCameras.hook.lookAt(hookPos.x, hookPos.y - 10, hookPos.z)
    virtualCameras.hook.fov = 75 + audioData.bass * 5
    virtualCameras.hook.updateProjectionMatrix()
    
    // Drone camera
    if (dronePath) {
      droneProgressRef.current += 0.001 + audioData.treble * 0.005
      if (droneProgressRef.current > 1) droneProgressRef.current = 0
      
      const dronePos = dronePath.getPoint(droneProgressRef.current)
      const droneTarget = dronePath.getPoint((droneProgressRef.current + 0.1) % 1)
      
      virtualCameras.drone.position.copy(dronePos)
      virtualCameras.drone.lookAt(droneTarget)
      virtualCameras.drone.updateProjectionMatrix()
    }
    
    // Underwater camera
    virtualCameras.underwater.position.set(
      shipPos.x + Math.sin(time * 0.1) * 10,
      -8,
      shipPos.z + 20 + Math.cos(time * 0.08) * 5
    )
    virtualCameras.underwater.lookAt(shipPos.x, -2, shipPos.z)
    virtualCameras.underwater.updateProjectionMatrix()
  }, [currentShip, craneState, dronePath, virtualCameras, audioData])
  
  // Render loop - just update cameras
  useFrame((state) => {
    if (!enabled || spectatorState.isActive) return
    
    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatPhase = (time % beatDuration) / beatDuration
    
    updateCameras(time, beatPhase)
  })
  
  if (!enabled || spectatorState.isActive) return null
  
  return (
    <MultiviewUI 
      enabled={enabled}
      currentShip={currentShip}
    />
  )
}

// =============================================================================
// UI COMPONENT - Just shows placeholder panels
// =============================================================================

interface MultiviewUIProps {
  enabled: boolean
  currentShip: ReturnType<typeof useGameStore.getState>['ships'][0] | undefined
}

function MultiviewUI({ enabled, currentShip }: MultiviewUIProps) {
  if (!enabled) return null
  
  const shipColors: Record<string, string> = {
    cruise: '#ff6b9d',
    container: '#00d4aa',
    tanker: '#ff9500',
    bulk: '#8b4513',
    lng: '#00bfff',
    roro: '#9b59b6',
    research: '#2ecc71',
    droneship: '#34495e'
  }
  const accentColor = currentShip ? shipColors[currentShip.type] || '#00d4aa' : '#00d4aa'
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '12px',
          width: 'min(90vw, 1200px)',
          height: 'min(80vh, 700px)',
          aspectRatio: '16/9'
        }}
      >
        <ViewPanel
          title="CRANE CAB"
          subtitle="POV"
          accentColor={accentColor}
          style={{ gridRow: 'span 2' }}
          icon="🎮"
        />
        <ViewPanel
          title="HOOK"
          subtitle="CAM"
          accentColor={accentColor}
          icon="🏗️"
        />
        <ViewPanel
          title="DRONE"
          subtitle="OVERVIEW"
          accentColor={accentColor}
          icon="🚁"
        />
        <ViewPanel
          title="UNDERWATER"
          subtitle="DEEP"
          accentColor="#00aaff"
          icon="🌊"
        />
      </div>
    </div>
  )
}

// =============================================================================
// VIEW PANEL COMPONENT
// =============================================================================

interface ViewPanelProps {
  title: string
  subtitle: string
  accentColor: string
  style?: React.CSSProperties
  icon?: string
}

function ViewPanel({ title, subtitle, accentColor, style, icon }: ViewPanelProps) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${accentColor}40`,
        boxShadow: `inset 0 0 20px ${accentColor}20, 0 4px 20px rgba(0,0,0,0.5)`,
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: `linear-gradient(90deg, ${accentColor}30, transparent)`,
          borderBottom: `1px solid ${accentColor}30`
        }}
      >
        <span style={{ fontSize: '14px' }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>
            {title}
          </div>
          <div style={{ fontSize: '9px', color: accentColor, letterSpacing: '0.5px' }}>
            {subtitle}
          </div>
        </div>
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#ff4444',
            boxShadow: '0 0 4px #ff4444',
            animation: 'pulse 1s ease-in-out infinite'
          }}
        />
      </div>

      {/* Placeholder content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${accentColor}10, transparent)`,
          color: accentColor,
          fontSize: '48px',
          opacity: 0.3
        }}
      >
        {icon}
      </div>

      {/* Corner accents */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '20px',
          height: '2px',
          background: accentColor
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '2px',
          height: '20px',
          background: accentColor
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '20px',
          height: '2px',
          background: accentColor
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '2px',
          height: '20px',
          background: accentColor
        }}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
