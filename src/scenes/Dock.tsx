import React from 'react'
import * as THREE from 'three'

/**
 * Dock — concrete quay, bollards, fenders, and dock lights.
 * All geometry is primitive-based (no external assets needed).
 */
export default function Dock() {
  return (
    <group>
      {/* ── Main quay surface ────────────────────────────────────────── */}
      <mesh position={[0, -0.5, -15]} receiveShadow>
        <boxGeometry args={[120, 1, 40]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>

      {/* Quay edge strip */}
      <mesh position={[0, 0.1, 5]} receiveShadow>
        <boxGeometry args={[120, 0.3, 1]} />
        <meshStandardMaterial color="#ffcc00" roughness={0.8} />
      </mesh>

      {/* ── Warehouse / terminal building ─────────────────────────────── */}
      <mesh position={[-20, 8, -30]} castShadow receiveShadow>
        <boxGeometry args={[40, 16, 20]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
      </mesh>
      <mesh position={[30, 6, -30]} castShadow receiveShadow>
        <boxGeometry args={[30, 12, 20]} />
        <meshStandardMaterial color="#1e2a1e" roughness={0.8} />
      </mesh>

      {/* ── Bollards ──────────────────────────────────────────────────── */}
      {[-40, -25, -10, 5, 20, 35, 50].map((x, i) => (
        <Bollard key={i} x={x} />
      ))}

      {/* ── Dock light poles ──────────────────────────────────────────── */}
      {[-45, -15, 15, 45].map((x, i) => (
        <DockLight key={i} x={x} />
      ))}

      {/* ── Rail tracks for crane ─────────────────────────────────────── */}
      <mesh position={[-18, 0.05, -8]} receiveShadow>
        <boxGeometry args={[120, 0.1, 0.5]} />
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-18, 0.05, -14]} receiveShadow>
        <boxGeometry args={[120, 0.1, 0.5]} />
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

function Bollard({ x }: { x: number }) {
  return (
    <group position={[x, 0, 4]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.4, 1.2, 8]} />
        <meshStandardMaterial color="#444" metalness={0.5} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.3, 0.4, 8]} />
        <meshStandardMaterial color="#444" metalness={0.5} roughness={0.6} />
      </mesh>
    </group>
  )
}

function DockLight({ x }: { x: number }) {
  return (
    <group position={[x, 0, -5]}>
      {/* Pole */}
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.15, 12, 8]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Light housing */}
      <mesh position={[0, 6.5, 1.5]}>
        <boxGeometry args={[0.8, 0.5, 1.5]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Warm sodium glow */}
      <pointLight position={[0, 6.5, 2]} intensity={3} distance={25} color="#ffaa44" />
      <mesh position={[0, 6.5, 2.2]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#ffaa44" emissive="#ffaa44" emissiveIntensity={3} />
      </mesh>
    </group>
  )
}
