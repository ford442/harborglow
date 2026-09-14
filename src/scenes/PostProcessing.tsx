import { useEffect, useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { RenderPipeline } from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { metalness, mrt, normalView, output, pass, roughness } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import { ssr } from 'three/addons/tsl/display/SSRNode.js'
import { useGameStore } from '../store/useGameStore'
import { AudioAnalysisData } from '../systems/audioVisualSync'
import { weatherSystem } from '../systems/weatherSystem'
import { moonSystem } from '../systems/moonSystem'
import { getLookDevSettings } from '../utils/lookDevControls'
import { useControls } from 'leva'
import { getSunPosition } from './mainScene/MainSceneHelpers'
import { getRendererDiagnostics, updateRendererDiagnostics } from '../rendering/rendererState'
import { getGpuChoreSession } from '../rendering/gpuChores'
import { applyGodRays, createGodRaysUniforms, type GodRaysUniforms } from '../shaders/godRaysTsl'
import { applyColorGrade, createColorGradeUniforms, type ColorGradeLut, type ColorGradeUniforms } from '../shaders/colorGradeTsl'
import { tsl } from '../shaders/tslCast'

interface PostProcessingProps {
  enabled?: boolean
  audioData?: AudioAnalysisData
}

const QUALITY_CONFIGS = {
  low: {
    bloom: { intensity: 1.2, threshold: 0.5, radius: 0.5 },
    vignette: 0.35,
    chromaticAberration: 0.0,
    filmGrain: 0.015,
    contrast: 1.05,
    dof: false,
    ssao: false,
  },
  medium: {
    bloom: { intensity: 1.8, threshold: 0.4, radius: 0.6 },
    vignette: 0.45,
    chromaticAberration: 0.0008,
    filmGrain: 0.025,
    contrast: 1.1,
    dof: true,
    ssao: false,
  },
  high: {
    bloom: { intensity: 2.4, threshold: 0.35, radius: 0.75 },
    vignette: 0.55,
    chromaticAberration: 0.0015,
    filmGrain: 0.035,
    contrast: 1.15,
    dof: true,
    ssao: true,
  },
  cinema: {
    bloom: { intensity: 3.0, threshold: 0.28, radius: 0.9 },
    vignette: 0.65,
    chromaticAberration: 0.0025,
    filmGrain: 0.045,
    contrast: 1.2,
    dof: true,
    ssao: true,
  },
}

const GOD_RAYS_SAMPLES: Record<keyof typeof QUALITY_CONFIGS, number> = {
  low: 0,
  medium: 32,
  high: 64,
  cinema: 64,
}

const COLOR_LUTS = {
  dawn: {
    brightness: 0.92,
    contrast: 1.08,
    saturation: 0.85,
    warmth: 0.25,
    tint: [0.05, 0.03, 0.0] as [number, number, number],
    shadows: [0.04, 0.04, 0.08] as [number, number, number],
    highlights: [1.0, 0.92, 0.75] as [number, number, number],
  },
  day: {
    brightness: 1.02,
    contrast: 1.02,
    saturation: 0.95,
    warmth: 0.08,
    tint: [0.0, 0.0, 0.0] as [number, number, number],
    shadows: [0.08, 0.09, 0.12] as [number, number, number],
    highlights: [1.0, 0.98, 0.95] as [number, number, number],
  },
  golden: {
    brightness: 0.97,
    contrast: 1.12,
    saturation: 1.05,
    warmth: 0.42,
    tint: [0.15, 0.08, 0.0] as [number, number, number],
    shadows: [0.12, 0.08, 0.04] as [number, number, number],
    highlights: [1.0, 0.88, 0.65] as [number, number, number],
  },
  blueHour: {
    brightness: 0.88,
    contrast: 1.15,
    saturation: 0.88,
    warmth: -0.15,
    tint: [0.0, 0.03, 0.12] as [number, number, number],
    shadows: [0.02, 0.03, 0.06] as [number, number, number],
    highlights: [0.72, 0.82, 1.0] as [number, number, number],
  },
  night: {
    brightness: 0.85,
    contrast: 1.18,
    saturation: 0.82,
    warmth: -0.25,
    tint: [0.0, 0.02, 0.06] as [number, number, number],
    shadows: [0.01, 0.02, 0.04] as [number, number, number],
    highlights: [0.65, 0.75, 0.92] as [number, number, number],
  },
}

type BloomPass = {
  strength: { value: number }
  threshold: { value: number }
  radius: { value: number }
}

type SsrPass = {
  opacity: { value: number }
  maxDistance: { value: number }
}

type PassHandle = {
  setSize?: (w: number, h: number) => void
  getTexture?: (name?: string) => THREE.Texture
}

export default function PostProcessing({ enabled = true, audioData }: PostProcessingProps) {
  const { scene, camera, gl, size } = useThree()

  const qualityPreset = useGameStore((state) => state.qualityPreset)
  const isNight = useGameStore((state) => state.isNight)
  const timeOfDay = useGameStore((state) => state.timeOfDay)
  const bpm = useGameStore((state) => state.bpm)
  const ships = useGameStore((state) => state.ships)
  const spectatorState = useGameStore((state) => state.spectatorState)

  const config = QUALITY_CONFIGS[qualityPreset]
  const cinematicTargetShip = spectatorState.targetShipId
    ? ships.find((s) => s.id === spectatorState.targetShipId)
    : undefined
  const cinematicBoostRef = useRef(0)
  const baseRadiance = isNight
    ? timeOfDay >= 20 && timeOfDay < 22
      ? 1.06
      : 1.1
    : timeOfDay >= 17 && timeOfDay < 20
      ? 1.03
      : 1

  const {
    'Night Spectator Boost': cinematicNightBoost,
    'Bloom Boost %': cinematicBloomBoost,
    'Color Lift': cinematicColorLift,
    'God Rays': godRaysEnabled,
    'God Rays Exposure': godRaysExposure,
    'God Rays Decay': godRaysDecay,
    'God Rays Density': godRaysDensity,
    'God Rays Weight': godRaysWeight,
    'God Rays Samples': godRaysSamplesLeva,
  } = useControls('Cinematic', {
    'Night Spectator Boost': { value: 1, min: 0, max: 2, step: 0.05 },
    'Bloom Boost %': { value: 0.32, min: 0, max: 0.8, step: 0.02 },
    'Color Lift': { value: 0.14, min: 0, max: 0.4, step: 0.02 },
    'God Rays': { value: true },
    'God Rays Exposure': { value: 0.35, min: 0, max: 1.5, step: 0.02 },
    'God Rays Decay': { value: 0.96, min: 0.85, max: 0.99, step: 0.005 },
    'God Rays Density': { value: 0.92, min: 0.3, max: 2.0, step: 0.02 },
    'God Rays Weight': { value: 0.12, min: 0.02, max: 0.4, step: 0.01 },
    'God Rays Samples': { value: 32, min: 8, max: 64, step: 8 },
  })

  const diag = getRendererDiagnostics()
  const ssrCapable =
    diag.activeBackend === 'webgpu' &&
    diag.capabilities?.computeShaders === true &&
    (qualityPreset === 'high')

  const {
    'SSR Enabled': ssrEnabledLeva,
    'SSR Intensity': ssrIntensity,
    'SSR Max Distance': ssrMaxDistance,
  } = useControls(
    'Post / SSR',
    {
      'SSR Enabled': { value: true },
      'SSR Intensity': { value: 1.0, min: 0, max: 3, step: 0.1 },
      'SSR Max Distance': { value: 20, min: 5, max: 100, step: 1 },
    },
    { collapsed: true, render: () => ssrCapable },
  )

  const lightShowActive = useMemo(() => ships.some((s) => s.version === '2.0'), [ships])

  const getTimeLUT = useCallback((): ColorGradeLut => {
    if (timeOfDay >= 5 && timeOfDay < 8) return COLOR_LUTS.dawn
    if (timeOfDay >= 8 && timeOfDay < 17) return COLOR_LUTS.day
    if (timeOfDay >= 17 && timeOfDay < 20) return COLOR_LUTS.golden
    if (timeOfDay >= 20 && timeOfDay < 22) return COLOR_LUTS.blueHour
    return COLOR_LUTS.night
  }, [timeOfDay])

  const pipelineRef = useRef<RenderPipeline | null>(null)
  const bloomPassRef = useRef<BloomPass | null>(null)
  const ssrPassRef = useRef<SsrPass | null>(null)
  const ssrLiveRef = useRef(false)
  const gradeRef = useRef<ColorGradeUniforms | null>(null)
  const godRaysRef = useRef<GodRaysUniforms | null>(null)
  const scenePassRef = useRef<PassHandle | null>(null)
  const lightPos3DRef = useRef(new THREE.Vector3())
  const projectedLightRef = useRef(new THREE.Vector3())
  const beatRef = useRef({ intensity: 1, lastBeat: 0, pulse: 0 })

  useEffect(() => {
    const session = getGpuChoreSession()
    session.attach(gl as never)
    return () => session.detach()
  }, [gl])

  useEffect(() => {
    if (!enabled || qualityPreset === 'low') {
      pipelineRef.current = null
      ssrLiveRef.current = false
      updateRendererDiagnostics({ supportsSSR: false })
      return
    }

    const scenePass = pass(scene, camera)
    scenePassRef.current = scenePass as unknown as PassHandle

    let beauty = tsl(scenePass.getTextureNode('output'))
    let ssrWired = false

    const canSsr =
      getRendererDiagnostics().activeBackend === 'webgpu' &&
      getRendererDiagnostics().capabilities?.computeShaders === true &&
      (qualityPreset === 'high')

    if (canSsr) {
      scenePass.setMRT(
        mrt({
          output,
          normal: normalView,
          metalness,
          roughness,
        }),
      )
      const ssrPass = ssr(
        scenePass.getTextureNode('output'),
        scenePass.getTextureNode('depth'),
        scenePass.getTextureNode('normal'),
        scenePass.getTextureNode('metalness'),
        scenePass.getTextureNode('roughness'),
        camera,
      )
      ssrPass.maxDistance.value = 20
      ssrPass.opacity.value = 1
      ssrPassRef.current = ssrPass
      beauty = beauty.add(ssrPass)
      ssrWired = true
    } else {
      ssrPassRef.current = null
    }

    ssrLiveRef.current = ssrWired
    updateRendererDiagnostics({
      supportsSSR: ssrWired,
    })

    const godU = createGodRaysUniforms()
    godRaysRef.current = godU
    let withRays = tsl(applyGodRays(scenePass.getTextureNode('output'), scenePass.getTextureNode('depth'), godU))
    if (ssrWired) {
      withRays = tsl(withRays.add(beauty.sub(scenePass.getTextureNode('output'))))
    }

    const bloomRadius = THREE.MathUtils.clamp(config.bloom.radius, 0, 1)
    const bloomPass = bloom(withRays, config.bloom.intensity, bloomRadius, config.bloom.threshold)
    bloomPassRef.current = bloomPass

    const lut = getTimeLUT()
    const gradeU = createColorGradeUniforms(lut, config.vignette, config.chromaticAberration, config.filmGrain)
    gradeRef.current = gradeU

    const composited = withRays.add(bloomPass)
    const graded = applyColorGrade(composited, gradeU)

    const pipeline = new RenderPipeline(gl as never)
    pipeline.outputNode = graded
    pipeline.needsUpdate = true
    pipelineRef.current = pipeline

    return () => {
      pipelineRef.current = null
      bloomPassRef.current = null
      ssrPassRef.current = null
      ssrLiveRef.current = false
      gradeRef.current = null
      godRaysRef.current = null
      scenePassRef.current = null
    }
  }, [enabled, qualityPreset, gl, scene, camera, config.bloom.intensity, config.bloom.radius, config.bloom.threshold, config.vignette, config.chromaticAberration, config.filmGrain, getTimeLUT])

  useEffect(() => {
    const passNode = scenePassRef.current
    passNode?.setSize?.(size.width, size.height)
  }, [size.width, size.height])

  useEffect(() => {
    const grade = gradeRef.current
    if (!grade) return
    const lut = getTimeLUT()
    grade.uBrightness.value = lut.brightness
    grade.uContrast.value = lut.contrast
    grade.uSaturation.value = lut.saturation
    grade.uWarmth.value = lut.warmth
    grade.uTint.value.set(...lut.tint)
    grade.uShadows.value.set(...lut.shadows)
    grade.uHighlights.value.set(...lut.highlights)
  }, [getTimeLUT, timeOfDay])

  useFrame((state) => {
    const pipeline = pipelineRef.current
    if (!enabled) return

    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatNum = Math.floor(time / beatDuration)

    if (beatNum !== beatRef.current.lastBeat && lightShowActive) {
      beatRef.current.intensity = 1.4
      beatRef.current.pulse = 1.0
      beatRef.current.lastBeat = beatNum
    } else {
      beatRef.current.intensity = THREE.MathUtils.lerp(beatRef.current.intensity, 1.0, 0.08)
      beatRef.current.pulse = THREE.MathUtils.lerp(beatRef.current.pulse, 0.0, 0.15)
    }

    const spectatorNightActive = isNight && spectatorState.isActive && !!cinematicTargetShip
    const duration = Math.max(1, spectatorState.duration || 10)
    const elapsed = spectatorNightActive ? (Date.now() - spectatorState.startTime) / 1000 : 0
    const fadeIn = THREE.MathUtils.clamp(elapsed / 1.3, 0, 1)
    const fadeOut = THREE.MathUtils.clamp((duration - elapsed) / 1.6, 0, 1)
    const cinematicTargetBoost = spectatorNightActive ? fadeIn * fadeOut * cinematicNightBoost : 0
    cinematicBoostRef.current = THREE.MathUtils.lerp(cinematicBoostRef.current, cinematicTargetBoost, 0.08)

    const godU = godRaysRef.current
    if (godU) {
      const qualitySamples = GOD_RAYS_SAMPLES[qualityPreset]
      const passEnabled = qualitySamples > 0 && godRaysEnabled
      if (!passEnabled) {
        godU.uEnabled.value = 0
      } else {
        const [lx, ly, lz] = isNight ? moonSystem.getState().position : getSunPosition(timeOfDay)
        lightPos3DRef.current.set(lx, ly, lz)
        projectedLightRef.current.copy(lightPos3DRef.current).project(camera)
        const p = projectedLightRef.current
        godU.uLightPos.value.set((p.x + 1) / 2, (p.y + 1) / 2)
        const behindCamera = p.z > 1
        const uv = godU.uLightPos.value
        const offScreen = uv.x < -0.12 || uv.x > 1.12 || uv.y < -0.12 || uv.y > 1.12
        const visible = !behindCamera && !offScreen
        godU.uEnabled.value = visible ? 1 : 0
        godU.uExposure.value = visible ? godRaysExposure : 0
        godU.uDecay.value = godRaysDecay
        godU.uDensity.value = godRaysDensity * getLookDevSettings().godRayDensity
        godU.uWeight.value = visible ? godRaysWeight : 0
        godU.uSamples.value = Math.min(godRaysSamplesLeva, qualitySamples)
      }
    }

    if (ssrPassRef.current) {
      const on = ssrEnabledLeva && ssrLiveRef.current
      ssrPassRef.current.opacity.value = on ? ssrIntensity : 0
      ssrPassRef.current.maxDistance.value = ssrMaxDistance
    }

    if (bloomPassRef.current) {
      const baseIntensity = config.bloom.intensity * (isNight ? 1.3 : 0.9)
      const audioBoost = audioData ? audioData.bass * 0.5 + audioData.envelope * 0.3 : 0
      const cinematicBloom = 1 + cinematicBoostRef.current * cinematicBloomBoost
      bloomPassRef.current.strength.value =
        baseIntensity * baseRadiance * beatRef.current.intensity * (1 + audioBoost) * cinematicBloom * (1 + getLookDevSettings().bloomExtra)
      const flareGuard = weatherSystem.getWeatherEffects().lensFlare ? 0.06 : 0
      if (audioData) {
        bloomPassRef.current.threshold.value =
          config.bloom.threshold + flareGuard - audioData.energy * 0.1 - cinematicBoostRef.current * 0.06 - (baseRadiance - 1) * 0.04
      } else {
        bloomPassRef.current.threshold.value =
          config.bloom.threshold + flareGuard - cinematicBoostRef.current * 0.06 - (baseRadiance - 1) * 0.04
      }
    }

    const grade = gradeRef.current
    if (grade) {
      const lut = getTimeLUT()
      const colorBoost = cinematicBoostRef.current * cinematicColorLift
      grade.uTime.value = time
      grade.uBeatPulse.value = beatRef.current.pulse
      grade.uFilmGrain.value = config.filmGrain * getLookDevSettings().filmGrainScale
      grade.uBrightness.value = lut.brightness + colorBoost * 0.06 + (baseRadiance - 1) * 0.03
      grade.uSaturation.value = lut.saturation + colorBoost * 0.22
      grade.uWarmth.value = lut.warmth + colorBoost * 0.12
      grade.uHighlights.value.set(
        lut.highlights[0] + colorBoost * 0.12,
        lut.highlights[1] + colorBoost * 0.14,
        lut.highlights[2] + colorBoost * 0.2,
      )
      const spectatorChromaticBoost = spectatorState.isActive ? 2.0 : 1.0
      grade.uChromaticAberration.value = config.chromaticAberration * spectatorChromaticBoost
      grade.uVignette.value = config.vignette + (spectatorState.isActive ? 0.1 : 0)
    }

    if (pipeline && qualityPreset !== 'low') {
      pipeline.render()
    }

    const choreSession = getGpuChoreSession()
    choreSession.tick({
      renderer: gl as never,
      colorTexture: scenePassRef.current?.getTexture?.('output') ?? null,
      dofEnabled: config.dof,
    })
  }, enabled && qualityPreset !== 'low' ? 1 : 0)

  return null
}
