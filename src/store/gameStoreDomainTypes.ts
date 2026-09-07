// =============================================================================
// GAME STORE - Core Domain Types
// Ships, weather/camera enums, wildlife/sea events, tugboat, missions, upgrades.
// Split out of gameStoreTypes.ts; re-exported there for backward compatibility.
// =============================================================================

import { reputationSystem } from '../systems/reputationSystem'

export const SHIP_TYPES = [
    'cruise',
    'container',
    'tanker',
    'bulk',
    'lng',
    'roro',
    'research',
    'droneship',
    'ferry',
    'trawler',
    'horizon',
    'fireboat',
    'icebreaker',
] as const

export type ShipType = (typeof SHIP_TYPES)[number]

/** Legacy blueprint / save aliases that still resolve to a live ShipType. */
const SHIP_TYPE_ALIASES: Record<string, ShipType> = {
    'icebreaker-yamal': 'icebreaker',
}

export function isShipType(value: unknown): value is ShipType {
    return typeof value === 'string' && (SHIP_TYPES as readonly string[]).includes(value)
}

/** Maps saved/blueprint ids onto a live ShipType. Unknown values become cruise. */
export function normalizeSavedShipType(raw: unknown): ShipType {
    if (typeof raw !== 'string') return 'cruise'
    if (isShipType(raw)) return raw
    return SHIP_TYPE_ALIASES[raw] ?? 'cruise'
}
export type WeatherState = 'clear' | 'rain' | 'fog' | 'storm'
export type CameraMode = 'orbit' | 'crane-cockpit' | 'crane-shoulder' | 'crane-top' |
                         'ship-low' | 'ship-aerial' | 'ship-water' | 'ship-rig' |
                         'spectator' | 'transition' | 'crane' | 'booth' | 'onFoot'
export type CabinViewMode = 'multiview' | 'immersive'
export type GameMode = 'sandbox' | 'training'
export type OperationMode = 'crane' | 'tugboat' | 'walking'
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
export type Season = 'spring' | 'summer' | 'fall' | 'winter'
export type QualityPreset = 'low' | 'medium' | 'high'
export type MultiviewMode = 'single' | 'quad'
export type HarborType = 'norway' | 'singapore' | 'dubai' | 'rotterdam' | 'yokohama' | 'longbeach' | 'santos'

// -------------------------------------------------------------------------
// NEW: CameraTransform — distinct from CameraMode, used for viewport-local
// history stack in the multiview dashboard (Alt A architecture)
// -------------------------------------------------------------------------
export interface CameraTransform {
    position: [number, number, number]
    target: [number, number, number]
    label?: string
}

export interface ViewportCameraState {
    history: CameraTransform[]
    historyIndex: number
    pinned: CameraTransform[]
}

export const DEFAULT_VIEWPORT_CAMERA_STATE: ViewportCameraState = {
    history: [],
    historyIndex: -1,
    pinned: []
}

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

export interface TugboatState {
    position: [number, number, number]
    velocity: [number, number, number]
    throttle: number        // -1..1
    steering: number        // -1..1
    heading: number         // radians
    portEngineRpm: number      // -100..100
    starboardEngineRpm: number // -100..100
    // Cavitation (Direction A) — set by CavitationSystem
    portCavitating?: boolean
    starboardCavitating?: boolean
    cavitationIntensity?: number   // 0..1
    // Environmental telemetry (Direction B) — set by TugboatTargetShip
    windShear?: number             // 0..1 normalised shear magnitude
    currentDrift?: [number, number] // net lateral current vector [x, z]
}

export interface TugboatObjective {
    id: string
    label: string
    berthCenter: [number, number, number]
    berthRadius: number
    completed: boolean
    shipType: ShipType
}

export interface Mission {
    id: string
    type: 'storm_rescue' | 'salvage' | 'ice-escort'
    targetShipType: ShipType
    targetShipId: string
    timeLimit: number
    timeRemaining: number
    damage: number
    maxDamage: number
    reward: number
    status: 'active' | 'completed' | 'failed'
    berthCenter: [number, number, number]
    berthRadius: number
    distressPosition?: [number, number, number]
    factionLabel?: string
    vesselLabel?: string
    briefing?: string
    acceptedFee?: number
    reputationReward?: number
    failurePenalty?: number
    iceSeed?: number
    iceConcentration?: number
    clientShipId?: string
    channelClearance?: number
}

export interface MissionObjective {
    id: string
    label: string
    completed: boolean
    progress: number
}

export interface TugboatCareerStats {
    totalTonsAssisted: number
    cleanTows: number
    nightRescues: number
    iceEscorts: number
}

/**
 * A crane-mode objective: install every light rig on a docked ship to
 * complete the contract. Gives the opening control-booth scene an explicit
 * goal + progress + reward instead of an empty harbor.
 */
export interface CraneContract {
    id: string
    shipId: string
    shipType: ShipType
    shipName: string
    /** Total rigs that must be installed to finish (= ship's full upgrade count). */
    targetRigs: number
    /** Credit bonus awarded once on completion. */
    reward: number
    status: 'active' | 'completed'
}

export type TugboatUpgradeId =
    | 'heavy_tow_winch'
    | 'cavitation_suppression_jets'
    | 'searchlight_rig'
    | 'dynamic_positioning_assist'
export type TugboatUpgradeState = Record<TugboatUpgradeId, boolean>

export const TUG_TONS_BY_SHIP: Record<ShipType, number> = {
    cruise: 160,
    container: 125,
    tanker: 145,
    bulk: 135,
    lng: 140,
    roro: 95,
    research: 80,
    droneship: 70,
    ferry: 65,
    trawler: 45,
    horizon: 90,
    fireboat: 30,
    icebreaker: 155,
}

export function getReputationTierMultiplier(): number {
    switch (reputationSystem.getTier()) {
        case 'novice': return 1
        case 'apprentice': return 1.03
        case 'operator': return 1.06
        case 'veteran': return 1.1
        case 'expert': return 1.14
        case 'master': return 1.18
        default: return 1.22
    }
}

/**
 * Measured quality of one crane installation, supplied by the gameplay caller
 * that actually observed it. Omitted fields mean "not measured" — reputation
 * awards base completion only rather than inventing a number.
 */
export interface InstallMetrics {
    /** Seconds from twistlock engage (load picked) to install. */
    timeSeconds?: number
    /** Load sway magnitude at the moment of install, 0-1. */
    swayPercent?: number
    /** Damage caused during the install, if the caller tracks it. */
    damage?: number
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
