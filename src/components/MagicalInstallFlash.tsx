// =============================================================================
// MAGICAL INSTALL FLASH - HarborGlow
// Brief, intense white flash in 3D space at the installation point.
// =============================================================================

import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface MagicalInstallFlashProps {
  position: [number, number, number]
  color: string
  active: boolean
}

export default function MagicalInstallFlash({
  position,
  color,
  active,
}: MagicalInstallFlashProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const startTimeRef = useRef<number>(0)
  const [alive, setAlive] = useState(false)

  const geometry = useMemo(() => new THREE.SphereGeometry(3, 32, 32), [])

  useEffect(() => {
    if (active) {
      startTimeRef.current = performance.now()
      setAlive(true)
    }
  }, [active])

  useFrame(() => {
    if (!meshRef.current || !alive) return

    const age = (performance.now() - startTimeRef.current) / 1000
    const duration = 0.3

    if (age >= duration) {
      setAlive(false)
      return
    }

    const t = age / duration
    const scale = 1 + t * 4 // 1 → 5
    meshRef.current.scale.setScalar(scale)

    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.4 * (1 - t) // 0.4 → 0
  })

  if (!active || !alive) return null

  return (
    <mesh ref={meshRef} position={position} geometry={geometry}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}
