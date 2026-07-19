import type { StateCreator } from 'zustand';
import type { Slice2 } from '../sliceTypes';
import {
    type GameState,
    type HarborType,
    type CabinViewMode,
    type GameMode,
    type OperationMode,
    type CameraMode,
    type TugboatState,
    type TugboatObjective,
    type Mission,
    type TugboatCareerStats,
    type TugboatUpgradeId,
    type TugboatUpgradeState,
    type WaveParams,
    type WeatherState,
    buildHandshakeSequence,
    scheduleSave,
    createSalvageContracts,
    getReputationTierMultiplier,
    TUG_TONS_BY_SHIP,
    DEFAULT_HANDSHAKE_SEQUENCE,
} from '../gameStoreTypes';
import type { AttachmentSystemConfig } from '../../systems/attachmentSystem';
import type { TrainingModuleId, TrainingProgress } from '../../systems/trainingSystem';
import { trainingSystem, isTugboatTrainingModule } from '../../systems/trainingSystem';
import type { AcousticNote } from '../../systems/commsSystem';
import { reputationSystem } from '../../systems/reputationSystem';

export const createSlice2: StateCreator<GameState, [], [], Slice2> = (set, get, _api) => ({
    removeWildlife: (id) => set((state) => ({
        wildlife: state.wildlife.filter(w => w.id !== id)
    })),

    updateWildlife: (id, updates) => set((state) => ({
        wildlife: state.wildlife.map(w =>
            w.id === id ? { ...w, ...updates } : w
        )
    })),

    setActiveSeaEvent: (event) => set({ activeSeaEvent: event }),

    // Harbor event actions
    addHarborEvent: (event) => set((state) => ({
        activeHarborEvents: [...state.activeHarborEvents, event]
    })),

    removeHarborEvent: (id) => set((state) => ({
        activeHarborEvents: state.activeHarborEvents.filter(e => e.id !== id)
    })),

    setEventEnabled: (type, enabled) => set((state) => ({
        eventEnabledSettings: {
            ...state.eventEnabledSettings,
            [type]: enabled
        }
    })),

    // Harbor theme
    setCurrentHarbor: (harbor: HarborType) => {
        set({ currentHarbor: harbor })
        console.log(`⚓ Harbor switched to: ${harbor}`)
    },

    // Operator Cabin view mode
    setCabinViewMode: (mode: CabinViewMode) => {
        set({ cabinViewMode: mode })
        console.log(`🎮 Cabin view mode: ${mode}`)
    },

    // Time system - update game time from timeSystem
    setGameTime: (hour: number, minute: number) => {
        const currentTime = get().gameTime
        // Only update if time has changed to avoid re-renders
        if (!currentTime || currentTime.hour !== hour || currentTime.minute !== minute) {
            set({ gameTime: { hour, minute } })
        }
    },

    // Attachment system configuration
    setAttachmentSystemConfig: (config: Partial<AttachmentSystemConfig>) => {
        set((state) => ({
            attachmentSystemConfig: { ...state.attachmentSystemConfig, ...config }
        }))
    },

    clearLastInstallation: () => set({ lastInstallation: null }),

    // Training system
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
    addReputation: (amount: number) => set((state) => {
        const newReputation = Math.max(0, state.reputation + amount)
        if (amount > 0) {
            console.log(`🏆 Reputation +${amount} (Total: ${newReputation})`)
        } else if (amount < 0) {
            console.log(`📉 Reputation ${amount} (Total: ${newReputation})`)
        }
        return { reputation: newReputation }
    }),

    // Tugboat mode actions
    setOperationMode: (mode: OperationMode) => {
        const patch = mode === 'tugboat'
            ? { operationMode: mode, salvageContracts: get().salvageContracts.length > 0 ? get().salvageContracts : createSalvageContracts() }
            : { operationMode: mode }
        set(patch)
        scheduleSave({ ...get(), ...patch })
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
        scheduleSave({ ...get(), ...patch })
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
        scheduleSave({ ...get(), ...patch })
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
        scheduleSave({ ...state, ...patch })
        return patch
    }),

    refreshSalvageContracts: () => set(() => ({
        salvageContracts: createSalvageContracts(),
    })),

    acceptSalvageContract: (contractId: string) => set((state) => {
        const contract = state.salvageContracts.find((item) => item.id === contractId)
        if (!contract || state.activeMission?.status === 'active') return state

        const updatedMoney = Math.max(0, state.money - contract.acceptedFee)
        const objectiveId = `salvage-objective-${contract.id}`
        const mission: Mission = {
            id: `salvage-mission-${contract.id}`,
            type: 'salvage',
            targetShipType: contract.vesselType,
            targetShipId: objectiveId,
            timeLimit: contract.seaState === 'severe' ? 150 : 180,
            timeRemaining: contract.seaState === 'severe' ? 150 : 180,
            damage: 0,
            maxDamage: 100,
            reward: contract.rewardEstimate,
            status: 'active',
            berthCenter: contract.berthCenter,
            berthRadius: contract.berthRadius,
            distressPosition: contract.distressPosition,
            factionLabel: contract.factionLabel,
            vesselLabel: contract.vesselLabel,
            briefing: contract.briefing,
            acceptedFee: contract.acceptedFee,
            reputationReward: contract.seaState === 'severe' ? 120 : contract.seaState === 'rough' ? 90 : 70,
            failurePenalty: Math.max(180, Math.round(contract.rewardEstimate * 0.2)),
        }

        const seed = `${contract.id}|${contract.vesselLabel}|${contract.factionLabel}`
        const handshakeTargetSequence = buildHandshakeSequence(seed)
        const tugboatObjectives: TugboatObjective[] = [
            {
                id: objectiveId,
                label: `${contract.vesselLabel} → Repair Berth`,
                berthCenter: contract.berthCenter,
                berthRadius: contract.berthRadius,
                completed: false,
                shipType: contract.vesselType,
            },
        ]

        const replacementPool = createSalvageContracts().filter((item) => item.id !== contractId)
        const salvageContracts = [...state.salvageContracts.filter((item) => item.id !== contractId), ...replacementPool]
            .slice(0, 3)

        const nextState = {
            money: updatedMoney,
            activeMission: mission,
            tugboatObjectives,
            tugboatDockedCount: 0,
            tugboatWinTriggered: false,
            handshakeTargetSequence,
            handshakeInputSequence: [],
            handshakeComplete: false,
            towingUnlocked: false,
            towLineAttached: false,
            activeTowedShipId: null,
            salvageContracts,
        }
        scheduleSave({ ...state, ...nextState })
        console.log(`🛟 Salvage dispatch accepted: ${contract.vesselLabel}`)
        return nextState
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
        const newMoney = state.money + objectiveCreditReward
        const newReputation = state.reputation + objectiveRepReward
        reputationSystem.addReputation(
            objectiveRepReward,
            'tugboat_objective_complete',
            { tons: objectiveTons, night: isNightRescue ? 1 : 0 },
            { syncGameStore: false },
        )
        scheduleSave({ ...state, money: newMoney, reputation: newReputation, tugboatCareerStats })
        return {
            tugboatObjectives: objectives,
            tugboatDockedCount: dockedCount,
            money: newMoney,
            reputation: newReputation,
            tugboatCareerStats,
        }
    }),

    purchaseTugboatUpgrade: (id: TugboatUpgradeId) => {
        const state = get()
        if (state.tugboatUpgrades[id]) return false

        const upgradeConfig: Record<TugboatUpgradeId, { cost: number; minReputation: number; minBoothTier?: 1 | 2 | 3 }> = {
            heavy_tow_winch: { cost: 0, minReputation: 0 },
            cavitation_suppression_jets: { cost: 0, minReputation: 0 },
            searchlight_rig: { cost: 600, minReputation: 550 },
            dynamic_positioning_assist: { cost: 900, minReputation: 1100, minBoothTier: 2 },
        }
        const config = upgradeConfig[id]
        if (!config) return false
        if (state.reputation < config.minReputation) return false
        if (config.minBoothTier && state.boothTier < config.minBoothTier) return false
        if (config.cost > 0 && state.money < config.cost) return false

        const patch = {
            money: config.cost > 0 ? state.money - config.cost : state.money,
            tugboatUpgrades: {
                ...state.tugboatUpgrades,
                [id]: true,
            },
        }
        set(patch)
        scheduleSave({ ...state, ...patch })
        return true
    },

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
            const newMoney = missionFailed
                ? Math.max(0, state.money - (mission.failurePenalty ?? 220))
                : state.money
            const newReputation = missionFailed
                ? Math.max(0, state.reputation - 55)
                : state.reputation
            scheduleSave({ ...state, money: newMoney, reputation: newReputation })
            return {
                towLineAttached: false,
                activeTowedShipId: null,
                towLineSnapped: true,
                money: newMoney,
                reputation: newReputation,
                activeMission: missionFailed ? { ...mission!, status: 'failed' as const } : mission,
            }
        })
        console.log('💥 Tow line snapped!')
        setTimeout(() => set({ towLineSnapped: false }), 1200)
    },

    setStormIntensity: (intensity: number) => {
        set({ stormIntensity: Math.max(0, Math.min(1, intensity)) })
    },

    setStormTimeRemaining: (time: number) => {
        set({ stormTimeRemaining: Math.max(0, time) })
    },

    setStormActive: (active: boolean) => {
        set({ isStormActive: active })
    },

    setWindDirection: (direction: number) => {
        set({ windDirection: direction })
    },

    setWindStrength: (strength: number) => {
        set({ windStrength: Math.max(0, strength) })
    },

    setRainDensity: (density: number) => {
        set({ rainDensity: Math.max(0, Math.min(1, density)) })
    },

    addMoney: (amount: number) => set((state) => {
        const newMoney = Math.max(0, state.money + amount)
        const newState = { money: newMoney }
        scheduleSave({ ...state, ...newState })
        return newState
    }),

    deductMoney: (amount: number) => set((state) => {
        const newMoney = Math.max(0, state.money - amount)
        const newState = { money: newMoney }
        scheduleSave({ ...state, ...newState })
        return newState
    }),

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
        const newMoney = state.money + totalReward
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
        scheduleSave({
            ...state,
            money: newMoney,
            salvageSuccessfulTows,
            tugboatUpgrades,
            reputation: newReputation,
            tugboatCareerStats,
        })
        console.log(`💰 Mission complete! Earned $${totalReward}`)
        return {
            money: newMoney,
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
        const newMoney = Math.max(0, state.money - appliedPenalty)
        const newReputation = mission.type === 'salvage'
            ? Math.max(0, state.reputation - 40)
            : state.reputation
        scheduleSave({ ...state, money: newMoney, reputation: newReputation })
        console.log(`❌ Mission failed. Penalty: $${appliedPenalty}`)
        return {
            money: newMoney,
            reputation: newReputation,
            activeMission: { ...mission, status: 'failed' as const },
        }
    }),

    triggerTugboatWin: () => {
        set({ tugboatWinTriggered: true })
        console.log('🏆 Tugboat mission complete!')
    },

    setTugSpectatorActive: (active: boolean) => set({ tugSpectatorActive: active }),

    setWaveParams: (patch: Partial<WaveParams>) => set((state) => {
        const newParams = { ...state.waveParams, ...patch }
        return { waveParams: newParams }
    })
});
