import { create } from 'zustand';
import { GameState, defaultState, scheduleSave } from './gameStoreTypes';
import {
    createShipsSlice,
    createCraneSlice,
    createCameraSlice,
    createEnvironmentSlice,
    createEconomySlice,
    createOpsSlice,
    createSessionSlice,
} from './slices';
export * from './gameStoreTypes';
import { Ship, Upgrade, ShipType } from './gameStoreTypes';

/**
 * Composition order (state first, then actions by domain).
 *
 * `defaultState` supplies every state field; each slice contributes only its
 * own actions, and no action name is owned by two slices — `sliceTypes.ts`
 * enforces that at compile time. Order is therefore not behaviourally
 * significant, but is kept stable for readable diffs.
 */
export const useGameStore = create<GameState>((set, get, api) => ({
    ...defaultState,
    ...createShipsSlice(set, get, api),
    ...createCraneSlice(set, get, api),
    ...createCameraSlice(set, get, api),
    ...createEnvironmentSlice(set, get, api),
    ...createEconomySlice(set, get, api),
    ...createOpsSlice(set, get, api),
    ...createSessionSlice(set, get, api),
}))

// -----------------------------------------------------------------------------
// PERSISTENCE — single write path
//
// This subscription is the ONLY caller of scheduleSave. Actions just `set(...)`;
// the debounced save picks up whatever the resulting state is. Do not add
// scheduleSave calls inside slices — that path was redundant (the subscription
// fires for every set) and made "what gets persisted" impossible to audit.
// The serialized field list lives in `getSerializableState` (gameStoreTypes.ts).
// -----------------------------------------------------------------------------
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

// Total number of light rigs required to fully upgrade each ship type.
export const UPGRADE_TARGETS: Record<ShipType, number> = {
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
    horizon: 4,     // Horizon Deep research vessel - A-frame + helideck + moonpool + sonar
    fireboat: 6     // Harbor fireboat - dual monitors + siren mast + hull wash + foam deck
}

export const selectUpgradeProgress = (state: GameState, shipId: string): number => {
    const ship = state.ships.find(s => s.id === shipId)
    if (!ship) return 0

    const installed = state.installedUpgrades.filter(u => u.shipId === shipId).length
    const total = UPGRADE_TARGETS[ship.type]
    return (installed / total) * 100
}

export const selectIsShipFullyUpgraded = (state: GameState, shipId: string): boolean => {
    const progress = selectUpgradeProgress(state, shipId)
    return progress >= 100
}
