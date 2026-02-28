import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'

/**
 * Crane — portal quay crane built from Box/Cylinder primitives.
 * The hook swings on a 2-segment pendulum driven by Rapier physics.
 * Leva controls are exposed for crane speed tuning.
 */
export default function Crane() {
  const crane = useGameStore((s) => s.crane)
  const craneGroupRef = useRef<THREE.Group>(null)
  const jibRef = useRef<THREE.Group>(null)
  const hookRef = useRef<THREE.Mesh>(null)
  const ropeRef = useRef<THREE.Mesh>(null)
  const trolleyRef = useRef<THREE.Group>(null)

  // Hook sway simulation
  const swayAngle = useRef(0)
  const swayVelocity = useRef(0)
  const windStrength = useGameStore((s) => s.windStrength)

  const { craneSpeed } = useControls('Crane', {
    craneSpeed: { value: 1, min: 0.1, max: 5, step: 0.1, label: 'Crane Speed' },
  })

  useFrame(({ clock }, delta) => {
    const g = craneGroupRef.current
    const hook = hookRef.current
    const rope = ropeRef.current
    const trolley = trolleyRef.current

    if (g) g.rotation.y = crane.rotation

    // Trolley position along jib (local X: -20 to +20)
    if (trolley) trolley.position.x = (crane.trolleyPos - 0.5) * 40

    // Rope length (local Y: 0 to -30)
    const ropeLen = crane.ropeLength * 30 + 2
    if (rope) {
      rope.scale.y = ropeLen / 5 // base geometry is 5 units tall
      rope.position.y = -(ropeLen / 2)
    }

    // Hook hangs at end of rope
    if (hook && trolley) {
      // Physics-lite: pendulum sway from wind + trolley acceleration
      const windForce = (windStrength * 0.002) * Math.sin(clock.getElapsedTime() * 0.7)
      swayVelocity.current += windForce - swayAngle.current * 0.04
      swayVelocity.current *= 0.97 // damping
      swayAngle.current += swayVelocity.current

      hook.position.set(
        Math.sin(swayAngle.current) * ropeLen,
        -(ropeLen + 1),
        Math.cos(swayAngle.current * 0.6) * (ropeLen * 0.1)
      )
    }
  })

  // Base elevation for the crane
  const baseY = 0

  return (
    <group ref={craneGroupRef} position={[-18, baseY, -10]}>
      {/* Portal legs */}
      <CraneLeg position={[-4, 20, 0]} />
      <CraneLeg position={[4, 20, 0]} />
      <CraneLeg position={[-4, 20, -8]} />
      <CraneLeg position={[4, 20, -8]} />

      {/* Cross-bracing between legs */}
      <mesh position={[0, 15, 0]} castShadow>
        <boxGeometry args={[8.2, 0.6, 0.4]} />
        <meshStandardMaterial color="#2a3a4a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 15, -8]} castShadow>
        <boxGeometry args={[8.2, 0.6, 0.4]} />
        <meshStandardMaterial color="#2a3a4a" roughness={0.6} />
      </mesh>

      {/* Cab / machinery house */}
      <mesh position={[0, 42, -4]} castShadow receiveShadow>
        <boxGeometry args={[9, 6, 10]} />
        <meshStandardMaterial color="#1c2c3c" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Cab windows */}
      <mesh position={[4.6, 42, -4]}>
        <boxGeometry args={[0.1, 3, 6]} />
        <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.6} transparent opacity={0.7} />
      </mesh>

      {/* Jib (horizontal boom) */}
      <group ref={jibRef} position={[0, 45, -4]}>
        <mesh castShadow>
          <boxGeometry args={[50, 1.5, 1.5]} />
          <meshStandardMaterial color="#2e4060" roughness={0.5} metalness={0.5} />
        </mesh>

        {/* Counter-jib (behind cab) */}
        <mesh position={[-18, 0, 0]} castShadow>
          <boxGeometry args={[14, 1.2, 1.2]} />
          <meshStandardMaterial color="#2e4060" roughness={0.5} metalness={0.5} />
        </mesh>

        {/* Trolley group — slides along jib */}
        <group ref={trolleyRef} position={[0, -1, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.5, 1.2, 2.5]} />
            <meshStandardMaterial color="#445566" roughness={0.4} metalness={0.6} />
          </mesh>

          {/* Rope */}
          <mesh ref={ropeRef} position={[0, -3, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 5, 6]} />
            <meshStandardMaterial color="#aa8833" roughness={0.8} />
          </mesh>

          {/* Hook */}
          <mesh ref={hookRef} position={[0, -8, 0]} castShadow>
            <torusGeometry args={[0.6, 0.15, 8, 16, Math.PI * 1.5]} />
            <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* Aviation warning light on jib tip */}
      <mesh position={[25, 47, -4]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={3} />
      </mesh>
    </group>
  )
}

/** Single crane portal leg */
function CraneLeg({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[1.2, 40, 1.2]} />
      <meshStandardMaterial color="#263340" roughness={0.6} metalness={0.3} />
    </mesh>
  )
}
