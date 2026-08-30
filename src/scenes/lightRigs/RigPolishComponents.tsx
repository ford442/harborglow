// =============================================================================
// RIG POLISH COMPONENTS — heat shimmer, rim shell, glints, flare anchor
// =============================================================================

import { useRef, useMemo, useEffect, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { getAudioAnalysisData } from '../../systems/audioVisualSync'
import {
  createRigRimMaterial,
  getRigPolishScales,
  setRigFlare,
} from './rigPolish'

const _worldPos = new THREE.Vector3()
const _camDelta = new THREE.Vector3()
const _lastCam = new THREE.Vector3()

interface HeatShimmerProps {
  scale?: number
  intensity?: number
  visible?: boolean
}

export function HeatShimmer({ scale = 1, intensity = 1, visible = true }: HeatShimmerProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame((state) => {
    if (!visible || getRigPolishScales().shimmer <= 0) {
      if (meshRef.current) meshRef.current.visible = false
      return
    }
    if (meshRef.current) meshRef.current.visible = true
    const mat = matRef.current
    if (!mat) return
    const audio = getAudioAnalysisData()
    const shimmer = getRigPolishScales().shimmer
    const ripple = Math.sin(state.clock.elapsedTime * 9.0) * Math.sin(state.clock.elapsedTime * 7.0)
    mat.opacity = Math.max(0, intensity * (0.18 + audio.energy * 0.12) * shimmer * (0.9 + ripple * 0.1))
    mat.color.setRGB(1.0, 0.58 + audio.bass * 0.12, 0.18 + audio.energy * 0.18)
  })

  if (!visible) return null

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]} scale={[2.2 * scale, 1.6 * scale, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <meshBasicMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        color="#ff8f2e"
        opacity={0.24}
        toneMapped={false}
      />
    </mesh>
  )
}

interface RigHousingShellProps {
  width: number
  height: number
  depth: number
  rimColor: string
  bodyColor?: string
  powerRef: MutableRefObject<number>
  metalness?: number
}

export function RigHousingShell({
  width,
  height,
  depth,
  rimColor,
  bodyColor = '#1a1a1a',
  powerRef,
  metalness = 0.82,
}: RigHousingShellProps) {
  const rimMat = useMemo(() => createRigRimMaterial(rimColor), [rimColor])
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(() => {
    const scales = getRigPolishScales()
    const p = powerRef.current
    rimMat.opacity = Math.max(0, p * scales.rimStrength * 0.75)
    if (bodyMatRef.current) {
      bodyMatRef.current.roughness = THREE.MathUtils.lerp(0.28, 0.62, 1 - p * 0.35)
      bodyMatRef.current.metalness = metalness
    }
  })

  useEffect(() => () => rimMat.dispose(), [rimMat])

  return (
    <group>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial ref={bodyMatRef} color={bodyColor} metalness={metalness} roughness={0.42} />
      </mesh>
      <mesh scale={[1.06, 1.06, 1.06]}>
        <boxGeometry args={[width, height, depth]} />
        <primitive object={rimMat} attach="material" />
      </mesh>
    </group>
  )
}

interface RigFlareAnchorProps {
  id: string
  color: string
  powerRef: MutableRefObject<number>
  priority?: number
}

export function RigFlareAnchor({ id, color, powerRef, priority = 58 }: RigFlareAnchorProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const scales = getRigPolishScales()
    if (!groupRef.current || scales.flareBright <= 0) {
      setRigFlare(id, null)
      return
    }
    groupRef.current.getWorldPosition(_worldPos)
    setRigFlare(id, {
      id,
      position: _worldPos.clone(),
      color,
      brightness: powerRef.current * 0.38 * scales.flareBright,
      priority,
    })
  })

  useEffect(() => () => setRigFlare(id, null), [id])

  return <group ref={groupRef} />
}

interface RigMicroGlintProps {
  color: string
  powerRef: MutableRefObject<number>
  seed?: number
}

export function RigMicroGlint({ color, powerRef, seed = 0.5 }: RigMicroGlintProps) {
  const glintRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const glintMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const cooldownRef = useRef(0)

  useFrame((_, delta) => {
    const scales = getRigPolishScales()
    const mesh = glintRef.current
    const mat = glintMatRef.current
    if (!mesh || !mat || scales.glints <= 0) {
      if (mat) mat.opacity = 0
      return
    }

    _camDelta.subVectors(camera.position, _lastCam)
    _lastCam.copy(camera.position)
    const camSpeed = _camDelta.length() / Math.max(delta, 0.001)

    cooldownRef.current = Math.max(0, cooldownRef.current - delta)
    if (camSpeed > 2.5 && cooldownRef.current <= 0 && powerRef.current > 0.35 && Math.random() < 0.02 * scales.glints * (seed + 0.5)) {
      cooldownRef.current = 0.35 + seed * 0.4
      mat.opacity = 0.85 * powerRef.current * scales.glints
      mesh.rotation.z = Math.random() * Math.PI
    } else {
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, delta * 8)
    }
  })

  return (
    <mesh ref={glintRef} position={[0, 0.15, 0.22]} rotation={[0, 0, 0.785]}>
      <planeGeometry args={[0.35, 0.06]} />
      <meshBasicMaterial
        ref={glintMatRef}
        color={color}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
