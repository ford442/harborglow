import { useRef, useMemo, useCallback, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { useAudioVisualSync } from '../systems/audioVisualSync'
import UnderwaterCamera from './UnderwaterCamera'

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
  const { scene, gl } = useThree()
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
  
  // Render targets for each view
  const renderTargets = useMemo(() => ({
    crane: new THREE.WebGLRenderTarget(512, 512, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    }),
    hook: new THREE.WebGLRenderTarget(512, 512, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    }),
    drone: new THREE.WebGLRenderTarget(512, 512, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    }),
    underwater: new THREE.WebGLRenderTarget(512, 512, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    })
  }), [])
  
  // Virtual cameras
  const virtualCameras = useMemo(() => {
    const cameras: Record<string, THREE.PerspectiveCamera> = {
      crane: new THREE.PerspectiveCamera(60, 1, 0.1, 1000),
      hook: new THREE.PerspectiveCamera(75, 1, 0.1, 1000),
      drone: new THREE.PerspectiveCamera(50, 1, 0.1, 1000),
      underwater: new THREE.PerspectiveCamera(70, 1, 0.1, 500)
    }
    
    // Configure underwater camera for proper underwater feel
    cameras.underwater.position.set(0, -8, 15)
    cameras.underwater.lookAt(0, -5, 0)
    
    return cameras
  }, [])
  
  // Drone path (Bézier curves)
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
  
  const droneProgressRef = useRef(0)
  const craneShakeRef = useRef({ x: 0, y: 0, intensity: 0 })
  const hookShakeRef = useRef({ x: 0, y: 0, intensity: 0 })
  
  // Update virtual camera positions
  const updateCameraPositions = useCallback((time: number, beatPhase: number) => {
    if (!currentShip) return
    
    const shipPos = new THREE.Vector3(...currentShip.position)
    
    // 1. CRANE CAB POV (largest, top-left)
    const craneBaseX = Math.sin(craneState.rotation) * 18
    const craneBaseZ = Math.cos(craneState.rotation) * 8
    
    // Music-reactive crane shake on bass
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
    virtualCameras.crane.lookAt(
      shipPos.x + Math.sin(time * 0.5) * 2,
      shipPos.y + 10,
      shipPos.z
    )
    
    // FOV zoom on beat
    virtualCameras.crane.fov = 60 + (beatPhase < 0.1 ? -3 : 0) + (audioData?.bass || 0) * 2
    
    // 2. HOOK-CAM (top-right)
    const hookX = craneBaseX + craneState.spreaderPos.x
    const hookY = Math.max(2, craneState.spreaderPos.y)
    const hookZ = craneBaseZ + craneState.spreaderPos.z
    
    // Hook shake on beat
    if (beatPhase < 0.1) {
      hookShakeRef.current.intensity = 0.15
    } else {
      hookShakeRef.current.intensity *= 0.9
    }
    hookShakeRef.current.x = (Math.random() - 0.5) * hookShakeRef.current.intensity
    hookShakeRef.current.y = (Math.random() - 0.5) * hookShakeRef.current.intensity
    
    virtualCameras.hook.position.set(
      hookX + hookShakeRef.current.x,
      hookY + hookShakeRef.current.y,
      hookZ
    )
    virtualCameras.hook.lookAt(hookX, hookY - 10, hookZ)
    virtualCameras.hook.fov = 75 + (beatPhase < 0.1 ? -5 : 0)
    
    // 3. DRONE OVERVIEW (bottom-left)
    if (dronePath) {
      droneProgressRef.current += 0.005
      if (droneProgressRef.current > 1) droneProgressRef.current = 0
      
      const point = dronePath.getPoint(droneProgressRef.current)
      const tangent = dronePath.getTangent(droneProgressRef.current)
      
      virtualCameras.drone.position.copy(point)
      virtualCameras.drone.lookAt(
        shipPos.clone().add(new THREE.Vector3(0, 5, 0).add(tangent.multiplyScalar(-10)))
      )
      
      // Variable speed - slow at interesting angles
      const pausePoint = Math.floor(droneProgressRef.current * 4) / 4
      if (Math.abs(droneProgressRef.current - pausePoint) < 0.05) {
        droneProgressRef.current -= 0.002
      }
    }
    
    // 4. UNDERWATER CAM (bottom-right)
    // Position below dock looking up at ship hull
    virtualCameras.underwater.position.set(
      shipPos.x + Math.sin(time * 0.1) * 10,
      -8,
      shipPos.z + 20 + Math.cos(time * 0.08) * 5
    )
    virtualCameras.underwater.lookAt(shipPos.x, -2, shipPos.z)
    virtualCameras.underwater.up.set(0, 1, 0)
    
    // Update camera matrices
    Object.values(virtualCameras).forEach(cam => cam.updateProjectionMatrix())
  }, [currentShip, craneState, dronePath, virtualCameras, audioData])
  
  // Render all views
  useFrame((state) => {
    if (!enabled) return
    
    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatPhase = (time % beatDuration) / beatDuration
    
    // Don't render multiview during spectator mode
    if (spectatorState.isActive) return
    
    updateCameraPositions(time, beatPhase)
    
    // Save current renderer state
    const currentRenderTarget = gl.getRenderTarget()
    const currentXrEnabled = gl.xr.enabled
    gl.xr.enabled = false
    
    // Render each view
    Object.entries(virtualCameras).forEach(([key, virtualCamera]) => {
      const target = renderTargets[key as keyof typeof renderTargets]
      if (!target) return
      
      gl.setRenderTarget(target)
      gl.render(scene, virtualCamera)
    })
    
    // Restore renderer state
    gl.setRenderTarget(currentRenderTarget)
    gl.xr.enabled = currentXrEnabled
  })
  
  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(renderTargets).forEach(target => target.dispose())
    }
  }, [renderTargets])
  
  // If not enabled, render underwater camera normally (for single-view underwater experience)
  if (!enabled) {
    return <UnderwaterCamera intensity={underwaterIntensity} />
  }
  
  return (
    <>
      {/* Underwater effects (visible in both multiview and normal) */}
      <UnderwaterCamera intensity={underwaterIntensity} />
      
      {/* Multiview UI Overlay - rendered as HTML via createPortal to a div */}
      <MultiviewUI 
        renderTargets={renderTargets}
        enabled={enabled}
        currentShip={currentShip}
      />
    </>
  )
}

// =============================================================================
// MULTIVIEW UI COMPONENT
// =============================================================================

interface MultiviewUIProps {
  renderTargets: {
    crane: THREE.WebGLRenderTarget
    hook: THREE.WebGLRenderTarget
    drone: THREE.WebGLRenderTarget
    underwater: THREE.WebGLRenderTarget
  }
  enabled: boolean
  currentShip: ReturnType<typeof useGameStore.getState>['ships'][0] | undefined
}

function MultiviewUI({ renderTargets, enabled, currentShip }: MultiviewUIProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [textures, setTextures] = useState<Record<string, string>>({})
  const frameCountRef = useRef(0)
  
  // Extract canvas data from render targets
  useFrame(() => {
    if (!enabled) return
    
    // Only update every 2nd frame for performance
    frameCountRef.current++
    if (frameCountRef.current % 2 !== 0) return
    
    const newTextures: Record<string, string> = {}
    
    Object.entries(renderTargets).forEach(([key, target]) => {
      const canvas = target.texture.image as HTMLCanvasElement
      if (canvas) {
        newTextures[key] = canvas.toDataURL('image/jpeg', 0.85)
      }
    })
    
    setTextures(newTextures)
  })
  
  if (!enabled) return null
  
  const shipColors: Record<string, string> = {
    cruise: '#ff6b9d',
    container: '#00d4aa',
    tanker: '#ff9500'
  }
  const accentColor = currentShip ? shipColors[currentShip.type] : '#00d4aa'
  
  return (
    <div
      ref={containerRef}
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
        {/* Crane Cab POV - Top Left (Largest) */}
        <ViewPanel
          title="CRANE CAB"
          subtitle="POV"
          texture={textures.crane}
          accentColor={accentColor}
          style={{ gridRow: 'span 2' }}
          icon="🎮"
        />
        
        {/* Hook-Cam - Top Right */}
        <ViewPanel
          title="HOOK"
          subtitle="CAM"
          texture={textures.hook}
          accentColor={accentColor}
          icon="🏗️"
        />
        
        {/* Drone Overview - Bottom Left */}
        <ViewPanel
          title="DRONE"
          subtitle="OVERVIEW"
          texture={textures.drone}
          accentColor={accentColor}
          icon="🚁"
        />
        
        {/* Underwater Cam - Bottom Right */}
        <ViewPanel
          title="UNDERWATER"
          subtitle="DEEP"
          texture={textures.underwater}
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
  texture: string | undefined
  accentColor: string
  icon: string
  style?: React.CSSProperties
}

function ViewPanel({ title, subtitle, texture, accentColor, icon, style }: ViewPanelProps) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'rgba(10, 15, 30, 0.7)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${accentColor}30`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
        ...style
      }}
    >
      {/* Glassmorphism overlay gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${accentColor}10 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      
      {/* Camera feed */}
      {texture ? (
        <img
          src={texture}
          alt={title}
          style={{
            width: '100%',
          height: '100%',
            objectFit: 'cover',
            opacity: 0.9
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          <span style={{ fontSize: '32px', opacity: 0.5 }}>{icon}</span>
        </div>
      )}
      
      {/* Label bar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          border: `1px solid ${accentColor}40`,
          zIndex: 2
        }}
      >
        <span style={{ fontSize: '14px' }}>{icon}</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: accentColor,
              letterSpacing: '1px'
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: '9px',
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: '0.5px'
            }}
          >
            {subtitle}
          </span>
        </div>
      </div>
      
      {/* Recording indicator */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#ff4444',
          boxShadow: '0 0 8px #ff4444',
          animation: 'pulse 1.5s ease-in-out infinite',
          zIndex: 2
        }}
      />
      
      {/* Corner accents */}
      <CornerAccent position="top-left" color={accentColor} />
      <CornerAccent position="top-right" color={accentColor} />
      <CornerAccent position="bottom-left" color={accentColor} />
      <CornerAccent position="bottom-right" color={accentColor} />
    </div>
  )
}

// =============================================================================
// CORNER ACCENT COMPONENT
// =============================================================================

function CornerAccent({ 
  position, 
  color 
}: { 
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  color: string 
}) {
  const positions = {
    'top-left': { top: 0, left: 0, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
    'top-right': { top: 0, right: 0, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` },
    'bottom-left': { bottom: 0, left: 0, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
    'bottom-right': { bottom: 0, right: 0, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }
  }
  
  return (
    <div
      style={{
        position: 'absolute',
        width: '20px',
        height: '20px',
        borderRadius: position.includes('top') ? '0 0 4px 0' : '4px 0 0 0',
        ...positions[position],
        zIndex: 2,
        pointerEvents: 'none'
      }}
    />
  )
}

export { MultiviewSystem }
