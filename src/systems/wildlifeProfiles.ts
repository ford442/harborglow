// =============================================================================
// WILDLIFE PROFILES — HarborGlow
// Season × time-of-day × weather multipliers for the ambient marine-life layer.
// Pure data + pure helper functions; no side effects.
// Source of truth: weekly_plan.md § "Wildlife & Scenic Coastal Ecosystem"
// =============================================================================

import type { Season, WeatherState, QualityPreset, CameraMode, Ship, Upgrade } from '../store/gameStoreTypes'
import type { DashboardViewportId } from '../types/CameraPreset'

export type AmbientSpecies =
    | 'moon_jellyfish'
    | 'fish_school'
    | 'night_plankton'
    | 'gray_whale'
    | 'seabird_flock'
    | 'kelp_bed'

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

export interface AmbientProfile {
    /** Base density multiplier for this species (0..1). */
    baseDensity: number
    /** Seasonal activity multiplier. */
    seasonMultiplier: Record<Season, number>
    /** Time-of-day activity multiplier. */
    timeMultiplier: Record<TimeOfDay, number>
    /** Weather visibility/activity multiplier. */
    weatherMultiplier: Record<WeatherState, number>
    /** Additional density reduction per unit of storm intensity (0..1). */
    stormPenalty: number
    /** Maximum instances at high quality / density = 1. */
    maxCount: number
    /** Typical vertical range in world units [min, max]. */
    depthRange: [number, number]
}

export const WILDLIFE_PROFILES: Record<AmbientSpecies, AmbientProfile> = {
    moon_jellyfish: {
        // Aurelia aurita — soft pulsing bells, peak in warm-water blooms
        baseDensity: 0.6,
        seasonMultiplier: {
            spring: 0.8,
            summer: 1.0,
            fall: 0.7,
            winter: 0.3
        },
        timeMultiplier: {
            dawn: 0.7,
            day: 0.8,
            dusk: 0.7,
            night: 1.0
        },
        weatherMultiplier: {
            clear: 1.0,
            rain: 0.6,
            fog: 0.5,
            storm: 0.2
        },
        stormPenalty: 0.5,
        maxCount: 40,
        depthRange: [-4, -1]
    },
    fish_school: {
        // Northern Anchovy / Pacific Sardine / Rockfish schools
        baseDensity: 0.7,
        seasonMultiplier: {
            spring: 0.8,
            summer: 1.0,
            fall: 0.9,
            winter: 0.5
        },
        timeMultiplier: {
            dawn: 0.8,
            day: 1.0,
            dusk: 0.8,
            night: 0.3
        },
        weatherMultiplier: {
            clear: 1.0,
            rain: 0.7,
            fog: 0.6,
            storm: 0.2
        },
        stormPenalty: 0.6,
        maxCount: 120,
        depthRange: [-8, -2]
    },
    night_plankton: {
        // Dinoflagellate glow layer — strongly nocturnal
        baseDensity: 0.8,
        seasonMultiplier: {
            spring: 0.7,
            summer: 1.0,
            fall: 0.8,
            winter: 0.5
        },
        timeMultiplier: {
            dawn: 0.4,
            day: 0.1,
            dusk: 0.5,
            night: 1.0
        },
        weatherMultiplier: {
            clear: 1.0,
            rain: 0.8,
            fog: 0.7,
            storm: 0.3
        },
        stormPenalty: 0.4,
        maxCount: 300,
        depthRange: [-3, -0.5]
    },
    gray_whale: {
        // Eschrichtius robustus — slow majestic surface passes, peak during migrations
        baseDensity: 0.25,
        seasonMultiplier: {
            spring: 0.8,
            summer: 0.3,
            fall: 1.0,
            winter: 0.6
        },
        timeMultiplier: {
            dawn: 1.0,
            day: 0.6,
            dusk: 1.0,
            night: 0.2
        },
        weatherMultiplier: {
            clear: 1.0,
            rain: 0.5,
            fog: 0.4,
            storm: 0.1
        },
        stormPenalty: 0.7,
        maxCount: 3,
        depthRange: [-2.5, 1.0]
    },
    seabird_flock: {
        // Western Gull / Brown Pelican / Cormorant flocks above the harbor
        baseDensity: 0.5,
        seasonMultiplier: {
            spring: 0.9,
            summer: 1.0,
            fall: 0.8,
            winter: 0.5
        },
        timeMultiplier: {
            dawn: 0.8,
            day: 1.0,
            dusk: 0.7,
            night: 0.1
        },
        weatherMultiplier: {
            clear: 1.0,
            rain: 0.4,
            fog: 0.3,
            storm: 0.1
        },
        stormPenalty: 0.8,
        maxCount: 60,
        depthRange: [10, 40]
    },
    kelp_bed: {
        // Giant kelp (Macrocystis pyrifera) near the shore side of the harbor
        baseDensity: 0.5,
        seasonMultiplier: {
            spring: 0.9,
            summer: 1.0,
            fall: 0.8,
            winter: 0.5
        },
        timeMultiplier: {
            dawn: 0.9,
            day: 1.0,
            dusk: 0.9,
            night: 0.6
        },
        weatherMultiplier: {
            clear: 1.0,
            rain: 0.8,
            fog: 0.7,
            storm: 0.3
        },
        stormPenalty: 0.5,
        maxCount: 80,
        depthRange: [-8, -1]
    }
}

/** Quality-based LOD multiplier for ambient instance counts. */
export const QUALITY_LOD_MULTIPLIER: Record<QualityPreset, number> = {
    low: 0.4,
    medium: 0.7,
    high: 1.0
}

/**
 * Scenic-camera bias: wildlife becomes more active/visible when the player is
 * watching from the spectator drone, ship-water cam, or underwater dashboard.
 */
export function getCameraAwareMultiplier(
    cameraMode: CameraMode,
    focusedViewport: DashboardViewportId | null
): number {
    const scenicModes: CameraMode[] = ['spectator', 'ship-water', 'ship-aerial']
    if (scenicModes.includes(cameraMode)) return 1.6
    if (focusedViewport === 'underwater') return 1.5
    return 1.0
}

/**
 * Seasonal color tint for instanced ambient species.
 * Returns a hex color string.
 */
export function getSeasonalColor(species: AmbientSpecies, season: Season): string {
    switch (species) {
        case 'moon_jellyfish':
            return season === 'spring' ? '#ffe8f0'
                : season === 'summer' ? '#e8f4ff'
                    : season === 'fall' ? '#fff0d8'
                        : '#c8d8f0'
        case 'fish_school':
            return season === 'spring' ? '#88c8d8'
                : season === 'summer' ? '#88ccff'
                    : season === 'fall' ? '#a8c8e8'
                        : '#7898a8'
        case 'night_plankton':
            return season === 'spring' ? '#66ffcc'
                : season === 'summer' ? '#00ffff'
                    : season === 'fall' ? '#88ffff'
                        : '#44ccff'
        case 'gray_whale':
            return season === 'spring' ? '#4a5b6a'
                : season === 'summer' ? '#6a7b8a'
                    : season === 'fall' ? '#5a6b7a'
                        : '#3a4b5a'
        case 'seabird_flock':
            return season === 'spring' ? '#f0f4f8'
                : season === 'summer' ? '#e0e8f0'
                    : season === 'fall' ? '#d8d8d8'
                        : '#b8c0c8'
        case 'kelp_bed':
            return season === 'spring' ? '#6bb85a'
                : season === 'summer' ? '#5a9e3a'
                    : season === 'fall' ? '#8a7a3a'
                        : '#3a4a3a'
    }
}

/**
 * Light-rig attraction multiplier. When a ship is fully upgraded and its
 * procedural music/light show is active, ambient life is subtly drawn in.
 */
export function getLightAttractionMultiplier(
    installedUpgrades: Upgrade[],
    ships: Ship[],
    musicPlaying: Map<string, boolean>
): number {
    const activeShow = ships.some((ship) => {
        const shipUpgrades = installedUpgrades.filter((u) => u.shipId === ship.id)
        const fullyUpgraded = shipUpgrades.length >= ship.attachmentPoints.length
        const musicActive = musicPlaying.get(ship.id) ?? false
        return fullyUpgraded && musicActive
    })
    return activeShow ? 1.2 : 1.0
}

/**
 * Map a 24-hour clock value to a time-of-day phase.
 * - dawn: 05:00–07:59
 * - day:  08:00–16:59
 * - dusk: 17:00–19:59
 * - night: 20:00–04:59
 */
export function getTimeOfDay(hour: number): TimeOfDay {
    const h = ((hour % 24) + 24) % 24
    if (h >= 5 && h < 8) return 'dawn'
    if (h >= 8 && h < 17) return 'day'
    if (h >= 17 && h < 20) return 'dusk'
    return 'night'
}

/**
 * Compute the ambient density multiplier for a single species.
 * Returns a value in [0, 1].
 */
export function getAmbientDensity(
    species: AmbientSpecies,
    season: Season,
    timeOfDay: TimeOfDay,
    weather: WeatherState,
    stormIntensity: number,
    wildlifeDensity: number
): number {
    const profile = WILDLIFE_PROFILES[species]
    const stormFactor = Math.max(0, 1 - profile.stormPenalty * Math.max(0, Math.min(1, stormIntensity)))
    const raw =
        profile.baseDensity *
        profile.seasonMultiplier[season] *
        profile.timeMultiplier[timeOfDay] *
        profile.weatherMultiplier[weather] *
        stormFactor *
        Math.max(0, Math.min(1, wildlifeDensity))
    return Math.max(0, Math.min(1, raw))
}

/**
 * Compute target instance counts for all ambient species.
 */
export function getAmbientCounts(
    season: Season,
    hour: number,
    weather: WeatherState,
    stormIntensity: number,
    wildlifeDensity: number,
    qualityPreset: QualityPreset,
    cameraMode: CameraMode = 'orbit',
    focusedViewport: DashboardViewportId | null = null
): Record<AmbientSpecies, number> {
    const timeOfDay = getTimeOfDay(hour)
    const lodMultiplier = QUALITY_LOD_MULTIPLIER[qualityPreset] ?? 1.0
    const cameraMultiplier = getCameraAwareMultiplier(cameraMode, focusedViewport)

    const counts = {} as Record<AmbientSpecies, number>
    for (const species of Object.keys(WILDLIFE_PROFILES) as AmbientSpecies[]) {
        const profile = WILDLIFE_PROFILES[species]
        const density = getAmbientDensity(species, season, timeOfDay, weather, stormIntensity, wildlifeDensity)
        const count = Math.round(profile.maxCount * density * lodMultiplier * cameraMultiplier)
        counts[species] = Math.max(0, Math.min(profile.maxCount, count))
    }
    return counts
}

/**
 * Compute a beat-reactive intensity multiplier for instanced ambient species.
 * Returns 1.0 when no show is playing or reactivity is disabled, otherwise a
 * value in [1, 1.8] pulsing with beat phase and overall energy.
 */
export function getBeatReactiveMultiplier(
    beatPhase: number,
    energy: number,
    showActive: boolean,
    reactivity: number
): number {
    if (!showActive || reactivity <= 0) return 1.0
    const clampedReactivity = Math.max(0, Math.min(1, reactivity))
    const boost = (0.1 + energy * 0.3 + beatPhase * 0.4) * clampedReactivity
    return Math.min(1.8, 1 + boost)
}

/**
 * Compute how strongly fish schools should tighten toward their centroid while
 * a light-show is playing. Returns 0..1; 0 means normal schooling, 1 means
 * strong attraction to the group center.
 */
export function getFishSchoolCohesionFactor(
    showActive: boolean,
    energy: number,
    reactivity: number
): number {
    if (!showActive || reactivity <= 0) return 0
    const clampedReactivity = Math.max(0, Math.min(1, reactivity))
    return Math.min(1, (0.25 + energy * 0.75) * clampedReactivity)
}

/**
 * Ease-in / ease-out envelope for the Bioluminescent Finale convergence.
 * Returns a value in [0, 1] that ramps up, holds, then ramps down over the
 * given duration (in seconds).
 */
export function getFinaleConvergenceEnvelope(elapsed: number, duration: number): number {
    if (duration <= 0 || elapsed <= 0) return 0
    if (elapsed >= duration) return 0
    const t = elapsed / duration
    const attack = 0.15
    const release = 0.30
    if (t < attack) {
        return t / attack
    }
    if (t > 1 - release) {
        return (1 - t) / release
    }
    return 1
}
