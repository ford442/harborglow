import { useState, useEffect, useMemo, Suspense, lazy, type ComponentProps } from 'react'
import { Canvas, type Renderer as FiberRenderer } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { Leva } from 'leva'
import { useGameStore } from './store/useGameStore'
import {
  createGameRenderer,
  parseScreenshotMode,
  resolveContextOptions,
  shadowMapTypeForQuality,
  shadowQualityForPreset,
  RendererDiagnosticsMonitor,
  FrameBudgetMonitor,
  WireframeDebug,
  runWebgpuBootProbe,
  getWebgpuProbe,
  toWebgpuProbePublic,
  type WebgpuProbePublic,
} from './rendering'
import type { TrainingModuleId } from './systems/trainingSystem'
import ErrorBoundary from './components/ErrorBoundary'
import HUD from './components/HUD'
import WebGPUFatalOverlay from './components/WebGPUFatalOverlay'
import TrainingHUD from './components/TrainingHUD'

const MainScene = lazy(() => import(/* webpackChunkName: "main-scene" */ './scenes/MainScene'))

type CanvasGlProp = ComponentProps<typeof Canvas>['gl']
const asGlProp = (
  factory: (canvas: HTMLCanvasElement) => Promise<FiberRenderer>
): CanvasGlProp => async (defaultProps) => factory(defaultProps.canvas as HTMLCanvasElement)

const WALKING_CONTROL_MAP = [
  { name: 'forward', keys: ['KeyW'] },
  { name: 'backward', keys: ['KeyS'] },
  { name: 'left', keys: ['KeyA'] },
  { name: 'right', keys: ['KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'sprint', keys: ['ShiftLeft', 'ShiftRight'] },
]

export interface GameShellProps {
  harborTheme: 'industrial' | 'arctic' | 'tropical'
  onOpenTraining: () => void
  currentTrainingModule: TrainingModuleId | null
  onCompleteTrainingModule: () => void
}

export default function GameShell({
  harborTheme,
  onOpenTraining,
  currentTrainingModule,
  onCompleteTrainingModule,
}: GameShellProps) {
  const [probe, setProbe] = useState<WebgpuProbePublic | null>(null)
  const [probeOk, setProbeOk] = useState(false)
  const [factoryFailed, setFactoryFailed] = useState(false)
  const [wireframeDebug, setWireframeDebug] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('wireframe')
    return raw === '1' || raw === 'true'
  })
  const [physicsDebug, setPhysicsDebug] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('physicsDebug')
    return raw === '1' || raw === 'true'
  })

  const [screenshotMode] = useState(() => parseScreenshotMode())
  const qualityPreset = useGameStore(state => state.qualityPreset)
  const shadowQuality = shadowQualityForPreset(qualityPreset)

  const contextOptions = useMemo(
    () => resolveContextOptions({ preserveDrawingBuffer: screenshotMode }),
    [screenshotMode]
  )

  const shadowConfig = useMemo(
    () => ({ enabled: shadowQuality !== 'off', type: shadowMapTypeForQuality(shadowQuality) }),
    [shadowQuality]
  )

  useEffect(() => {
    let cancelled = false
    void runWebgpuBootProbe().then((outcome) => {
      if (cancelled) return
      setProbe(toWebgpuProbePublic(outcome))
      setProbeOk(outcome.ok)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const glFactory = useMemo(
    () =>
      asGlProp(async (canvas: HTMLCanvasElement) => {
        try {
          return await createGameRenderer(canvas, {
            ...contextOptions,
            preference: 'webgpu',
            shadows: shadowQuality,
          })
        } catch (err) {
          const latest = getWebgpuProbe()
          if (latest) setProbe(toWebgpuProbePublic(latest))
          setFactoryFailed(true)
          throw err
        }
      }),
    [contextOptions, shadowQuality]
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (wireframeDebug) params.set('wireframe', '1')
    else params.delete('wireframe')
    if (physicsDebug) params.set('physicsDebug', '1')
    else params.delete('physicsDebug')
    const next = params.toString()
    window.history.replaceState({}, '', `${window.location.pathname}${next ? `?${next}` : ''}`)
  }, [wireframeDebug, physicsDebug])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return

      if (e.code === 'KeyG') {
        setWireframeDebug((prev) => !prev)
      }
      if (e.code === 'KeyF') {
        setPhysicsDebug((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!probeOk || factoryFailed) {
    return <WebGPUFatalOverlay probe={factoryFailed || probe?.ok === false ? probe : null} />
  }

  return (
    <ErrorBoundary>
      <Canvas
        shadows={shadowConfig}
        camera={{ position: [0, 2.5, 4.5], fov: 60 }}
        dpr={[1, 2]}
        gl={glFactory}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100vw',
          height: '100vh',
          display: 'block',
        }}
        onCreated={(state) => {
          const canvas = (state.gl as { domElement?: HTMLCanvasElement }).domElement
          if (canvas) {
            canvas.dataset.renderer = 'webgpu'
          }
        }}
      >
        <Suspense fallback={<SceneFallback />}>
          <KeyboardControls map={WALKING_CONTROL_MAP}>
            <Physics gravity={[0, -9.81, 0]}>
              <MainScene harborTheme={harborTheme} />
              <RendererDiagnosticsMonitor
                preference="webgpu"
                contextOptions={contextOptions}
              />
              <FrameBudgetMonitor />
              <WireframeDebug enabled={wireframeDebug} />
            </Physics>
          </KeyboardControls>
        </Suspense>
      </Canvas>

      <HUD onOpenTraining={onOpenTraining} />

      {currentTrainingModule && (
        <TrainingHUD
          moduleId={currentTrainingModule}
          onExit={onCompleteTrainingModule}
          onComplete={onCompleteTrainingModule}
        />
      )}

      <Leva collapsed={true} titleBar={{ title: 'Harbor Controls' }} flat />
    </ErrorBoundary>
  )
}

function SceneFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#00d4aa" wireframe />
    </mesh>
  )
}
