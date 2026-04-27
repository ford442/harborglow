// =============================================================================
// CAMERA TRANSITION HOOK - Smooth camera lerping on mode switch
// =============================================================================

import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

export function useCameraTransition() {
  const { camera } = useThree()
  const operationMode = useGameStore((s) => s.operationMode)
  const prevModeRef = useRef(operationMode)
  const transitionRef = useRef({
    active: false,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
    progress: 0,
    duration: 1.2,
  })

  useEffect(() => {
    if (prevModeRef.current !== operationMode) {
      // Trigger transition
      const t = transitionRef.current
      t.active = true
      t.fromPos.copy(camera.position)
      t.progress = 0

      if (operationMode === 'tugboat') {
        // Target will be set by Tugboat helm camera
        t.toPos.set(20, 3, 10)
        t.toTarget.set(20, 0, 20)
      } else {
        // Return to crane overview
        t.toPos.set(18, 24, 8)
        t.toTarget.set(0, 0, 0)
      }

      prevModeRef.current = operationMode
    }
  }, [operationMode, camera])

  useFrame((_, delta) => {
    const t = transitionRef.current
    if (!t.active) return

    t.progress += delta / t.duration
    const ease = 1 - Math.pow(1 - Math.min(1, t.progress), 3) // ease-out cubic

    camera.position.lerpVectors(t.fromPos, t.toPos, ease)

    const currentTarget = new THREE.Vector3().lerpVectors(t.fromTarget, t.toTarget, ease)
    camera.lookAt(currentTarget)

    if (t.progress >= 1) {
      t.active = false
    }
  })
}
