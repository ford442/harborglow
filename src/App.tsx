import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Leva } from 'leva'
import { useGameStore } from './store/useGameStore'
import { loadGameState } from './utils/storage_manager'
import * as Tone from 'tone'
import MainMenu from './components/MainMenu'
import LoadingScreen from './components/LoadingScreen'
import './App.css'

// Lazy load MainScene for code splitting
const MainScene = lazy(() => import('./scenes/MainScene'))

// =============================================================================
// APP COMPONENT
// Bootstrap, menu, and game container
// =============================================================================

function App() {
    const [screen, setScreen] = useState<'menu' | 'loading' | 'game'>('menu')
    const [loadingProgress, setLoadingProgress] = useState(0)
    const hasSave = !!loadGameState()
    
    const loadSavedState = useGameStore(state => state.loadSavedState)
    const resetGame = useGameStore(state => state.resetGame)
    
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

    // Loading sequence with progress simulation
    const startGame = useCallback(async (loadSave: boolean) => {
        setScreen('loading')
        
        // Simulate progressive loading
        const steps = [
            { progress: 20, delay: 100, label: 'Initializing harbor...' },
            { progress: 45, delay: 200, label: 'Loading ship blueprints...' },
            { progress: 70, delay: 150, label: 'Calibrating cranes...' },
            { progress: 90, delay: 100, label: 'Building control booth...' },
            { progress: 100, delay: 100, label: 'Ready' },
        ]

        for (const step of steps) {
            await new Promise(r => setTimeout(r, step.delay))
            setLoadingProgress(step.progress)
        }

        if (loadSave) {
            loadSavedState()
        } else {
            resetGame()
        }
        
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

    // Menu screen
    if (screen === 'menu') {
        return <MainMenu hasSave={hasSave} onNewGame={handleNewGame} onLoadGame={handleLoadGame} />
    }

    // Loading screen
    if (screen === 'loading') {
        return <LoadingScreen progress={loadingProgress} />
    }

    // Game screen - IMMERSIVE CONTROL BOOTH MODE
    return (
        <>
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
                <Suspense fallback={null}>
                    <Physics gravity={[0, -9.81, 0]}>
                        {/*
                          IMMERSIVE MODE: useBooth={true}
                          This wraps the scene in a 3D control booth with live monitors
                        */}
                        <MainScene
                            useBooth={true}
                            harborTheme={harborTheme()}
                        />
                    </Physics>
                </Suspense>
            </Canvas>
            <Leva
                collapsed={true}
                titleBar={{ title: 'Harbor Controls' }}
                flat
            />
        </>
    )
}

export default App
