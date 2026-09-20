// =============================================================================
// WATER COMPONENT — HarborGlow
// Gerstner displacement via TSL MeshStandardNodeMaterial. WaveSystem uniforms.
// =============================================================================

import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { MeshStandardNodeMaterial } from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { useGameStore } from '../store/useGameStore'
import { waveSystem } from '../systems/WaveSystem'
import { tugboatWakeState } from '../systems/TugboatWakeSystem'
import { useMusicPulse } from '../hooks/useMusicPulse'
import { MAX_DYNAMIC_LIGHTS, MAX_WAVE_LAYERS } from './water/gerstnerHeight'
import { createWaterNodeMaterial, type WaterTslUserData } from './water/gerstnerTsl'
import { createOceanFFTTexture, type OceanFFTTexture } from './water/oceanFFTTexture'
import { OceanFFTCompute } from './water/oceanFFTCompute'
import {
  canUseGpuOceanFft,
  oceanFFTSeed,
  parseOceanCinema,
  resolveOceanFftSize,
} from '../systems/ocean'

interface WaterProps {
  isNight?: boolean
}

// Per-frame scratch for dynamic light gathering (no allocation inside useFrame).
interface LightSlot {
  position: THREE.Vector3
  color: THREE.Color
  intensity: number
  radius: number
  score: number
}
const lightPool: LightSlot[] = []
const sortedLights: LightSlot[] = []
let lightCount = 0
const upgradeByShip = new Map<string, number>()
const WHITE = new THREE.Color('#ffffff')
const DOCK_WARM = new THREE.Color('#ffb15a')
const DOCK_COOL = new THREE.Color('#38b6ff')
const SPREADER_LIGHT = new THREE.Color('#ffd99a')
const TANKER_FLARE = new THREE.Color('#ff7f35')
const SHIP_LIGHT_DEFAULT = new THREE.Color('#a5ceff')
const SHIP_LIGHT_COLORS: Record<string, THREE.Color> = Object.fromEntries(
  Object.entries({
    cruise: '#ffc27d',
    container: '#66d7ff',
    tanker: '#ff9c4f',
    bulk: '#e6b87f',
    lng: '#7bd6ff',
    roro: '#ff9e6e',
    research: '#87bbff',
    droneship: '#a3d8ff',
    ferry: '#9dd9ff',
    trawler: '#d8b07a',
    horizon: '#95beff',
  }).map(([type, hex]) => [type, new THREE.Color(hex)]),
)
const byScoreDesc = (a: LightSlot, b: LightSlot) => b.score - a.score

function pushLight(x: number, y: number, z: number, color: THREE.Color, intensity: number, radius: number): LightSlot {
  let slot = lightPool[lightCount]
  if (!slot) {
    slot = { position: new THREE.Vector3(), color: new THREE.Color(), intensity: 0, radius: 0, score: 0 }
    lightPool[lightCount] = slot
  }
  lightCount++
  slot.position.set(x, y, z)
  slot.color.copy(color)
  slot.intensity = intensity
  slot.radius = radius
  return slot
}

function waterUserData(mat: MeshStandardNodeMaterial): WaterTslUserData {
  return mat.userData as WaterTslUserData
}

export default function Water({ isNight = true }: WaterProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<MeshStandardNodeMaterial | null>(null)
  const { camera, gl } = useThree()

  const weather = useGameStore((s) => s.weather)
  const quality = useGameStore((s) => s.qualityPreset)
  const waveParams = useGameStore((s) => s.waveParams)
  const stormIntensity = useGameStore((s) => s.stormIntensity)
  const lightIntensity = useGameStore((s) => s.lightIntensity)
  const timeOfDay = useGameStore((s) => s.timeOfDay)
  const bpm = useGameStore((s) => s.bpm)
  const musicPlaying = useGameStore((s) => s.musicPlaying)
  const ships = useGameStore((s) => s.ships)
  const installedUpgrades = useGameStore((s) => s.installedUpgrades)
  const spreaderPos = useGameStore((s) => s.spreaderPos)
  const musicPulse = useMusicPulse(bpm)
  const musicActive = Array.from(musicPlaying.values()).some(Boolean)

  const { 'Cinema 256': cinemaLeva } = useControls('Ocean', {
    'Cinema 256': false,
  })

  const segments = quality === 'high' ? 512 : quality === 'medium' ? 256 : 128

  const gpuLatchedOff = useRef(false)
  const [gpuEpoch, setGpuEpoch] = useState(0)
  const gpuEligible = canUseGpuOceanFft(gl) && !gpuLatchedOff.current
  const wantCinema = cinemaLeva || parseOceanCinema()
  const fftSize = resolveOceanFftSize(quality, { cinema: wantCinema, gpu: gpuEligible })

  const fftTextureRef = useRef<OceanFFTTexture | null>(null)
  const gpuComputeRef = useRef<OceanFFTCompute | null>(null)
  const cinemaWarned = useRef(false)

  useEffect(() => {
    if (wantCinema && quality !== 'low' && quality !== 'medium' && !gpuEligible && !cinemaWarned.current) {
      cinemaWarned.current = true
      console.warn('[oceanFFT] cinema 256² requires GPU compute; staying on 128² CPU/WASM')
    }
  }, [wantCinema, quality, gpuEligible])

  const fft = useMemo(() => {
    fftTextureRef.current?.dispose()
    fftTextureRef.current = null
    gpuComputeRef.current?.dispose()
    gpuComputeRef.current = null

    // gpuEpoch retriggers after a GPU init failure latches to CPU/WASM.
    void gpuEpoch
    if (fftSize === 0) {
      waveSystem.setOceanFFT(false)
      return undefined
    }

    const field = waveSystem.setOceanFFT(true, { size: fftSize, seed: oceanFFTSeed() })
    if (!field) return undefined

    if (gpuEligible) {
      const gpu = new OceanFFTCompute(field.size)
      gpuComputeRef.current = gpu
      return { texture: gpu.texture as unknown as THREE.Texture, patchSize: field.patchSize, size: field.size }
    }

    const packed = createOceanFFTTexture(field)
    fftTextureRef.current = packed
    return { texture: packed.texture, patchSize: field.patchSize, size: field.size }
    // gpuEpoch retriggers after a GPU init failure latches to CPU/WASM.
  }, [fftSize, gpuEligible, gpuEpoch])

  useEffect(() => {
    const gpu = gpuComputeRef.current
    if (!gpu) return
    let cancelled = false
    void gpu.init(gl).then((ok) => {
      if (cancelled) return
      if (!ok) {
        gpuLatchedOff.current = true
        setGpuEpoch((epoch) => epoch + 1)
      }
    })
    return () => {
      cancelled = true
    }
  }, [fft, gl])

  useEffect(
    () => () => {
      fftTextureRef.current?.dispose()
      fftTextureRef.current = null
      gpuComputeRef.current?.dispose()
      gpuComputeRef.current = null
      waveSystem.setOceanFFT(false)
    },
    [],
  )

  const material = useMemo(() => {
    const mat = createWaterNodeMaterial({
      isNight,
      weather,
      waveAmp: waveParams.amplitude,
      waveSpeed: waveParams.speed,
      stormIntensity,
      fft,
    })
    materialRef.current = mat
    const layers = waveSystem.getLayersForShader()
    const u = waterUserData(mat)
    for (let i = 0; i < MAX_WAVE_LAYERS; i++) {
      if (i < layers.length) {
        u.uWaveAmplitudes.array[i] = layers[i].amplitude
        u.uWaveFrequencies.array[i] = layers[i].frequency
        u.uWaveSpeeds.array[i] = layers[i].speed
        u.uWaveDirections.array[i].set(layers[i].direction[0], layers[i].direction[1])
        u.uWaveSteepness.array[i] = layers[i].steepness
      }
    }
    return mat
  }, [isNight, weather, waveParams.amplitude, waveParams.speed, stormIntensity, fft])

  useFrame(() => {
    const mat = materialRef.current
    if (!mat) return
    const u = waterUserData(mat)

    // WaveSystem re-transforms the field on its own cadence (30 Hz). GPU
    // displacement is packed by WGSL; CPU/WASM fallback re-packs a DataTexture.
    // Dirty is left set while GPU init is in flight so the first ready frame
    // still uploads.
    const field = waveSystem.getOceanFFT()
    const gpu = gpuComputeRef.current
    if (field) {
      if (gpu) {
        if (gpu.ready && waveSystem.consumeOceanFFTDirty()) {
          if (!gpu.dispatch(field) && gpu.failedToInit) {
            gpuLatchedOff.current = true
            setGpuEpoch((epoch) => epoch + 1)
          }
        }
      } else if (fftTextureRef.current && waveSystem.consumeOceanFFTDirty()) {
        fftTextureRef.current.sync(field)
      }
    }

    const nightBlend = isNight
      ? 1
      : timeOfDay < 8
        ? (8 - timeOfDay) / 3
        : timeOfDay > 18
          ? (timeOfDay - 18) / 5
          : 0
    const clampedNightBlend = Math.max(0, Math.min(1, nightBlend))

    upgradeByShip.clear()
    for (let i = 0; i < installedUpgrades.length; i++) {
      const id = installedUpgrades[i].shipId
      upgradeByShip.set(id, (upgradeByShip.get(id) ?? 0) + 1)
    }

    lightCount = 0
    const dockBase = Math.max(0.25, lightIntensity)
    pushLight(-20, 8, -8, DOCK_WARM, 2.4 * dockBase, 30)
    pushLight(20, 8, -8, DOCK_WARM, 2.4 * dockBase, 30)
    pushLight(-30, -3, 10, DOCK_COOL, 1.8 * dockBase, 34)
    pushLight(30, -3, 10, DOCK_COOL, 1.8 * dockBase, 34)
    pushLight(
      spreaderPos.x,
      spreaderPos.y + 0.8,
      spreaderPos.z,
      SPREADER_LIGHT,
      (2.2 + Math.max(0, 8 - spreaderPos.y) * 0.2) * lightIntensity,
      14,
    )

    for (let si = 0; si < ships.length; si++) {
      const ship = ships[si]
      const installedCount = upgradeByShip.get(ship.id) ?? 0
      const maxPoints = Math.max(1, ship.attachmentPoints.length)
      const progress = Math.min(1, installedCount / maxPoints)
      const baseColor = SHIP_LIGHT_COLORS[ship.type] ?? SHIP_LIGHT_DEFAULT
      pushLight(
        ship.position[0],
        ship.position[1] + 4.5,
        ship.position[2],
        baseColor,
        (0.7 + progress * 1.6) * lightIntensity,
        Math.max(12, ship.length * 0.7),
      )
      if (ship.type === 'tanker') {
        pushLight(
          ship.position[0] - 2.4,
          ship.position[1] + 9.5,
          ship.position[2] - ship.length * 0.22,
          TANKER_FLARE,
          (1.4 + progress * 2.0) * lightIntensity,
          20,
        )
      }
      let usedPoints = 0
      for (let ui = 0; ui < installedUpgrades.length; ui++) {
        const upgrade = installedUpgrades[ui]
        if (upgrade.shipId !== ship.id || usedPoints >= 2) continue
        let part: (typeof ship.attachmentPoints)[number] | undefined
        for (let pi = 0; pi < ship.attachmentPoints.length; pi++) {
          if (ship.attachmentPoints[pi].partName === upgrade.partName) {
            part = ship.attachmentPoints[pi]
            break
          }
        }
        if (!part) continue
        const slot = pushLight(
          ship.position[0] + part.position[0],
          ship.position[1] + part.position[1] + 1.2,
          ship.position[2] + part.position[2],
          baseColor,
          (1.1 + progress * 1.3) * lightIntensity,
          12,
        )
        slot.color.lerp(WHITE, 0.35)
        usedPoints += 1
      }
    }

    // Score, then stable in-place sort of a preallocated array (ties keep push order).
    sortedLights.length = lightCount
    for (let i = 0; i < lightCount; i++) {
      const slot = lightPool[i]
      const distance = slot.position.distanceTo(camera.position)
      slot.score = slot.intensity / (1 + distance * 0.05)
      sortedLights[i] = slot
    }
    sortedLights.sort(byScoreDesc)
    const litCount = Math.min(lightCount, MAX_DYNAMIC_LIGHTS)

    u.uTime.value = waveSystem.getTime()
    u.uCameraPos.value.copy(camera.position)
    u.uGlobalAmp.value = waveParams.amplitude * (musicActive ? 1 + musicPulse * 0.12 : 1)
    u.uGlobalSpeed.value = waveParams.speed
    u.uStormIntensity.value = stormIntensity
    u.uNightBlend.value = clampedNightBlend
    u.uIsNight.value = isNight ? 1 : 0

    const layers = waveSystem.getLayersForShader()
    for (let i = 0; i < MAX_WAVE_LAYERS; i++) {
      if (i < layers.length) {
        u.uWaveAmplitudes.array[i] = layers[i].amplitude
        u.uWaveSpeeds.array[i] = layers[i].speed
        u.uWaveDirections.array[i].set(layers[i].direction[0], layers[i].direction[1])
      }
    }

    u.uDynLightCount.value = litCount
    for (let i = 0; i < MAX_DYNAMIC_LIGHTS; i++) {
      const current = i < litCount ? sortedLights[i] : undefined
      u.uDynLightIntensities.array[i] = current ? current.intensity * clampedNightBlend : 0
      u.uDynLightRadii.array[i] = current ? current.radius : 1
      if (current) {
        u.uDynLightPositions.array[i].copy(current.position)
        u.uDynLightColors.array[i].copy(current.color)
      } else {
        u.uDynLightPositions.array[i].set(0, -1000, 0)
        u.uDynLightColors.array[i].setRGB(0, 0, 0)
      }
    }

    u.uTugActive.value = tugboatWakeState.active ? 1 : 0
    if (tugboatWakeState.active) {
      u.uTugPos.value.copy(tugboatWakeState.position)
      u.uTugDir.value.copy(tugboatWakeState.direction)
      u.uPropWashPower.value = tugboatWakeState.propWashPower
      u.uWashAsymmetry.value = tugboatWakeState.washAsymmetry
    } else {
      u.uPropWashPower.value = 0
    }
  })

  return (
    <mesh ref={meshRef} position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[1000, 1000, segments, segments]} />
    </mesh>
  )
}
