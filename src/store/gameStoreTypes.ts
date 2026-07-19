
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
  trainingSystem,
  isTugboatTrainingModule,
} from '../systems/trainingSystem'
import { reputationSystem } from '../systems/reputationSystem'
import { economySystem } from '../systems/economySystem'
import type { CameraPresetId, DashboardPresets, DashboardViewportId } from '../types/CameraPreset'
import type { WaveParams } from '../systems/WaveSystem'
import { isCameraPresetId } from '../types/CameraPreset'
import { ACOUSTIC_NOTE_LAYOUT, AcousticNote } from '../systems/commsSystem'

export const DEFAULT_STORE_DASHBOARD_PRESETS: DashboardPresets = {
    crane: 'gantry-top-down',
    hook: 'cable-tip-follow',
    drone: 'drone-chase',
    underwater: 'dock-level'
}

// =============================================================================
// TYPES - HarborGlow Game State
// =============================================================================

export type ShipType = 'cruise' | 'container' | 'tanker' | 'bulk' | 'lng' | 'roro' | 'research' | 'droneship' | 'ferry' | 'trawler' | 'horizon' | 'fireboat'
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

export { WaveParams }

export interface Mission {
    id: string
    type: 'storm_rescue' | 'salvage'
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

export interface SalvageContract {
    id: string
    vesselLabel: string
    vesselType: ShipType
    factionLabel: string
    distanceNm: number
    seaState: 'moderate' | 'rough' | 'severe'
    rewardEstimate: number
    techniqueNote: string
    distressPosition: [number, number, number]
    berthCenter: [number, number, number]
    berthRadius: number
    briefing: string
    acceptedFee: number
    expiresAt: number
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

export const DEFAULT_HANDSHAKE_SEQUENCE: AcousticNote[] = ['C1', 'G1', 'D#1', 'A#1']

export function buildHandshakeSequence(objectiveSeed: string): AcousticNote[] {
    if (!objectiveSeed) return DEFAULT_HANDSHAKE_SEQUENCE

    let hash = 0
    for (let i = 0; i < objectiveSeed.length; i++) {
        hash = (hash + objectiveSeed.charCodeAt(i) * (i + 1)) % 100000
    }

    return [0, 3, 7, 10].map(offset =>
        ACOUSTIC_NOTE_LAYOUT[(hash + offset) % ACOUSTIC_NOTE_LAYOUT.length]
    )
}

const LEGACY_VESSEL_POOL: Array<{
    vesselType: ShipType
    vesselLabel: string
    factionLabel: string
    techniqueNote: string
    baseReward: number
}> = [
    {
        vesselType: 'trawler',
        vesselLabel: 'Rustline Trawler 12',
        factionLabel: 'Legacy Co-op Trawler Guild',
        techniqueNote: 'Keep tow line soft — avoid hard rudder corrections in swell.',
        baseReward: 950,
    },
    {
        vesselType: 'ferry',
        vesselLabel: 'Old Harbor Ferry Cormorant',
        factionLabel: 'Independent Ferry Collective',
        techniqueNote: 'Maintain slow stern pull while crossing the breakwater wake.',
        baseReward: 1100,
    },
    {
        vesselType: 'horizon',
        vesselLabel: 'Horizon Utility Barge Atlas',
        factionLabel: 'Legacy Horizon Works',
        techniqueNote: 'Use differential thrust to counter crosscurrent shear.',
        baseReward: 1400,
    },
]

function computeSalvageRewardEstimate(baseReward: number, distanceNm: number, seaState: SalvageContract['seaState']): number {
    const seaMultiplier = seaState === 'severe' ? 1.35 : seaState === 'rough' ? 1.18 : 1.0
    return Math.round(baseReward * seaMultiplier + distanceNm * 110)
}

export function createSalvageContracts(now = Date.now()): SalvageContract[] {
    return [0, 1, 2].map((slot) => {
        const vessel = LEGACY_VESSEL_POOL[(slot + Math.floor(now / 1000)) % LEGACY_VESSEL_POOL.length]
        const distanceNm = 1.4 + slot * 0.9
        const seaState: SalvageContract['seaState'] = slot === 2 ? 'severe' : slot === 1 ? 'rough' : 'moderate'
        const distressPosition: [number, number, number] = [
            -55 + slot * 18,
            0,
            -95 - slot * 22,
        ]
        const berthCenter: [number, number, number] = slot === 0
            ? [-15, 0, -20]
            : slot === 1
                ? [0, 0, -25]
                : [15, 0, -20]
        return {
            id: `salvage-${now}-${slot}`,
            vesselType: vessel.vesselType,
            vesselLabel: vessel.vesselLabel,
            factionLabel: vessel.factionLabel,
            distanceNm,
            seaState,
            rewardEstimate: computeSalvageRewardEstimate(vessel.baseReward, distanceNm, seaState),
            techniqueNote: vessel.techniqueNote,
            distressPosition,
            berthCenter,
            berthRadius: 8,
            briefing: `${vessel.vesselLabel} reported dead in the water beyond the breakwater. Recover for ${vessel.factionLabel}.`,
            acceptedFee: 120 + slot * 30,
            expiresAt: now + (8 + slot * 2) * 60_000,
        }
    })
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
    viewportCameras: Record<DashboardViewportId, ViewportCameraState>
    focusedViewport: DashboardViewportId | null
    // Wildlife and sea events
    wildlife: WildlifeEntity[]
    activeSeaEvent: SeaEvent | null
    // Ambient marine life layer
    season: Season
    wildlifeDensity: number
    enableMarineLife: boolean

    // Harbor research-based events
    activeHarborEvents: HarborEvent[]
    eventEnabledSettings: Record<HarborEventType, boolean>
    // Full crane mechanics
    spreaderPos: { x: number; y: number; z: number }
    spreaderRotation: number
    cableDepth: number
    loadTension: number
    trolleyPosition: number
    winchSpeed: number
    joystickLeft: { x: number; y: number }
    joystickRight: { x: number; y: number }
    isMoving: boolean
    heaterActive: boolean
    iceBuildup: number
    // Economy
    money: number
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
    // Upgrade menu highlighting and auto-pilot
    highlightedUpgradePart: string | null
    pendingAutoInstall: { shipId: string; partName: string } | null
    installQueue: Array<{ shipId: string; partName: string }>
    installQueueIndex: number
    isQueueRunning: boolean
    isQueuePaused: boolean
    queuePausedAt: number | null
    queuePausedShipId: string | null
    // Training system
    trainingProgress: TrainingProgress
    gameMode: GameMode
    currentTrainingModule: TrainingModuleId | null
    setGameMode: (mode: GameMode) => void
    startTrainingModule: (moduleId: TrainingModuleId) => void
    exitTrainingModule: () => void
    updateTrainingProgress: (progress: TrainingProgress) => void
    // Tugboat mode
    operationMode: OperationMode
    tugboatState: TugboatState
    tugboatObjectives: TugboatObjective[]
    tugboatDockedCount: number
    tugboatWinTriggered: boolean
    tugboatFirstTimeViewed: boolean
    salvageContracts: SalvageContract[]
    salvageSuccessfulTows: number
    tugboatCareerStats: TugboatCareerStats
    tugboatUpgrades: TugboatUpgradeState
    handshakeTargetSequence: AcousticNote[]
    handshakeInputSequence: AcousticNote[]
    handshakeComplete: boolean
    towingUnlocked: boolean
    towLineAttached: boolean
    activeTowedShipId: string | null
    /** Briefly true (auto-resets after ~1 s) when the tow cable snaps. */
    towLineSnapped: boolean
    stormIntensity: number
    stormTimeRemaining: number
    isStormActive: boolean
    windDirection: number
    windStrength: number
    rainDensity: number
    waveParams: WaveParams
    /** True while the tug spectator drone cinematic camera is active */
    tugSpectatorActive: boolean
    setOperationMode: (mode: OperationMode) => void
    updateTugboatState: (patch: Partial<TugboatState>) => void
    setTugboatObjectives: (objectives: TugboatObjective[]) => void
    refreshSalvageContracts: () => void
    acceptSalvageContract: (contractId: string) => void
    submitAcousticNote: (note: AcousticNote) => void
    resetAcousticHandshake: () => void
    completeTugboatObjective: (id: string) => void
    purchaseTugboatUpgrade: (id: TugboatUpgradeId) => boolean
    resetTugboatMode: () => void
    setStormIntensity: (intensity: number) => void
    setStormTimeRemaining: (time: number) => void
    setStormActive: (active: boolean) => void
    setWindDirection: (direction: number) => void
    setWindStrength: (strength: number) => void
    setRainDensity: (density: number) => void
    triggerTugboatWin: () => void
    setWaveParams: (patch: Partial<WaveParams>) => void
    attachTowLine: (shipId: string) => void
    detachTowLine: () => void
    setTugSpectatorActive: (active: boolean) => void
    // Economy
    addMoney: (amount: number) => void
    deductMoney: (amount: number) => void
    // Mission system
    activeMission: Mission | null
    setActiveMission: (mission: Mission | null) => void
    updateMission: (patch: Partial<Mission>) => void
    completeMission: (bonus?: number) => void
    failMission: (penalty?: number) => void
    // Crane-mode starter objective
    craneContract: CraneContract | null
    setCraneContract: (contract: CraneContract | null) => void
    completeCraneContract: () => void
}

export interface GameState extends SerializableState {
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
    walkingPosition: [number, number, number]
    walkingVelocity: [number, number, number]
    walkingSpawnPoint: [number, number, number]
    walkingReturnCameraMode: CameraMode
    walkingReturnCabinViewMode: CabinViewMode

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
    // Viewport-local camera history stack (Alt A)
    pushViewportHistory: (viewportId: DashboardViewportId, transform: CameraTransform) => void
    navigateViewportHistory: (viewportId: DashboardViewportId, direction: -1 | 1) => void
    pinViewportCamera: (viewportId: DashboardViewportId, transform: CameraTransform) => void
    recallPinnedViewportCamera: (viewportId: DashboardViewportId, pinIndex: number) => void
    setFocusedViewport: (viewportId: DashboardViewportId | null) => void
    // Crane control actions
    setSpreaderPos: (pos: { x: number; y: number; z: number }) => void
    setSpreaderRotation: (rotation: number) => void
    setCableDepth: (depth: number) => void
    setLoadTension: (tension: number) => void
    setTrolleyPosition: (position: number) => void
    setWinchSpeed: (speed: number) => void
    setHighlightedUpgradePart: (partName: string | null) => void
    setPendingAutoInstall: (pending: { shipId: string; partName: string } | null) => void
    setInstallQueue: (queue: Array<{ shipId: string; partName: string }>) => void
    advanceInstallQueue: () => void
    abortInstallQueue: () => void
    pauseInstallQueue: (shipId: string) => void
    resumeInstallQueue: () => void
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
    // Ambient marine life layer setters
    setSeason: (season: Season) => void
    setWildlifeDensity: (density: number) => void
    setEnableMarineLife: (enabled: boolean) => void

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
    // Tugboat mode
    setOperationMode: (mode: OperationMode) => void
    beginWalkingFromCab: () => void
    returnToCraneFromWalking: () => void
    updateWalkingState: (position: [number, number, number], velocity: [number, number, number]) => void
    updateTugboatState: (patch: Partial<TugboatState>) => void
    setTugboatObjectives: (objectives: TugboatObjective[]) => void
    markTugboatFirstTimeViewed: () => void
    refreshSalvageContracts: () => void
    acceptSalvageContract: (contractId: string) => void
    submitAcousticNote: (note: AcousticNote) => void
    resetAcousticHandshake: () => void
    completeTugboatObjective: (id: string) => void
    resetTugboatMode: () => void
    setStormIntensity: (intensity: number) => void
    setStormTimeRemaining: (time: number) => void
    triggerTugboatWin: () => void
    attachTowLine: (shipId: string) => void
    detachTowLine: () => void
    /** Signal a cable snap — sets towLineSnapped true, auto-clears after 1.2 s */
    signalTowLineSnap: () => void
}
export const defaultState: Omit<GameState, keyof {
    addShip: unknown; removeShip: unknown; setCurrentShip: unknown;
    installUpgrade: unknown; uninstallUpgrade: unknown; setMusicPlaying: unknown;
    stopAllMusic: unknown; setBPM: unknown; setLyricsSize: unknown;
    setLightIntensity: unknown; setSpectatorTarget: unknown; endSpectatorMode: unknown;
    setTimeOfDay: unknown; setCameraMode: unknown; resetGame: unknown; loadSavedState: unknown;
    scheduleDeparture: unknown; returnToDock: unknown; upgradeShipVersion: unknown; setWeather: unknown; setQualityPreset: unknown;
    setSpreaderPos: unknown; setSpreaderRotation: unknown; setCableDepth: unknown; setLoadTension: unknown;
    setTrolleyPosition: unknown; setWinchSpeed: unknown; setHighlightedUpgradePart: unknown; setPendingAutoInstall: unknown; setJoystickLeft: unknown; setJoystickRight: unknown;
    setInstallQueue: unknown; advanceInstallQueue: unknown; abortInstallQueue: unknown; pauseInstallQueue: unknown; resumeInstallQueue: unknown;
    setTwistlockEngaged: unknown; setHeaterActive: unknown; setIsMoving: unknown;
    setMultiviewMode: unknown; setUnderwaterIntensity: unknown; setDashboardPreset: unknown;
    setSeason: unknown; setWildlifeDensity: unknown; setEnableMarineLife: unknown;
    pushViewportHistory: unknown; navigateViewportHistory: unknown; pinViewportCamera: unknown;
    recallPinnedViewportCamera: unknown; setFocusedViewport: unknown;
    addWildlife: unknown; removeWildlife: unknown; updateWildlife: unknown; setActiveSeaEvent: unknown;
    beginWalkingFromCab: unknown; returnToCraneFromWalking: unknown; updateWalkingState: unknown;
    addHarborEvent: unknown; removeHarborEvent: unknown; setEventEnabled: unknown;
    setCurrentHarbor: unknown; setCabinViewMode: unknown; setGameTime: unknown;
    setAttachmentSystemConfig: unknown; clearLastInstallation: unknown;
    setGameMode: unknown; startTrainingModule: unknown; exitTrainingModule: unknown;
    updateTrainingProgress: unknown; addReputation: unknown;
    setOperationMode: unknown; updateTugboatState: unknown; setTugboatObjectives: unknown; markTugboatFirstTimeViewed: unknown;
    refreshSalvageContracts: unknown; acceptSalvageContract: unknown;
    submitAcousticNote: unknown; resetAcousticHandshake: unknown;
    completeTugboatObjective: unknown; purchaseTugboatUpgrade: unknown; resetTugboatMode: unknown; setStormIntensity: unknown;
    setStormTimeRemaining: unknown; triggerTugboatWin: unknown; setWaveParams: unknown;
    setStormActive: unknown; setWindDirection: unknown; setWindStrength: unknown;
    setRainDensity: unknown;
    addMoney: unknown; deductMoney: unknown;
    setActiveMission: unknown; updateMission: unknown;
    completeMission: unknown; failMission: unknown;
    setCraneContract: unknown; completeCraneContract: unknown;
    attachTowLine: unknown; detachTowLine: unknown; signalTowLineSnap: unknown;
    setTugSpectatorActive: unknown;
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
    winchSpeed: 1.0,
    highlightedUpgradePart: null,
    pendingAutoInstall: null,
    installQueue: [],
    installQueueIndex: 0,
    isQueueRunning: false,
    isQueuePaused: false,
    queuePausedAt: null,
    queuePausedShipId: null,
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
    viewportCameras: {
        crane: { history: [], historyIndex: -1, pinned: [] },
        hook: { history: [], historyIndex: -1, pinned: [] },
        drone: { history: [], historyIndex: -1, pinned: [] },
        underwater: { history: [], historyIndex: -1, pinned: [] }
    },
    focusedViewport: null,
    wildlife: [],
    activeSeaEvent: null,
    season: 'summer' as Season,
    wildlifeDensity: 0.6,
    enableMarineLife: true,
    walkingPosition: [2, 0.2, 7],
    walkingVelocity: [0, 0, 0],
    walkingSpawnPoint: [2, 0.2, 7],
    walkingReturnCameraMode: 'crane-cockpit' as CameraMode,
    walkingReturnCabinViewMode: 'multiview' as CabinViewMode,
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
    // Tugboat mode
    operationMode: 'crane' as OperationMode,
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
    tugboatFirstTimeViewed: false,
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
    towLineAttached: false,
    activeTowedShipId: null,
    towLineSnapped: false,
    stormIntensity: 0,
    stormTimeRemaining: 0,
    isStormActive: false,
    windDirection: 0,
    windStrength: 0,
    rainDensity: 0.5,
    money: 0,
    activeMission: null,
    craneContract: null,
    waveParams: { amplitude: 1.0, speed: 1.0, chaos: 0.0 },
    tugSpectatorActive: false,
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
    operationMode: state.operationMode,
    tugboatState: state.tugboatState,
    tugboatDockedCount: state.tugboatDockedCount,
    tugboatWinTriggered: state.tugboatWinTriggered,
    tugboatFirstTimeViewed: state.tugboatFirstTimeViewed,
    salvageContracts: state.salvageContracts,
    salvageSuccessfulTows: state.salvageSuccessfulTows,
    tugboatCareerStats: state.tugboatCareerStats,
    tugboatUpgrades: state.tugboatUpgrades,
    waveParams: state.waveParams,
    money: state.money,
    economyData: economySystem.serialize(),
    season: state.season,
    wildlifeDensity: state.wildlifeDensity,
    enableMarineLife: state.enableMarineLife,
})

export const scheduleSave = (state: GameState) => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
        saveGameState(getSerializableState(state))
    }, 500)
}
