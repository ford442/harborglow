import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Leva } from 'leva'
import { useGameStore } from './store/useGameStore'
import { loadGameState } from './utils/storage_manager'
import * as Tone from 'tone'
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
            { progress: 90, delay: 100, label: 'Syncing audio systems...' },
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

    // Game screen
    return (
        <>
            <Canvas 
                shadows 
                camera={{ position: [10, 10, 10], fov: 50 }}
                dpr={[1, 2]} // Responsive pixel ratio
                gl={{ 
                    antialias: true,
                    powerPreference: 'high-performance',
                    stencil: false,
                    depth: true
                }}
            >
                <Suspense fallback={null}>
                    <Physics gravity={[0, -9.81, 0]}>
                        <MainScene />
                    </Physics>
                </Suspense>
            </Canvas>
            <Leva 
                collapsed={true}
                titleBar={{ title: 'Harbor Controls' }}
            />
        </>
    )
}

// =============================================================================
// MAIN MENU COMPONENT
// =============================================================================

interface MainMenuProps {
    hasSave: boolean
    onNewGame: () => void
    onLoadGame: () => void
}

function MainMenu({ hasSave, onNewGame, onLoadGame }: MainMenuProps) {
    return (
        <div className="menu-container">
            <div className="menu-backdrop" />
            <div className="menu-content">
                <h1 className="menu-title">
                    <span className="title-glow">HARBOR</span>
                    <span className="title-accent">GLOW</span>
                </h1>
                <p className="menu-subtitle">Light up the night, one ship at a time.</p>
                
                <nav className="menu-nav">
                    <button className="menu-btn primary" onClick={onNewGame}>
                        <span className="btn-icon">⚡</span>
                        New Game
                    </button>
                    
                    {hasSave && (
                        <button className="menu-btn" onClick={onLoadGame}>
                            <span className="btn-icon">📂</span>
                            Continue
                        </button>
                    )}
                    
                    <button className="menu-btn" onClick={() => alert('Settings: Audio, Graphics, Controls')}>
                        <span className="btn-icon">⚙️</span>
                        Settings
                    </button>
                    
                    <button className="menu-btn" onClick={() => alert('HarborGlow v2.0 - A crane-operator light-show experience. Built with React Three Fiber, Tone.js, and love.')}>
                        <span className="btn-icon">ⓘ</span>
                        Credits
                    </button>
                </nav>
                
                <p className="menu-hint">
                    <kbd>SPACE</kbd> to start
                </p>
            </div>
        </div>
    )
}

// =============================================================================
// LOADING SCREEN COMPONENT
// =============================================================================

function LoadingScreen({ progress }: { progress: number }) {
    return (
        <div className="loading-container">
            <div className="loading-content">
                <div className="loading-spinner" />
                <div className="loading-bar">
                    <div 
                        className="loading-progress" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="loading-text">{progress}%</p>
            </div>
        </div>
    )
}

export default App
