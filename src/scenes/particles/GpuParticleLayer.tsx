// =============================================================================
// GPU PARTICLE LAYER — lazy scene mount for the compute firework pool
// and the volumetric laser mesh. Audio and ship poses are read inside
// useFrame; this component does not subscribe to per-frame store fields.
// =============================================================================

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore'
import { getAudioAnalysisData } from '../../systems/audioVisualSync'
import { lightingSystem } from '../../systems/lightingSystem'
import { canUseGpuParticles } from '../../rendering/particles/particleGate'
import { particleCountFor, MAX_LASERS, EMITTER_STRIDE } from '../../rendering/particles/particleBudget'
import { createParticleSystem } from '../../rendering/particles/particleKernel'
import {
  emitterStorage,
  fireworkSlotCount,
  laserSlotCount,
  syncShowEmitters,
  tickBursts,
  type EmitterPoint,
} from './fxBus'

const EMPTY_POINTS: readonly EmitterPoint[] = []
const DEFAULT_COLOR = '#ffd27a'
const _up = new THREE.Vector3(0, 1, 0)
const _dir = new THREE.Vector3()
const _pos = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _scale = new THREE.Vector3()
const _matrix = new THREE.Matrix4()

function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

function publishEmitters(): void {
  const show = lightingSystem.getCurrentShow()
  if (!show.isActive || !show.shipId) {
    syncShowEmitters(0, 0, 0, EMPTY_POINTS, 'all', DEFAULT_COLOR, 1)
    return
  }
  const ships = useGameStore.getState().ships
  let ship: (typeof ships)[number] | undefined
  for (let i = 0; i < ships.length; i++) {
    if (ships[i].id === show.shipId) {
      ship = ships[i]
      break
    }
  }
  if (!ship) {
    syncShowEmitters(0, 0, 0, EMPTY_POINTS, 'all', DEFAULT_COLOR, 1)
    return
  }
  const cue = lightingSystem.getActiveCue()
  const origin = ship.position
  syncShowEmitters(
    origin[0],
    origin[1],
    origin[2],
    ship.attachmentPoints,
    cue?.target ?? 'all',
    cue?.color ?? DEFAULT_COLOR,
    cue?.intensity ?? 1,
  )
}

function writeLasers(mesh: THREE.InstancedMesh | null, treble: number, beatPhase: number): void {
  if (!mesh) return
  const lasers = laserSlotCount()
  const fireworks = fireworkSlotCount()
  mesh.count = lasers
  mesh.visible = lasers > 0
  if (lasers === 0) return
  const table = emitterStorage()
  const pulse = (0.35 + treble * 0.9) * (1 - beatPhase * 0.35)
  const color = mesh.instanceColor
  for (let i = 0; i < lasers; i++) {
    const o = (fireworks + i) * EMITTER_STRIDE
    const intensity = table[o + 11]
    const len = (8 + intensity * 18) * Math.max(pulse, 0.05)
    _dir.set(table[o + 4], table[o + 5], table[o + 6])
    if (_dir.lengthSq() < 1e-8) _dir.copy(_up)
    else _dir.normalize()
    _quat.setFromUnitVectors(_up, _dir)
    _pos.set(table[o], table[o + 1], table[o + 2]).addScaledVector(_dir, len * 0.5)
    _scale.set(0.15, len, 0.15)
    _matrix.compose(_pos, _quat, _scale)
    mesh.setMatrixAt(i, _matrix)
    color?.setXYZ(i, table[o + 8], table[o + 9], table[o + 10])
  }
  mesh.instanceMatrix.needsUpdate = true
  if (color) color.needsUpdate = true
}

function ParticlePool({ drawnCount }: { drawnCount: number }) {
  const gl = useThree((s) => s.gl)
  const system = useMemo(() => createParticleSystem(drawnCount), [drawnCount])
  const laserRef = useRef<THREE.InstancedMesh>(null)
  const seedRef = useRef({ id: '', seed: 1 })

  useLayoutEffect(() => {
    const mesh = laserRef.current
    if (mesh) {
      mesh.count = 0
      mesh.frustumCulled = false
      if (!mesh.instanceColor) {
        mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_LASERS * 3), 3)
      }
    }
    return () => system.dispose()
  }, [system])

  useFrame((_, dt) => {
    if (!system.isReady) {
      void system.init(gl)
      return
    }
    const step = dt > 0.05 ? 0.05 : dt
    tickBursts(step)
    publishEmitters()
    system.uploadEmitters(emitterStorage(), fireworkSlotCount())
    const audio = getAudioAnalysisData()
    const showId = lightingSystem.getCurrentShow().shipId ?? ''
    if (seedRef.current.id !== showId) {
      seedRef.current.id = showId
      seedRef.current.seed = hashId(showId)
    }
    system.writeAudio(audio.bass, audio.mid, audio.treble, audio.beatPhase, step, seedRef.current.seed)
    const fireworks = fireworkSlotCount()
    system.sprite.count = fireworks > 0 ? system.drawnCount : 0
    system.sprite.visible = fireworks > 0
    if (fireworks > 0) system.dispatch(gl)
    writeLasers(laserRef.current, audio.treble, audio.beatPhase)
  })

  return (
    <>
      <primitive object={system.sprite} />
      <instancedMesh
        ref={laserRef}
        args={[system.laserGeometry, system.laserMaterial, MAX_LASERS]}
        frustumCulled={false}
      />
    </>
  )
}

export default function GpuParticleLayer() {
  const gl = useThree((s) => s.gl)
  const quality = useGameStore((s) => s.qualityPreset)
  const [enabled, setEnabled] = useState(false)

  useFrame(() => {
    if (!enabled && canUseGpuParticles(gl)) setEnabled(true)
  })

  if (!enabled) return null
  return <ParticlePool key={quality} drawnCount={particleCountFor(quality)} />
}
