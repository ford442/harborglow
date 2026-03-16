import { create } from 'zustand'
import { 
  saveGameState, 
  loadGameState, 
  clearSave,
  type GameState as StorageGameState 
} from '../utils/storage_manager'

// =============================================================================
// TYPES - HarborGlow Game State
// =============================================================================

export type ShipType = 'cruise' | 'container' | 'tanker' | 'bulk' | 'lng' | 'roro' | 'research' | 'droneship'
export type WeatherState = 'clear' | 'rain' | 'fog' | 'storm'
export type SeaEventType = 'milky_seas' | 'whale_migration' | 'shark_patrol' | 'meteor_shower' | 'bioluminescent_bloom' | 'none'
export type WildlifeType = 'humpback_whale' | 'great_white_shark' | 'bottlenose_dolphin' | 'bioluminescent_plankton'
export type QualityPreset = 'low' | 'medium' | 'high'
export type MultiviewMode = 'single' | 'quad'

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
    cameraMode: 'orbit' | 'spectator' | 'crane'
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
    // Wildlife and sea events
    wildlife: WildlifeEntity[]
    activeSeaEvent: SeaEvent | null
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
}

interface GameState extends SerializableState {
    currentShipId: string | null
    installedUpgrades: Upgrade[]  // alias for craneUpgrades
    musicPlaying: Map<string, boolean>
    spectatorState: SpectatorState
    isNight: boolean
    
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
    setCameraMode: (mode: 'orbit' | 'spectator' | 'crane') => void
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
    setMultiviewMode: unknown; setUnderwaterIntensity: unknown;
    addWildlife: unknown; removeWildlife: unknown; updateWildlife: unknown; setActiveSeaEvent: unknown;
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
    multiviewMode: 'single' as MultiviewMode,
    underwaterIntensity: 1,
    wildlife: [],
    activeSeaEvent: null,
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
                cameraMode: saved.cameraMode && ['orbit', 'spectator', 'crane'].includes(saved.cameraMode) 
                    ? saved.cameraMode as 'orbit' | 'spectator' | 'crane'
                    : 'orbit',
                isNight: (saved.timeOfDay ?? 22) < 6 || (saved.timeOfDay ?? 22) > 18,
                shipVersions: saved.shipVersions ?? {},
                shipSailTimes: saved.shipSailTimes ?? {},
                shipDockedStatus: saved.shipDockedStatus ?? {},
                weather: saved.weather ?? 'clear',
                weatherIntensity: saved.weatherIntensity ?? 0.5,
                qualityPreset: saved.qualityPreset ?? 'high',
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
