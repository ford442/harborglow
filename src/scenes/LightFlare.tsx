// =============================================================================
// LIGHT FLARE — single source (three-stdlib Lensflare + billboard fallback)
// =============================================================================

import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Lensflare, LensflareElement } from 'three-stdlib'
import { getFlareTextures } from './lightFlareTextures'
import { getLightFlareSettings } from '../systems/lightFlareSettings'
import { getLookDevSettings } from '../utils/lookDevControls'
import { detectActiveBackend } from '../rendering/rendererState'
import { lightingSystem } from '../systems/lightingSystem'
import { getAudioAnalysisData } from '../systems/audioVisualSync'

export type FlarePreset = 'sun' | 'warm' | 'cool' | 'starburst'

export interface LightFlareProps {
  position: [number, number, number]
  color?: string
  preset?: FlarePreset
  /** Source brightness multiplier 0–1+ */
  brightness?: number
  brightnessRef?: MutableRefObject<number>
}

interface FlareBuildResult {
  lensflare: Lensflare
  elements: LensflareElement[]
  baseSizes: number[]
}

const _camDir = new THREE.Vector3()
const _toSource = new THREE.Vector3()
const _sourcePos = new THREE.Vector3()

function buildLensflare(
  preset: FlarePreset,
  color: THREE.Color,
  anamorphic: boolean,
  dirt: boolean
): FlareBuildResult {
  const tex = getFlareTextures()
  const lf = new Lensflare()
  const baseSizes: number[] = []
  const elements: LensflareElement[] = []

  const add = (texture: THREE.Texture, size: number, distance: number, tint?: THREE.Color) => {
    const el = new LensflareElement(texture, size, distance, tint ?? color)
    lf.addElement(el)
    baseSizes.push(size)
    elements.push(el)
  }

  switch (preset) {
    case 'sun':
      add(tex.star, 620, 0)
      add(tex.core, 280, 0.04, color)
      if (anamorphic) add(tex.streak, 480, 0.35)
      add(tex.ring, 160, 0.55)
      if (anamorphic) add(tex.streak, 320, 0.72, new THREE.Color('#ffd080'))
      add(tex.ring, 90, 0.88, new THREE.Color('#ffb060'))
      if (dirt) add(tex.dirt, 220, 0.42, new THREE.Color('#806040'))
      break
    case 'starburst':
      add(tex.star, 420, 0)
      add(tex.core, 180, 0.06)
      add(tex.ring, 110, 0.45)
      if (anamorphic) add(tex.streak, 260, 0.62)
      add(tex.ring, 70, 0.82)
      break
    case 'cool':
      add(tex.core, 220, 0)
      add(tex.ring, 80, 0.38, new THREE.Color('#a8d8ff'))
      add(tex.ring, 55, 0.72, new THREE.Color('#70c0ff'))
      break
    case 'warm':
    default:
      add(tex.core, 260, 0)
      add(tex.ring, 90, 0.32)
      if (anamorphic) add(tex.streak, 180, 0.58, new THREE.Color('#ffcc88'))
      add(tex.core, 50, 0.78, new THREE.Color('#ffaa55'))
      break
  }

  return { lensflare: lf, elements, baseSizes }
}

function BillboardFlare({
  position,
  color,
  preset,
  brightness = 1,
  brightnessRef,
}: LightFlareProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const tex = useMemo(() => getFlareTextures(), [])
  const baseColor = useMemo(() => new THREE.Color(color ?? '#ffffff'), [color])

  const map = preset === 'starburst' || preset === 'sun' ? tex.star : tex.core

  useFrame(({ camera }) => {
    const mesh = meshRef.current
    const mat = matRef.current
    if (!mesh || !mat) return

    const settings = getLightFlareSettings()
    if (!settings.enabled) {
      mat.opacity = 0
      return
    }

    _sourcePos.set(...position)
    _toSource.subVectors(_sourcePos, camera.position)
    const dist = _toSource.length()
    if (dist < 0.001) return
    _toSource.normalize()
    camera.getWorldDirection(_camDir)
    const alignment = Math.max(0, _camDir.dot(_toSource))
    const gate = Math.pow(alignment, settings.threshold)
    if (gate < 0.002) {
      mat.opacity = 0
      return
    }

    const beat = lightingSystem.getBeatPulse()
    const audio = getAudioAnalysisData()
    const pulse = 1 + beat * 0.32 + (audio.beat ? 0.12 : 0)
    const liveBrightness = brightnessRef?.current ?? brightness

    mesh.lookAt(camera.position)
    const scale =
      settings.size *
      liveBrightness *
      settings.intensity *
      pulse *
      gate *
      THREE.MathUtils.clamp(24 / dist, 0.35, 4.5)
    mesh.scale.setScalar(scale * (preset === 'sun' ? 1.4 : 1))
    mat.opacity = THREE.MathUtils.clamp(gate * liveBrightness * settings.intensity * pulse * 0.85, 0, 1)
    mat.color.copy(baseColor)
  })

  return (
    <mesh ref={meshRef} position={position} frustumCulled={false} renderOrder={999}>
      <planeGeometry args={[2.2, 2.2]} />
      <meshBasicMaterial
        ref={matRef}
        map={map}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0}
        color={baseColor}
      />
    </mesh>
  )
}

export default function LightFlare({
  position,
  color = '#ffffff',
  preset = 'warm',
  brightness = 1,
  brightnessRef,
}: LightFlareProps) {
  const { gl } = useThree()
  const backend = useMemo(
    () =>
      detectActiveBackend(
        gl as unknown as {
          isWebGLRenderer?: boolean
          isWebGPURenderer?: boolean
          backend?: { isWebGPUBackend?: boolean }
        }
      ),
    [gl]
  )
  const useBillboard = backend === 'webgpu'

  const flareColor = useMemo(() => new THREE.Color(color), [color])
  const lookDev = getLookDevSettings()
  const build = useMemo(() => {
    return buildLensflare(preset, flareColor, lookDev.flareAnamorphic, lookDev.flareDirt)
  }, [preset, flareColor, lookDev.flareAnamorphic, lookDev.flareDirt])

  const elementsRef = useRef<LensflareElement[]>(build.elements)
  const baseSizesRef = useRef<number[]>(build.baseSizes)

  useEffect(() => {
    elementsRef.current = build.elements
    baseSizesRef.current = build.baseSizes
    if (useBillboard) return
    return () => {
      build.lensflare.dispose()
    }
  }, [build, useBillboard])

  useFrame(() => {
    if (useBillboard) return
    const settings = getLightFlareSettings()
    if (!settings.enabled) return

    const beat = lightingSystem.getBeatPulse()
    const audio = getAudioAnalysisData()
    const pulse = 1 + beat * 0.32 + (audio.beat ? 0.12 : 0)
    const liveBrightness = brightnessRef?.current ?? brightness
    const scale = settings.size * liveBrightness * settings.intensity * pulse
    const elements = elementsRef.current
    const baseSizes = baseSizesRef.current
    for (let i = 0; i < elements.length; i++) {
      const weight = i === 0 ? 1 : 0.55 + (i % 3) * 0.15
      elements[i].size = (baseSizes[i] ?? elements[i].size) * scale * weight
    }
  })

  if (useBillboard) {
    return (
      <BillboardFlare
        position={position}
        color={color}
        preset={preset}
        brightness={brightness}
        brightnessRef={brightnessRef}
      />
    )
  }

  return (
    <group position={position}>
      <primitive object={build.lensflare} />
    </group>
  )
}
