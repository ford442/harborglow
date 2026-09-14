// =============================================================================
// GAME STORE - Multiplayer Types
// WebRTC shared-harbor sync (optional, ?multiplayer=1).
// Split out of gameStoreTypes.ts; re-exported there for backward compatibility.
// =============================================================================

import type { InstallationEvent } from '../systems/attachmentSystem'
import type { WaveParams } from '../systems/WaveSystem'
import type {
    Ship,
    Upgrade,
    WeatherState,
    OperationMode,
    TugboatState,
    TugboatCareerStats,
    TugboatUpgradeState,
    Season,
    SpectatorState,
    WildlifeEntity,
    SeaEvent,
    HarborEvent,
} from './gameStoreDomainTypes'
import type { SalvageContract } from './gameStoreSalvage'

export type MultiplayerRole = 'offline' | 'host' | 'spectator'
export type MultiplayerConnectionStatus = 'idle' | 'signalling' | 'connected' | 'error'

export interface ChatMessage {
    id: string
    sender: string
    text: string
    ts: number
}

/** Leftover v1 wire projection (no longer broadcast). Kept for store tests / debug overlays. */
export interface NetworkSyncState {
    // Base (matches getSerializableState)
    ships: Ship[]
    craneUpgrades: Upgrade[]
    musicEnabled: boolean
    currentSong?: string
    bpm: number
    lyricsSize: number
    lightIntensity: number
    timeOfDay: number
    shipVersions: Record<string, string>
    shipSailTimes: Record<string, number>
    shipDockedStatus: Record<string, boolean>
    weather: WeatherState
    weatherIntensity: number
    operationMode: OperationMode
    tugboatState: TugboatState
    tugboatDockedCount: number
    tugboatWinTriggered: boolean
    tugboatFirstTimeViewed: boolean
    salvageContracts: SalvageContract[]
    salvageSuccessfulTows: number
    tugboatCareerStats: TugboatCareerStats
    tugboatUpgrades: TugboatUpgradeState
    waveParams: WaveParams
    harborCredits: number
    unlockedShopItems: string[]
    economyData?: string
    season: Season
    wildlifeDensity: number
    enableMarineLife: boolean
    // Crane ephemeral
    spreaderPos: { x: number; y: number; z: number }
    spreaderRotation: number
    cableDepth: number
    loadTension: number
    trolleyPosition: number
    winchSpeed: number
    twistlockEngaged: boolean
    craneHeight: number
    craneRotation: number
    isMoving: boolean
    heaterActive: boolean
    iceBuildup: number
    joystickLeft: { x: number; y: number }
    joystickRight: { x: number; y: number }
    // Fleet / cinematic
    currentShipId: string | null
    spectatorState: SpectatorState
    tugSpectatorActive: boolean
    lastInstallation: InstallationEvent | null
    // Music (Record, not Map)
    musicPlaying: Record<string, boolean>
    // Time
    gameTime: { hour: number; minute: number } | null
    isNight: boolean
    // Ambient authority
    wildlife: WildlifeEntity[]
    activeSeaEvent: SeaEvent | null
    activeHarborEvents: HarborEvent[]
    // Modes
    walkingPosition: [number, number, number]
    stormIntensity: number
    stormTimeRemaining: number
    isStormActive: boolean
    windDirection: number
    windStrength: number
    rainDensity: number
}
