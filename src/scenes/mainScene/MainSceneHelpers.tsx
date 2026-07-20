/**
 * Thin compatibility barrel — implementation lives in sibling modules.
 * @see ./index.ts
 */
export type {
    AtSeaShip,
    LevaControlsConfig,
    ShipSchedulingConfig,
    SpectatorCameraConfig,
    DepartingShipsConfig,
} from './index'

export {
    NightDockLights,
    NightVolumetricCones,
    WaterLightVolumes,
    SpectatorNightCinematicEffects,
    ShipWrapper,
    SpectatorOverlay,
    triggerGeopoliticalEvent,
    triggerTariffEvent,
    triggerLaborAction,
    triggerPeakSeason,
    useLevaControls,
    useShipScheduling,
    UnderwaterEffects,
    getSunPosition,
    updateSpectatorCamera,
    animateDepartingShips,
} from './index'
