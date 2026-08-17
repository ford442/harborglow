import { useState, useEffect, useCallback, useMemo, type ComponentType } from 'react'
import { useGameStore, UPGRADE_TARGETS } from './store/useGameStore'
import { ShipSpawner } from './systems/shipSpawner'
import { loadGameState } from './utils/storage_manager'
import type { TrainingModuleId } from './systems/trainingSystem'
import MainMenu from './components/MainMenu'
import LoadingScreen from './components/LoadingScreen'
import TrainingMode from './components/TrainingMode'
import { introMusicSystem } from './systems/introMusicSystem'
import { wasmDSP } from './systems/wasmDSP'
import { audioRuntime } from './systems/audio/AudioRuntime'
import './App.css'

import type { GameShellProps } from './GameShell'

// =============================================================================
// APP COMPONENT
// Bootstrap, menu, and game container with proper loading & error handling
// =============================================================================

function parseMultiplayerConfig(): { enabled: boolean; joinRoomId: string | null } {
    const params = new URLSearchParams(window.location.search)
    return {
        enabled: params.get('multiplayer') === '1',
        joinRoomId: params.get('join'),
    }
}

function App() {
    const [screen, setScreen] = useState<'menu' | 'loading' | 'game' | 'training'>('menu')
    const [loadingProgress, setLoadingProgress] = useState(0)
    const [loadingStatus, setLoadingStatus] = useState('Initializing')
    const [GameShellComponent, setGameShellComponent] = useState<ComponentType<GameShellProps> | null>(null)
    const hasSave = !!loadGameState()
    const multiplayerConfig = useMemo(() => parseMultiplayerConfig(), [])
    
    const loadSavedState = useGameStore(state => state.loadSavedState)
    const resetGame = useGameStore(state => state.resetGame)
    const startTrainingModule = useGameStore(state => state.startTrainingModule)
    const currentTrainingModule = useGameStore(state => state.currentTrainingModule)
    const exitTrainingModule = useGameStore(state => state.exitTrainingModule)
    
    const boothTier = useGameStore(state => state.boothTier)
    
    const harborTheme = useCallback(() => {
        switch (boothTier) {
            case 1: return 'industrial'
            case 2: return 'tropical'
            case 3: return 'arctic'
            default: return 'industrial'
        }
    }, [boothTier])

    // Multiplayer feature flag (?multiplayer=1)
    useEffect(() => {
        if (multiplayerConfig.enabled) {
            useGameStore.getState().setMultiplayerEnabled(true)
        }
    }, [multiplayerConfig.enabled])

    // Wire WebRTC when entering game screen
    useEffect(() => {
        if (screen !== 'game' || !multiplayerConfig.enabled) return

        let disposed = false
        const initMultiplayer = async () => {
            const { multiplayerSystem } = await import('./systems/multiplayerSystem')
            if (disposed) return

            if (multiplayerConfig.joinRoomId) {
                await multiplayerSystem.startSpectator(multiplayerConfig.joinRoomId)
            }
        }
        void initMultiplayer()

        return () => {
            disposed = true
            void import('./systems/multiplayerSystem').then(({ multiplayerSystem }) => {
                multiplayerSystem.dispose()
            })
        }
    }, [screen, multiplayerConfig.enabled, multiplayerConfig.joinRoomId])

    // Initialize audio on user gesture
    useEffect(() => {
        const initAudio = async () => {
            await audioRuntime.resume()
        }

        const handleGesture = () => {
            void initAudio()
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
        setLoadingStatus('Loading DSP modules...')
        setLoadingProgress(2)
        await Promise.all([wasmDSP.init(), audioRuntime.resume()])

        const stages = [
            { weight: 10, label: 'Initializing harbor systems...', duration: 300 },
            { weight: 28, label: 'Loading ship models...', duration: 0, real: true as const },
            { weight: 18, label: 'Building 3D environment...', duration: 450 },
            { weight: 14, label: 'Calibrating crane physics...', duration: 350 },
            { weight: 14, label: 'Setting up audio systems...', duration: 280 },
            { weight: 14, label: 'Building control booth...', duration: 280 },
        ]

        let currentProgress = 0

        for (const stage of stages) {
            setLoadingStatus(stage.label)

            if ('real' in stage && stage.real) {
                const { preloadShipModels } = await import('./ships/preloadShipModels')
                await preloadShipModels({
                    onProgress: ({ label, percent }) => {
                        setLoadingStatus(label)
                        const stageProgress = stage.weight * (percent / 100)
                        setLoadingProgress(Math.min(95, currentProgress + stageProgress))
                    },
                })
                currentProgress += stage.weight
                setLoadingProgress(Math.min(95, currentProgress))
                continue
            }

            const steps = 5
            const stepDuration = stage.duration / steps
            const stepIncrement = stage.weight / steps

            for (let i = 0; i < steps; i++) {
                await new Promise(r => setTimeout(r, stepDuration))
                currentProgress += stepIncrement
                setLoadingProgress(Math.min(95, currentProgress))
            }
        }

        setLoadingStatus('Finalizing...')
        
        if (loadSave) {
            loadSavedState()
        } else if (multiplayerConfig.joinRoomId) {
            resetGame()
        } else {
            resetGame()
            const starterType = 'container' as const
            const ship = ShipSpawner.spawnShip(starterType)
            const targetRigs = UPGRADE_TARGETS[starterType]
            useGameStore.getState().setCraneContract({
                id: `contract-${ship.id}`,
                shipId: ship.id,
                shipType: starterType,
                shipName: ship.name ?? 'Container Vessel',
                targetRigs,
                reward: targetRigs * 150,
                status: 'active',
            })
        }
        
        await new Promise(r => setTimeout(r, 200))
        setLoadingProgress(100)
        await new Promise(r => setTimeout(r, 300))
        
        setScreen('game')
    }, [loadSavedState, resetGame, multiplayerConfig.joinRoomId])

    const handleNewGame = useCallback(() => startGame(false), [startGame])
    const handleLoadGame = useCallback(() => startGame(true), [startGame])

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
        await startGame(false)
        setTimeout(() => {
            useGameStore.getState().setOperationMode('tugboat')
        }, 500)
    }, [startGame])

    useEffect(() => {
        if (screen === 'game') {
            introMusicSystem.fadeOut(1.5)
        } else if (screen === 'menu') {
            introMusicSystem.playTitle().catch(() => {})
        } else if (screen === 'training') {
            introMusicSystem.fadeOut(1.0)
        }
    }, [screen])

    useEffect(() => {
        if (screen !== 'game') {
            setGameShellComponent(null)
            return
        }

        let cancelled = false
        void import('./GameShell').then((mod) => {
            if (!cancelled) setGameShellComponent(() => mod.default)
        })

        return () => {
            cancelled = true
        }
    }, [screen])

    if (screen === 'menu') {
        return <MainMenu hasSave={hasSave} onNewGame={handleNewGame} onLoadGame={handleLoadGame} onTraining={handleOpenTraining} onTugboatMode={handleTugboatMode} />
    }
    
    if (screen === 'training') {
        return <TrainingMode onExit={handleExitTraining} onStartModule={handleStartTrainingModule} />
    }

    if (screen === 'loading') {
        return <LoadingScreen progress={loadingProgress} status={loadingStatus} />
    }

    if (!GameShellComponent) {
        return <LoadingScreen progress={99} status="Loading 3D engine..." />
    }

    return (
        <GameShellComponent
            harborTheme={harborTheme()}
            onOpenTraining={handleOpenTraining}
            currentTrainingModule={currentTrainingModule}
            onCompleteTrainingModule={handleCompleteTrainingModule}
        />
    )
}

export default App
