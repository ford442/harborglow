// =============================================================================
// OPS SLICE — Operation mode (crane / tugboat / walking), missions, training, and comms.
// =============================================================================

import type { StateCreator } from 'zustand';
import type { OpsSlice } from '../sliceTypes';
import {
    type GameState,
    type CameraMode,
    type OperationMode,
    type WeatherState,
    type TugboatState,
    type TugboatUpgradeState,
    type TugboatCareerStats,
    type GameMode,
    type TugboatObjective,
    type Mission,
    createSalvageContracts,
    DEFAULT_HANDSHAKE_SEQUENCE,
    buildHandshakeSequence,
    getReputationTierMultiplier,
    TUG_TONS_BY_SHIP,
} from '../gameStoreTypes';
import { reputationSystem } from '../../systems/reputationSystem';
import type { TrainingModuleId } from '../../systems/trainingSystem';
import type { TrainingProgress } from '../../systems/trainingSystem';
import { trainingSystem } from '../../systems/trainingSystem';
import { isTugboatTrainingModule } from '../../systems/trainingSystem';
import { setupTrainingScenario } from '../../systems/trainingSystem';
import type { AcousticNote } from '../../systems/commsSystem';

export const createOpsSlice: StateCreator<GameState, [], [], OpsSlice> = (set, get, _api) => ({
    setGameMode: (mode: GameMode) => {
        set({ gameMode: mode })
        console.log(`🎓 Game mode: ${mode}`)
    },

    startTrainingModule: (moduleId: TrainingModuleId) => {
        const started = trainingSystem.startModule(moduleId)
        if (started) {
            const module = trainingSystem.getModule(moduleId)
            const trainingOperationMode: OperationMode = isTugboatTrainingModule(moduleId) ? 'tugboat' : 'crane'
            set({
                gameMode: 'training',
                currentTrainingModule: moduleId,
                operationMode: trainingOperationMode,
                trainingProgress: trainingSystem.getProgress()
            })
            // Set weather and time from module config
            if (module) {
                set({
                    weather: module.weather as WeatherState,
                    timeOfDay: module.timeOfDay,
                    isNight: module.timeOfDay < 6 || module.timeOfDay > 18
                })
            }
            setupTrainingScenario(moduleId)
            console.log(`🎓 Started training: ${moduleId}`)
        }
    },

    exitTrainingModule: () => {
        trainingSystem.exitModule()
        set({
            gameMode: 'sandbox',
            currentTrainingModule: null,
            operationMode: 'crane',
            trainingProgress: trainingSystem.getProgress()
        })
        console.log('🎓 Exited training module')
    },

    updateTrainingProgress: (progress: TrainingProgress) => {
        set({ trainingProgress: progress })
    },

    // Traffic system - reputation management

    setOperationMode: (mode: OperationMode) => {
        const patch = mode === 'tugboat'
            ? { operationMode: mode, salvageContracts: get().salvageContracts.length > 0 ? get().salvageContracts : createSalvageContracts() }
            : { operationMode: mode }
        set(patch)
        if (get().gameMode === 'training') {
            trainingSystem.recordOperationModeSwitch(mode)
        }
        console.log(`🚤 Operation mode: ${mode}`)
    },

    beginWalkingFromCab: () => {
        const state = get()
        if (state.operationMode !== 'crane' || state.cameraMode !== 'crane-cockpit') return
        const patch = {
            operationMode: 'walking' as OperationMode,
            walkingPosition: [...state.walkingSpawnPoint] as [number, number, number],
            walkingVelocity: [0, 0, 0] as [number, number, number],
            walkingReturnCameraMode: state.cameraMode,
            walkingReturnCabinViewMode: state.cabinViewMode,
            cameraMode: 'onFoot' as CameraMode,
        }
        set(patch)
    },

    returnToCraneFromWalking: () => {
        const state = get()
        if (state.operationMode !== 'walking') return
        const patch = {
            operationMode: 'crane' as OperationMode,
            cameraMode: state.walkingReturnCameraMode || 'crane-cockpit',
            cabinViewMode: state.walkingReturnCabinViewMode || 'multiview',
        }
        set(patch)
    },

    updateWalkingState: (position, velocity) => {
        set({
            walkingPosition: position,
            walkingVelocity: velocity
        })
    },

    updateTugboatState: (patch: Partial<TugboatState>) => set((state) => ({
        tugboatState: { ...state.tugboatState, ...patch }
    })),

    setTugboatObjectives: (objectives: TugboatObjective[]) => {
        const seed = objectives.map(o => o.id).join('|')
        const targetSequence = buildHandshakeSequence(seed)
        set({
            tugboatObjectives: objectives,
            handshakeTargetSequence: targetSequence,
            handshakeInputSequence: [],
            handshakeComplete: false,
            towingUnlocked: false,
        })
    },

    markTugboatFirstTimeViewed: () => set((state) => {
        const patch = { tugboatFirstTimeViewed: true }
        return patch
    }),

    submitAcousticNote: (note: AcousticNote) => set((state) => {
        const target = state.handshakeTargetSequence
        const maxLength = target.length
        if (maxLength === 0) return {}

        const nextSequence = [...state.handshakeInputSequence, note].slice(-maxLength)
        const complete = nextSequence.length === target.length && nextSequence.every((value, index) => value === target[index])
        if (complete) {
            console.log('📡 Acoustic handshake complete. Towing unlocked.')
        }

        return {
            handshakeInputSequence: nextSequence,
            handshakeComplete: state.handshakeComplete || complete,
            towingUnlocked: state.towingUnlocked || complete,
        }
    }),

    resetAcousticHandshake: () => set((state) => ({
        handshakeTargetSequence: buildHandshakeSequence(state.tugboatObjectives.map(o => o.id).join('|')),
        handshakeInputSequence: [],
        handshakeComplete: false,
        towingUnlocked: false,
    })),

    completeTugboatObjective: (id: string) => set((state) => {
        const objectives = state.tugboatObjectives.map(o =>
            o.id === id ? { ...o, completed: true } : o
        )
        const dockedCount = objectives.filter(o => o.completed).length
        const completedObjective = objectives.find((o) => o.id === id)
        const isNewlyCompleted = !!completedObjective && !state.tugboatObjectives.find((o) => o.id === id)?.completed
        if (!isNewlyCompleted || !completedObjective) {
            return {
                tugboatObjectives: objectives,
                tugboatDockedCount: dockedCount,
            }
        }

        const tierMultiplier = getReputationTierMultiplier()
        const objectiveCreditReward = Math.round(140 * tierMultiplier)
        const objectiveRepReward = Math.round(24 * tierMultiplier)
        const objectiveTons = TUG_TONS_BY_SHIP[completedObjective.shipType] ?? 80
        const isNightRescue = state.timeOfDay < 6 || state.timeOfDay >= 19
        const tugboatCareerStats: TugboatCareerStats = {
            totalTonsAssisted: state.tugboatCareerStats.totalTonsAssisted + objectiveTons,
            cleanTows: state.tugboatCareerStats.cleanTows + (state.towLineSnapped ? 0 : 1),
            nightRescues: state.tugboatCareerStats.nightRescues + (isNightRescue ? 1 : 0),
        }
        const newCredits = state.harborCredits + objectiveCreditReward
        const newReputation = state.reputation + objectiveRepReward
        reputationSystem.addReputation(
            objectiveRepReward,
            'tugboat_objective_complete',
            { tons: objectiveTons, night: isNightRescue ? 1 : 0 },
            { syncGameStore: false },
        )
        return {
            tugboatObjectives: objectives,
            tugboatDockedCount: dockedCount,
            harborCredits: newCredits,
            reputation: newReputation,
            tugboatCareerStats,
        }
    }),

    resetTugboatMode: () => {
        set({
            tugboatObjectives: [],
            tugboatDockedCount: 0,
            tugboatWinTriggered: false,
            handshakeTargetSequence: DEFAULT_HANDSHAKE_SEQUENCE,
            handshakeInputSequence: [],
            handshakeComplete: false,
            towingUnlocked: false,
            towLineAttached: false,
            activeTowedShipId: null,
            towLineSnapped: false,
            stormIntensity: 0,
            stormTimeRemaining: 0,
            isStormActive: false,
            windDirection: 0,
            windStrength: 0,
            rainDensity: 0.5,
            activeMission: null,
            waveParams: { amplitude: 1.0, speed: 1.0, chaos: 0.0 },
            tugSpectatorActive: false,
            tugboatState: {
                position: [20, 0.5, 10],
                velocity: [0, 0, 0],
                throttle: 0,
                steering: 0,
                heading: -Math.PI / 2,
                portEngineRpm: 0,
                starboardEngineRpm: 0,
                portCavitating: false,
                starboardCavitating: false,
                cavitationIntensity: 0,
                windShear: 0,
                currentDrift: [0, 0],
            },
        })
        console.log('🚤 Tugboat mode reset')
    },

    attachTowLine: (shipId: string) => {
        set({ towLineAttached: true, activeTowedShipId: shipId })
        console.log(`⚓ Tow line attached to ship: ${shipId}`)
    },

    detachTowLine: () => {
        set({ towLineAttached: false, activeTowedShipId: null })
        console.log('⚓ Tow line detached')
    },

    signalTowLineSnap: () => {
        set((state) => {
            const mission = state.activeMission
            const missionFailed = mission?.type === 'salvage' && mission.status === 'active'
            const newCredits = missionFailed
                ? Math.max(0, state.harborCredits - (mission.failurePenalty ?? 220))
                : state.harborCredits
            const newReputation = missionFailed
                ? Math.max(0, state.reputation - 55)
                : state.reputation
            return {
                towLineAttached: false,
                activeTowedShipId: null,
                towLineSnapped: true,
                harborCredits: newCredits,
                reputation: newReputation,
                activeMission: missionFailed ? { ...mission!, status: 'failed' as const } : mission,
            }
        })
        console.log('💥 Tow line snapped!')
        setTimeout(() => set({ towLineSnapped: false }), 1200)
    },

    setActiveMission: (mission: Mission | null) => {
        set({ activeMission: mission })
    },

    updateMission: (patch: Partial<Mission>) => set((state) => {
        if (!state.activeMission) return state
        const updated = { ...state.activeMission, ...patch }
        return { activeMission: updated }
    }),

    completeMission: (bonus = 0) => set((state) => {
        if (!state.activeMission) return state
        const mission = state.activeMission
        const conditionMultiplier = mission.type === 'salvage'
            ? Math.max(0.6, 1 - mission.damage / Math.max(1, mission.maxDamage))
            : 1
        const tierBonus = getReputationTierMultiplier()
        const reward = Math.round((mission.reward + bonus) * conditionMultiplier * tierBonus)
        const isNightRescue = state.timeOfDay < 6 || state.timeOfDay >= 19
        const searchlightBonus = mission.type === 'salvage' && isNightRescue && state.tugboatUpgrades.searchlight_rig
            ? Math.round(120 * tierBonus)
            : 0
        const totalReward = reward + searchlightBonus
        const newCredits = state.harborCredits + totalReward
        const salvageSuccessfulTows = mission.type === 'salvage'
            ? state.salvageSuccessfulTows + 1
            : state.salvageSuccessfulTows
        const tugboatCareerStats: TugboatCareerStats = mission.type === 'salvage'
            ? {
                totalTonsAssisted: state.tugboatCareerStats.totalTonsAssisted + (TUG_TONS_BY_SHIP[mission.targetShipType] ?? 90),
                cleanTows: state.tugboatCareerStats.cleanTows + (mission.damage <= 10 && !state.towLineSnapped ? 1 : 0),
                nightRescues: state.tugboatCareerStats.nightRescues + (isNightRescue ? 1 : 0),
            }
            : state.tugboatCareerStats
        const reputationGain = mission.type === 'salvage' && mission.reputationReward
            ? Math.round(mission.reputationReward * tierBonus)
            : 0
        const newReputation = state.reputation + reputationGain
        const tugboatUpgrades: TugboatUpgradeState = {
            ...state.tugboatUpgrades,
            heavy_tow_winch: state.tugboatUpgrades.heavy_tow_winch || salvageSuccessfulTows >= 2,
            cavitation_suppression_jets: state.tugboatUpgrades.cavitation_suppression_jets || salvageSuccessfulTows >= 4,
            searchlight_rig: state.tugboatUpgrades.searchlight_rig || newReputation >= 750,
            dynamic_positioning_assist: state.tugboatUpgrades.dynamic_positioning_assist || newReputation >= 1400,
        }
        reputationSystem.addReputation(
            reputationGain,
            mission.type === 'salvage' ? 'tugboat_contract_complete' : 'tugboat_mission_complete',
            { reward: totalReward, cleanTow: mission.damage <= 10 ? 1 : 0, night: isNightRescue ? 1 : 0 },
            { syncGameStore: false },
        )
        console.log(`💰 Mission complete! Earned $${totalReward}`)
        return {
            harborCredits: newCredits,
            reputation: newReputation,
            salvageSuccessfulTows,
            tugboatCareerStats,
            tugboatUpgrades,
            activeMission: { ...mission, status: 'completed' as const, reward: totalReward },
        }
    }),

    failMission: (penalty = 100) => set((state) => {
        if (!state.activeMission) return state
        const mission = state.activeMission
        const appliedPenalty = mission.type === 'salvage'
            ? mission.failurePenalty ?? penalty
            : penalty
        const newCredits = Math.max(0, state.harborCredits - appliedPenalty)
        const newReputation = mission.type === 'salvage'
            ? Math.max(0, state.reputation - 40)
            : state.reputation
        console.log(`❌ Mission failed. Penalty: $${appliedPenalty}`)
        return {
            harborCredits: newCredits,
            reputation: newReputation,
            activeMission: { ...mission, status: 'failed' as const },
        }
    }),

    triggerTugboatWin: () => {
        set({ tugboatWinTriggered: true })
        console.log('🏆 Tugboat mission complete!')
    },
});
