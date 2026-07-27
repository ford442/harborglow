// =============================================================================
// ENVIRONMENT SLICE — Time of day, season, weather, storm, waves, wildlife, and harbor events.
// =============================================================================

import type { StateCreator } from 'zustand';
import type { EnvironmentSlice } from '../sliceTypes';
import {
    type GameState,
    type Season,
    type WeatherState,
    type QualityPreset,
    type HarborType,
    type WaveParams,
} from '../gameStoreTypes';

export const createEnvironmentSlice: StateCreator<GameState, [], [], EnvironmentSlice> = (set, get, _api) => ({
    setTimeOfDay: (hour) => {
        const newTime = hour % 24
        set({
            timeOfDay: newTime,
            isNight: newTime < 6 || newTime > 18
        })
    },

    setSeason: (season: Season) => {
        set({ season })
    },

    setWildlifeDensity: (density: number) => {
        const newDensity = Math.max(0, Math.min(1, density))
        set({ wildlifeDensity: newDensity })
    },

    setEnableMarineLife: (enabled: boolean) => {
        set({ enableMarineLife: enabled })
    },

    // Weather system

    setWeather: (weather: WeatherState) => {
        set({ weather })
        console.log(`🌤️ Weather set to: ${weather}`)
    },

    // Quality preset

    setQualityPreset: (preset: QualityPreset) => {
        set({ qualityPreset: preset })
        console.log(`🎨 Quality preset set to: ${preset}`)
    },

    // Crane control actions

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

    setGameTime: (hour: number, minute: number) => {
        const currentTime = get().gameTime
        // Only update if time has changed to avoid re-renders
        if (!currentTime || currentTime.hour !== hour || currentTime.minute !== minute) {
            set({ gameTime: { hour, minute } })
        }
    },

    // Attachment system configuration

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

    setWaveParams: (patch: Partial<WaveParams>) => set((state) => {
        const newParams = { ...state.waveParams, ...patch }
        return { waveParams: newParams }
    })
});
