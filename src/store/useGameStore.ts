import { create } from 'zustand'

// =============================================================================
// TYPES - HarborGlow Game State
// =============================================================================

export type ShipType = 'cruise' | 'container' | 'tanker'

export interface AttachmentPoint {
    position: [number, number, number]
    rotation: [number, number, number]
    partName: string
}

export interface Ship {
    id: string
    type: ShipType
    modelName: string // GLB model filename (e.g., 'cruise_liner', 'container_vessel', 'oil_tanker')
    position: [number, number, number]
    length: number
    attachmentPoints: AttachmentPoint[]
    name?: string // Ship name for display
}

export interface Upgrade {
    shipId: string
    partName: string
    installed: boolean
    installedAt?: number // Timestamp
}

export interface SpectatorState {
    isActive: boolean
    targetShipId: string | null
    startTime: number
    duration: number // seconds
}

interface GameState {
    // Ships
    ships: Ship[]
    currentShipId: string | null
    
    // Upgrades
    installedUpgrades: Upgrade[]
    
    // Music
    musicPlaying: Map<string, boolean>
    bpm: number
    lyricsSize: number
    lightIntensity: number
    
    // Spectator Mode (post-upgrade cinematic)
    spectatorState: SpectatorState
    
    // Night/Day cycle
    isNight: boolean
    timeOfDay: number // 0-24
    
    // Camera
    cameraMode: 'orbit' | 'spectator' | 'crane'
    
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
}

// =============================================================================
// STORE - Zustand Game State
// =============================================================================

export const useGameStore = create<GameState>((set, get) => ({
    // Initial state
    ships: [],
    currentShipId: null,
    installedUpgrades: [],
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
    timeOfDay: 22, // 10 PM
    cameraMode: 'orbit',

    // -------------------------------------------------------------------------
    // SHIP ACTIONS
    // -------------------------------------------------------------------------
    
    addShip: (ship) => set((state) => {
        // Auto-select first ship
        const shouldSelect = state.ships.length === 0
        return { 
            ships: [...state.ships, ship],
            currentShipId: shouldSelect ? ship.id : state.currentShipId
        }
    }),

    removeShip: (shipId) => set((state) => ({
        ships: state.ships.filter(s => s.id !== shipId),
        currentShipId: state.currentShipId === shipId 
            ? (state.ships.find(s => s.id !== shipId)?.id || null)
            : state.currentShipId,
        installedUpgrades: state.installedUpgrades.filter(u => u.shipId !== shipId),
        musicPlaying: (() => {
            const newMap = new Map(state.musicPlaying)
            newMap.delete(shipId)
            return newMap
        })()
    })),

    setCurrentShip: (id) => set({ currentShipId: id }),

    // -------------------------------------------------------------------------
    // UPGRADE ACTIONS
    // -------------------------------------------------------------------------
    
    installUpgrade: (shipId, partName) =>
        set((state) => ({
            installedUpgrades: [
                ...state.installedUpgrades,
                { 
                    shipId, 
                    partName, 
                    installed: true,
                    installedAt: Date.now()
                },
            ],
        })),

    uninstallUpgrade: (shipId, partName) =>
        set((state) => ({
            installedUpgrades: state.installedUpgrades.filter(
                u => !(u.shipId === shipId && u.partName === partName)
            ),
        })),

    // -------------------------------------------------------------------------
    // MUSIC ACTIONS
    // -------------------------------------------------------------------------
    
    setMusicPlaying: (shipId, playing) =>
        set((state) => {
            const newMap = new Map(state.musicPlaying)
            newMap.set(shipId, playing)
            return { musicPlaying: newMap }
        }),

    stopAllMusic: () =>
        set((state) => {
            const newMap = new Map(state.musicPlaying)
            newMap.forEach((_, key) => newMap.set(key, false))
            return { musicPlaying: newMap }
        }),

    setBPM: (bpm) => set({ bpm: Math.max(60, Math.min(200, bpm)) }),
    
    setLyricsSize: (size) => set({ lyricsSize: Math.max(12, Math.min(72, size)) }),
    
    setLightIntensity: (intensity) => set({ 
        lightIntensity: Math.max(0.1, Math.min(5, intensity)) 
    }),

    // -------------------------------------------------------------------------
    // SPECTATOR MODE (Drone Camera)
    // -------------------------------------------------------------------------
    
    setSpectatorTarget: (shipId, duration = 10) => {
        const state = get()
        
        // Only activate if not already in spectator mode
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

        // Auto-end after duration
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

    // -------------------------------------------------------------------------
    // ENVIRONMENT
    // -------------------------------------------------------------------------
    
    setTimeOfDay: (hour) => set({
        timeOfDay: hour % 24,
        isNight: hour < 6 || hour > 18
    }),

    setCameraMode: (mode) => set({ cameraMode: mode })
}))

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
    
    // Get expected upgrade count based on ship type
    const upgradeCounts: Record<ShipType, number> = {
        cruise: 8,
        container: 10,
        tanker: 8
    }
    
    const installed = state.installedUpgrades.filter(u => u.shipId === shipId).length
    const total = upgradeCounts[ship.type]
    return (installed / total) * 100
}

export const selectIsShipFullyUpgraded = (state: GameState, shipId: string): boolean => {
    const progress = selectUpgradeProgress(state, shipId)
    return progress >= 100
}
