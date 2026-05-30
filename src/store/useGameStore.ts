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
import type { WaveParams } from '../systems/WaveSystem'
import { isCameraPresetId } from '../types/CameraPreset'
import { ACOUSTIC_NOTE_LAYOUT, AcousticNote } from '../systems/commsSystem'

const DEFAULT_STORE_DASHBOARD_PRESETS: DashboardPresets = {
    crane: 'gantry-top-down',
    hook: 'cable-tip-follow',
    drone: 'drone-chase',
    underwater: 'dock-level'
}

// =============================================================================
// TYPES - HarborGlow Game State
// =============================================================================

export type ShipType = 'cruise' | 'container' | 'tanker' | 'bulk' | 'lng' | 'roro' | 'research' | 'droneship' | 'ferry' | 'trawler' | 'horizon'
export type WeatherState = 'clear' | 'rain' | 'fog' | 'storm'
export type CameraMode = 'orbit' | 'crane-cockpit' | 'crane-shoulder' | 'crane-top' |
                         'ship-low' | 'ship-aerial' | 'ship-water' | 'ship-rig' |
                         'spectator' | 'transition' | 'crane' | 'booth'
export type CabinViewMode = 'multiview' | 'immersive'
export type GameMode = 'sandbox' | 'training'
export type OperationMode = 'crane' | 'tugboat'
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

const TUG_TONS_BY_SHIP: Record<ShipType, number> = {
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
}

function getReputationTierMultiplier(): number {
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

const DEFAULT_HANDSHAKE_SEQUENCE: AcousticNote[] = ['C1', 'G1', 'D#1', 'A#1']

function buildHandshakeSequence(objectiveSeed: string): AcousticNote[] {
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

function createSalvageContracts(now = Date.now()): SalvageContract[] {
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
    // Tugboat mode
    setOperationMode: (mode: OperationMode) => void
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
    pushViewportHistory: unknown; navigateViewportHistory: unknown; pinViewportCamera: unknown;
    recallPinnedViewportCamera: unknown; setFocusedViewport: unknown;
    addWildlife: unknown; removeWildlife: unknown; updateWildlife: unknown; setActiveSeaEvent: unknown;
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
            viewportCameras: {
                crane: { history: [], historyIndex: -1, pinned: [] },
                hook: { history: [], historyIndex: -1, pinned: [] },
                drone: { history: [], historyIndex: -1, pinned: [] },
                underwater: { history: [], historyIndex: -1, pinned: [] }
            },
            focusedViewport: null,
            operationMode: 'crane',
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
            waveParams: { amplitude: 1.0, speed: 1.0, chaos: 0.0 },
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
                operationMode: saved.operationMode ?? 'crane',
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
                activeMission: null,
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
    
    // Tugboat mode actions
    setOperationMode: (mode: OperationMode) => {
        const patch = mode === 'tugboat'
            ? { operationMode: mode, salvageContracts: get().salvageContracts.length > 0 ? get().salvageContracts : createSalvageContracts() }
            : { operationMode: mode }
        set(patch)
        scheduleSave({ ...get(), ...patch })
        console.log(`🚤 Operation mode: ${mode}`)
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
        droneship: 6,   // Space recovery drone ship - landing platform + thruster bays
        ferry: 4,       // Island Hopper ferry - passenger deck + car deck + nav lights
        trawler: 4,     // North Star trawler - wheelhouse + gantry + fish hold + mast
        horizon: 4      // Horizon Deep research vessel - A-frame + helideck + moonpool + sonar
    }
    
    const installed = state.installedUpgrades.filter(u => u.shipId === shipId).length
    const total = upgradeCounts[ship.type]
    return (installed / total) * 100
}

export const selectIsShipFullyUpgraded = (state: GameState, shipId: string): boolean => {
    const progress = selectUpgradeProgress(state, shipId)
    return progress >= 100
}
