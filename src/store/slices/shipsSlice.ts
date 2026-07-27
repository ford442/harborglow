// =============================================================================
// SHIPS SLICE — Fleet lifecycle, upgrade installation, sail schedule, and per-ship music/lyrics.
// =============================================================================

import type { StateCreator } from 'zustand';
import type { ShipsSlice } from '../sliceTypes';
import {
    type GameState,
    type Ship,
} from '../gameStoreTypes';
import { reputationSystem } from '../../systems/reputationSystem';

export const createShipsSlice: StateCreator<GameState, [], [], ShipsSlice> = (set, get, _api) => ({
    addShip: (ship) => set((state) => {
        const shouldSelect = state.ships.length === 0
        const newState = {
            ships: [...state.ships, ship],
            currentShipId: shouldSelect ? ship.id : state.currentShipId
        }
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
        return newState
    }),

    setCurrentShip: (id) => set({ currentShipId: id }),

    // Crane-mode starter objective

    installUpgrade: (shipId, partName, metrics) => set((state) => {
        const newUpgrades = [
            ...state.installedUpgrades,
            { shipId, partName, installed: true, installedAt: Date.now() },
        ]
        const newState = { installedUpgrades: newUpgrades, craneUpgrades: newUpgrades }

        // Award reputation. Metrics come from the caller that observed the
        // install (see triggerInstallation); when absent the installation still
        // counts, it just earns base completion with no measured bonuses.
        reputationSystem.recordInstallation({
            success: true,
            timeSeconds: metrics?.timeSeconds,
            swayPercent: metrics?.swayPercent,
            damage: metrics?.damage,
        })

        return newState
    }),

    uninstallUpgrade: (shipId, partName) => set((state) => {
        const newUpgrades = state.installedUpgrades.filter(
            u => !(u.shipId === shipId && u.partName === partName)
        )
        const newState = { installedUpgrades: newUpgrades, craneUpgrades: newUpgrades }
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
    },

    setLyricsSize: (size) => {
        const newSize = Math.max(12, Math.min(72, size))
        set({ lyricsSize: newSize })
    },

    setLightIntensity: (intensity) => {
        const newIntensity = Math.max(0.1, Math.min(5, intensity))
        set({ lightIntensity: newIntensity })
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

        console.log(`✅ Upgrade complete! ${shipName} is now v${nextVersion}`)
    },

    // Ambient marine life layer setters

    clearLastInstallation: () => set({ lastInstallation: null }),

    // Training system
});
