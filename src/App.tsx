import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { Leva, useControls } from 'leva'
import { useGameStore } from './store/useGameStore'
import {
  createGameRenderer,
  parseRendererPreference,
  persistRendererPreference,
  RendererDiagnosticsMonitor,
  WireframeDebug,
  type RendererPreference,
} from './rendering'
import { loadGameState } from './utils/storage_manager'
import { TrainingModuleId } from './systems/trainingSystem'
import * as Tone from 'tone'
import MainMenu from './components/MainMenu'
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'
import HUD from './components/HUD'
import TrainingMode from './components/TrainingMode'
import WebGPUWarning from './components/WebGPUWarning'
import TrainingHUD from './components/TrainingHUD'
import { introMusicSystem } from './systems/introMusicSystem'
import './App.css'

// Lazy load MainScene for code splitting with explicit chunk name
const MainScene = lazy(() => import(/* webpackChunkName: "main-scene" */ './scenes/MainScene'))

const WALKING_CONTROL_MAP = [
    { name: 'forward', keys: ['KeyW'] },
    { name: 'backward', keys: ['KeyS'] },
    { name: 'left', keys: ['KeyA'] },
    { name: 'right', keys: ['KeyD'] },
    { name: 'jump', keys: ['Space'] },
    { name: 'sprint', keys: ['ShiftLeft', 'ShiftRight'] },
]

// =============================================================================
// APP COMPONENT
// Bootstrap, menu, and game container with proper loading & error handling
// =============================================================================

function App() {
    const [screen, setScreen] = useState<'menu' | 'loading' | 'game' | 'training'>('menu')
    const [loadingProgress, setLoadingProgress] = useState(0)
    const [loadingStatus, setLoadingStatus] = useState('Initializing')
    const hasSave = !!loadGameState()
    
    const loadSavedState = useGameStore(state => state.loadSavedState)
    const resetGame = useGameStore(state => state.resetGame)
    const startTrainingModule = useGameStore(state => state.startTrainingModule)
    const currentTrainingModule = useGameStore(state => state.currentTrainingModule)
    const exitTrainingModule = useGameStore(state => state.exitTrainingModule)
    
    // Get current harbor theme from store (or default)
    const boothTier = useGameStore(state => state.boothTier)
    
    // Map booth tier to theme
    const harborTheme = useCallback(() => {
        switch (boothTier) {
            case 1: return 'industrial'
            case 2: return 'tropical'
            case 3: return 'arctic'
            default: return 'industrial'
        }
    }, [boothTier])

    // -------------------------------------------------------------------------
    // RENDERER BACKEND (WebGPU primary + toggleable WebGL2 fallback)
    // ?renderer=webgl, localStorage, or Leva control. Canvas remounts on change.
    // -------------------------------------------------------------------------
    const [rendererPreference, setRendererPreference] = useState<RendererPreference>(() =>
      parseRendererPreference()
    )
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

    const handleRendererPreferenceChange = useCallback((next: RendererPreference) => {
      persistRendererPreference(next)
      setRendererPreference(next)
    }, [])

    // Leva-controlled renderer backend toggle (appears under "Renderer Backend" folder)
    // Changing this updates state + URL + localStorage; Canvas key forces remount with new gl factory.
    useControls(
      'Renderer Backend',
      {
        renderer: {
          value: rendererPreference,
          options: {
            'WebGPU (primary)': 'webgpu',
            'WebGL2 (fallback/debug)': 'webgl',
          },
          onChange: (v: string) => {
            const next = (v === 'webgl' ? 'webgl' : 'webgpu') as RendererPreference
            if (next !== rendererPreference) {
              handleRendererPreferenceChange(next)
            }
          },
        },
      },
      { collapsed: true }
    )

    // URL sync for wireframe / physicsDebug (shareable debug links)
    useEffect(() => {
      const params = new URLSearchParams(window.location.search)
      if (wireframeDebug) params.set('wireframe', '1')
      else params.delete('wireframe')
      if (physicsDebug) params.set('physicsDebug', '1')
      else params.delete('physicsDebug')
      const next = params.toString()
      window.history.replaceState({}, '', `${window.location.pathname}${next ? `?${next}` : ''}`)
    }, [wireframeDebug, physicsDebug])

    // Keyboard shortcuts for debug overlays (G = wireframe, F = physics colliders)
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return
        // Ignore when focused on inputs
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

    // Initialize audio on user gesture
    useEffect(() => {
        const initAudio = async () => {
            if (Tone.context.state !== 'running') {
                await Tone.start()
            }
        }

        const handleGesture = () => {
            initAudio()
        }

        document.addEventListener('click', handleGesture, { once: true })
        document.addEventListener('keydown', handleGesture, { once: true })

        return () => {
            document.removeEventListener('click', handleGesture)
            document.removeEventListener('keydown', handleGesture)
        }
    }, [])

    // Real loading sequence with progress tracking
    const startGame = useCallback(async (loadSave: boolean) => {
        setScreen('loading')
        
        // Define loading stages with realistic weights
        const stages = [
            { weight: 15, label: 'Initializing harbor systems...', duration: 400 },
            { weight: 25, label: 'Loading ship blueprints...', duration: 600 },
            { weight: 20, label: 'Building 3D environment...', duration: 500 },
            { weight: 15, label: 'Calibrating crane physics...', duration: 400 },
            { weight: 15, label: 'Setting up audio systems...', duration: 300 },
            { weight: 10, label: 'Building control booth...', duration: 300 },
        ]
        
        let currentProgress = 0
        
        for (const stage of stages) {
            setLoadingStatus(stage.label)
            
            // Simulate progressive loading within each stage
            const steps = 5
            const stepDuration = stage.duration / steps
            const stepIncrement = stage.weight / steps
            
            for (let i = 0; i < steps; i++) {
                await new Promise(r => setTimeout(r, stepDuration))
                currentProgress += stepIncrement
                setLoadingProgress(Math.min(95, currentProgress))
            }
        }

        // Final initialization
        setLoadingStatus('Finalizing...')
        
        if (loadSave) {
            loadSavedState()
        } else {
            resetGame()
        }
        
        // Small delay for smooth transition
        await new Promise(r => setTimeout(r, 200))
        setLoadingProgress(100)
        await new Promise(r => setTimeout(r, 300))
        
        setScreen('game')
    }, [loadSavedState, resetGame])

    const handleNewGame = useCallback(() => startGame(false), [startGame])
    const handleLoadGame = useCallback(() => startGame(true), [startGame])

    // Space to start shortcut
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space' && screen === 'menu') {
                e.preventDefault()
                startGame(hasSave)
            }
        }
        
        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [screen, hasSave, startGame])

    // Handle training navigation
    const handleOpenTraining = useCallback(() => {
        setScreen('training')
    }, [])

    const handleExitTraining = useCallback(() => {
        setScreen('menu')
    }, [])

    const handleStartTrainingModule = useCallback((moduleId: TrainingModuleId) => {
        startTrainingModule(moduleId)
        setScreen('game')
    }, [startTrainingModule])

    const handleCompleteTrainingModule = useCallback(() => {
        exitTrainingModule()
        setScreen('training')
    }, [exitTrainingModule])

    const handleTugboatMode = useCallback(async () => {
        // Start a new game and immediately switch to tugboat mode
        await startGame(false)
        // Set operation mode to tugboat after a brief delay to ensure game is loaded
        setTimeout(() => {
            useGameStore.getState().setOperationMode('tugboat')
        }, 500)
    }, [startGame])

    // -------------------------------------------------------------------------
    // INTRO MUSIC LIFECYCLE
    // Orchestrate fade-outs and restarts across screen transitions.
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (screen === 'game') {
            // Fade out intro music before the 3D scene boots.
            // If already fading, this is a no-op.
            introMusicSystem.fadeOut(1.5)
        } else if (screen === 'menu') {
            // Restart title music when returning to menu
            introMusicSystem.playTitle().catch(() => {})
        } else if (screen === 'training') {
            // Quiet fade for training hub
            introMusicSystem.fadeOut(1.0)
        }
    }, [screen])

    // Menu screen
    if (screen === 'menu') {
        return <MainMenu hasSave={hasSave} onNewGame={handleNewGame} onLoadGame={handleLoadGame} onTraining={handleOpenTraining} onTugboatMode={handleTugboatMode} />
    }
    
    // Training Hub screen
    if (screen === 'training') {
        return <TrainingMode onExit={handleExitTraining} onStartModule={handleStartTrainingModule} />
    }

    // Loading screen
    if (screen === 'loading') {
        return <LoadingScreen progress={loadingProgress} status={loadingStatus} />
    }

    // Game screen - IMMERSIVE CONTROL BOOTH MODE with ErrorBoundary
    // Canvas is keyed by rendererPreference so that switching backends (via Leva / ?renderer / localStorage)
    // fully remounts the R3F root with the correct (async) gl factory.
    return (
        <ErrorBoundary>
            <Canvas
                key={`renderer-${rendererPreference}`}
                shadows
                camera={{ position: [0, 2.5, 4.5], fov: 60 }}
                dpr={[1, 2]} // Responsive pixel ratio
                gl={
                  // Async factory required for WebGPURenderer (R3F awaits the promise). Cast keeps tsc happy; runtime contract is supported.
                  (async (canvas: HTMLCanvasElement) =>
                    createGameRenderer(canvas, {
                      preference: rendererPreference,
                      antialias: true,
                      powerPreference: 'high-performance',
                      stencil: false,
                      depth: true,
                    })) as any
                }
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'block'
                }}
                onCreated={(state) => {
                  // Ensure canvas dataset + window exposure are set even on initial mount
                  const canvas = (state.gl as any).domElement as HTMLCanvasElement | undefined
                  // The monitor effect will also call expose; this is a belt-and-suspenders for early tooling
                  if (canvas) {
                    canvas.dataset.renderer = rendererPreference
                  }
                }}
            >
                <Suspense fallback={<SceneFallback />}>
                    <KeyboardControls map={WALKING_CONTROL_MAP}>
                        <Physics gravity={[0, -9.81, 0]}>
                            {/*
                              Operator Cabin Experience:
                              - Default: 4-camera multiview (multiview mode)
                              - Press 'C' to toggle Immersive Cab Mode (first-person)
                            */}
                            <MainScene harborTheme={harborTheme()} />

                            {/* Renderer-agnostic debug helpers (work on both WebGPU and WebGL2) */}
                            <RendererDiagnosticsMonitor preference={rendererPreference} />
                            <WireframeDebug enabled={wireframeDebug} />
                            {/* physicsDebug flag is live (F key / URL / future Leva) — Rapier <Debug/> not exported in current @react-three/rapier; extend here with useRapier() + manual lines if needed for full collider viz. */}
                        </Physics>
                    </KeyboardControls>
                </Suspense>
            </Canvas>
            
            {/* HUD Overlay */}
            <HUD onOpenTraining={handleOpenTraining} />
            
            {/* Renderer status / WebGPU availability banner (visible when needed or forced to fallback) */}
            <WebGPUWarning />
            
            {/* Training HUD (only when in training mode) */}
            {currentTrainingModule && (
                <TrainingHUD 
                    moduleId={currentTrainingModule}
                    onExit={handleCompleteTrainingModule}
                    onComplete={handleCompleteTrainingModule}
                />
            )}
            
            <Leva
                collapsed={true}
                titleBar={{ title: 'Harbor Controls' }}
                flat
            />
        </ErrorBoundary>
    )
}

// =============================================================================
// SCENE FALLBACK - Shows while MainScene is loading
// =============================================================================

function SceneFallback() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#00d4aa" wireframe />
        </mesh>
    )
}

export default App
