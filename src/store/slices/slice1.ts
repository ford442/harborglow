import type { StateCreator } from 'zustand';
import type { Slice1 } from '../sliceTypes';
import {
    type GameState,
    type Ship,
    type CameraMode,
    type OperationMode,
    type Season,
    type WeatherState,
    type QualityPreset,
    type SalvageContract,
    type TugboatState,
    type TugboatUpgradeState,
    type TugboatCareerStats,
    defaultState,
    DEFAULT_STORE_DASHBOARD_PRESETS,
    createSalvageContracts,
    DEFAULT_HANDSHAKE_SEQUENCE,
    scheduleSave,
} from '../gameStoreTypes';
import { clearSave, loadGameState, type GameState as StorageGameState } from '../../utils/storage_manager';
import { reputationSystem } from '../../systems/reputationSystem';
import { economySystem } from '../../systems/economySystem';
import { isCameraPresetId } from '../../types/CameraPreset';

export const createSlice1: StateCreator<GameState, [], [], Slice1> = (set, get, _api) => ({
    ...defaultState,

    addShip: (ship) => set((state) => {
        const shouldSelect = state.ships.length === 0
        const newState = {
            ships: [...state.ships, ship],
            currentShipId: shouldSelect ? ship.id : state.currentShipId
        }
        scheduleSave({ ...state, ...newState })
        return newState
    }),

    removeShip: (shipId) => set((state) => {
        const newState = {
            ships: state.ships.filter(s => s.id !== shipId),
            currentShipId: state.currentShipId === shipId
                ? (state.ships.find(s => s.id !== shipId)?.id || null)
                : state.currentShipId,
            installedUpgrades: state.installedUpgrades.filter(u => u.shipId !== shipId),
            craneUpgrades: state.installedUpgrades.filter(u => u.shipId !== shipId),
            musicPlaying: (() => {
                const newMap = new Map(state.musicPlaying)
                newMap.delete(shipId)
                return newMap
            })()
        }
        scheduleSave({ ...state, ...newState })
        return newState
    }),

    setCurrentShip: (id) => set({ currentShipId: id }),

    // Crane-mode starter objective
    setCraneContract: (contract) => set((state) => {
        const newState = { craneContract: contract }
        scheduleSave({ ...state, ...newState })
        return newState
    }),

    completeCraneContract: () => set((state) => {
        const contract = state.craneContract
        if (!contract || contract.status === 'completed') return {}
        const newState = {
            craneContract: { ...contract, status: 'completed' as const },
            money: state.money + contract.reward,
        }
        scheduleSave({ ...state, ...newState })
        console.log(`📊 Crane contract complete — +${contract.reward} credits`)
        return newState
    }),

    installUpgrade: (shipId, partName) => set((state) => {
        const newUpgrades = [
            ...state.installedUpgrades,
            { shipId, partName, installed: true, installedAt: Date.now() },
        ]
        const newState = { installedUpgrades: newUpgrades, craneUpgrades: newUpgrades }
        scheduleSave({ ...state, ...newState })

        // Award reputation for successful installation
        reputationSystem.recordInstallation({
            success: true,
            timeSeconds: 30, // Placeholder - would come from actual timing
            swayPercent: 0.2, // Placeholder
            damage: 0
        })

        return newState
    }),

    uninstallUpgrade: (shipId, partName) => set((state) => {
        const newUpgrades = state.installedUpgrades.filter(
            u => !(u.shipId === shipId && u.partName === partName)
        )
        const newState = { installedUpgrades: newUpgrades, craneUpgrades: newUpgrades }
        scheduleSave({ ...state, ...newState })
        return newState
    }),

    setMusicPlaying: (shipId, playing) => set((state) => {
        const newMap = new Map(state.musicPlaying)
        newMap.set(shipId, playing)
        return { musicPlaying: newMap }
    }),

    stopAllMusic: () => set((state) => {
        const newMap = new Map(state.musicPlaying)
        newMap.forEach((_, key) => newMap.set(key, false))
        return { musicPlaying: newMap }
    }),

    setBPM: (bpm) => {
        const newBpm = Math.max(60, Math.min(200, bpm))
        set({ bpm: newBpm })
        scheduleSave({ ...get(), bpm: newBpm })
    },

    setLyricsSize: (size) => {
        const newSize = Math.max(12, Math.min(72, size))
        set({ lyricsSize: newSize })
        scheduleSave({ ...get(), lyricsSize: newSize })
    },

    setLightIntensity: (intensity) => {
        const newIntensity = Math.max(0.1, Math.min(5, intensity))
        set({ lightIntensity: newIntensity })
        scheduleSave({ ...get(), lightIntensity: newIntensity })
    },

    setSpectatorTarget: (shipId, duration = 10) => {
        const state = get()
        if (state.spectatorState.isActive) return

        set({
            spectatorState: {
                isActive: true,
                targetShipId: shipId,
                startTime: Date.now(),
                duration
            },
            cameraMode: 'spectator'
        })

        setTimeout(() => {
            const currentState = get()
            if (currentState.spectatorState.targetShipId === shipId) {
                get().endSpectatorMode()
            }
        }, duration * 1000)
    },

    endSpectatorMode: () => set({
        spectatorState: {
            isActive: false,
            targetShipId: null,
            startTime: 0,
            duration: 10
        },
        cameraMode: 'orbit'
    }),

    setTimeOfDay: (hour) => {
        const newTime = hour % 24
        set({
            timeOfDay: newTime,
            isNight: newTime < 6 || newTime > 18
        })
        scheduleSave({ ...get(), timeOfDay: newTime })
    },

    setCameraMode: (mode) => {
        set({ cameraMode: mode })
        scheduleSave({ ...get(), cameraMode: mode })
    },

    resetGame: () => {
        clearSave()
        set({
            ships: [],
            craneUpgrades: [],
            installedUpgrades: [],
            currentShipId: null,
            musicPlaying: new Map(),
            musicEnabled: true,
            shipVersions: {},
            shipSailTimes: {},
            shipDockedStatus: {},
            weather: 'clear',
            weatherIntensity: 0.5,
            qualityPreset: 'high',
            dashboardPresets: DEFAULT_STORE_DASHBOARD_PRESETS,
            viewportCameras: {
                crane: { history: [], historyIndex: -1, pinned: [] },
                hook: { history: [], historyIndex: -1, pinned: [] },
                drone: { history: [], historyIndex: -1, pinned: [] },
                underwater: { history: [], historyIndex: -1, pinned: [] }
            },
            focusedViewport: null,
            operationMode: 'crane',
            walkingPosition: [2, 0.2, 7],
            walkingVelocity: [0, 0, 0],
            walkingSpawnPoint: [2, 0.2, 7],
            walkingReturnCameraMode: 'crane-cockpit',
            walkingReturnCabinViewMode: 'multiview',
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
            tugboatObjectives: [],
            tugboatDockedCount: 0,
            tugboatWinTriggered: false,
            salvageContracts: createSalvageContracts(),
            salvageSuccessfulTows: 0,
            tugboatCareerStats: {
                totalTonsAssisted: 0,
                cleanTows: 0,
                nightRescues: 0,
            },
            tugboatUpgrades: {
                heavy_tow_winch: false,
                cavitation_suppression_jets: false,
                searchlight_rig: false,
                dynamic_positioning_assist: false,
            },
            handshakeTargetSequence: DEFAULT_HANDSHAKE_SEQUENCE,
            handshakeInputSequence: [],
            handshakeComplete: false,
            towingUnlocked: false,
            stormIntensity: 0,
            stormTimeRemaining: 0,
            isStormActive: false,
            windDirection: 0,
            windStrength: 0,
            rainDensity: 0.5,
            activeMission: null,
            craneContract: null,
            waveParams: { amplitude: 1.0, speed: 1.0, chaos: 0.0 },
            season: 'summer',
            wildlifeDensity: 0.6,
            enableMarineLife: true,
        })
        console.log('🗑️ Game reset')
    },

    loadSavedState: () => {
        const saved = loadGameState()
        if (saved) {
            set({
                ships: Array.isArray(saved.ships) ? saved.ships.map((s: Ship) => ({
                    ...s,
                    isDocked: s.isDocked ?? true,  // Default to docked if not set
                    sailTime: s.sailTime ?? undefined
                })) : [],
                craneUpgrades: Array.isArray(saved.craneUpgrades) ? saved.craneUpgrades : [],
                installedUpgrades: Array.isArray(saved.craneUpgrades) ? saved.craneUpgrades : [],
                musicEnabled: saved.musicEnabled ?? true,
                currentSong: saved.currentSong,
                bpm: saved.bpm ?? 128,
                lyricsSize: saved.lyricsSize ?? 28,
                lightIntensity: saved.lightIntensity ?? 1.5,
                timeOfDay: saved.timeOfDay ?? 22,
                cameraMode: saved.cameraMode && (['orbit', 'crane-cockpit', 'crane-shoulder', 'crane-top', 'ship-low', 'ship-aerial', 'ship-water', 'ship-rig', 'spectator', 'transition', 'crane', 'booth', 'onFoot'] as const).includes(saved.cameraMode as CameraMode)
                    ? saved.cameraMode as CameraMode
                    : 'orbit',
                isNight: (saved.timeOfDay ?? 22) < 6 || (saved.timeOfDay ?? 22) > 18,
                shipVersions: saved.shipVersions ?? {},
                shipSailTimes: saved.shipSailTimes ?? {},
                shipDockedStatus: saved.shipDockedStatus ?? {},
                weather: saved.weather ?? 'clear',
                weatherIntensity: saved.weatherIntensity ?? 0.5,
                qualityPreset: saved.qualityPreset ?? 'high',
                dashboardPresets: {
                    crane: isCameraPresetId(saved.dashboardPresets?.crane) ? saved.dashboardPresets.crane : DEFAULT_STORE_DASHBOARD_PRESETS.crane,
                    hook: isCameraPresetId(saved.dashboardPresets?.hook) ? saved.dashboardPresets.hook : DEFAULT_STORE_DASHBOARD_PRESETS.hook,
                    drone: isCameraPresetId(saved.dashboardPresets?.drone) ? saved.dashboardPresets.drone : DEFAULT_STORE_DASHBOARD_PRESETS.drone,
                    underwater: isCameraPresetId(saved.dashboardPresets?.underwater) ? saved.dashboardPresets.underwater : DEFAULT_STORE_DASHBOARD_PRESETS.underwater,
                },
                operationMode: (['crane', 'tugboat', 'walking'] as const).includes((saved.operationMode ?? 'crane') as OperationMode)
                    ? ((saved.operationMode ?? 'crane') as OperationMode)
                    : 'crane',
                tugboatState: saved.tugboatState ? {
                    ...saved.tugboatState,
                    portEngineRpm: (saved.tugboatState as TugboatState).portEngineRpm ?? 0,
                    starboardEngineRpm: (saved.tugboatState as TugboatState).starboardEngineRpm ?? 0,
                    portCavitating: (saved.tugboatState as TugboatState).portCavitating ?? false,
                    starboardCavitating: (saved.tugboatState as TugboatState).starboardCavitating ?? false,
                    cavitationIntensity: (saved.tugboatState as TugboatState).cavitationIntensity ?? 0,
                    windShear: (saved.tugboatState as TugboatState).windShear ?? 0,
                    currentDrift: (saved.tugboatState as TugboatState).currentDrift ?? [0, 0],
                } : {
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
                tugboatDockedCount: saved.tugboatDockedCount ?? 0,
                tugboatWinTriggered: saved.tugboatWinTriggered ?? false,
                tugboatFirstTimeViewed: (saved as StorageGameState & { tugboatFirstTimeViewed?: boolean }).tugboatFirstTimeViewed ?? false,
                salvageContracts: Array.isArray((saved as StorageGameState & { salvageContracts?: SalvageContract[] }).salvageContracts)
                    ? (saved as StorageGameState & { salvageContracts?: SalvageContract[] }).salvageContracts!
                    : createSalvageContracts(),
                salvageSuccessfulTows: (saved as StorageGameState & { salvageSuccessfulTows?: number }).salvageSuccessfulTows ?? 0,
                tugboatCareerStats: {
                    totalTonsAssisted: (saved as StorageGameState & { tugboatCareerStats?: TugboatCareerStats }).tugboatCareerStats?.totalTonsAssisted ?? 0,
                    cleanTows: (saved as StorageGameState & { tugboatCareerStats?: TugboatCareerStats }).tugboatCareerStats?.cleanTows ?? 0,
                    nightRescues: (saved as StorageGameState & { tugboatCareerStats?: TugboatCareerStats }).tugboatCareerStats?.nightRescues ?? 0,
                },
                tugboatUpgrades: {
                    heavy_tow_winch: (saved as StorageGameState & { tugboatUpgrades?: TugboatUpgradeState }).tugboatUpgrades?.heavy_tow_winch ?? false,
                    cavitation_suppression_jets: (saved as StorageGameState & { tugboatUpgrades?: TugboatUpgradeState }).tugboatUpgrades?.cavitation_suppression_jets ?? false,
                    searchlight_rig: (saved as StorageGameState & { tugboatUpgrades?: TugboatUpgradeState }).tugboatUpgrades?.searchlight_rig ?? false,
                    dynamic_positioning_assist: (saved as StorageGameState & { tugboatUpgrades?: TugboatUpgradeState }).tugboatUpgrades?.dynamic_positioning_assist ?? false,
                },
                handshakeTargetSequence: DEFAULT_HANDSHAKE_SEQUENCE,
                handshakeInputSequence: [],
                handshakeComplete: false,
                towingUnlocked: false,
                isStormActive: saved.isStormActive ?? false,
                windDirection: saved.windDirection ?? 0,
                windStrength: saved.windStrength ?? 0,
                waveParams: saved.waveParams ?? { amplitude: 1.0, speed: 1.0, chaos: 0.0 },
                money: saved.money ?? 0,
                season: (['spring', 'summer', 'fall', 'winter'] as const).includes((saved as StorageGameState & { season?: Season }).season as Season)
                    ? ((saved as StorageGameState & { season?: Season }).season as Season)
                    : 'summer',
                wildlifeDensity: Math.max(0, Math.min(1, (saved as StorageGameState & { wildlifeDensity?: number }).wildlifeDensity ?? 0.6)),
                enableMarineLife: (saved as StorageGameState & { enableMarineLife?: boolean }).enableMarineLife ?? true,
                activeMission: null,
            })
            if (saved.economyData) {
                economySystem.deserialize(saved.economyData)
            }
            console.log('📂 Loaded from storage_manager')
        }
    },

    scheduleDeparture: (shipId: string) => set((state) => {
        const delayMs = Math.floor(Math.random() * 45000) + 45000 // 45-90 seconds
        const sailTime = Date.now() + delayMs
        const ship = state.ships.find(s => s.id === shipId)

        const newShips = state.ships.map(s =>
            s.id === shipId
                ? { ...s, sailTime, isDocked: true }
                : s
        )

        if (ship) {
            console.log(`⛵ Ship ${ship.name || shipId} scheduled to depart in ${Math.round(delayMs/1000)}s`)
        }

        const newState = { ships: newShips }
        scheduleSave({ ...state, ...newState })
        return newState
    }),

    returnToDock: (shipId: string) => set((state) => {
        const ship = state.ships.find(s => s.id === shipId)

        const newShips = state.ships.map(s =>
            s.id === shipId
                ? { ...s, sailTime: undefined, isDocked: true }
                : s
        )

        if (ship) {
            console.log(`🔄 Ship ${ship.name || shipId} returning for upgrade`)
        }

        const newState = { ships: newShips }
        scheduleSave({ ...state, ...newState })
        return newState
    }),

    // Full Structural Overhaul - Upgrade ship version (v1.0 → v1.5 → v2.0)
    upgradeShipVersion: async (shipId: string) => {
        const state = get()
        const ship = state.ships.find(s => s.id === shipId)
        if (!ship) {
            console.warn('⚠️ Cannot upgrade: Ship not found')
            return
        }
        if (!ship.isDocked) {
            console.warn('⚠️ Cannot upgrade: Ship must be docked')
            return
        }

        // Get current version (default to "1.0")
        const currentVersion = ship.version || '1.0'

        // Define version progression
        const versionMap: Record<string, string> = {
            '1.0': '1.5',
            '1.5': '2.0',
            '2.0': '2.0'  // Max version
        }
        const nextVersion = versionMap[currentVersion]

        if (currentVersion === '2.0') {
            console.log('🚢 Ship is already at maximum version (v2.0)')
            return
        }

        const shipName = ship.name || `${ship.type.charAt(0).toUpperCase() + ship.type.slice(1)} Ship`
        console.log(`🔧 Upgrading ${shipName} to v${nextVersion}...`)

        // Simulate upgrade delay for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Update ship version
        const updatedShips = state.ships.map(s => {
            if (s.id === shipId) {
                return {
                    ...s,
                    version: nextVersion,
                    blueprintVersion: nextVersion  // Reference to new blueprint if available
                }
            }
            return s
        })

        const newState = { ships: updatedShips }
        set(newState)
        scheduleSave({ ...state, ...newState })

        console.log(`✅ Upgrade complete! ${shipName} is now v${nextVersion}`)
    },

    // Ambient marine life layer setters
    setSeason: (season: Season) => {
        set({ season })
        scheduleSave({ ...get(), season })
    },

    setWildlifeDensity: (density: number) => {
        const newDensity = Math.max(0, Math.min(1, density))
        set({ wildlifeDensity: newDensity })
        scheduleSave({ ...get(), wildlifeDensity: newDensity })
    },

    setEnableMarineLife: (enabled: boolean) => {
        set({ enableMarineLife: enabled })
        scheduleSave({ ...get(), enableMarineLife: enabled })
    },

    // Weather system
    setWeather: (weather: WeatherState) => {
        set({ weather })
        scheduleSave({ ...get(), weather })
        console.log(`🌤️ Weather set to: ${weather}`)
    },

    // Quality preset
    setQualityPreset: (preset: QualityPreset) => {
        set({ qualityPreset: preset })
        scheduleSave({ ...get(), qualityPreset: preset })
        console.log(`🎨 Quality preset set to: ${preset}`)
    },

    // Crane control actions
    setSpreaderPos: (pos) => set({ spreaderPos: pos }),
    setSpreaderRotation: (rotation) => set({ spreaderRotation: rotation }),
    setCableDepth: (depth) => set({ cableDepth: depth }),
    setLoadTension: (tension) => set({ loadTension: tension }),
    setTrolleyPosition: (position) => set({ trolleyPosition: position }),
    setWinchSpeed: (speed: number) => set({ winchSpeed: speed }),
    setHighlightedUpgradePart: (partName) => set({ highlightedUpgradePart: partName }),
    setPendingAutoInstall: (pending) => set({ pendingAutoInstall: pending }),
    setInstallQueue: (queue) => set((state) => {
        const nextState = {
            installQueue: queue,
            installQueueIndex: 0,
            isQueueRunning: queue.length > 0,
            isQueuePaused: false,
            queuePausedAt: null,
            queuePausedShipId: null,
            pendingAutoInstall: null,
        }
        scheduleSave({ ...state, ...nextState })
        return nextState
    }),
    advanceInstallQueue: () => set((state) => {
        const nextIndex = state.installQueueIndex + 1
        if (nextIndex >= state.installQueue.length) {
            return {
                installQueue: [],
                installQueueIndex: 0,
                isQueueRunning: false,
                isQueuePaused: false,
                queuePausedAt: null,
                queuePausedShipId: null,
            }
        }
        return {
            installQueueIndex: nextIndex,
            isQueuePaused: false,
            queuePausedAt: null,
            queuePausedShipId: null,
        }
    }),
    abortInstallQueue: () => set({
        installQueue: [],
        installQueueIndex: 0,
        isQueueRunning: false,
        isQueuePaused: false,
        queuePausedAt: null,
        queuePausedShipId: null,
    }),
    pauseInstallQueue: (shipId) => set((state) => ({
        isQueuePaused: true,
        queuePausedAt: Date.now(),
        queuePausedShipId: shipId,
        isQueueRunning: state.installQueue.length > 0,
    })),
    resumeInstallQueue: () => set({
        isQueuePaused: false,
        queuePausedAt: null,
        queuePausedShipId: null,
    }),
    setJoystickLeft: (pos) => set((state) => {
        const nextState = { joystickLeft: pos }
        if ((state.isQueueRunning || state.isQueuePaused) && (Math.abs(pos.x) > 0.001 || Math.abs(pos.y) > 0.001)) {
            return {
                ...nextState,
                installQueue: [],
                installQueueIndex: 0,
                isQueueRunning: false,
                isQueuePaused: false,
                queuePausedAt: null,
                queuePausedShipId: null,
            }
        }
        return nextState
    }),
    setJoystickRight: (pos) => set((state) => {
        const nextState = { joystickRight: pos }
        if ((state.isQueueRunning || state.isQueuePaused) && (Math.abs(pos.x) > 0.001 || Math.abs(pos.y) > 0.001)) {
            return {
                ...nextState,
                installQueue: [],
                installQueueIndex: 0,
                isQueueRunning: false,
                isQueuePaused: false,
                queuePausedAt: null,
                queuePausedShipId: null,
            }
        }
        return nextState
    }),
    setTwistlockEngaged: (engaged) => set({ twistlockEngaged: engaged }),
    setHeaterActive: (active) => set({ heaterActive: active }),
    setIsMoving: (moving) => set({ isMoving: moving }),

    // Multiview system actions
    setMultiviewMode: (mode) => {
        set({ multiviewMode: mode })
        console.log(`📺 Multiview mode: ${mode}`)
    },
    setUnderwaterIntensity: (intensity) => {
        const newIntensity = Math.max(0, Math.min(2, intensity))
        set({ underwaterIntensity: newIntensity })
    },
    setDashboardPreset: (viewportId, presetId) => {
        set((state) => {
            const dashboardPresets = {
                ...state.dashboardPresets,
                [viewportId]: presetId
            }
            const newState = { dashboardPresets }
            scheduleSave({ ...state, ...newState })
            return newState
        })
    },

    // Viewport-local camera history stack (Alt A)
    pushViewportHistory: (viewportId, transform) => {
        set((state) => {
            const vp = state.viewportCameras[viewportId]
            const newHistory = vp.history.slice(0, vp.historyIndex + 1)
            newHistory.push(transform)
            if (newHistory.length > 20) newHistory.shift()
            const newIndex = newHistory.length - 1
            return {
                viewportCameras: {
                    ...state.viewportCameras,
                    [viewportId]: {
                        ...vp,
                        history: newHistory,
                        historyIndex: newIndex
                    }
                }
            }
        })
    },
    navigateViewportHistory: (viewportId, direction) => {
        set((state) => {
            const vp = state.viewportCameras[viewportId]
            const newIndex = Math.max(0, Math.min(vp.history.length - 1, vp.historyIndex + direction))
            if (newIndex === vp.historyIndex) return state
            return {
                viewportCameras: {
                    ...state.viewportCameras,
                    [viewportId]: { ...vp, historyIndex: newIndex }
                }
            }
        })
    },
    pinViewportCamera: (viewportId, transform) => {
        set((state) => {
            const vp = state.viewportCameras[viewportId]
            const newPinned = [...vp.pinned, transform]
            if (newPinned.length > 6) newPinned.shift()
            return {
                viewportCameras: {
                    ...state.viewportCameras,
                    [viewportId]: { ...vp, pinned: newPinned }
                }
            }
        })
    },
    recallPinnedViewportCamera: (viewportId, pinIndex) => {
        set((state) => {
            const vp = state.viewportCameras[viewportId]
            const snapshot = vp.pinned[pinIndex]
            if (!snapshot) return state
            const newHistory = vp.history.slice(0, vp.historyIndex + 1)
            newHistory.push(snapshot)
            if (newHistory.length > 20) newHistory.shift()
            return {
                viewportCameras: {
                    ...state.viewportCameras,
                    [viewportId]: {
                        ...vp,
                        history: newHistory,
                        historyIndex: newHistory.length - 1
                    }
                }
            }
        })
    },
    setFocusedViewport: (viewportId) => set({ focusedViewport: viewportId }),

    // Wildlife and sea event actions
    addWildlife: (wildlife) => set((state) => ({
        wildlife: [...state.wildlife, wildlife]
    })),

});
