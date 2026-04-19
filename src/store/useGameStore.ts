import { create } from 'zustand'
import { 
  saveGameState, 
  loadGameState, 
  clearSave,
  type GameState as StorageGameState 
} from '../utils/storage_manager'
import { 
  AttachmentSystemConfig, 
  DEFAULT_ATTACHMENT_CONFIG,
  InstallationEvent 
} from '../systems/attachmentSystem'
import {
  TrainingProgress,
  DEFAULT_TRAINING_PROGRESS,
  TrainingModuleId,
  trainingSystem
} from '../systems/trainingSystem'
import { reputationSystem } from '../systems/reputationSystem'
import type { CameraPresetId, DashboardPresets, DashboardViewportId } from '../types/CameraPreset'

const DEFAULT_STORE_DASHBOARD_PRESETS: DashboardPresets = {
    crane: 'gantry-top-down',
    hook: 'cable-tip-follow',
    drone: 'drone-chase',
    underwater: 'dock-level'
}

const CAMERA_PRESET_IDS: CameraPresetId[] = [
    'orbit-overview',
    'gantry-top-down',
    'cable-tip-follow',
    'dock-level',
    'drone-chase',
    'ship-interior'
]

const isCameraPresetId = (value: unknown): value is CameraPresetId =>
    typeof value === 'string' && CAMERA_PRESET_IDS.includes(value as CameraPresetId)

// =============================================================================
// TYPES - HarborGlow Game State
// =============================================================================

export type ShipType = 'cruise' | 'container' | 'tanker' | 'bulk' | 'lng' | 'roro' | 'research' | 'droneship'
export type WeatherState = 'clear' | 'rain' | 'fog' | 'storm'
export type CameraMode = 'orbit' | 'crane-cockpit' | 'crane-shoulder' | 'crane-top' |
                         'ship-low' | 'ship-aerial' | 'ship-water' | 'ship-rig' |
                         'spectator' | 'transition' | 'crane' | 'booth'
export type CabinViewMode = 'multiview' | 'immersive'
export type GameMode = 'sandbox' | 'training'
export type SeaEventType = 'milky_seas' | 'whale_migration' | 'shark_patrol' | 'meteor_shower' | 'bioluminescent_bloom' | 'none'

// HarborGlow Bay Research-Based Events
export type HarborEventType = 
    | 'whale_migration'      // Gray/humpback migration (Dec-May)
    | 'dolphin_pod'          // Bottlenose dolphins
    | 'porpoise_sighting'    // Harbor porpoise (rare)
    | 'shark_patrol'         // Great whites
    | 'sea_lion_haulout'     // California sea lions
    | 'plankton_bloom'       // Bioluminescent display
    | 'ship_fire'            // Container/tanker fire
    | 'fireboat_response'    // 5 fireboats
    | 'navy_fleet_week'      // May/October
    | 'navy_resupply'        // Random naval visits
    | 'atmospheric_river'    // Pineapple Express storms
    | 'cruise_arrival'       // Tourism ship
    | 'cruise_departure'     // Mexico/Alaska bound
    | 'suspicious_vessel'    // Rare security event
    | 'clear'
export type WildlifeType = 'humpback_whale' | 'great_white_shark' | 'bottlenose_dolphin' | 'bioluminescent_plankton'
export type QualityPreset = 'low' | 'medium' | 'high'
export type MultiviewMode = 'single' | 'quad'
export type HarborType = 'norway' | 'singapore' | 'dubai' | 'rotterdam' | 'yokohama' | 'longbeach' | 'santos'

export interface AttachmentPoint {
    position: [number, number, number]
    rotation: [number, number, number]
    partName: string
}

export interface Ship {
    id: string
    type: ShipType
    modelName: string
    position: [number, number, number]
    velocity?: [number, number, number]  // Optional velocity for wildlife system
    length: number
    attachmentPoints: AttachmentPoint[]
    name?: string
    sailTime?: number  // Timestamp when ship departs
    isDocked?: boolean // Whether ship is currently docked
    version?: string   // Ship instance version (e.g., "1.0", "1.5", "2.0")
    blueprintVersion?: string  // The blueprint version this ship was created from
}

export interface WildlifeEntity {
    id: string
    type: WildlifeType
    position: [number, number, number]
    velocity: [number, number, number]
    behaviorState: 'idle' | 'hunting' | 'migrating' | 'playing' | 'breaching'
    targetShipId?: string  // For bow-riding dolphins
    createdAt: number
}

export interface SeaEvent {
    id: string
    type: SeaEventType
    startTime: number
    duration: number  // seconds
    intensity: number  // 0-1
    affectedArea: {
        center: [number, number, number]
        radius: number
    }
}

export interface HarborEvent {
    id: string
    type: HarborEventType
    startTime: number
    duration: number  // seconds
    intensity: number  // 0-1
    affectedShipId?: string
    position: [number, number, number]
    metadata?: Record<string, unknown>
}

export interface Upgrade {
    shipId: string
    partName: string
    installed: boolean
    installedAt?: number
}

export interface SpectatorState {
    isActive: boolean
    targetShipId: string | null
    startTime: number
    duration: number
}

// Serializable state matching storage_manager GameState
interface SerializableState {
    ships: Ship[]
    craneUpgrades: Upgrade[]  // renamed to match storage_manager
    musicEnabled: boolean
    currentSong?: string
    bpm: number
    lyricsSize: number
    lightIntensity: number
    timeOfDay: number
    cameraMode: CameraMode
    // Ship tracking data
    shipVersions: Record<string, string>
    shipSailTimes: Record<string, number>
    shipDockedStatus: Record<string, boolean>
    // Weather system
    weather: WeatherState
    weatherIntensity: number
    // Rendering quality
    qualityPreset: QualityPreset
    // Crane state
    twistlockEngaged: boolean
    craneHeight: number
    craneRotation: number
    // Multiview system
    multiviewMode: MultiviewMode
    underwaterIntensity: number
    dashboardPresets: DashboardPresets
    // Wildlife and sea events
    wildlife: WildlifeEntity[]
    activeSeaEvent: SeaEvent | null
    
    // Harbor research-based events
    activeHarborEvents: HarborEvent[]
    eventEnabledSettings: Record<HarborEventType, boolean>
    // Full crane mechanics
    spreaderPos: { x: number; y: number; z: number }
    spreaderRotation: number
    cableDepth: number
    loadTension: number
    trolleyPosition: number
    joystickLeft: { x: number; y: number }
    joystickRight: { x: number; y: number }
    isMoving: boolean
    heaterActive: boolean
    iceBuildup: number
    // Booth tier (1=standard, 3=arctic)
    boothTier: 1 | 2 | 3
    // Harbor/Booth theme
    currentHarbor: HarborType
    // Operator Cabin view mode
    cabinViewMode: CabinViewMode
    // Attachment system configuration
    attachmentSystemConfig: AttachmentSystemConfig
    setAttachmentSystemConfig: (config: Partial<AttachmentSystemConfig>) => void
    // Last installation for feedback effects
    lastInstallation: InstallationEvent | null
    clearLastInstallation: () => void
    // Training system
    trainingProgress: TrainingProgress
    gameMode: GameMode
    currentTrainingModule: TrainingModuleId | null
    setGameMode: (mode: GameMode) => void
    startTrainingModule: (moduleId: TrainingModuleId) => void
    exitTrainingModule: () => void
    updateTrainingProgress: (progress: TrainingProgress) => void
}

interface GameState extends SerializableState {
    currentShipId: string | null
    installedUpgrades: Upgrade[]  // alias for craneUpgrades
    musicPlaying: Map<string, boolean>
    spectatorState: SpectatorState
    isNight: boolean
    // Time system state
    gameTime: { hour: number; minute: number } | null
    // Wildlife and sea events
    wildlife: WildlifeEntity[]
    activeSeaEvent: SeaEvent | null
    
    // Actions
    addShip: (ship: Ship) => void
    removeShip: (shipId: string) => void
    setCurrentShip: (id: string | null) => void
    installUpgrade: (shipId: string, partName: string) => void
    uninstallUpgrade: (shipId: string, partName: string) => void
    setMusicPlaying: (shipId: string, playing: boolean) => void
    stopAllMusic: () => void
    setBPM: (bpm: number) => void
    setLyricsSize: (size: number) => void
    setLightIntensity: (intensity: number) => void
    setSpectatorTarget: (shipId: string | null, duration?: number) => void
    endSpectatorMode: () => void
    setTimeOfDay: (hour: number) => void
    setCameraMode: (mode: CameraMode) => void
    resetGame: () => void
    loadSavedState: () => void
    scheduleDeparture: (shipId: string) => void
    returnToDock: (shipId: string) => void
    upgradeShipVersion: (shipId: string) => Promise<void>  // Full Structural Overhaul
    setWeather: (weather: WeatherState) => void  // Weather system
    setQualityPreset: (preset: QualityPreset) => void  // Quality preset
    // Multiview system
    setMultiviewMode: (mode: MultiviewMode) => void
    setUnderwaterIntensity: (intensity: number) => void
    setDashboardPreset: (viewportId: DashboardViewportId, presetId: CameraPresetId) => void
    // Crane control actions
    setSpreaderPos: (pos: { x: number; y: number; z: number }) => void
    setSpreaderRotation: (rotation: number) => void
    setCableDepth: (depth: number) => void
    setLoadTension: (tension: number) => void
    setTrolleyPosition: (position: number) => void
    setJoystickLeft: (pos: { x: number; y: number }) => void
    setJoystickRight: (pos: { x: number; y: number }) => void
    setTwistlockEngaged: (engaged: boolean) => void
    setHeaterActive: (active: boolean) => void
    setIsMoving: (moving: boolean) => void
    // Wildlife and sea event actions
    addWildlife: (wildlife: WildlifeEntity) => void
    removeWildlife: (id: string) => void
    updateWildlife: (id: string, updates: Partial<WildlifeEntity>) => void
    setActiveSeaEvent: (event: SeaEvent | null) => void
    
    // Harbor event actions (research-based events)
    activeHarborEvents: HarborEvent[]
    addHarborEvent: (event: HarborEvent) => void
    removeHarborEvent: (id: string) => void
    setEventEnabled: (type: HarborEventType, enabled: boolean) => void
    eventEnabledSettings: Record<HarborEventType, boolean>
    // Harbor theme
    setCurrentHarbor: (harbor: HarborType) => void
    // Operator Cabin view mode
    setCabinViewMode: (mode: CabinViewMode) => void
    // Time system
    setGameTime: (hour: number, minute: number) => void
    // Traffic system
    reputation: number
    dailyShipsCompleted: number
    dailyShipsMissed: number
    addReputation: (amount: number) => void
}

// Default initial state
const defaultState: Omit<GameState, keyof {
    addShip: unknown; removeShip: unknown; setCurrentShip: unknown;
    installUpgrade: unknown; uninstallUpgrade: unknown; setMusicPlaying: unknown;
    stopAllMusic: unknown; setBPM: unknown; setLyricsSize: unknown;
    setLightIntensity: unknown; setSpectatorTarget: unknown; endSpectatorMode: unknown;
    setTimeOfDay: unknown; setCameraMode: unknown; resetGame: unknown; loadSavedState: unknown;
    scheduleDeparture: unknown; returnToDock: unknown; upgradeShipVersion: unknown; setWeather: unknown; setQualityPreset: unknown;
    setSpreaderPos: unknown; setSpreaderRotation: unknown; setCableDepth: unknown; setLoadTension: unknown;
    setTrolleyPosition: unknown; setJoystickLeft: unknown; setJoystickRight: unknown;
    setTwistlockEngaged: unknown; setHeaterActive: unknown; setIsMoving: unknown;
    setMultiviewMode: unknown; setUnderwaterIntensity: unknown; setDashboardPreset: unknown;
    addWildlife: unknown; removeWildlife: unknown; updateWildlife: unknown; setActiveSeaEvent: unknown;
    addHarborEvent: unknown; removeHarborEvent: unknown; setEventEnabled: unknown;
    setCurrentHarbor: unknown; setCabinViewMode: unknown; setGameTime: unknown;
    setAttachmentSystemConfig: unknown; clearLastInstallation: unknown;
    setGameMode: unknown; startTrainingModule: unknown; exitTrainingModule: unknown;
    updateTrainingProgress: unknown; addReputation: unknown;
}> = {
    ships: [],
    craneUpgrades: [],
    installedUpgrades: [],
    musicEnabled: true,
    currentShipId: null,
    musicPlaying: new Map(),
    bpm: 128,
    lyricsSize: 28,
    lightIntensity: 1.5,
    spectatorState: {
        isActive: false,
        targetShipId: null,
        startTime: 0,
        duration: 10
    },
    isNight: true,
    timeOfDay: 22,
    cameraMode: 'orbit',
    shipVersions: {},
    shipSailTimes: {},
    shipDockedStatus: {},
    weather: 'clear',
    weatherIntensity: 0.5,
    qualityPreset: 'high',
    twistlockEngaged: false,
    craneHeight: 15.5,
    craneRotation: 0.2,
    spreaderPos: { x: 0, y: 10, z: 0 },
    spreaderRotation: 0,
    cableDepth: 15,
    loadTension: 0,
    trolleyPosition: 0.5,
    joystickLeft: { x: 0, y: 0 },
    joystickRight: { x: 0, y: 0 },
    isMoving: false,
    heaterActive: true,
    iceBuildup: 0.3,
    boothTier: 3, // Default to Arctic tier for demo
    currentHarbor: 'rotterdam', // Default harbor
    multiviewMode: 'single' as MultiviewMode,
    underwaterIntensity: 1,
    dashboardPresets: DEFAULT_STORE_DASHBOARD_PRESETS,
    wildlife: [],
    activeSeaEvent: null,
    activeHarborEvents: [],
    gameTime: null,
    eventEnabledSettings: {
        whale_migration: true,
        dolphin_pod: true,
        porpoise_sighting: true,
        shark_patrol: true,
        sea_lion_haulout: true,
        plankton_bloom: true,
        ship_fire: true,
        fireboat_response: true,
        navy_fleet_week: true,
        navy_resupply: true,
        atmospheric_river: true,
        cruise_arrival: true,
        cruise_departure: true,
        suspicious_vessel: true,
        clear: true
    },
    // Operator Cabin view mode - default to multiview
    cabinViewMode: 'multiview' as CabinViewMode,
    // Attachment system configuration
    attachmentSystemConfig: DEFAULT_ATTACHMENT_CONFIG,
    lastInstallation: null,
    // Training system
    trainingProgress: DEFAULT_TRAINING_PROGRESS,
    gameMode: 'sandbox',
    currentTrainingModule: null,
    // Traffic system
    reputation: 0,
    dailyShipsCompleted: 0,
    dailyShipsMissed: 0,
}

// =============================================================================
// STORE - Zustand Game State with storage_manager
// =============================================================================

let saveTimeout: ReturnType<typeof setTimeout> | null = null

const getSerializableState = (state: GameState): StorageGameState => ({
    ships: state.ships,
    craneUpgrades: state.installedUpgrades,
    musicEnabled: state.musicEnabled,
    currentSong: state.currentSong,
    bpm: state.bpm,
    lyricsSize: state.lyricsSize,
    lightIntensity: state.lightIntensity,
    timeOfDay: state.timeOfDay,
    cameraMode: state.cameraMode,
    shipVersions: state.shipVersions,
    shipSailTimes: state.shipSailTimes,
    shipDockedStatus: state.shipDockedStatus,
    weather: state.weather,
    weatherIntensity: state.weatherIntensity,
    dashboardPresets: state.dashboardPresets,
})

const scheduleSave = (state: GameState) => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
        saveGameState(getSerializableState(state))
    }, 500)
}

export const useGameStore = create<GameState>((set, get) => ({
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
                cameraMode: saved.cameraMode && (['orbit', 'crane-cockpit', 'crane-shoulder', 'crane-top', 'ship-low', 'ship-aerial', 'ship-water', 'ship-rig', 'spectator', 'transition', 'crane', 'booth'] as const).includes(saved.cameraMode as CameraMode)
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
            })
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
    setJoystickLeft: (pos) => set({ joystickLeft: pos }),
    setJoystickRight: (pos) => set({ joystickRight: pos }),
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
    
    // Wildlife and sea event actions
    addWildlife: (wildlife) => set((state) => ({
        wildlife: [...state.wildlife, wildlife]
    })),
    
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
            set({ 
                gameMode: 'training',
                currentTrainingModule: moduleId,
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
}))

// Subscribe to save on all state changes
useGameStore.subscribe((state) => {
    scheduleSave(state)
})

// =============================================================================
// SELECTORS - Convenience hooks for derived state
// =============================================================================

export const selectCurrentShip = (state: GameState): Ship | undefined =>
    state.ships.find(s => s.id === state.currentShipId)

export const selectShipUpgrades = (state: GameState, shipId: string): Upgrade[] =>
    state.installedUpgrades.filter(u => u.shipId === shipId)

export const selectUpgradeProgress = (state: GameState, shipId: string): number => {
    const ship = state.ships.find(s => s.id === shipId)
    if (!ship) return 0
    
    const upgradeCounts: Record<ShipType, number> = {
        cruise: 8,
        container: 10,
        tanker: 8,
        bulk: 9,        // Capesize bulk carrier - 9 cargo hold lighting zones
        lng: 10,        // LNG carrier - 5 membrane tank enclosures + 5 superstructure
        roro: 8,        // Ro-Ro ferry - vehicle deck lighting + ramp illumination
        research: 7,    // Research vessel - lab lighting + sonar array + equipment bays
        droneship: 6    // Space recovery drone ship - landing platform + thruster bays
    }
    
    const installed = state.installedUpgrades.filter(u => u.shipId === shipId).length
    const total = upgradeCounts[ship.type]
    return (installed / total) * 100
}

export const selectIsShipFullyUpgraded = (state: GameState, shipId: string): boolean => {
    const progress = selectUpgradeProgress(state, shipId)
    return progress >= 100
}
