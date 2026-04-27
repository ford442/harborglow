// =============================================================================
// FOAM SYSTEM — HarborGlow
// Instanced foam particles for wave crests and boat wakes.
// Uses a ring buffer over a fixed-size instanced mesh for performance.
// =============================================================================

import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { waveSystem } from '../systems/WaveSystem'

// -------------------------------------------------------------------------
// CONFIG
// -------------------------------------------------------------------------

const MAX_INSTANCES = 800
const FOAM_LIFETIME = 3.0       // seconds
const WAKE_LIFETIME = 2.5
const FOAM_SCALE_MAX = 2.5
const WAKE_SCALE_MAX = 1.8
const SPAWN_GRID_SIZE = 60      // world units around camera to scan for crests
const SPAWN_GRID_RES = 8        // samples per axis

// -------------------------------------------------------------------------
// INSTANCE DATA
// -------------------------------------------------------------------------

interface FoamInstance {
  active: boolean
  position: THREE.Vector3
  life: number
  maxLife: number
  scaleBase: number
  type: 'crest' | 'wake'
}

// -------------------------------------------------------------------------
// COMPONENT
// -------------------------------------------------------------------------

export default function FoamSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const cameraRef = useRef<THREE.Camera | null>(null)

  const isNight = useGameStore((s) => s.isNight)
  const quality = useGameStore((s) => s.qualityPreset)
  const tugboatState = useGameStore((s) => s.tugboatState)

  // Disable crest scanning on low quality
  const enableCrests = quality !== 'low'

  // Pool of instance data
  const poolRef = useRef<FoamInstance[]>(
    Array.from({ length: MAX_INSTANCES }, () => ({
      active: false,
      position: new THREE.Vector3(),
      life: 0,
      maxLife: FOAM_LIFETIME,
      scaleBase: 1,
      type: 'crest',
    }))
  )

  const nextIndexRef = useRef(0)
  const scanTimerRef = useRef(0)
  const lastTugboatPos = useRef<THREE.Vector3 | null>(null)

  // Helper: spawn an instance
  const spawn = useCallback((pos: THREE.Vector3, type: 'crest' | 'wake', scaleBase = 1) => {
    const pool = poolRef.current
    const idx = nextIndexRef.current
    nextIndexRef.current = (nextIndexRef.current + 1) % MAX_INSTANCES

    pool[idx].active = true
    pool[idx].position.copy(pos)
    pool[idx].life = 0
    pool[idx].maxLife = type === 'wake' ? WAKE_LIFETIME : FOAM_LIFETIME
    pool[idx].scaleBase = scaleBase
    pool[idx].type = type
  }, [])

  useFrame((state, delta) => {
    cameraRef.current = state.camera
    const mesh = meshRef.current
    if (!mesh) return

    const time = waveSystem.getTime()
    const pool = poolRef.current

    // ---------------------------------------------------------------
    // 1. CREST FOAM: scan grid around camera
    // ---------------------------------------------------------------
    if (enableCrests) {
      scanTimerRef.current += delta
      // Throttle scanning to every ~0.1s
      if (scanTimerRef.current > 0.08) {
        scanTimerRef.current = 0
        const camX = state.camera.position.x
        const camZ = state.camera.position.z
        const step = SPAWN_GRID_SIZE / SPAWN_GRID_RES

        for (let ix = 0; ix < SPAWN_GRID_RES; ix++) {
          for (let iz = 0; iz < SPAWN_GRID_RES; iz++) {
            const x = camX - SPAWN_GRID_SIZE * 0.5 + ix * step + (Math.random() - 0.5) * step
            const z = camZ - SPAWN_GRID_SIZE * 0.5 + iz * step + (Math.random() - 0.5) * step

            const h = waveSystem.getWaterHeight(x, z, time)
            const foam = waveSystem.getFoamAmount(x, z, time)

            // Spawn if foam is high enough
            if (foam > 0.55 && Math.random() < foam * 0.4) {
              const pos = new THREE.Vector3(x, h - 2.5 + 0.05, z)
              spawn(pos, 'crest', 0.5 + foam * 0.8)
            }
          }
        }
      }
    }

    // ---------------------------------------------------------------
    // 2. WAKE FOAM: behind tugboat
    // ---------------------------------------------------------------
    const tbPos = new THREE.Vector3(
      tugboatState.position[0],
      tugboatState.position[1],
      tugboatState.position[2]
    )
    const tbVel = new THREE.Vector3(
      tugboatState.velocity[0],
      0,
      tugboatState.velocity[2]
    )
    const speed = tbVel.length()

    if (speed > 0.5 && lastTugboatPos.current) {
      const dist = tbPos.distanceTo(lastTugboatPos.current)
      const spawnInterval = Math.max(0.3, 1.5 - speed * 0.15)

      if (dist > spawnInterval * 0.5) {
        // Spawn behind stern
        const heading = tugboatState.heading
        const sternOffset = new THREE.Vector3(
          -Math.cos(heading) * 2.8,
          0,
          -Math.sin(heading) * 2.8
        )
        const spawnPos = tbPos.clone().add(sternOffset)
        const waterH = waveSystem.getWaterHeight(spawnPos.x, spawnPos.z, time)
        spawnPos.y = waterH - 2.5 + 0.05

        spawn(spawnPos, 'wake', 0.4 + Math.min(speed / 8, 1) * 0.8)
        lastTugboatPos.current.copy(tbPos)
      }
    } else if (!lastTugboatPos.current) {
      lastTugboatPos.current = tbPos.clone()
    }

    // ---------------------------------------------------------------
    // 3. UPDATE INSTANCES
    // ---------------------------------------------------------------
    let activeCount = 0

    for (let i = 0; i < MAX_INSTANCES; i++) {
      const inst = pool[i]

      if (!inst.active) {
        // Hide
        dummy.position.set(0, -1000, 0)
        dummy.scale.set(0, 0, 0)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
        continue
      }

      inst.life += delta
      const progress = inst.life / inst.maxLife

      if (progress >= 1) {
        inst.active = false
        dummy.position.set(0, -1000, 0)
        dummy.scale.set(0, 0, 0)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
        continue
      }

      // Billboard: face camera
      dummy.position.copy(inst.position)
      dummy.lookAt(state.camera.position)

      // Scale animation: grow then shrink
      let scale = inst.scaleBase
      if (progress < 0.2) {
        scale *= progress / 0.2
      } else {
        scale *= (1 - progress) / 0.8
      }
      scale = Math.max(0.01, scale)

      const maxScale = inst.type === 'wake' ? WAKE_SCALE_MAX : FOAM_SCALE_MAX
      dummy.scale.set(scale * maxScale, scale * maxScale, scale * maxScale)

      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      activeCount++
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  // Foam plane geometry (slightly irregular circle via alpha)
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: isNight ? '#c8d8f0' : '#ffffff',
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  }, [isNight])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_INSTANCES]}
      frustumCulled={false}
    />
  )
}
