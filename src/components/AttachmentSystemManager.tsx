// =============================================================================
// ATTACHMENT SYSTEM MANAGER - HarborGlow Phase 9
// Central manager that ties together attachment system, effects, and feedback
// =============================================================================

import { useEffect, useRef, useCallback, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import {
  useAttachmentSystem,
  InstallationEvent,
  findBindCandidate,
  triggerInstallation,
  calculateAttachmentState,
  isPointUpgraded,
  RIG_TYPE_COLORS,
} from '../systems/attachmentSystem'
import { useScreenShake } from '../hooks/useScreenShake'
import { playSound, playInstallationCelebration } from '../systems/soundEffects'
import { playInstallationLock } from '../systems/craneSoundSystem'
import { economySystem } from '../systems/economySystem'
import { trainingSystem } from '../systems/trainingSystem'
import { swaySystem } from '../systems/swaySystem'
import ParticleBurst3D from './ParticleBurst3D'
import MagicalInstallFlash from './MagicalInstallFlash'
import InstallationFeedback from './InstallationFeedback'

interface AttachmentSystemManagerProps {
  children?: React.ReactNode
}

interface StickyTarget {
  shipId: string
  partName: string
  position: [number, number, number]
}

function distance3D(
  a: [number, number, number],
  b: { x: number; y: number; z: number },
): number {
  const dx = a[0] - b.x
  const dy = a[1] - b.y
  const dz = a[2] - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function findBestSnappingTarget(
  ships: ReturnType<typeof useGameStore.getState>['ships'],
  spreader: { x: number; y: number; z: number },
  twistlockEngaged: boolean,
  config: ReturnType<typeof useGameStore.getState>['attachmentSystemConfig'],
): StickyTarget | null {
  let best: StickyTarget | null = null
  let minDistance = Infinity

  for (const ship of ships) {
    for (const point of ship.attachmentPoints || []) {
      if (isPointUpgraded(ship.id, point.partName)) continue

      const worldPos: [number, number, number] = [
        ship.position[0] + point.position[0],
        ship.position[1] + point.position[1],
        ship.position[2] + point.position[2],
      ]

      const { state, distance } = calculateAttachmentState(
        ship.id,
        point.partName,
        worldPos,
        spreader,
        twistlockEngaged,
        config,
      )

      if (state === 'snapping' && distance < minDistance) {
        minDistance = distance
        best = { shipId: ship.id, partName: point.partName, position: worldPos }
      }
    }
  }

  return best
}

export default function AttachmentSystemManager({ children }: AttachmentSystemManagerProps) {
  const { camera } = useThree()
  const {
    nearestPoint,
    lastInstall,
    setLastInstall,
    config,
    updateCameraPosition,
    clearLastInstall,
  } = useAttachmentSystem()

  const {
    triggerInstallationShake,
    triggerSnapShake,
    triggerLockShake,
  } = useScreenShake()

  const prevNearestRef = useRef<string | null>(null)
  const prevInstallRef = useRef<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackData, setFeedbackData] = useState<{
    shipId: string
    partName: string
    rigType: import('../systems/attachmentSystem').RigType
    position: [number, number, number]
  } | null>(null)

  const bindCandidateRef = useRef<InstallationEvent | null>(null)
  const bindStartTimeRef = useRef<number>(0)
  const isBindingRef = useRef(false)
  const prevSpreaderPosRef = useRef<{ x: number; y: number; z: number } | null>(null)
  const stickyTargetRef = useRef<StickyTarget | null>(null)
  const prevSpreaderForVelRef = useRef<{ x: number; y: number; z: number } | null>(null)
  const spreaderVelRef = useRef({ x: 0, z: 0 })
  const shiftHeldRef = useRef(false)
  const lockFeedbackFiredRef = useRef(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeldRef.current = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeldRef.current = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const fireLockFeedback = useCallback(() => {
    playInstallationLock()
    triggerLockShake()
    swaySystem.triggerSettling(config)
  }, [config, triggerLockShake])

  useFrame((state, delta) => {
    const camPos = camera.position
    updateCameraPosition([camPos.x, camPos.y, camPos.z])

    const store = useGameStore.getState()
    const attachmentConfig = store.attachmentSystemConfig
    const spreader = store.spreaderPos
    const dt = Math.min(delta, 0.05)

    if (prevSpreaderForVelRef.current) {
      const vx = (spreader.x - prevSpreaderForVelRef.current.x) / dt
      const vz = (spreader.z - prevSpreaderForVelRef.current.z) / dt
      spreaderVelRef.current = { x: vx, z: vz }
    }
    prevSpreaderForVelRef.current = { ...spreader }

    const releaseDistance = attachmentConfig.snapRadius * attachmentConfig.releaseHysteresis
    if (stickyTargetRef.current) {
      const stickyDist = distance3D(stickyTargetRef.current.position, spreader)
      if (
        stickyDist > releaseDistance
        || isPointUpgraded(stickyTargetRef.current.shipId, stickyTargetRef.current.partName)
      ) {
        stickyTargetRef.current = null
      }
    }

    if (!stickyTargetRef.current) {
      stickyTargetRef.current = findBestSnappingTarget(
        store.ships,
        spreader,
        store.twistlockEngaged,
        attachmentConfig,
      )
    }

    const magnetActive = attachmentConfig.magneticEnabled
      && !shiftHeldRef.current
      && !isBindingRef.current
      && stickyTargetRef.current !== null

    if (magnetActive && stickyTargetRef.current) {
      const stickyDist = distance3D(stickyTargetRef.current.position, spreader)
      if (stickyDist <= attachmentConfig.snapRadius) {
        const offsetX = stickyTargetRef.current.position[0] - spreader.x
        const offsetZ = stickyTargetRef.current.position[2] - spreader.z
        const joystickLeft = store.joystickLeft
        const joystickRight = store.joystickRight
        const inputMagnitude = Math.min(
          1,
          Math.sqrt(
            joystickLeft.x * joystickLeft.x
            + joystickLeft.y * joystickLeft.y
            + joystickRight.x * joystickRight.x
            + joystickRight.y * joystickRight.y,
          ),
        )

        const { worldDeltaX, worldDeltaZ } = swaySystem.applyMagneticGuidance(
          offsetX,
          offsetZ,
          dt,
          attachmentConfig,
          inputMagnitude,
        )

        if (worldDeltaX !== 0 || worldDeltaZ !== 0) {
          store.setSpreaderPos({
            x: spreader.x + worldDeltaX,
            y: spreader.y,
            z: spreader.z + worldDeltaZ,
          })
        }
      } else {
        swaySystem.clearMagneticGuidance()
      }
    } else {
      swaySystem.clearMagneticGuidance()
    }

    const spreaderSpeed = Math.sqrt(
      spreaderVelRef.current.x * spreaderVelRef.current.x
      + spreaderVelRef.current.z * spreaderVelRef.current.z,
    )
    const candidate = spreaderSpeed <= attachmentConfig.captureVelocity
      ? findBindCandidate(
        store.ships,
        store.spreaderPos,
        store.twistlockEngaged,
        attachmentConfig,
      )
      : null

    if (candidate && !isBindingRef.current) {
      isBindingRef.current = true
      bindCandidateRef.current = candidate
      bindStartTimeRef.current = state.clock.elapsedTime
      prevSpreaderPosRef.current = { ...store.spreaderPos }
      stickyTargetRef.current = {
        shipId: candidate.shipId,
        partName: candidate.partName,
        position: candidate.position,
      }

      if (!lockFeedbackFiredRef.current) {
        fireLockFeedback()
        lockFeedbackFiredRef.current = true
      }

      swaySystem.clearMagneticGuidance()
    }

    if (isBindingRef.current && !candidate) {
      isBindingRef.current = false
      bindCandidateRef.current = null
      prevSpreaderPosRef.current = null
      lockFeedbackFiredRef.current = false
      return
    }

    if (isBindingRef.current && bindCandidateRef.current && prevSpreaderPosRef.current) {
      const elapsed = (state.clock.elapsedTime - bindStartTimeRef.current) * 1000
      const duration = attachmentConfig.bindDurationMs
      const rawProgress = Math.min(1, elapsed / duration)
      const t = rawProgress * rawProgress * (3 - 2 * rawProgress)

      const target = bindCandidateRef.current.position
      const start = prevSpreaderPosRef.current

      store.setSpreaderPos({
        x: start.x + (target[0] - start.x) * t,
        y: start.y + (target[1] - start.y) * t,
        z: start.z + (target[2] - start.z) * t,
      })

      if (rawProgress >= 1) {
        triggerInstallation(
          bindCandidateRef.current.shipId,
          bindCandidateRef.current.partName,
          bindCandidateRef.current.position,
          (event) => {
            setLastInstall(event)
          },
        )
        setLastInstall(bindCandidateRef.current)
        isBindingRef.current = false
        bindCandidateRef.current = null
        prevSpreaderPosRef.current = null
        lockFeedbackFiredRef.current = false
        stickyTargetRef.current = null
      }
    }
  })

  useEffect(() => {
    const nearestId = nearestPoint ? `${nearestPoint.shipId}-${nearestPoint.partName}` : null

    if (nearestId !== prevNearestRef.current) {
      if (nearestId && nearestPoint?.state === 'snapping') {
        playSound('snapEnter')
        triggerSnapShake()
      } else if (prevNearestRef.current && !nearestId) {
        playSound('snapExit')
      }

      prevNearestRef.current = nearestId
    }
  }, [nearestPoint, triggerSnapShake])

  const handleInstallComplete = useCallback((event: InstallationEvent) => {
    playInstallationCelebration(event.rigType)

    const gameState = useGameStore.getState()
    const ship = gameState.ships.find((s) => s.id === event.shipId)
    if (ship) {
      triggerInstallationShake(ship.length)
    }

    const earnings = economySystem.recordInstallation({
      rigType: event.rigType,
      timeSeconds: 25,
      targetTimeSeconds: 30,
      swayPercent: 0.15,
      syncAccuracy: 0.7,
      weather: gameState.weather,
      isEventActive: gameState.activeHarborEvents.length > 0,
    })

    window.dispatchEvent(new CustomEvent('showCreditFeedback', { detail: earnings }))

    if (gameState.gameMode === 'training') {
      trainingSystem.recordInstallation(event.shipId)
    }

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

  const handleFeedbackComplete = useCallback(() => {
    setShowFeedback(false)
    setFeedbackData(null)
    clearLastInstall()
  }, [clearLastInstall])

  const twistlockEngaged = useGameStore((s) => s.twistlockEngaged)
  const prevTwistlockRef = useRef(twistlockEngaged)

  useEffect(() => {
    if (twistlockEngaged !== prevTwistlockRef.current) {
      playSound(twistlockEngaged ? 'twistlockEngage' : 'twistlockDisengage')
      prevTwistlockRef.current = twistlockEngaged
    }
  }, [twistlockEngaged])

  return (
    <>
      {lastInstall && (
        <>
          <MagicalInstallFlash
            position={lastInstall.position}
            color={RIG_TYPE_COLORS[lastInstall.rigType].primary}
            active={true}
          />
          <ParticleBurst3D
            position={lastInstall.position}
            rigType={lastInstall.rigType}
            active={true}
            onComplete={() => {}}
          />
        </>
      )}

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
