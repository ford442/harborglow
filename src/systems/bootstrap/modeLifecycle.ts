import { useEffect } from 'react'

import { useGameStore, type GameMode, type OperationMode } from '../../store/useGameStore'
import type { TrainingModuleId } from '../trainingSystem'
import type { Mission } from '../../store/gameStoreTypes'
import { systemRegistry } from './SystemRegistry'
import { ensureMainSceneSystemsRegistered } from './mainSceneSystems'

// =============================================================================
// MODE LIFECYCLE — pause groups that should not run in the current context
// =============================================================================

export interface ModeLifecycleState {
    operationMode: OperationMode
    gameMode: GameMode
    currentTrainingModule: TrainingModuleId | null
    activeMission: Mission | null
}

/**
 * Apply group pause/resume for the current game context.
 * Storm start/stop durations remain in MainScene's tugboat-mode effect; this
 * only gates per-frame ticks via the `storm` group + `shouldTick`.
 */
export function syncSystemModeLifecycle(state: ModeLifecycleState): void {
    const { operationMode, gameMode, currentTrainingModule, activeMission } = state

    // Crane physics only while operating the gantry (or on-foot near crane).
    if (operationMode === 'crane') {
        systemRegistry.resumeGroup('crane')
    } else {
        systemRegistry.pauseGroup('crane')
    }

    // Storm ticks in tugboat helm or emergency crane training.
    const stormTicks =
        operationMode === 'tugboat' ||
        (gameMode === 'training' && currentTrainingModule === 'emergency')
    if (stormTicks) {
        systemRegistry.resumeGroup('storm')
    } else {
        systemRegistry.pauseGroup('storm')
    }

    // Sandbox harbor traffic; pause during focused training drills.
    if (gameMode === 'training') {
        systemRegistry.pauseGroup('traffic')
    } else {
        systemRegistry.resumeGroup('traffic')
    }

    // Ambient wildlife layer — sandbox only.
    if (gameMode === 'training') {
        systemRegistry.pauseGroup('ambient')
    } else {
        systemRegistry.resumeGroup('ambient')
    }

    // Harbor business / dynamic events — pause during training or active missions.
    const pauseHarborEvents =
        gameMode === 'training' || activeMission?.status === 'active'
    if (pauseHarborEvents) {
        systemRegistry.pauseGroup('harbor-events')
    } else {
        systemRegistry.resumeGroup('harbor-events')
    }
}

/**
 * Register systems, start lifecycle, and sync group pauses on mode changes.
 * Call once from MainScene.
 */
export function useMainSceneSystemBootstrap(): void {
    useEffect(() => {
        ensureMainSceneSystemsRegistered()
        systemRegistry.startAll()
        return () => {
            systemRegistry.stopAll()
        }
    }, [])

    const operationMode = useGameStore((s) => s.operationMode)
    const gameMode = useGameStore((s) => s.gameMode)
    const currentTrainingModule = useGameStore((s) => s.currentTrainingModule)
    const activeMission = useGameStore((s) => s.activeMission)

    useEffect(() => {
        syncSystemModeLifecycle({
            operationMode,
            gameMode,
            currentTrainingModule,
            activeMission,
        })
    }, [operationMode, gameMode, currentTrainingModule, activeMission])
}
