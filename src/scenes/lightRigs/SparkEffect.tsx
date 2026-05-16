import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface SparkEffectProps {
  position: [number, number, number]
  onComplete: () => void
}

export function SparkEffect({ position, onComplete }: SparkEffectProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const [life, setLife] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setLife(prev => {
        if (prev <= 0) {
          onComplete()
          return 0
        }
        return prev - 0.05
      })
    }, 16)
    return () => clearInterval(interval)
  }, [onComplete])

  const particles = useMemo(() => {
    const count = 20
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0

      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 0.1 + Math.random() * 0.2

      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      velocities[i * 3 + 1] = Math.cos(phi) * speed
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed
    }

    return { positions, velocities }
  }, [])

  useFrame(() => {
    if (!particlesRef.current?.geometry?.attributes?.position) return

    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < 20; i++) {
      posArray[i * 3] += particles.velocities[i * 3]
      posArray[i * 3 + 1] += particles.velocities[i * 3 + 1]
      posArray[i * 3 + 2] += particles.velocities[i * 3 + 2]

      // Gravity
      particles.velocities[i * 3 + 1] -= 0.005
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={20}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#ffff00"
        transparent
        opacity={life}
        toneMapped={false}
      />
    </points>
  )
}
