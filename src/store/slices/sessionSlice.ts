// =============================================================================
// SESSION SLICE — Whole-session lifecycle: new game reset and save restore.
// =============================================================================

import type { StateCreator } from 'zustand';
import type { SessionSlice } from '../sliceTypes';
import {
    type GameState,
    type Ship,
    type CameraMode,
    type OperationMode,
    type Season,
    type SalvageContract,
    type TugboatState,
    type TugboatUpgradeState,
    type TugboatCareerStats,
    DEFAULT_STORE_DASHBOARD_PRESETS,
    createSalvageContracts,
    DEFAULT_HANDSHAKE_SEQUENCE,
} from '../gameStoreTypes';
import { clearSave } from '../../utils/storage_manager';
import { loadGameState } from '../../utils/storage_manager';
import type { GameState as StorageGameState } from '../../utils/storage_manager';
import { economySystem } from '../../systems/economySystem';
import { isCameraPresetId } from '../../types/CameraPreset';

export const createSessionSlice: StateCreator<GameState, [], [], SessionSlice> = (set, get, _api) => ({
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
            twistlockEngaged: false,
            installAttemptStartedAt: null,
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
                // v4 wallet, with the v3 field as a fallback for saves that
                // reached us without going through migrateV3.
                harborCredits: saved.harborCredits ?? saved.money ?? 0,
                unlockedShopItems: saved.unlockedShopItems ?? [],
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
});
