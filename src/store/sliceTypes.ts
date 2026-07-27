import type { StateCreator } from 'zustand';
import type { GameState, GameStateActionKey } from './gameStoreTypes';

// =============================================================================
// SLICE TYPE SURFACES
// One Pick<GameState, ...> per domain slice. Every GameState action belongs to
// exactly one slice; the compile-time exhaustiveness check at the bottom fails
// the build if a new action is added to GameState without an owner.
// =============================================================================

/** Fleet lifecycle, upgrades, sail schedule, per-ship music/lyrics */
export type ShipsSlice = Pick<
    GameState,
    | 'addShip'
    | 'removeShip'
    | 'setCurrentShip'
    | 'installUpgrade'
    | 'uninstallUpgrade'
    | 'setMusicPlaying'
    | 'stopAllMusic'
    | 'setBPM'
    | 'setLyricsSize'
    | 'setLightIntensity'
    | 'scheduleDeparture'
    | 'returnToDock'
    | 'upgradeShipVersion'
    | 'clearLastInstallation'
>;

/** Crane kinematics, twistlock, joysticks, contracts, install queue */
export type CraneSlice = Pick<
    GameState,
    | 'setCraneContract'
    | 'completeCraneContract'
    | 'setSpreaderPos'
    | 'setSpreaderRotation'
    | 'setCableDepth'
    | 'setLoadTension'
    | 'setTrolleyPosition'
    | 'setWinchSpeed'
    | 'setHighlightedUpgradePart'
    | 'setPendingAutoInstall'
    | 'setInstallQueue'
    | 'advanceInstallQueue'
    | 'abortInstallQueue'
    | 'pauseInstallQueue'
    | 'resumeInstallQueue'
    | 'setJoystickLeft'
    | 'setJoystickRight'
    | 'setTwistlockEngaged'
    | 'setHeaterActive'
    | 'setIsMoving'
    | 'setAttachmentSystemConfig'
>;

/** Camera modes, spectator, multiview viewports, dashboard presets */
export type CameraSlice = Pick<
    GameState,
    | 'setSpectatorTarget'
    | 'endSpectatorMode'
    | 'setCameraMode'
    | 'setMultiviewMode'
    | 'setUnderwaterIntensity'
    | 'setDashboardPreset'
    | 'pushViewportHistory'
    | 'navigateViewportHistory'
    | 'pinViewportCamera'
    | 'recallPinnedViewportCamera'
    | 'setFocusedViewport'
    | 'setCabinViewMode'
    | 'setTugSpectatorActive'
>;

/** Time, season, weather, storm, waves, wildlife, harbor events */
export type EnvironmentSlice = Pick<
    GameState,
    | 'setTimeOfDay'
    | 'setSeason'
    | 'setWildlifeDensity'
    | 'setEnableMarineLife'
    | 'setWeather'
    | 'setQualityPreset'
    | 'addWildlife'
    | 'removeWildlife'
    | 'updateWildlife'
    | 'setActiveSeaEvent'
    | 'addHarborEvent'
    | 'removeHarborEvent'
    | 'setEventEnabled'
    | 'setCurrentHarbor'
    | 'setGameTime'
    | 'setStormIntensity'
    | 'setStormTimeRemaining'
    | 'setStormActive'
    | 'setWindDirection'
    | 'setWindStrength'
    | 'setRainDensity'
    | 'setWaveParams'
>;

/** Money, reputation, salvage contracts, tugboat upgrade purchases */
export type EconomySlice = Pick<
    GameState,
    | 'addReputation'
    | 'refreshSalvageContracts'
    | 'acceptSalvageContract'
    | 'purchaseTugboatUpgrade'
    | 'addMoney'
    | 'deductMoney'
>;

/** Operation mode, missions, training, tugboat ops, comms */
export type OpsSlice = Pick<
    GameState,
    | 'setGameMode'
    | 'startTrainingModule'
    | 'exitTrainingModule'
    | 'updateTrainingProgress'
    | 'setOperationMode'
    | 'beginWalkingFromCab'
    | 'returnToCraneFromWalking'
    | 'updateWalkingState'
    | 'updateTugboatState'
    | 'setTugboatObjectives'
    | 'markTugboatFirstTimeViewed'
    | 'submitAcousticNote'
    | 'resetAcousticHandshake'
    | 'completeTugboatObjective'
    | 'resetTugboatMode'
    | 'attachTowLine'
    | 'detachTowLine'
    | 'signalTowLineSnap'
    | 'setActiveMission'
    | 'updateMission'
    | 'completeMission'
    | 'failMission'
    | 'triggerTugboatWin'
>;

/** New game reset and save restore */
export type SessionSlice = Pick<
    GameState,
    | 'resetGame'
    | 'loadSavedState'
>;

/** Every action key owned by some slice. */
export type OwnedActionKey =
    | keyof ShipsSlice
    | keyof CraneSlice
    | keyof CameraSlice
    | keyof EnvironmentSlice
    | keyof EconomySlice
    | keyof OpsSlice
    | keyof SessionSlice;

/**
 * Compile-time guard: any action on GameState that no slice claims shows up
 * here as a type error naming the orphan key.
 */
type UnownedActions = Exclude<GameStateActionKey, OwnedActionKey>;
const _actionsAllOwned: UnownedActions extends never ? true : UnownedActions = true;
void _actionsAllOwned;

/** Convenience alias for slice factory functions */
export type GameStoreSlice<T> = StateCreator<GameState, [], [], T>;
