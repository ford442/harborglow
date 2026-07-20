import { useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../../store/useGameStore'
import UnderwaterCamera from '../UnderwaterCamera'

export function UnderwaterEffects() {
  const cameraMode = useGameStore(s => s.cameraMode)
  const { camera } = useThree()
  const [show, setShow] = useState(false)

  useFrame(() => {
    setShow(cameraMode === 'ship-water' || camera.position.y < -1)
  })

  if (!show) return null
  return <UnderwaterCamera intensity={1.2} />
}

export function getSunPosition(hour: number): [number, number, number] {
    const angle = ((hour - 12) / 12) * Math.PI
    return [
        Math.sin(angle) * 50,
        Math.cos(angle) * 50,
        20
    ]
}
