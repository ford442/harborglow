// =============================================================================
// PARTICLE BURST 3D - HarborGlow Phase 9
// 3D particle effects for installation feedback with sparks, confetti, smoke,
// shockwave, starburst, directional light flash, and floating sparkles.
// =============================================================================

import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RigType, RIG_TYPE_COLORS } from '../systems/attachmentSystem'

interface ParticleBurst3DProps {
  position: [number, number, number]
  rigType: RigType
  active: boolean
  onComplete?: () => void
}

// Special rig types get an extra color boost
const SMOKE_COLOR = new THREE.Color(0.5, 0.5, 0.5)

const SPECIAL_RIG_TYPES: RigType[] = ['emergency_strobe', 'searchlight']

// Generate random color variation
function varyColor(baseColor: string, variation: number = 0.2): THREE.Color {
  const color = new THREE.Color(baseColor)
  color.r += (Math.random() - 0.5) * variation
  color.g += (Math.random() - 0.5) * variation
  color.b += (Math.random() - 0.5) * variation
  return color
}

// Fixed particle pool: one InstancedMesh per kind, state in typed arrays (no React state per particle).
type Kind = 'spark' | 'confetti' | 'smoke' | 'sparkle'
const KINDS: Kind[] = ['spark', 'confetti', 'smoke', 'sparkle']
const KIND_COUNT = [50, 20, 10, 10]
const KIND_START = [0, 50, 70, 80]
const TOTAL = 90

// Sparks/sparkles blend additively, so opacity is folded into the instance colour (exact:
// additive = rgb * alpha). Confetti/smoke use NormalBlending, where per-instance alpha is not
// available on the shared material, so they fade with the mean opacity of their live particles.
const ADDITIVE = [true, false, false, true]
const OPACITY_SCALE = [1, 1, 0.3, 0.8]

export default function ParticleBurst3D({
  position,
  rigType,
  active,
  onComplete,
}: ParticleBurst3DProps) {
  const [alive, setAlive] = useState(false)
  const aliveRef = useRef(false)
  const groupRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const dirLightRef = useRef<THREE.DirectionalLight>(null)
  const startTimeRef = useRef<number>(0)
  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([null, null, null, null])

  const baseColor = useMemo(() => RIG_TYPE_COLORS[rigType].primary, [rigType])
  const isSpecial = useMemo(() => SPECIAL_RIG_TYPES.includes(rigType), [rigType])

  const pool = useMemo(
    () => ({
      pos: new Float32Array(TOTAL * 3),
      vel: new Float32Array(TOTAL * 3),
      life: new Float32Array(TOTAL),
      maxLife: new Float32Array(TOTAL),
      size: new Float32Array(TOTAL),
      color: new Float32Array(TOTAL * 3),
    }),
    [],
  )

  // Geometries/materials are per instance and reused for every burst
  const geometries = useMemo(
    () => [
      new THREE.SphereGeometry(1, 8, 8),
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.SphereGeometry(1, 6, 6),
      new THREE.SphereGeometry(1, 6, 6),
    ],
    [],
  )
  const materials = useMemo(
    () =>
      ADDITIVE.map(
        (additive) =>
          new THREE.MeshBasicMaterial({
            transparent: true,
            blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
          }),
      ),
    [],
  )
  useEffect(
    () => () => {
      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
    },
    [geometries, materials],
  )

  const meshRefCallbacks = useMemo(
    () =>
      KINDS.map((_, k) => (mesh: THREE.InstancedMesh | null) => {
        meshRefs.current[k] = mesh
        if (mesh && !mesh.instanceColor) {
          mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(KIND_COUNT[k] * 3), 3)
        }
      }),
    [],
  )

  // Initialize particles when activated
  useEffect(() => {
    if (!active) {
      pool.life.fill(0)
      aliveRef.current = false
      setAlive(false)
      return
    }

    startTimeRef.current = performance.now()
    const colorBoost = isSpecial ? 0.4 : 0.3
    const confettiScale = isSpecial ? 1.4 : 1.0
    let id = 0

    const put = (
      px: number, py: number, pz: number,
      vx: number, vy: number, vz: number,
      maxLife: number, size: number, color: THREE.Color,
    ) => {
      pool.pos[id * 3] = px; pool.pos[id * 3 + 1] = py; pool.pos[id * 3 + 2] = pz
      pool.vel[id * 3] = vx; pool.vel[id * 3 + 1] = vy; pool.vel[id * 3 + 2] = vz
      pool.life[id] = 1.0
      pool.maxLife[id] = maxLife
      pool.size[id] = size
      pool.color[id * 3] = color.r; pool.color[id * 3 + 1] = color.g; pool.color[id * 3 + 2] = color.b
      id++
    }

    // Sparks — fast, bright, short-lived
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2
      const elevation = (Math.random() - 0.5) * Math.PI
      const speed = 5 + Math.random() * 7
      put(
        position[0], position[1], position[2],
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed + 3,
        Math.sin(angle) * Math.cos(elevation) * speed,
        0.6 + Math.random() * 0.4,
        (0.06 + Math.random() * 0.12) * 1.2,
        varyColor('#ffffff', 0.1),
      )
    }

    // Confetti — slower, colorful, longer-lived (larger when special)
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      put(
        position[0], position[1], position[2],
        Math.cos(angle) * speed,
        3 + Math.random() * 3,
        Math.sin(angle) * speed,
        1.5 + Math.random() * 0.5,
        (0.12 + Math.random() * 0.18) * confettiScale,
        varyColor(baseColor, colorBoost),
      )
    }

    // Smoke — rises slowly
    for (let i = 0; i < 10; i++) {
      put(
        position[0] + (Math.random() - 0.5) * 0.5,
        position[1],
        position[2] + (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        1 + Math.random(),
        (Math.random() - 0.5) * 0.5,
        2.0,
        0.2 + Math.random() * 0.3,
        SMOKE_COLOR,
      )
    }

    // Floating sparkles — tiny, upward, long lifetime
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2
      put(
        position[0] + (Math.random() - 0.5) * 0.3,
        position[1] + Math.random() * 0.3,
        position[2] + (Math.random() - 0.5) * 0.3,
        Math.cos(angle) * 0.2,
        0.5 + Math.random() * 0.8,
        Math.sin(angle) * 0.2,
        3.0,
        0.03 + Math.random() * 0.04,
        varyColor(baseColor, 0.2),
      )
    }

    aliveRef.current = true
    setAlive(true)

    // Auto-complete after animation
    const timeout = setTimeout(() => {
      onComplete?.()
    }, 3000)

    return () => clearTimeout(timeout)
  }, [active, position, rigType, baseColor, isSpecial, onComplete, pool])

  useFrame((_, delta) => {
    if (!aliveRef.current) return

    const now = performance.now()
    const { pos, vel, life, maxLife, size, color } = pool
    let liveTotal = 0

    for (let k = 0; k < 4; k++) {
      const start = KIND_START[k]
      const end = start + KIND_COUNT[k]
      const mesh = meshRefs.current[k]
      const matrices = mesh ? (mesh.instanceMatrix.array as Float32Array) : null
      const colors = mesh?.instanceColor ? (mesh.instanceColor.array as Float32Array) : null
      const additive = ADDITIVE[k]
      let slot = 0
      let opacitySum = 0

      for (let id = start; id < end; id++) {
        if (life[id] <= 0) continue
        const i3 = id * 3

        pos[i3] += vel[i3] * delta
        pos[i3 + 1] += vel[i3 + 1] * delta
        pos[i3 + 2] += vel[i3 + 2] * delta

        if (k === 0) {
          vel[i3 + 1] -= 9.8 * delta
        } else if (k === 1) {
          vel[i3] += Math.sin(now * 0.01 + pos[i3 + 1]) * 0.5 * delta
          vel[i3 + 2] += Math.cos(now * 0.008 + pos[i3 + 1]) * 0.5 * delta
          vel[i3 + 1] -= 2 * delta
        } else if (k === 2) {
          vel[i3] *= 0.98
          vel[i3 + 1] *= 0.98
          vel[i3 + 2] *= 0.98
          size[id] += delta * 0.1
        } else {
          // Sparkles drift gently upward with slight wobble
          const phase = id - start
          vel[i3] += Math.sin(now * 0.005 + phase) * 0.02 * delta
          vel[i3 + 2] += Math.cos(now * 0.004 + phase) * 0.02 * delta
        }

        life[id] -= delta / maxLife[id]
        if (life[id] <= 0) continue

        liveTotal++
        if (!matrices || !colors) continue
        const opacity = life[id] * OPACITY_SCALE[k]
        const sz = size[id]
        const m = slot * 16
        matrices[m] = sz
        matrices[m + 5] = k === 1 ? sz * 0.5 : sz
        matrices[m + 10] = k === 1 ? sz * 0.1 : sz
        matrices[m + 12] = pos[i3]
        matrices[m + 13] = pos[i3 + 1]
        matrices[m + 14] = pos[i3 + 2]
        matrices[m + 15] = 1
        const c = slot * 3
        const f = additive ? opacity : 1
        colors[c] = color[i3] * f
        colors[c + 1] = color[i3 + 1] * f
        colors[c + 2] = color[i3 + 2] * f
        opacitySum += opacity
        slot++
      }

      if (mesh) {
        mesh.count = slot
        mesh.instanceMatrix.needsUpdate = true
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
        if (!additive && slot > 0) materials[k].opacity = opacitySum / slot
      }
    }

    // Change-guarded flip: unmount once every particle has died
    if (liveTotal === 0) {
      aliveRef.current = false
      setAlive(false)
    }

    // Animate point light flash
    if (lightRef.current) {
      const maxAge = 0.3
      const age = (now - startTimeRef.current) / 1000
      lightRef.current.intensity = age < maxAge ? 8 * (1 - age / maxAge) : 0
    }

    // Animate directional light flash (0.2s)
    if (dirLightRef.current) {
      const maxAge = 0.2
      const age = (now - startTimeRef.current) / 1000
      dirLightRef.current.intensity = age < maxAge ? 12 * (1 - age / maxAge) : 0
    }
  })

  if (!active || !alive) return null

  return (
    <group ref={groupRef} position={position}>
      {/* Point flash light */}
      <pointLight
        ref={lightRef}
        color={baseColor}
        intensity={8}
        distance={25}
        decay={2}
      />

      {/* Directional light flash — casts shadows on the ship */}
      <directionalLight
        ref={dirLightRef}
        color={baseColor}
        intensity={12}
        position={[2, 5, 2]}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {/* Particles (absolute coordinates inside a group already at `position`, as before) */}
      {KINDS.map((kind, k) => (
        <instancedMesh
          key={kind}
          ref={meshRefCallbacks[k]}
          args={[geometries[k], materials[k], KIND_COUNT[k]]}
          frustumCulled={false}
        />
      ))}

      {/* Shockwave ring */}
      <ShockwaveRing color={baseColor} />

      {/* Starburst ring — cyan, faster, high opacity that fades quickly */}
      <StarburstRing />
    </group>
  )
}

// Expanding shockwave ring
function ShockwaveRing({ color }: { color: string }) {
  const ringRef = useRef<THREE.Mesh>(null)
  const ringGeometry = useMemo(() => new THREE.RingGeometry(0.5, 0.7, 32), [])

  useFrame((state) => {
    if (!ringRef.current) return
    const age = state.clock.elapsedTime % 1 // 1 second cycle
    const scale = 1 + age * 5
    ringRef.current.scale.setScalar(scale)
    const mat = ringRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = (1 - age) * 0.5
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} geometry={ringGeometry}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Fast cyan starburst ring — scale 1→10 over 0.6s with quick fade
function StarburstRing() {
  const ringRef = useRef<THREE.Mesh>(null)
  const startTimeRef = useRef<number>(0)
  const ringGeometry = useMemo(() => new THREE.RingGeometry(0.3, 0.5, 48), [])

  useEffect(() => {
    startTimeRef.current = performance.now()
  }, [])

  useFrame(() => {
    if (!ringRef.current) return
    const age = (performance.now() - startTimeRef.current) / 1000
    if (age > 0.6) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0
      return
    }
    const t = age / 0.6
    const scale = 1 + t * 9 // 1 → 10
    ringRef.current.scale.setScalar(scale)
    const mat = ringRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = (1 - t) * 0.85
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} geometry={ringGeometry}>
      <meshBasicMaterial
        color="#00ffff"
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
