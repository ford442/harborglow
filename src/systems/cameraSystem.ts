import { useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// PHASE 7: CINEMATIC CAMERA SYSTEM
// 7.1 Dynamic Camera Modes | 7.2 Spectator Drone | 7.3 Transitions
// =============================================================================

export type CameraMode = 'orbit' | 'crane-cockpit' | 'crane-shoulder' | 'crane-top' | 
                         'ship-low' | 'ship-aerial' | 'ship-water' | 'ship-rig' | 
                         'spectator' | 'transition' | 'crane' | 'booth'

interface CameraTarget {
  position: THREE.Vector3
  lookAt: THREE.Vector3
  fov: number
}

// Bézier curve point generator for smooth drone paths
function createOrbitPath(
  center: THREE.Vector3, 
  radius: number, 
  height: number, 
  variations: number
): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = []
  const segments = 8
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const r = radius + Math.sin(i * variations) * 5
    const h = height + Math.cos(i * variations * 0.5) * 8
    
    points.push(new THREE.Vector3(
      center.x + Math.cos(angle) * r,
      center.y + h,
      center.z + Math.sin(angle) * r
    ))
  }
  
  // Close the loop
  points.push(points[0].clone())
  
  return new THREE.CatmullRomCurve3(points, true)
}

// Camera system hook
export function useCinematicCamera() {
  const { camera } = useThree()
  const ships = useGameStore(state => state.ships)
  const currentShipId = useGameStore(state => state.currentShipId)
  const spectatorState = useGameStore(state => state.spectatorState)
  const cameraMode = useGameStore(state => state.cameraMode)
  const bpm = useGameStore(state => state.bpm)
  
  const currentShip = ships.find(s => s.id === currentShipId)
  
  // Refs for smooth transitions
  const currentPosRef = useRef(new THREE.Vector3())
  const currentLookRef = useRef(new THREE.Vector3())
  const targetPosRef = useRef(new THREE.Vector3())
  const targetLookRef = useRef(new THREE.Vector3())
  const pathProgressRef = useRef(0)
  const pathCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null)
  const transitionProgressRef = useRef(1) // 1 = complete, 0 = start
  const lastModeRef = useRef<CameraMode>('orbit')
  
  // Camera shake from bass
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 })
  
  // 7.1 Dynamic Camera Modes - Calculate target for each mode
  const getCameraTarget = useCallback((mode: CameraMode, ship: typeof currentShip): CameraTarget => {
    if (!ship) {
      return {
        position: new THREE.Vector3(30, 20, 30),
        lookAt: new THREE.Vector3(0, 0, 0),
        fov: 50
      }
    }
    
    const shipPos = new THREE.Vector3(...ship.position)
    const shipLength = ship.length || 50
    const shipWidth = shipLength * 0.15
    
    switch (mode) {
      // Crane View Modes
      case 'crane-cockpit':
        return {
          position: new THREE.Vector3(
            Math.sin(0.2) * 18,
            24,
            Math.cos(0.2) * 8
          ),
          lookAt: new THREE.Vector3(
            shipPos.x + Math.sin(Date.now() * 0.001) * 5,
            shipPos.y + 10,
            shipPos.z
          ),
          fov: 60
        }
        
      case 'crane-shoulder':
        return {
          position: new THREE.Vector3(
            Math.sin(0.2) * 22,
            20,
            Math.cos(0.2) * 12
          ),
          lookAt: new THREE.Vector3(
            shipPos.x,
            shipPos.y + 5,
            shipPos.z
          ),
          fov: 55
        }
        
      case 'crane-top':
        return {
          position: new THREE.Vector3(
            Math.sin(0.2) * 15,
            30,
            Math.cos(0.2) * 5
          ),
          lookAt: shipPos,
          fov: 50
        }
        
      // Ship Showcase Modes
      case 'ship-low':
        return {
          position: new THREE.Vector3(
            shipPos.x - shipLength * 0.6,
            shipPos.y + 3,
            shipPos.z + shipWidth * 2
          ),
          lookAt: new THREE.Vector3(
            shipPos.x,
            shipPos.y + 15,
            shipPos.z
          ),
          fov: 45
        }
        
      case 'ship-aerial':
        return {
          position: new THREE.Vector3(
            shipPos.x,
            shipPos.y + 40,
            shipPos.z + 50
          ),
          lookAt: shipPos,
          fov: 40
        }
        
      case 'ship-water':
        return {
          position: new THREE.Vector3(
            shipPos.x - shipLength * 0.4,
            -1,
            shipPos.z + shipWidth * 1.5
          ),
          lookAt: new THREE.Vector3(
            shipPos.x + shipLength * 0.3,
            shipPos.y + 8,
            shipPos.z
          ),
          fov: 55
        }
        
      case 'ship-rig':
        return {
          position: new THREE.Vector3(
            shipPos.x,
            shipPos.y + 20,
            shipPos.z + shipWidth * 0.8
          ),
          lookAt: new THREE.Vector3(
            shipPos.x,
            shipPos.y + 8,
            shipPos.z
          ),
          fov: 50
        }
        
      default:
        return {
          position: new THREE.Vector3(30, 20, 30),
          lookAt: shipPos,
          fov: 50
        }
    }
  }, [])
  
  // 7.2 Spectator Drone - Create smooth orbit path
  useEffect(() => {
    if (spectatorState.isActive && spectatorState.targetShipId) {
      const ship = ships.find(s => s.id === spectatorState.targetShipId)
      if (ship) {
        const shipPos = new THREE.Vector3(...ship.position)
        const radius = ship.type === 'tanker' ? 50 : ship.type === 'container' ? 40 : 35
        const height = 15
        
        pathCurveRef.current = createOrbitPath(shipPos, radius, height, 2)
        pathProgressRef.current = 0
      }
    }
  }, [spectatorState.isActive, spectatorState.targetShipId, ships])
  
  // Handle camera mode transitions
  useEffect(() => {
    if (cameraMode !== lastModeRef.current) {
      transitionProgressRef.current = 0
      lastModeRef.current = cameraMode
    }
  }, [cameraMode])
  
  // Main camera update loop
  useFrame((state, delta) => {
    if (!currentShip) return
    
    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatPhase = (time % beatDuration) / beatDuration
    
    // 8.1 Music visualization - Camera shake on bass
    if (beatPhase < 0.15) {
      shakeRef.current.intensity = 0.3
    } else {
      shakeRef.current.intensity = THREE.MathUtils.lerp(shakeRef.current.intensity, 0, 0.1)
    }
    
    shakeRef.current.x = (Math.random() - 0.5) * shakeRef.current.intensity
    shakeRef.current.y = (Math.random() - 0.5) * shakeRef.current.intensity
    
    // Calculate target based on mode
    let target: CameraTarget
    
    if (spectatorState.isActive && pathCurveRef.current) {
      // 7.2 Spectator Drone - Move along Bézier path
      pathProgressRef.current += delta * 0.08
      if (pathProgressRef.current > 1) pathProgressRef.current = 0
      
      const point = pathCurveRef.current.getPoint(pathProgressRef.current)
      const tangent = pathCurveRef.current.getTangent(pathProgressRef.current)
      
      target = {
        position: point,
        lookAt: new THREE.Vector3(...currentShip.position).add(
          new THREE.Vector3(0, 5, 0).add(tangent.multiplyScalar(-10))
        ),
        fov: 45
      }
      
      // Variable speed - slow down at interesting angles
      const pausePoint = Math.floor(pathProgressRef.current * 4) / 4
      if (Math.abs(pathProgressRef.current - pausePoint) < 0.05) {
        pathProgressRef.current -= delta * 0.04 // Slow down
      }
      
    } else if (cameraMode.startsWith('crane-') || cameraMode.startsWith('ship-')) {
      // Dynamic camera modes
      target = getCameraTarget(cameraMode as CameraMode, currentShip)
      
      // 7.1 Music-reactive camera - subtle zoom on beat
      if (beatPhase < 0.1) {
        target.fov *= 0.98
      }
      
    } else {
      // Default orbit - let OrbitControls handle it
      return
    }
    
    // 7.3 Transition effects - Smooth interpolation
    if (transitionProgressRef.current < 1) {
      transitionProgressRef.current += delta * 2 // 0.5 second transition
      transitionProgressRef.current = Math.min(1, transitionProgressRef.current)
      
      // Ease-in-out curve
      const t = transitionProgressRef.current
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      
      targetPosRef.current.lerpVectors(currentPosRef.current, target.position, eased)
      targetLookRef.current.lerpVectors(currentLookRef.current, target.lookAt, eased)
    } else {
      targetPosRef.current.copy(target.position)
      targetLookRef.current.copy(target.lookAt)
    }
    
    // Apply camera shake
    const shakeX = shakeRef.current.x
    const shakeY = shakeRef.current.y
    
    // Smooth camera movement with lerp
    const lerpFactor = spectatorState.isActive ? 0.03 : 0.08
    camera.position.lerp(
      new THREE.Vector3(
        targetPosRef.current.x + shakeX,
        targetPosRef.current.y + shakeY,
        targetPosRef.current.z
      ),
      lerpFactor
    )
    
    // Smooth look-at
    const currentLook = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position)
    currentLook.lerp(targetLookRef.current, lerpFactor)
    camera.lookAt(currentLook)
    
    // Update FOV smoothly (only for PerspectiveCamera)
    const targetFOV = target.fov + (beatPhase < 0.1 ? -2 : 0) // Beat-reactive FOV
    if ((camera as THREE.PerspectiveCamera).fov !== undefined) {
      const perspCam = camera as THREE.PerspectiveCamera
      perspCam.fov = THREE.MathUtils.lerp(perspCam.fov, targetFOV, 0.05)
      perspCam.updateProjectionMatrix()
    }
    
    // Store current values for next frame
    currentPosRef.current.copy(camera.position)
    currentLookRef.current.copy(currentLook)
  })
  
  return {
    getCameraTarget,
    shakeIntensity: shakeRef.current.intensity,
    isTransitioning: transitionProgressRef.current < 1
  }
}

// 7.3 Camera transition helper
export function useCameraTransition() {
  const { camera } = useThree()
  const transitionRef = useRef({
    active: false,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startLook: new THREE.Vector3(),
    endLook: new THREE.Vector3(),
    progress: 0,
    duration: 1
  })
  
  const startTransition = useCallback((
    targetPos: THREE.Vector3,
    targetLook: THREE.Vector3,
    duration = 1
  ) => {
    const currentLook = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position)
    
    transitionRef.current = {
      active: true,
      startPos: camera.position.clone(),
      endPos: targetPos,
      startLook: currentLook,
      endLook: targetLook,
      progress: 0,
      duration
    }
  }, [camera])
  
  useFrame((_, delta) => {
    if (!transitionRef.current.active) return
    
    transitionRef.current.progress += delta / transitionRef.current.duration
    
    if (transitionRef.current.progress >= 1) {
      transitionRef.current.active = false
      camera.position.copy(transitionRef.current.endPos)
      camera.lookAt(transitionRef.current.endLook)
      return
    }
    
    // Cubic ease-in-out
    const t = transitionRef.current.progress
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    
    camera.position.lerpVectors(
      transitionRef.current.startPos,
      transitionRef.current.endPos,
      eased
    )
    
    const currentLook = new THREE.Vector3().lerpVectors(
      transitionRef.current.startLook,
      transitionRef.current.endLook,
      eased
    )
    camera.lookAt(currentLook)
  })
  
  return { startTransition, isTransitioning: () => transitionRef.current.active }
}

// Focus on ship with smooth pan
export function focusOnShip(shipPosition: [number, number, number], duration = 1.5) {
  const { camera } = useThree()
  const startPos = camera.position.clone()
  const endPos = new THREE.Vector3(
    shipPosition[0] + 30,
    shipPosition[1] + 20,
    shipPosition[2] + 30
  )
  const targetLook = new THREE.Vector3(...shipPosition)
  
  // This would be called from a useFrame in the component
  return { startPos, endPos, targetLook, duration }
}
