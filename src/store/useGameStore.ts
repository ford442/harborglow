import { create } from 'zustand';
import { GameState } from './gameStoreTypes';
import { createSlice1 } from './slices/slice1';
import { createSlice2 } from './slices/slice2';
export * from './gameStoreTypes';
import { Ship, Upgrade, ShipType } from './gameStoreTypes';

export const useGameStore = create<GameState>((set, get) => ({
    ...createSlice1(set, get),
    ...createSlice2(set, get)
}))

// Subscribe to save on all state changes
import { scheduleSave } from './gameStoreTypes';
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
