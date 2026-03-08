import { useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'
import { Leva } from 'leva'
import MainScene from './scenes/MainScene'
import HUD from './components/HUD'
import { useGameStore } from './store/useGameStore'
import { loadGameState } from './utils/storage_manager'

function App() {
    const [screen, setScreen] = useState<'menu' | 'game'>('menu')
    const hasSave = !!loadGameState()
    
    const loadSavedState = useGameStore(state => state.loadSavedState)
    const resetGame = useGameStore(state => state.resetGame)

    const handleNewGame = useCallback(() => {
        resetGame()
        setScreen('game')
    }, [resetGame])

    const handleLoadGame = useCallback(() => {
        loadSavedState()
        setScreen('game')
    }, [loadSavedState])

    const handleKeyPress = useCallback((e: KeyboardEvent) => {
        if (e.code === 'Space' && screen === 'menu') {
            if (hasSave) {
                handleLoadGame()
            } else {
                handleNewGame()
            }
        }
    }, [screen, hasSave, handleLoadGame, handleNewGame])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [handleKeyPress])

    if (screen === 'menu') {
        return (
            <div className="menu-container">
                <div className="menu-content">
                    <h1 className="menu-title">HARBOR GLOW</h1>
                    <p className="menu-subtitle">Light up the night, one ship at a time.</p>
                    
                    <div className="menu-buttons">
                        <button className="menu-btn primary" onClick={handleNewGame}>
                            New Game
                        </button>
                        
                        {hasSave && (
                            <button className="menu-btn" onClick={handleLoadGame}>
                                Load Game
                            </button>
                        )}
                        
                        <button className="menu-btn" onClick={() => alert('Settings coming soon!')}>
                            Settings
                        </button>
                        
                        <button className="menu-btn" onClick={() => alert('HarborGlow v2.0\nBuilt with React Three Fiber + storage_manager')}>
                            Credits
                        </button>
                    </div>
                    
                    <p className="menu-hint">Press SPACE or click to start</p>
                </div>
                
                <style>{`
                    .menu-container {
                        position: fixed;
                        top: 0; left: 0;
                        width: 100vw; height: 100vh;
                        background: linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: system-ui, -apple-system, sans-serif;
                        z-index: 9999;
                    }
                    .menu-content {
                        text-align: center;
                        padding: 2rem;
                        max-width: 500px;
                    }
                    .menu-title {
                        font-size: 4rem;
                        font-weight: 900;
                        color: #fff;
                        margin: 0 0 0.5rem 0;
                        text-shadow: 0 0 20px rgba(0, 200, 255, 0.5), 0 0 40px rgba(0, 150, 255, 0.3);
                        letter-spacing: 0.1em;
                        animation: glow 3s ease-in-out infinite alternate;
                    }
                    @keyframes glow {
                        from { text-shadow: 0 0 20px rgba(0, 200, 255, 0.5), 0 0 40px rgba(0, 150, 255, 0.3); }
                        to { text-shadow: 0 0 30px rgba(0, 255, 200, 0.6), 0 0 60px rgba(0, 200, 255, 0.4); }
                    }
                    .menu-subtitle {
                        font-size: 1.2rem;
                        color: rgba(255, 255, 255, 0.6);
                        margin: 0 0 3rem 0;
                        font-style: italic;
                    }
                    .menu-buttons {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                        margin-bottom: 2rem;
                    }
                    .menu-btn {
                        padding: 1rem 2rem;
                        font-size: 1.1rem;
                        font-weight: 600;
                        color: rgba(255, 255, 255, 0.9);
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .menu-btn:hover {
                        background: rgba(255, 255, 255, 0.1);
                        border-color: rgba(0, 200, 255, 0.5);
                        transform: translateY(-2px);
                        box-shadow: 0 4px 20px rgba(0, 200, 255, 0.2);
                    }
                    .menu-btn.primary {
                        background: linear-gradient(135deg, rgba(0, 150, 255, 0.3), rgba(0, 200, 255, 0.2));
                        border-color: rgba(0, 200, 255, 0.4);
                    }
                    .menu-hint {
                        font-size: 0.9rem;
                        color: rgba(255, 255, 255, 0.4);
                        animation: pulse 2s ease-in-out infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 0.4; }
                        50% { opacity: 0.8; }
                    }
                `}</style>
            </div>
        )
    }

    return (
        <>
            <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
                <Suspense fallback={null}>
                    <Physics>
                        <MainScene />
                    </Physics>
                </Suspense>
            </Canvas>
            <HUD />
            <Leva />
        </>
    )
}

export default App
