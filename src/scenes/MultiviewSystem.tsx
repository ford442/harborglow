import { useRef, useMemo, useCallback, useEffect, forwardRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { View, Html, PerspectiveCamera } from '@react-three/drei'
import { useGameStore, type CameraTransform } from '../store/useGameStore'
import type { DashboardViewportId } from '../types/CameraPreset'
import { useAudioVisualSync } from '../systems/audioVisualSync'

// =============================================================================
// MULTIVIEW CAMERA SYSTEM — Alt A Architecture
// 4 simultaneous live feeds with viewport-local history & pinned snapshots
// =============================================================================

const VIEWPORT_ORDER: DashboardViewportId[] = ['crane', 'hook', 'drone', 'underwater']

const VIEWPORT_CONFIG: Record<DashboardViewportId, { title: string; subtitle: string; icon: string; accentColor: string; fov: number }> = {
  crane: { title: 'CRANE CAB', subtitle: 'POV', icon: '🎮', accentColor: '#ffcc00', fov: 60 },
  hook: { title: 'HOOK', subtitle: 'CAM', icon: '🏗️', accentColor: '#ff9500', fov: 75 },
  drone: { title: 'DRONE', subtitle: 'OVERVIEW', icon: '🚁', accentColor: '#00d4aa', fov: 50 },
  underwater: { title: 'UNDERWATER', subtitle: 'DEEP', icon: '🌊', accentColor: '#00aaff', fov: 70 }
}

interface MultiviewSystemProps {
  enabled: boolean
  underwaterIntensity?: number
  children?: React.ReactNode
}

export default function MultiviewSystem({ enabled, underwaterIntensity = 1, children }: MultiviewSystemProps) {
  const { audioData } = useAudioVisualSync()

  // ---------------------------------------------------------------------------
  // Panel DOM refs for <View track={...}>
  // ---------------------------------------------------------------------------
  const panelRefs = {
    crane: useRef<HTMLDivElement>(null!) as React.MutableRefObject<HTMLDivElement>,
    hook: useRef<HTMLDivElement>(null!) as React.MutableRefObject<HTMLDivElement>,
    drone: useRef<HTMLDivElement>(null!) as React.MutableRefObject<HTMLDivElement>,
    underwater: useRef<HTMLDivElement>(null!) as React.MutableRefObject<HTMLDivElement>
  }

  // ---------------------------------------------------------------------------
  // Camera refs for animation
  // ---------------------------------------------------------------------------
  const cameraRefs = {
    crane: useRef<THREE.PerspectiveCamera>(null),
    hook: useRef<THREE.PerspectiveCamera>(null),
    drone: useRef<THREE.PerspectiveCamera>(null),
    underwater: useRef<THREE.PerspectiveCamera>(null)
  }

  // ---------------------------------------------------------------------------
  // Animation refs
  // ---------------------------------------------------------------------------
  const droneProgressRef = useRef(0)
  const craneShakeRef = useRef({ x: 0, y: 0, intensity: 0 })
  const hookShakeRef = useRef({ x: 0, y: 0, intensity: 0 })
  const initializedRef = useRef(false)

  // ---------------------------------------------------------------------------
  // Derive current ship & crane state (reactive for render)
  // ---------------------------------------------------------------------------
  const ships = useGameStore(state => state.ships)
  const currentShipId = useGameStore(state => state.currentShipId)
  const currentShip = ships.find(s => s.id === currentShipId)
  const spectatorState = useGameStore(state => state.spectatorState)
  const bpm = useGameStore(state => state.bpm)
  const craneState = useGameStore(state => ({
    rotation: state.craneRotation ?? 0.2,
    height: state.craneHeight ?? 15.5,
    spreaderPos: state.spreaderPos ?? { x: 0, y: 10, z: 0 }
  }))

  // ---------------------------------------------------------------------------
  // Drone orbit path
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Compute live camera transform for each viewport
  // ---------------------------------------------------------------------------
  const getLiveTransform = useCallback((viewportId: DashboardViewportId, time: number, beatPhase: number): CameraTransform => {
    if (!currentShip) {
      return { position: [30, 20, 30], target: [0, 0, 0], label: 'Default' }
    }

    const shipPos = new THREE.Vector3(...currentShip.position)

    switch (viewportId) {
      case 'crane': {
        const craneBaseX = Math.sin(craneState.rotation) * 18
        const craneBaseZ = Math.cos(craneState.rotation) * 8
        if (beatPhase < 0.15) {
          craneShakeRef.current.intensity = 0.2
        } else {
          craneShakeRef.current.intensity *= 0.9
        }
        craneShakeRef.current.x = (Math.random() - 0.5) * craneShakeRef.current.intensity
        craneShakeRef.current.y = (Math.random() - 0.5) * craneShakeRef.current.intensity

        const position: [number, number, number] = [
          craneBaseX + craneShakeRef.current.x,
          24 + craneShakeRef.current.y,
          craneBaseZ
        ]
        return { position, target: [shipPos.x, shipPos.y + 5, shipPos.z] }
      }

      case 'hook': {
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

        const position: [number, number, number] = [
          hookPos.x + hookShakeRef.current.x,
          hookPos.y + hookShakeRef.current.y,
          hookPos.z
        ]
        return { position, target: [hookPos.x, hookPos.y - 10, hookPos.z] }
      }

      case 'drone': {
        if (dronePath) {
          droneProgressRef.current += 0.001 + audioData.treble * 0.005
          if (droneProgressRef.current > 1) droneProgressRef.current = 0
          const dronePos = dronePath.getPoint(droneProgressRef.current)
          const droneTarget = dronePath.getPoint((droneProgressRef.current + 0.1) % 1)
          return {
            position: [dronePos.x, dronePos.y, dronePos.z],
            target: [droneTarget.x, droneTarget.y, droneTarget.z]
          }
        }
        return { position: [0, 16, 0], target: [shipPos.x, shipPos.y + 5, shipPos.z] }
      }

      case 'underwater': {
        return {
          position: [
            shipPos.x + Math.sin(time * 0.1) * 10,
            -8 * underwaterIntensity,
            shipPos.z + 20 + Math.cos(time * 0.08) * 5
          ],
          target: [shipPos.x, -2, shipPos.z]
        }
      }

      default:
        return { position: [30, 20, 30], target: [shipPos.x, shipPos.y, shipPos.z] }
    }
  }, [currentShip, craneState, dronePath, audioData.treble, underwaterIntensity])

  // ---------------------------------------------------------------------------
  // Apply a CameraTransform to a Three.js camera
  // ---------------------------------------------------------------------------
  const applyTransform = useCallback((camera: THREE.PerspectiveCamera | null, transform: CameraTransform, fov: number, beatPhase: number, viewportId: DashboardViewportId) => {
    if (!camera) return
    camera.position.set(...transform.position)
    camera.lookAt(...transform.target)
    // Music-reactive FOV zoom on bass
    let targetFov = fov
    if (beatPhase < 0.1) {
      targetFov *= 0.98
    }
    if (viewportId === 'crane') {
      targetFov += audioData.bass * 3
    } else if (viewportId === 'hook') {
      targetFov += audioData.bass * 5
    }
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.05)
    camera.updateProjectionMatrix()
  }, [audioData.bass])

  // ---------------------------------------------------------------------------
  // Main camera update loop
  // ---------------------------------------------------------------------------
  useFrame((state) => {
    if (!enabled || spectatorState.isActive) return

    const store = useGameStore.getState()
    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatPhase = (time % beatDuration) / beatDuration

    try {
      VIEWPORT_ORDER.forEach((viewportId) => {
        const vp = store.viewportCameras[viewportId]
        const camera = cameraRefs[viewportId].current
        const liveTransform = getLiveTransform(viewportId, time, beatPhase)

        // Initialize history on first frame
        if (vp.history.length === 0) {
          store.pushViewportHistory(viewportId, liveTransform)
          return
        }

        // Apply either history entry or live position
        if (vp.historyIndex === vp.history.length - 1) {
          // At tip: show live position
          applyTransform(camera, liveTransform, VIEWPORT_CONFIG[viewportId].fov, beatPhase, viewportId)
        } else {
          // Browsing history
          const historyEntry = vp.history[vp.historyIndex]
          if (historyEntry) {
            applyTransform(camera, historyEntry, VIEWPORT_CONFIG[viewportId].fov, beatPhase, viewportId)
          }
        }
      })
    } finally {
      state.gl.setScissorTest(false)
    }
  })

  // ---------------------------------------------------------------------------
  // Keyboard: Shift+1..6 recalls pinned[0..5] for focused viewport
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey) return
      const keyNum = parseInt(event.key, 10)
      if (isNaN(keyNum) || keyNum < 1 || keyNum > 6) return

      // Do not steal keys when user is typing
      const activeTag = document.activeElement?.tagName
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return

      const store = useGameStore.getState()
      const focused = store.focusedViewport
      if (!focused) return

      event.preventDefault()
      store.recallPinnedViewportCamera(focused, keyNum - 1)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!enabled || spectatorState.isActive) return null

  return (
    <>
      {/* DOM overlay with panel chrome */}
      <Html fullscreen style={{ pointerEvents: 'none', zIndex: 100 }}>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
            <ViewPanelChrome
              ref={panelRefs.crane}
              viewportId="crane"
              cameraRef={cameraRefs.crane}
              style={{ gridRow: 'span 2' }}
            />
            <ViewPanelChrome
              ref={panelRefs.hook}
              viewportId="hook"
              cameraRef={cameraRefs.hook}
            />
            <ViewPanelChrome
              ref={panelRefs.drone}
              viewportId="drone"
              cameraRef={cameraRefs.drone}
            />
            <ViewPanelChrome
              ref={panelRefs.underwater}
              viewportId="underwater"
              cameraRef={cameraRefs.underwater}
            />
          </div>
        </div>
      </Html>

      {/* 3D Views — one per panel */}
      {VIEWPORT_ORDER.map((viewportId) => (
        <View
          key={viewportId}
          track={panelRefs[viewportId]}
        >
          <PerspectiveCamera
            ref={cameraRefs[viewportId]}
            makeDefault
            fov={VIEWPORT_CONFIG[viewportId].fov}
            near={0.1}
            far={1000}
          />
          {children}
        </View>
      ))}
    </>
  )
}

// =============================================================================
// VIEW PANEL CHROME (DOM overlay per viewport)
// =============================================================================

interface ViewPanelChromeProps {
  viewportId: DashboardViewportId
  style?: React.CSSProperties
  cameraRef: React.RefObject<THREE.PerspectiveCamera>
}

const ViewPanelChrome = forwardRef<HTMLDivElement, ViewPanelChromeProps>(({ viewportId, style, cameraRef }, ref) => {
  const config = VIEWPORT_CONFIG[viewportId]

  // Read reactive state for render
  const viewportCameras = useGameStore(state => state.viewportCameras)
  const focusedViewport = useGameStore(state => state.focusedViewport)
  const vp = viewportCameras[viewportId]
  const isFocused = focusedViewport === viewportId

  const handleBack = useCallback(() => {
    useGameStore.getState().navigateViewportHistory(viewportId, -1)
  }, [viewportId])

  const handleForward = useCallback(() => {
    useGameStore.getState().navigateViewportHistory(viewportId, 1)
  }, [viewportId])

  const handlePin = useCallback(() => {
    const camera = cameraRef.current
    if (!camera) return
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    const transform: CameraTransform = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [
        camera.position.x + dir.x,
        camera.position.y + dir.y,
        camera.position.z + dir.z
      ],
      label: `${config.title} pinned`
    }
    const store = useGameStore.getState()
    store.pushViewportHistory(viewportId, transform)
    store.pinViewportCamera(viewportId, transform)
  }, [viewportId, cameraRef, config.title])

  const canGoBack = vp.historyIndex > 0
  const canGoForward = vp.historyIndex < vp.history.length - 1
  const isLive = vp.historyIndex === vp.history.length - 1

  return (
    <div
      ref={ref}
      onClick={() => useGameStore.getState().setFocusedViewport(viewportId)}
      style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        border: `2px solid ${isFocused ? config.accentColor : config.accentColor + '40'}`,
        boxShadow: `inset 0 0 20px ${config.accentColor}20, 0 4px 20px rgba(0,0,0,0.5)`,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
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
          background: `linear-gradient(90deg, ${config.accentColor}30, transparent)`,
          borderBottom: `1px solid ${config.accentColor}30`
        }}
      >
        <span style={{ fontSize: '14px' }}>{config.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>
            {config.title}
          </div>
          <div style={{ fontSize: '9px', color: config.accentColor, letterSpacing: '0.5px' }}>
            {isLive ? config.subtitle : `HISTORY ${vp.historyIndex + 1}/${vp.history.length}`}
          </div>
        </div>

        {/* Navigation buttons */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleBack() }}
          disabled={!canGoBack}
          style={chromeButtonStyle(!canGoBack)}
          title="Back"
        >
          ←
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleForward() }}
          disabled={!canGoForward}
          style={chromeButtonStyle(!canGoForward)}
          title="Forward"
        >
          →
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handlePin() }}
          style={chromeButtonStyle(false)}
          title="Pin current view (Shift+1..6 to recall)"
        >
          📌
        </button>

        {/* Live indicator */}
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isLive ? '#ff4444' : '#888',
            boxShadow: isLive ? '0 0 4px #ff4444' : 'none',
            animation: isLive ? 'pulse 1s ease-in-out infinite' : 'none'
          }}
        />
      </div>

      {/* Viewport surface — this is what <View> tracks */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          background: `linear-gradient(135deg, ${config.accentColor}10, transparent)`,
          color: config.accentColor,
          fontSize: '48px',
          opacity: 0.3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {config.icon}
      </div>

      {/* Pinned slot indicators */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '4px 12px',
          justifyContent: 'flex-end'
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: vp.pinned[i] ? config.accentColor : 'rgba(255,255,255,0.15)',
              boxShadow: vp.pinned[i] ? `0 0 4px ${config.accentColor}` : 'none'
            }}
            title={vp.pinned[i] ? vp.pinned[i].label || `Pinned ${i + 1}` : `Empty slot ${i + 1}`}
          />
        ))}
      </div>

      {/* Corner accents */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '20px', height: '2px', background: config.accentColor }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '2px', height: '20px', background: config.accentColor }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20px', height: '2px', background: config.accentColor }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '2px', height: '20px', background: config.accentColor }} />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
})
ViewPanelChrome.displayName = 'ViewPanelChrome'

function chromeButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
    color: disabled ? '#666' : '#fff',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    pointerEvents: disabled ? 'none' : 'auto',
    lineHeight: 1
  }
}
