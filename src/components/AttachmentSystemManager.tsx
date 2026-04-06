// =============================================================================
// ATTACHMENT SYSTEM MANAGER - HarborGlow Phase 9
// Central manager that ties together attachment system, effects, and feedback
// =============================================================================

import { useEffect, useRef, useCallback, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { 
  useAttachmentSystem, 
  InstallationEvent 
} from '../systems/attachmentSystem'
import { useScreenShake } from '../hooks/useScreenShake'
import { playSound, playInstallationCelebration } from '../systems/soundEffects'
import { economySystem } from '../systems/economySystem'
import ParticleBurst3D from './ParticleBurst3D'
import InstallationFeedback from './InstallationFeedback'

interface AttachmentSystemManagerProps {
  children?: React.ReactNode
}

export default function AttachmentSystemManager({ children }: AttachmentSystemManagerProps) {
  const { camera } = useThree()
  const {
    activePoints,
    nearestPoint,
    lastInstall,
    config,
    updateCameraPosition,
    clearLastInstall,
  } = useAttachmentSystem()
  
  const {
    triggerInstallationShake,
    triggerSnapShake,
  } = useScreenShake()
  
  // Track previous states for change detection
  const prevNearestRef = useRef<string | null>(null)
  const prevInstallRef = useRef<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackData, setFeedbackData] = useState<{
    shipId: string
    partName: string
    rigType: import('../systems/attachmentSystem').RigType
    position: [number, number, number]
  } | null>(null)
  
  // Update camera position for distance calculations
  useFrame(() => {
    const camPos = camera.position
    updateCameraPosition([camPos.x, camPos.y, camPos.z])
  })
  
  // Handle nearest point changes (snap enter/exit)
  useEffect(() => {
    const nearestId = nearestPoint ? `${nearestPoint.shipId}-${nearestPoint.partName}` : null
    
    if (nearestId !== prevNearestRef.current) {
      if (nearestId && nearestPoint?.state === 'snapping') {
        // Entered snap zone
        playSound('snapEnter')
        triggerSnapShake()
      } else if (prevNearestRef.current && !nearestId) {
        // Exited snap zone
        playSound('snapExit')
      }
      
      prevNearestRef.current = nearestId
    }
  }, [nearestPoint, triggerSnapShake])
  
  // Handle installation completion
  const handleInstallComplete = useCallback((event: InstallationEvent) => {
    // Play celebration sound
    playInstallationCelebration(event.rigType)
    
    // Trigger screen shake based on ship size
    const state = useGameStore.getState()
    const ship = state.ships.find(s => s.id === event.shipId)
    if (ship) {
      triggerInstallationShake(ship.length)
    }
    
    // Award economy rewards
    const earnings = economySystem.recordInstallation({
      rigType: event.rigType,
      timeSeconds: 25, // TODO: Track actual installation time
      targetTimeSeconds: 30,
      swayPercent: 0.15, // TODO: Get actual sway from crane state
      syncAccuracy: 0.7, // TODO: Calculate from music sync
      weather: state.weather,
      isEventActive: state.activeHarborEvents.length > 0
    })
    
    // Dispatch event for floating text
    window.dispatchEvent(new CustomEvent('showCreditFeedback', { detail: earnings }))
    
    // Show visual feedback
    setFeedbackData({
      shipId: event.shipId,
      partName: event.partName,
      rigType: event.rigType,
      position: event.position,
    })
    setShowFeedback(true)
  }, [triggerInstallationShake])
  
  useEffect(() => {
    if (lastInstall && lastInstall.timestamp !== Number(prevInstallRef.current)) {
      handleInstallComplete(lastInstall)
      prevInstallRef.current = String(lastInstall.timestamp)
    }
  }, [lastInstall, handleInstallComplete])
  
  // Handle feedback completion
  const handleFeedbackComplete = useCallback(() => {
    setShowFeedback(false)
    setFeedbackData(null)
    clearLastInstall()
  }, [clearLastInstall])
  
  // Handle twistlock changes
  const twistlockEngaged = useGameStore((state) => state.twistlockEngaged)
  const prevTwistlockRef = useRef(twistlockEngaged)
  
  useEffect(() => {
    if (twistlockEngaged !== prevTwistlockRef.current) {
      playSound(twistlockEngaged ? 'twistlockEngage' : 'twistlockDisengage')
      prevTwistlockRef.current = twistlockEngaged
    }
  }, [twistlockEngaged])
  
  return (
    <>
      {/* Render particle burst for last installation */}
      {lastInstall && (
        <ParticleBurst3D
          position={lastInstall.position}
          rigType={lastInstall.rigType}
          active={true}
          onComplete={() => {}}
        />
      )}
      
      {/* Installation feedback overlay */}
      {showFeedback && feedbackData && (
        <InstallationFeedback
          shipId={feedbackData.shipId}
          partName={feedbackData.partName}
          rigType={feedbackData.rigType}
          position={feedbackData.position}
          onComplete={handleFeedbackComplete}
        />
      )}
      
      {children}
    </>
  )
}

// Debug overlay component
interface DebugProps {
  activePoints: ReturnType<typeof useAttachmentSystem>['activePoints']
  nearestPoint: ReturnType<typeof useAttachmentSystem>['nearestPoint']
  config: ReturnType<typeof useAttachmentSystem>['config']
}

function AttachmentSystemDebug({ activePoints, nearestPoint, config }: DebugProps) {
  return (
    <group>
      {/* Visualize snap radius for nearest point */}
      {nearestPoint && nearestPoint.state !== 'installed' && (
        <mesh 
          position={[nearestPoint.position[0], 0.1, nearestPoint.position[2]]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[config.snapRadius - 0.1, config.snapRadius, 64]} />
          <meshBasicMaterial 
            color={nearestPoint.state === 'snapping' ? '#00ff00' : '#ffff00'}
            transparent
            opacity={0.3}
            side={2}
          />
        </mesh>
      )}
    </group>
  )
}
