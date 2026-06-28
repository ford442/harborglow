// =============================================================================
// CRANE DETAILS — labels, rivets, spreader assembly, cabin glass
// =============================================================================

import { useMemo, useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useCraneMaterial } from './CraneMaterials'

interface SpreaderAssemblyProps {
  twistlockEngaged: boolean
  tension: number
  nearAttachment: boolean
}

export function SpreaderAssembly({
  twistlockEngaged,
  tension,
  nearAttachment,
}: SpreaderAssemblyProps) {
  const spreaderMat = useCraneMaterial('machinedSteel')
  const paintedMat = useCraneMaterial('paintedSteel', { baseColor: '#e06810' })
  const pinRefs = useRef<Array<THREE.Group | null>>([null, null, null, null])
  const lockMatRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([null, null, null, null])
  const centerGlowRef = useRef<THREE.MeshStandardMaterial>(null)

  const pinPositions = useMemo(
    () =>
      [
        [-0.95, -0.08, 0.42],
        [0.95, -0.08, 0.42],
        [-0.95, -0.08, -0.42],
        [0.95, -0.08, -0.42],
      ] as [number, number, number][],
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const engage = twistlockEngaged ? 1 : 0
    pinRefs.current.forEach((group, i) => {
      if (!group) return
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, engage * (Math.PI / 2), 0.12)
      group.position.y = THREE.MathUtils.lerp(group.position.y, -0.08 - engage * 0.06, 0.1)
    })
    lockMatRefs.current.forEach((mat) => {
      if (!mat) return
      if (twistlockEngaged) {
        mat.emissive.set('#44ff88')
        mat.emissiveIntensity = 0.55 + Math.sin(t * 8) * 0.12
        mat.color.set('#2a8f52')
      } else if (nearAttachment) {
        mat.emissive.set('#4488ff')
        mat.emissiveIntensity = 0.35 + Math.sin(t * 4) * 0.08
        mat.color.set('#555555')
      } else {
        mat.emissive.set('#000000')
        mat.emissiveIntensity = tension > 0.5 ? 0.15 : 0
        mat.color.set('#444444')
      }
    })
    if (centerGlowRef.current) {
      centerGlowRef.current.emissive.set(twistlockEngaged ? '#44ff88' : '#ffaa44')
      centerGlowRef.current.emissiveIntensity = twistlockEngaged
        ? 0.45
        : nearAttachment
          ? 0.25
          : 0.08
    }
  })

  return (
    <group position={[0, -0.15, 0]}>
      {/* Spreader bar */}
      <mesh castShadow material={paintedMat}>
        <boxGeometry args={[2.2, 0.28, 1.15]} />
      </mesh>
      <mesh position={[0, -0.12, 0]} material={spreaderMat}>
        <boxGeometry args={[2.05, 0.08, 1.0]} />
      </mesh>

      {/* Hydraulic lines */}
      {pinPositions.map((pos, i) => (
        <mesh key={`hyd-${i}`} position={[pos[0] * 0.45, 0.05, pos[2] * 0.45]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.55, 6]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.55} />
        </mesh>
      ))}

      {/* Corner twistlock pins */}
      {pinPositions.map((pos, i) => (
        <group
          key={`pin-${i}`}
          ref={(ref) => {
            pinRefs.current[i] = ref
          }}
          position={pos}
        >
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.11, 0.22, 10]} />
            <meshStandardMaterial
              ref={(ref) => {
                lockMatRefs.current[i] = ref
              }}
              color="#444444"
              metalness={0.9}
              roughness={0.22}
              emissive="#000000"
              emissiveIntensity={0}
            />
          </mesh>
          <mesh position={[0, -0.14, 0]}>
            <boxGeometry args={[0.14, 0.04, 0.14]} />
            <meshStandardMaterial color="#222222" metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Center hub */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.35, 12]} />
        <meshStandardMaterial
          ref={centerGlowRef}
          color="#333333"
          metalness={0.88}
          roughness={0.25}
          emissive="#000000"
          emissiveIntensity={0}
        />
      </mesh>

      {/* Bolt heads along bar */}
      {[-0.55, 0, 0.55].map((x) => (
        <mesh key={`bolt-${x}`} position={[x, 0.16, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.025, 6]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.92} roughness={0.18} />
        </mesh>
      ))}
    </group>
  )
}

export function CraneTowerRivets() {
  const structuralMat = useCraneMaterial('structuralSteel')
  const count = 48
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const positions = useMemo(() => {
    const pts: Array<[number, number, number, number]> = []
    for (let face = 0; face < 4; face++) {
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 2; col++) {
          const y = -4 + row * 1.65
          const offset = col * 0.55 - 0.275
          if (face === 0) pts.push([offset, y, 1.02, 0])
          if (face === 1) pts.push([offset, y, -1.02, Math.PI])
          if (face === 2) pts.push([1.02, y, offset, Math.PI / 2])
          if (face === 3) pts.push([-1.02, y, offset, -Math.PI / 2])
        }
      }
    }
    return pts.slice(0, count)
  }, [count])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    positions.forEach(([x, y, z, rotY], i) => {
      dummy.position.set(x, y, z)
      dummy.rotation.set(0, rotY, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [positions, dummy])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} material={structuralMat}>
      <cylinderGeometry args={[0.035, 0.035, 0.04, 6]} />
    </instancedMesh>
  )
}

export function CraneLabels() {
  const plateMat = useCraneMaterial('structuralSteel', { baseColor: '#3d4248' })

  return (
    <group>
      <group position={[1.05, 9.35, 1.02]}>
        <mesh material={plateMat}>
          <boxGeometry args={[0.55, 0.22, 0.02]} />
        </mesh>
        <Text
          position={[0, 0, 0.015]}
          fontSize={0.09}
          color="#e8e8e8"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.5}
        >
          HK-07
        </Text>
      </group>

      <group position={[-11.8, 10.85, 1.05]} rotation={[0, 0, 0]}>
        <mesh material={plateMat}>
          <boxGeometry args={[0.7, 0.28, 0.02]} />
        </mesh>
        <Text position={[0, 0.04, 0.015]} fontSize={0.07} color="#ffcc66" anchorX="center" anchorY="middle">
          40T MAX
        </Text>
        <Text position={[0, -0.06, 0.015]} fontSize={0.05} color="#aaaaaa" anchorX="center" anchorY="middle">
          SWL 40.0t
        </Text>
      </group>

      <group position={[0, -3.65, 2.05]}>
        <mesh material={plateMat}>
          <boxGeometry args={[0.85, 0.18, 0.02]} />
        </mesh>
        <Text position={[0, 0, 0.015]} fontSize={0.06} color="#ff9955" anchorX="center" anchorY="middle">
          DANGER — OVERHEAD LOAD
        </Text>
      </group>
    </group>
  )
}

export function CabinGlassPane() {
  const glassMat = useCraneMaterial('cabinGlass')

  return (
    <>
      <mesh position={[2.52, 8.5, 0]} material={glassMat}>
        <boxGeometry args={[0.06, 1.05, 1.45]} />
      </mesh>
      {/* Interior silhouette hint */}
      <mesh position={[2.35, 8.35, 0]}>
        <boxGeometry args={[0.02, 0.55, 0.9]} />
        <meshStandardMaterial color="#0a0a12" roughness={0.95} metalness={0} />
      </mesh>
      {/* Frame */}
      <mesh position={[2.48, 8.5, 0]}>
        <boxGeometry args={[0.04, 1.15, 1.55]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.45} />
      </mesh>
    </>
  )
}
