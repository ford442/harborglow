import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Leva } from 'leva'
import { useGameStore } from './store/useGameStore'
import { loadGameState } from './utils/storage_manager'
import { TrainingModuleId } from './systems/trainingSystem'
import * as Tone from 'tone'
import MainMenu from './components/MainMenu'
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'
import HUD from './components/HUD'
import TrainingMode from './components/TrainingMode'
import TrainingHUD from './components/TrainingHUD'
import { introMusicSystem } from './systems/introMusicSystem'
import './App.css'

// Lazy load MainScene for code splitting with explicit chunk name
const MainScene = lazy(() => import(/* webpackChunkName: "main-scene" */ './scenes/MainScene'))

// =============================================================================
// APP COMPONENT
// Bootstrap, menu, and game container with proper loading & error handling
// =============================================================================

function App() {
    const [screen, setScreen] = useState<'menu' | 'loading' | 'game' | 'training'>('menu')
    const [loadingProgress, setLoadingProgress] = useState(0)
    const [loadingStatus, setLoadingStatus] = useState('Initializing')
    const [activeTrainingModule, setActiveTrainingModule] = useState<TrainingModuleId | null>(null)
    const hasSave = !!loadGameState()
    
    const loadSavedState = useGameStore(state => state.loadSavedState)
    const resetGame = useGameStore(state => state.resetGame)
    const setGameMode = useGameStore(state => state.setGameMode)
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
        setActiveTrainingModule(moduleId)
        setScreen('game')
    }, [])

    const handleCompleteTrainingModule = useCallback(() => {
        exitTrainingModule()
        setActiveTrainingModule(null)
        setScreen('training')
    }, [exitTrainingModule])

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
        return <MainMenu hasSave={hasSave} onNewGame={handleNewGame} onLoadGame={handleLoadGame} onTraining={handleOpenTraining} />
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
    return (
        <ErrorBoundary>
            <Canvas
                shadows
                camera={{ position: [0, 2.5, 4.5], fov: 60 }}
                dpr={[1, 2]} // Responsive pixel ratio
                gl={{
                    antialias: true,
                    powerPreference: 'high-performance',
                    stencil: false,
                    depth: true
                }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'block'
                }}
            >
                <Suspense fallback={<SceneFallback />}>
                    <Physics gravity={[0, -9.81, 0]}>
                        {/*
                          Operator Cabin Experience:
                          - Default: 4-camera multiview (multiview mode)
                          - Press 'C' to toggle Immersive Cab Mode (first-person)
                        */}
                        <MainScene harborTheme={harborTheme()} />
                    </Physics>
                </Suspense>
            </Canvas>
            
            {/* HUD Overlay */}
            <HUD onOpenTraining={handleOpenTraining} />
            
            {/* Training HUD (only when in training mode) */}
            {activeTrainingModule && (
                <TrainingHUD 
                    moduleId={activeTrainingModule}
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
