// =============================================================================
// WILDLIFE PROFILES TESTS
// =============================================================================

import { describe, it, expect } from 'vitest'
import {
    WILDLIFE_PROFILES,
    QUALITY_LOD_MULTIPLIER,
    getTimeOfDay,
    getAmbientDensity,
    getAmbientCounts,
    getCameraAwareMultiplier,
    getSeasonalColor,
    getLightAttractionMultiplier,
    getBeatReactiveMultiplier,
    getFishSchoolCohesionFactor,
    getFinaleConvergenceEnvelope,
    type AmbientSpecies,
    type Season,
    type TimeOfDay,
    type WeatherState,
    type QualityPreset
} from '../wildlifeProfiles'

describe('wildlifeProfiles', () => {
    describe('getTimeOfDay', () => {
        it('classifies dawn, day, dusk, and night boundaries', () => {
            expect(getTimeOfDay(5)).toBe('dawn')
            expect(getTimeOfDay(7.5)).toBe('dawn')
            expect(getTimeOfDay(8)).toBe('day')
            expect(getTimeOfDay(16.9)).toBe('day')
            expect(getTimeOfDay(17)).toBe('dusk')
            expect(getTimeOfDay(19.5)).toBe('dusk')
            expect(getTimeOfDay(20)).toBe('night')
            expect(getTimeOfDay(4)).toBe('night')
            expect(getTimeOfDay(28)).toBe('night') // wraps around
            expect(getTimeOfDay(-2)).toBe('night') // wraps around
        })
    })

    describe('getCameraAwareMultiplier', () => {
        it('boosts counts for spectator and ship-water camera modes', () => {
            expect(getCameraAwareMultiplier('spectator', null)).toBe(1.6)
            expect(getCameraAwareMultiplier('ship-water', null)).toBe(1.6)
            expect(getCameraAwareMultiplier('ship-aerial', null)).toBe(1.6)
        })

        it('boosts counts when the underwater dashboard viewport is focused', () => {
            expect(getCameraAwareMultiplier('orbit', 'underwater')).toBe(1.5)
        })

        it('uses neutral multiplier for non-scenic views', () => {
            expect(getCameraAwareMultiplier('orbit', null)).toBe(1.0)
            expect(getCameraAwareMultiplier('crane-cockpit', 'crane')).toBe(1.0)
        })
    })

    describe('getAmbientDensity', () => {
        it('returns peak density for summer day clear conditions', () => {
            const fish = getAmbientDensity('fish_school', 'summer', 'day', 'clear', 0, 1)
            expect(fish).toBeGreaterThan(0.5)
            expect(fish).toBeLessThanOrEqual(1)
        })

        it('returns zero density when wildlifeDensity is zero', () => {
            for (const species of Object.keys(WILDLIFE_PROFILES) as AmbientSpecies[]) {
                expect(getAmbientDensity(species, 'summer', 'day', 'clear', 0, 0)).toBe(0)
            }
        })

        it('clamps wildlifeDensity above 1', () => {
            const normal = getAmbientDensity('moon_jellyfish', 'summer', 'night', 'clear', 0, 1)
            const overdriven = getAmbientDensity('moon_jellyfish', 'summer', 'night', 'clear', 0, 5)
            expect(overdriven).toBe(normal)
        })

        it('reduces density in storm', () => {
            const calm = getAmbientDensity('fish_school', 'summer', 'day', 'clear', 0, 1)
            const stormy = getAmbientDensity('fish_school', 'summer', 'day', 'storm', 0.5, 1)
            expect(stormy).toBeLessThan(calm)
            expect(stormy).toBeLessThan(0.25)
        })

        it('night plankton is strongest at night and nearly absent by day', () => {
            const night = getAmbientDensity('night_plankton', 'summer', 'night', 'clear', 0, 1)
            const day = getAmbientDensity('night_plankton', 'summer', 'day', 'clear', 0, 1)
            expect(night).toBeGreaterThan(day * 5)
        })

        it('fish schools are strongest during the day', () => {
            const day = getAmbientDensity('fish_school', 'summer', 'day', 'clear', 0, 1)
            const night = getAmbientDensity('fish_school', 'summer', 'night', 'clear', 0, 1)
            expect(day).toBeGreaterThan(night)
        })

        it('moon jellyfish peak in summer', () => {
            const summer = getAmbientDensity('moon_jellyfish', 'summer', 'night', 'clear', 0, 1)
            const winter = getAmbientDensity('moon_jellyfish', 'winter', 'night', 'clear', 0, 1)
            expect(summer).toBeGreaterThan(winter)
        })

        it('gray whales peak during fall migration and are reduced in summer', () => {
            const fall = getAmbientDensity('gray_whale', 'fall', 'dawn', 'clear', 0, 1)
            const summer = getAmbientDensity('gray_whale', 'summer', 'dawn', 'clear', 0, 1)
            expect(fall).toBeGreaterThan(summer)
        })

        it('seabird flocks are active during the day and shelter at night', () => {
            const day = getAmbientDensity('seabird_flock', 'summer', 'day', 'clear', 0, 1)
            const night = getAmbientDensity('seabird_flock', 'summer', 'night', 'clear', 0, 1)
            expect(day).toBeGreaterThan(night * 5)
        })
    })

    describe('getAmbientCounts', () => {
        it('scales counts with quality preset LOD multipliers', () => {
            const low = getAmbientCounts('summer', 12, 'clear', 0, 1, 'low')
            const medium = getAmbientCounts('summer', 12, 'clear', 0, 1, 'medium')
            const high = getAmbientCounts('summer', 12, 'clear', 0, 1, 'high')

            for (const species of Object.keys(WILDLIFE_PROFILES) as AmbientSpecies[]) {
                expect(low[species]).toBeLessThanOrEqual(medium[species])
                expect(medium[species]).toBeLessThanOrEqual(high[species])
                expect(low[species]).toBeGreaterThanOrEqual(0)
                expect(high[species]).toBeLessThanOrEqual(WILDLIFE_PROFILES[species].maxCount)
            }
        })

        it('returns zero counts when marine life is disabled via density', () => {
            const counts = getAmbientCounts('summer', 12, 'clear', 0, 0, 'high')
            for (const species of Object.keys(WILDLIFE_PROFILES) as AmbientSpecies[]) {
                expect(counts[species]).toBe(0)
            }
        })

        it('clamps counts to maxCount', () => {
            const counts = getAmbientCounts('summer', 12, 'clear', 0, 1, 'high')
            for (const species of Object.keys(WILDLIFE_PROFILES) as AmbientSpecies[]) {
                expect(counts[species]).toBeLessThanOrEqual(WILDLIFE_PROFILES[species].maxCount)
            }
        })

        it('produces more night plankton at night than during the day', () => {
            const night = getAmbientCounts('summer', 23, 'clear', 0, 1, 'high')
            const day = getAmbientCounts('summer', 12, 'clear', 0, 1, 'high')
            expect(night.night_plankton).toBeGreaterThan(day.night_plankton)
        })

        it('boosts ambient counts in scenic camera modes', () => {
            const scenic = getAmbientCounts('summer', 12, 'clear', 0, 1, 'high', 'spectator', null)
            const normal = getAmbientCounts('summer', 12, 'clear', 0, 1, 'high', 'orbit', null)
            for (const species of Object.keys(WILDLIFE_PROFILES) as AmbientSpecies[]) {
                expect(scenic[species]).toBeGreaterThanOrEqual(normal[species])
            }
        })

        it('boosts ambient counts when underwater viewport is focused', () => {
            const underwater = getAmbientCounts('summer', 12, 'clear', 0, 1, 'high', 'orbit', 'underwater')
            const normal = getAmbientCounts('summer', 12, 'clear', 0, 1, 'high', 'orbit', null)
            for (const species of Object.keys(WILDLIFE_PROFILES) as AmbientSpecies[]) {
                expect(underwater[species]).toBeGreaterThanOrEqual(normal[species])
            }
        })

        it('caps gray whale count at a small number even at peak conditions', () => {
            const counts = getAmbientCounts('fall', 6, 'clear', 0, 1, 'high')
            expect(counts.gray_whale).toBeGreaterThan(0)
            expect(counts.gray_whale).toBeLessThanOrEqual(WILDLIFE_PROFILES.gray_whale.maxCount)
        })

        it('produces kelp beds in clear daytime conditions', () => {
            const counts = getAmbientCounts('summer', 12, 'clear', 0, 1, 'high')
            expect(counts.kelp_bed).toBeGreaterThan(0)
            expect(counts.kelp_bed).toBeLessThanOrEqual(WILDLIFE_PROFILES.kelp_bed.maxCount)
        })
    })

    describe('getSeasonalColor', () => {
        it('returns different colors per season for each species', () => {
            for (const species of Object.keys(WILDLIFE_PROFILES) as AmbientSpecies[]) {
                const spring = getSeasonalColor(species, 'spring')
                const summer = getSeasonalColor(species, 'summer')
                const fall = getSeasonalColor(species, 'fall')
                const winter = getSeasonalColor(species, 'winter')
                expect(spring).not.toBe(summer)
                expect(spring).toMatch(/^#[0-9a-f]{6}$/i)
                expect(winter).toMatch(/^#[0-9a-f]{6}$/i)
            }
        })

        it('returns greener kelp in spring/summer and browner in fall/winter', () => {
            const spring = getSeasonalColor('kelp_bed', 'spring')
            const fall = getSeasonalColor('kelp_bed', 'fall')
            const winter = getSeasonalColor('kelp_bed', 'winter')
            expect(spring).toBe('#6bb85a')
            expect(fall).toBe('#8a7a3a')
            expect(winter).toBe('#3a4a3a')
        })

        it('returns cooler tones for moon jellyfish in winter', () => {
            const winter = getSeasonalColor('moon_jellyfish', 'winter')
            const summer = getSeasonalColor('moon_jellyfish', 'summer')
            expect(winter).toBe('#c8d8f0')
            expect(summer).toBe('#e8f4ff')
        })
    })

    describe('getLightAttractionMultiplier', () => {
        it('returns neutral multiplier when no ship is fully upgraded and playing', () => {
            const ship = {
                id: 'ship-1',
                type: 'cruise' as const,
                modelName: 'cruise',
                position: [0, 0, 0] as [number, number, number],
                length: 100,
                attachmentPoints: [{ position: [0, 0, 0], rotation: [0, 0, 0], partName: 'p1' }]
            }
            expect(getLightAttractionMultiplier([], [ship], new Map())).toBe(1.0)
        })

        it('boosts multiplier when a ship is fully upgraded and music is playing', () => {
            const ship = {
                id: 'ship-1',
                type: 'cruise' as const,
                modelName: 'cruise',
                position: [0, 0, 0] as [number, number, number],
                length: 100,
                attachmentPoints: [{ position: [0, 0, 0], rotation: [0, 0, 0], partName: 'p1' }]
            }
            const musicPlaying = new Map([['ship-1', true]])
            const installedUpgrades = [{ shipId: 'ship-1', partName: 'p1', installed: true }]
            expect(getLightAttractionMultiplier(installedUpgrades, [ship], musicPlaying)).toBe(1.2)
        })

        it('does not boost when ship is upgraded but music is not playing', () => {
            const ship = {
                id: 'ship-1',
                type: 'cruise' as const,
                modelName: 'cruise',
                position: [0, 0, 0] as [number, number, number],
                length: 100,
                attachmentPoints: [{ position: [0, 0, 0], rotation: [0, 0, 0], partName: 'p1' }]
            }
            const installedUpgrades = [{ shipId: 'ship-1', partName: 'p1', installed: true }]
            expect(getLightAttractionMultiplier(installedUpgrades, [ship], new Map())).toBe(1.0)
        })
    })

    describe('QUALITY_LOD_MULTIPLIER', () => {
        it('has expected values', () => {
            expect(QUALITY_LOD_MULTIPLIER.low).toBe(0.4)
            expect(QUALITY_LOD_MULTIPLIER.medium).toBe(0.7)
            expect(QUALITY_LOD_MULTIPLIER.high).toBe(1.0)
        })
    })

    describe('getBeatReactiveMultiplier', () => {
        it('returns neutral 1.0 when no show is active', () => {
            expect(getBeatReactiveMultiplier(0.5, 0.8, false, 1)).toBe(1.0)
        })

        it('returns neutral 1.0 when reactivity is disabled', () => {
            expect(getBeatReactiveMultiplier(1, 1, true, 0)).toBe(1.0)
            expect(getBeatReactiveMultiplier(1, 1, true, -0.5)).toBe(1.0)
        })

        it('boosts intensity when a show is active and clamps to 1.8', () => {
            const low = getBeatReactiveMultiplier(0, 0, true, 1)
            const mid = getBeatReactiveMultiplier(0.5, 0.5, true, 1)
            const max = getBeatReactiveMultiplier(1, 1, true, 1)
            expect(low).toBeGreaterThan(1)
            expect(mid).toBeGreaterThan(low)
            expect(max).toBe(1.8)
        })

        it('scales linearly with reactivity', () => {
            const zero = getBeatReactiveMultiplier(1, 1, true, 0)
            const half = getBeatReactiveMultiplier(1, 1, true, 0.5)
            const full = getBeatReactiveMultiplier(1, 1, true, 1)
            expect(zero).toBe(1.0)
            expect(half).toBeCloseTo(1.4, 5)
            expect(full).toBe(1.8)
        })

        it('clamps reactivity above 1', () => {
            expect(getBeatReactiveMultiplier(1, 1, true, 5)).toBe(1.8)
        })
    })

    describe('getFishSchoolCohesionFactor', () => {
        it('returns 0 when no show is active', () => {
            expect(getFishSchoolCohesionFactor(false, 1, 1)).toBe(0)
        })

        it('returns 0 when reactivity is disabled', () => {
            expect(getFishSchoolCohesionFactor(true, 1, 0)).toBe(0)
        })

        it('increases with energy during a show', () => {
            const lowEnergy = getFishSchoolCohesionFactor(true, 0, 1)
            const highEnergy = getFishSchoolCohesionFactor(true, 1, 1)
            expect(lowEnergy).toBe(0.25)
            expect(highEnergy).toBe(1)
            expect(highEnergy).toBeGreaterThan(lowEnergy)
        })

        it('scales with reactivity and clamps at 1', () => {
            expect(getFishSchoolCohesionFactor(true, 1, 0.5)).toBe(0.5)
            expect(getFishSchoolCohesionFactor(true, 1, 2)).toBe(1)
        })
    })

    describe('getFinaleConvergenceEnvelope', () => {
        it('returns 0 outside the finale window', () => {
            expect(getFinaleConvergenceEnvelope(-1, 10)).toBe(0)
            expect(getFinaleConvergenceEnvelope(0, 10)).toBe(0)
            expect(getFinaleConvergenceEnvelope(10, 10)).toBe(0)
            expect(getFinaleConvergenceEnvelope(15, 10)).toBe(0)
        })

        it('ramps in during the attack portion', () => {
            const atStart = getFinaleConvergenceEnvelope(0.01, 10)
            const midAttack = getFinaleConvergenceEnvelope(0.75, 10)
            expect(atStart).toBeGreaterThan(0)
            expect(midAttack).toBeGreaterThan(atStart)
            expect(getFinaleConvergenceEnvelope(1.5, 10)).toBe(1)
        })

        it('ramps out during the release portion', () => {
            const beforeRelease = getFinaleConvergenceEnvelope(7.0, 10)
            const midRelease = getFinaleConvergenceEnvelope(8.5, 10)
            const endRelease = getFinaleConvergenceEnvelope(9.99, 10)
            expect(beforeRelease).toBe(1)
            expect(midRelease).toBeLessThan(beforeRelease)
            expect(endRelease).toBeGreaterThan(0)
            expect(endRelease).toBeLessThan(midRelease)
        })

        it('handles zero or negative duration safely', () => {
            expect(getFinaleConvergenceEnvelope(1, 0)).toBe(0)
            expect(getFinaleConvergenceEnvelope(1, -5)).toBe(0)
        })
    })
})
