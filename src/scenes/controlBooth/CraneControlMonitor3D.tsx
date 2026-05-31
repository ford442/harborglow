import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useGameStore } from '../../store/useGameStore'
import { lightingSystem } from '../../systems/lightingSystem'

type MonitorRow = {
  label: string
  value: number
  display: string
}

export default function CraneControlMonitor3D() {
  const {
    trolleyPosition,
    cableDepth,
    spreaderPos,
    winchSpeed,
    twistlockEngaged,
    loadTension,
  } = useGameStore(state => ({
    trolleyPosition: state.trolleyPosition,
    cableDepth: state.cableDepth,
    spreaderPos: state.spreaderPos,
    winchSpeed: state.winchSpeed,
    twistlockEngaged: state.twistlockEngaged,
    loadTension: state.loadTension,
  }))

  const accentRef = useRef<THREE.MeshStandardMaterial>(null)
  const fillRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([])

  const rows = useMemo<MonitorRow[]>(
    () => [
      {
        label: 'BOOM EXT',
        value: trolleyPosition,
        display: `${(trolleyPosition * 100).toFixed(0)}%`,
      },
      {
        label: 'HOOK HT',
        value: Math.min(1, cableDepth / 50),
        display: `${cableDepth.toFixed(1)}m`,
      },
      {
        label: 'WINCH',
        value: Math.min(1, winchSpeed / 2),
        display: `${winchSpeed.toFixed(1)}x`,
      },
      {
        label: 'TENSION',
        value: Math.min(1, loadTension / 50),
        display: `${loadTension.toFixed(0)}t`,
      },
    ],
    [cableDepth, loadTension, trolleyPosition, winchSpeed],
  )

  useFrame(() => {
    const pulse = lightingSystem.getBeatPulse()
    if (accentRef.current) {
      accentRef.current.emissiveIntensity = 0.4 + pulse * 1.2
    }
    fillRefs.current.forEach((material, index) => {
      if (!material) return
      material.emissiveIntensity = 0.5 + pulse * (index === 3 ? 1.15 : 0.8)
    })
  })

  return (
    <group>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[1.6, 1.2]} />
        <meshStandardMaterial color="#050a0f" roughness={0.95} metalness={0.1} />
      </mesh>

      <mesh position={[0, 0.52, 0.01]}>
        <planeGeometry args={[1.32, 0.08]} />
        <meshStandardMaterial
          ref={accentRef}
          color="#00d4aa"
          emissive="#00d4aa"
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      <Text position={[-0.66, 0.52, 0.02]} fontSize={0.08} color="#dffef7" anchorX="left" anchorY="middle">
        CRANE CONTROL - LIVE
      </Text>
      <Text position={[0.66, 0.52, 0.02]} fontSize={0.07} color="#7fffe1" anchorX="right" anchorY="middle">
        CAM 04
      </Text>
      <Text position={[-0.66, 0.37, 0.02]} fontSize={0.045} color="#8aa8a4" anchorX="left" anchorY="middle">
        READ ONLY / NO TOUCH INPUT
      </Text>

      {rows.map((row, index) => {
        const y = 0.12 - index * 0.22
        const width = 1.08 * Math.max(0.05, row.value)

        return (
          <group key={row.label} position={[0, y, 0]}>
            <Text position={[-0.66, 0.055, 0.02]} fontSize={0.05} color="#6be6c7" anchorX="left" anchorY="middle">
              {row.label}
            </Text>
            <Text position={[0.66, 0.055, 0.02]} fontSize={0.05} color="#dffef7" anchorX="right" anchorY="middle">
              {row.display}
            </Text>

            <mesh position={[0, -0.015, -0.005]}>
              <boxGeometry args={[1.28, 0.05, 0.02]} />
              <meshStandardMaterial color="#0b1f23" roughness={0.92} metalness={0.05} />
            </mesh>

            <mesh position={[-0.64 + width / 2, -0.015, 0.01]}>
              <boxGeometry args={[width, 0.05, 0.02]} />
              <meshStandardMaterial
                ref={material => {
                  fillRefs.current[index] = material
                }}
                color="#00d4aa"
                emissive="#00d4aa"
                emissiveIntensity={0.5}
                roughness={0.28}
                metalness={0.08}
              />
            </mesh>
          </group>
        )
      })}

      <Text position={[-0.66, -0.5, 0.02]} fontSize={0.045} color="#7d9d98" anchorX="left" anchorY="middle">
        SWING {spreaderPos.z >= 0 ? '+' : ''}
        {spreaderPos.z.toFixed(1)}m
      </Text>
      <Text
        position={[0.66, -0.5, 0.02]}
        fontSize={0.045}
        color={twistlockEngaged ? '#00d4aa' : '#7d9d98'}
        anchorX="right"
        anchorY="middle"
      >
        TWISTLOCK {twistlockEngaged ? '● ENGAGED' : '○ OPEN'}
      </Text>
    </group>
  )
}
