
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

// =============================================================================
// TYPES - HarborGlow Game State
//
// Domain types (ships, weather/camera enums, wildlife, tugboat, missions),
// salvage/handshake generation, and multiplayer sync types have moved to
// sibling files (gameStoreDomainTypes.ts, gameStoreSalvage.ts,
// gameStoreMultiplayer.ts) and are re-exported below so this stays the one
// canonical import path for the store's types.
// =============================================================================

export * from './gameStoreDomainTypes'
export * from './gameStoreSalvage'
export * from './gameStoreMultiplayer'

import {
  ShipType,
  CameraMode,
  CabinViewMode,
  GameMode,
  OperationMode,
  HarborEventType,
  Season,
  QualityPreset,
  MultiviewMode,
  HarborType,
  CameraTransform,
  Ship,
  WildlifeEntity,
  SeaEvent,
  HarborEvent,
  TugboatState,
  TugboatObjective,
  Mission,
  TugboatCareerStats,
  CraneContract,
  TugboatUpgradeId,
  TugboatUpgradeState,
  InstallMetrics,
  Upgrade,
  SpectatorState,
  ViewportCameraState,
  WeatherState,
} from './gameStoreDomainTypes'
import { SalvageContract, DEFAULT_HANDSHAKE_SEQUENCE, createSalvageContracts } from './gameStoreSalvage'
import {
  MultiplayerRole,
  MultiplayerConnectionStatus,
  ChatMessage,
  NetworkSyncState,
} from './gameStoreMultiplayer'

export { WaveParams }

export const DEFAULT_STORE_DASHBOARD_PRESETS: DashboardPresets = {
    crane: 'gantry-top-down',
    hook: 'cable-tip-follow',
    drone: 'drone-chase',
    underwater: 'dock-level'
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
    /** Ephemeral: Date.now() when the twistlock last engaged, for install timing. Not persisted. */
    installAttemptStartedAt: number | null
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
    // Economy — Harbor Credits (HC) is the single player wallet.
    // Every earn/spend path (installs, ship completion, crane contracts, tug
    // objectives, salvage fees, missions, shop purchases) mutates this field.
    harborCredits: number
    /** Dock upgrades / specialists bought through purchaseShopItem. */
    unlockedShopItems: string[]
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
    /** Credit the wallet. `source` is for logging/telemetry only. */
    addHarborCredits: (amount: number, source?: string) => void
    /** Debit the wallet. Returns false and changes nothing when funds are short. */
    spendHarborCredits: (amount: number, reason?: string) => boolean
    /** Buy a dock upgrade or specialist from SHOP_CATALOG. Checks credits + reputation. */
    purchaseShopItem: (itemId: string) => boolean
    /** @deprecated Use addHarborCredits. Kept for one release. */
    addMoney: (amount: number) => void
    /** @deprecated Use spendHarborCredits; this one clamps at zero instead of refusing. */
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
    installUpgrade: (shipId: string, partName: string, metrics?: InstallMetrics) => void
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
    // Multiplayer
    multiplayerRole: MultiplayerRole
    multiplayerEnabled: boolean
    connectionStatus: MultiplayerConnectionStatus
    roomId: string | null
    spectatorCount: number
    networkLatencyMs: number
    isApplyingNetworkPatch: boolean
    chatMessages: ChatMessage[]
    setMultiplayerRole: (role: MultiplayerRole) => void
    setMultiplayerEnabled: (enabled: boolean) => void
    setConnectionStatus: (status: MultiplayerConnectionStatus) => void
    setRoomId: (roomId: string | null) => void
    setSpectatorCount: (count: number) => void
    setNetworkLatency: (ms: number) => void
    applyNetworkPatch: (patch: Partial<NetworkSyncState>) => void
    addChatMessage: (message: ChatMessage) => void
}
/**
 * Keys of GameState whose values are actions. Derived, not hand-listed: the old
 * `Omit<GameState, keyof { addShip: unknown; ... }>` had to be edited by hand
 * every time an action was added, and silently drifted when it wasn't.
 */
export type GameStateActionKey = {
    [K in keyof GameState]-?: GameState[K] extends (...args: never[]) => unknown ? K : never
}[keyof GameState];

/** Initial value for every non-action field on GameState. */
export const defaultState: Omit<GameState, GameStateActionKey> = {
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
    installAttemptStartedAt: null,
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
    boothTier: 1,
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
        iceEscorts: 0,
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
    harborCredits: 0,
    unlockedShopItems: [],
    activeMission: null,
    craneContract: null,
    waveParams: { amplitude: 1.0, speed: 1.0, chaos: 0.0 },
    tugSpectatorActive: false,
    // Multiplayer
    multiplayerRole: 'offline' as MultiplayerRole,
    multiplayerEnabled: false,
    connectionStatus: 'idle' as MultiplayerConnectionStatus,
    roomId: null,
    spectatorCount: 0,
    networkLatencyMs: 0,
    isApplyingNetworkPatch: false,
    chatMessages: [],
}

// =============================================================================
// STORE - Zustand Game State with storage_manager
// =============================================================================

let saveTimeout: ReturnType<typeof setTimeout> | null = null

/**
 * The persisted projection of the store — the authoritative answer to "what is
 * saved?". Everything omitted here is ephemeral by design: crane kinematics
 * (spreader pose, cable depth, tension, joysticks, twistlock, install timing),
 * camera/viewport transforms, live wildlife and sea events, and any in-flight
 * mission or install queue. Those are recomputed each frame or each session, and
 * restoring them would resume a half-finished pick on load.
 *
 * Exported so tests can assert the shape without reaching through the debounce.
 */
/**
 * Full network sync projection — extends the persistence shape with ephemeral
 * crane kinematics, musicPlaying, wildlife, and other per-frame fields needed
 * for spectators to mirror the host harbor.
 */
export const getNetworkSyncState = (state: GameState): NetworkSyncState => {
    const musicPlaying: Record<string, boolean> = {}
    state.musicPlaying.forEach((playing, shipId) => {
        musicPlaying[shipId] = playing
    })
    return {
        ships: state.ships,
        craneUpgrades: state.installedUpgrades,
        musicEnabled: state.musicEnabled,
        currentSong: state.currentSong,
        bpm: state.bpm,
        lyricsSize: state.lyricsSize,
        lightIntensity: state.lightIntensity,
        timeOfDay: state.timeOfDay,
        shipVersions: state.shipVersions,
        shipSailTimes: state.shipSailTimes,
        shipDockedStatus: state.shipDockedStatus,
        weather: state.weather,
        weatherIntensity: state.weatherIntensity,
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
        harborCredits: state.harborCredits,
        unlockedShopItems: state.unlockedShopItems,
        economyData: economySystem.serialize(),
        season: state.season,
        wildlifeDensity: state.wildlifeDensity,
        enableMarineLife: state.enableMarineLife,
        spreaderPos: state.spreaderPos,
        spreaderRotation: state.spreaderRotation,
        cableDepth: state.cableDepth,
        loadTension: state.loadTension,
        trolleyPosition: state.trolleyPosition,
        winchSpeed: state.winchSpeed,
        twistlockEngaged: state.twistlockEngaged,
        craneHeight: state.craneHeight,
        craneRotation: state.craneRotation,
        isMoving: state.isMoving,
        heaterActive: state.heaterActive,
        iceBuildup: state.iceBuildup,
        joystickLeft: state.joystickLeft,
        joystickRight: state.joystickRight,
        currentShipId: state.currentShipId,
        spectatorState: state.spectatorState,
        tugSpectatorActive: state.tugSpectatorActive,
        lastInstallation: state.lastInstallation,
        musicPlaying,
        gameTime: state.gameTime,
        isNight: state.isNight,
        wildlife: state.wildlife,
        activeSeaEvent: state.activeSeaEvent,
        activeHarborEvents: state.activeHarborEvents,
        walkingPosition: state.walkingPosition,
        stormIntensity: state.stormIntensity,
        stormTimeRemaining: state.stormTimeRemaining,
        isStormActive: state.isStormActive,
        windDirection: state.windDirection,
        windStrength: state.windStrength,
        rainDensity: state.rainDensity,
    }
}

export const getSerializableState = (state: GameState): StorageGameState => ({
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
    boothTier: state.boothTier,
    waveParams: state.waveParams,
    harborCredits: state.harborCredits,
    unlockedShopItems: state.unlockedShopItems,
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
