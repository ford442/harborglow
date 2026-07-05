// =============================================================================
// AMBIENT MARINE LIFE SYSTEM — HarborGlow
// Density-driven, season/time/weather-aware ambient wildlife layer.
// Keeps transient particle/fish state out of the Zustand store to avoid
// per-frame re-renders. The renderer reads this singleton each frame.
// =============================================================================

import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'
import {
    getAmbientCounts,
    getCameraAwareMultiplier,
    getLightAttractionMultiplier,
    type AmbientSpecies,
    WILDLIFE_PROFILES
} from './wildlifeProfiles'

export interface AmbientCreature {
    id: string
    species: AmbientSpecies
    position: [number, number, number]
    phase: number
    speed: number
    scale: number
    /** Interaction disturbance impulse, decays over time (0..1). */
    disturbance: number
    /** Horizontal velocity accumulated by disturbances. */
    driftVelocity: [number, number]
}

interface AmbientState {
    creatures: Record<AmbientSpecies, AmbientCreature[]>
    lastTargetCounts: Record<AmbientSpecies, number>
}

const DEFAULT_BOUNDS = {
    xMin: -140,
    xMax: 140,
    zMin: -140,
    zMax: 140
}

const SHORE_BOUNDS = {
    xMin: -70,
    xMax: 70,
    zMin: 10,
    zMax: 50
}

/** Scenic camera modes that should bias spawn origins toward the view frustum. */
const SCENIC_CAMERA_MODES: string[] = ['spectator', 'ship-water', 'ship-aerial']

/** Creatures that react to crane-spreader disturbance. */
const DISTURBABLE_SPECIES: AmbientSpecies[] = ['moon_jellyfish', 'fish_school', 'night_plankton', 'kelp_bed']

class AmbientMarineLifeSystem {
    private state: AmbientState = {
        creatures: {
            moon_jellyfish: [],
            fish_school: [],
            night_plankton: [],
            gray_whale: [],
            seabird_flock: [],
            kelp_bed: []
        },
        lastTargetCounts: {
            moon_jellyfish: 0,
            fish_school: 0,
            night_plankton: 0,
            gray_whale: 0,
            seabird_flock: 0,
            kelp_bed: 0
        }
    }

    private spawnAccumulator = 0
    private readonly SPAWN_INTERVAL = 1.5 // seconds between spawn/reconcile batches

    getState(): AmbientState {
        return this.state
    }

    update(delta: number, camera?: THREE.Camera) {
        const store = useGameStore.getState()
        const {
            enableMarineLife,
            season,
            timeOfDay,
            weather,
            stormIntensity,
            wildlifeDensity,
            qualityPreset,
            cameraMode,
            focusedViewport,
            installedUpgrades,
            ships,
            musicPlaying,
            spreaderPos
        } = store

        if (!enableMarineLife) {
            this.clear()
            return
        }

        const cameraMultiplier = getCameraAwareMultiplier(cameraMode, focusedViewport)
        const lightMultiplier = getLightAttractionMultiplier(installedUpgrades, ships, musicPlaying)
        const distanceLodMultiplier = this.getDistanceLodMultiplier(camera)

        const targetCounts = getAmbientCounts(
            season,
            timeOfDay,
            weather,
            stormIntensity,
            wildlifeDensity,
            qualityPreset,
            cameraMode,
            focusedViewport
        )

        // Apply light-rig attraction and distance LOD on top of profile counts
        for (const species of Object.keys(targetCounts) as AmbientSpecies[]) {
            const boosted = Math.round(
                targetCounts[species] * lightMultiplier * distanceLodMultiplier
            )
            targetCounts[species] = Math.min(boosted, WILDLIFE_PROFILES[species].maxCount)
        }

        this.spawnAccumulator += delta
        if (this.spawnAccumulator >= this.SPAWN_INTERVAL) {
            this.spawnAccumulator = 0
            this.reconcile(targetCounts, camera, cameraMode, focusedViewport)
        }

        this.animate(delta, spreaderPos)
    }

    private getDistanceLodMultiplier(camera?: THREE.Camera): number {
        if (!camera) return 1.0
        // If camera is far from the harbor center, reduce ambient counts
        const dist = camera.position.distanceTo(new THREE.Vector3(0, 5, 0))
        if (dist > 180) return 0.4
        if (dist > 120) return 0.65
        if (dist > 80) return 0.85
        return 1.0
    }

    private reconcile(
        targetCounts: Record<AmbientSpecies, number>,
        camera?: THREE.Camera,
        cameraMode?: string,
        focusedViewport?: string | null
    ) {
        const scenic = camera && (SCENIC_CAMERA_MODES.includes(cameraMode ?? '') || focusedViewport === 'underwater')

        for (const species of Object.keys(this.state.creatures) as AmbientSpecies[]) {
            const target = targetCounts[species]
            const current = this.state.creatures[species]
            const profile = WILDLIFE_PROFILES[species]

            // Add creatures up to target, biasing spawn position toward scenic camera
            while (current.length < target) {
                current.push(this.spawnCreature(species, profile.depthRange, scenic ? camera : undefined))
            }

            // Remove excess
            if (current.length > target) {
                this.state.creatures[species] = current.slice(0, target)
            }

            this.state.lastTargetCounts[species] = target
        }
    }

    private spawnCreature(
        species: AmbientSpecies,
        depthRange: [number, number],
        camera?: THREE.Camera
    ): AmbientCreature {
        const id = `ambient-${species}-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`

        let x: number
        let z: number
        let y: number

        if (species === 'kelp_bed') {
            // Kelp grows near the shore side of the dock
            x = SHORE_BOUNDS.xMin + Math.random() * (SHORE_BOUNDS.xMax - SHORE_BOUNDS.xMin)
            z = SHORE_BOUNDS.zMin + Math.random() * (SHORE_BOUNDS.zMax - SHORE_BOUNDS.zMin)
            y = depthRange[0] + Math.random() * (depthRange[1] - depthRange[0])
        } else if (camera) {
            // Bias spawn origin toward the camera's view frustum
            const direction = new THREE.Vector3()
            camera.getWorldDirection(direction)
            const targetDistance = 55
            const target = new THREE.Vector3()
                .copy(camera.position)
                .add(direction.multiplyScalar(targetDistance))

            const isAirborne = species === 'seabird_flock'
            const centerY = isAirborne
                ? Math.max(12, target.y)
                : target.y < -1
                    ? target.y
                    : -2

            const spreadXZ = 70
            const spreadY = isAirborne ? 12 : 8

            x = target.x + (Math.random() - 0.5) * spreadXZ
            z = target.z + (Math.random() - 0.5) * spreadXZ

            // Keep within world bounds
            x = Math.max(DEFAULT_BOUNDS.xMin, Math.min(DEFAULT_BOUNDS.xMax, x))
            z = Math.max(DEFAULT_BOUNDS.zMin, Math.min(DEFAULT_BOUNDS.zMax, z))

            y = Math.max(
                depthRange[0],
                Math.min(depthRange[1], centerY + (Math.random() - 0.5) * spreadY)
            )
        } else {
            x = DEFAULT_BOUNDS.xMin + Math.random() * (DEFAULT_BOUNDS.xMax - DEFAULT_BOUNDS.xMin)
            z = DEFAULT_BOUNDS.zMin + Math.random() * (DEFAULT_BOUNDS.zMax - DEFAULT_BOUNDS.zMin)
            y = depthRange[0] + Math.random() * (depthRange[1] - depthRange[0])
        }

        return {
            id,
            species,
            position: [x, y, z],
            phase: Math.random() * Math.PI * 2,
            speed: 0.2 + Math.random() * 0.6,
            scale: 0.7 + Math.random() * 0.6,
            disturbance: 0,
            driftVelocity: [0, 0]
        }
    }

    private animate(delta: number, spreaderPos: { x: number; y: number; z: number }) {
        const time = Date.now() / 1000
        const disturbanceRadius = 15
        const disturbanceStrength = 2.5
        const decay = 1.5 * delta

        for (const species of Object.keys(this.state.creatures) as AmbientSpecies[]) {
            const creatures = this.state.creatures[species]
            const isAirborne = species === 'seabird_flock'
            const isWhale = species === 'gray_whale'
            const isKelp = species === 'kelp_bed'
            const isDisturbable = DISTURBABLE_SPECIES.includes(species)

            for (const creature of creatures) {
                // Interaction hook: crane spreader disturbs nearby underwater life
                if (isDisturbable) {
                    const dx = creature.position[0] - spreaderPos.x
                    const dz = creature.position[2] - spreaderPos.z
                    const dy = creature.position[1] - spreaderPos.y
                    const distSq = dx * dx + dy * dy + dz * dz

                    if (distSq < disturbanceRadius * disturbanceRadius) {
                        const dist = Math.sqrt(distSq)
                        const intensity = (1 - dist / disturbanceRadius) * disturbanceStrength
                        creature.disturbance = Math.min(1, creature.disturbance + intensity * delta * 2)

                        // Flee vector away from spreader
                        if (dist > 0.1) {
                            creature.driftVelocity[0] += (dx / dist) * intensity * delta * 4
                            creature.driftVelocity[1] += (dz / dist) * intensity * delta * 4
                        }
                    }

                    // Decay disturbance
                    creature.disturbance = Math.max(0, creature.disturbance - decay)
                }

                // Apply drift velocity with damping
                const damping = Math.pow(0.92, delta * 60)
                creature.driftVelocity[0] *= damping
                creature.driftVelocity[1] *= damping

                // Gentle drift with per-creature phase
                const baseSpeed = creature.speed * (1 + creature.disturbance * 2)
                const driftX = Math.sin(time * baseSpeed * 0.3 + creature.phase) * 0.5 * delta
                const driftZ = Math.cos(time * baseSpeed * 0.25 + creature.phase) * 0.5 * delta
                const driftY = Math.sin(time * baseSpeed * 0.5 + creature.phase) * 0.1 * delta

                creature.position[0] += driftX + creature.driftVelocity[0] * delta
                creature.position[2] += driftZ + creature.driftVelocity[1] * delta
                creature.position[1] += driftY + (isKelp ? 0 : creature.disturbance * 0.5 * delta)

                // Wrap around horizontal bounds to keep schools in the harbor
                if (creature.position[0] > DEFAULT_BOUNDS.xMax) creature.position[0] = DEFAULT_BOUNDS.xMin
                if (creature.position[0] < DEFAULT_BOUNDS.xMin) creature.position[0] = DEFAULT_BOUNDS.xMax
                if (creature.position[2] > DEFAULT_BOUNDS.zMax) creature.position[2] = DEFAULT_BOUNDS.zMin
                if (creature.position[2] < DEFAULT_BOUNDS.zMin) creature.position[2] = DEFAULT_BOUNDS.zMax

                // Kelp stays near shore; if it drifted out, push it back
                if (isKelp) {
                    creature.position[0] = Math.max(
                        SHORE_BOUNDS.xMin,
                        Math.min(SHORE_BOUNDS.xMax, creature.position[0])
                    )
                    creature.position[2] = Math.max(
                        SHORE_BOUNDS.zMin,
                        Math.min(SHORE_BOUNDS.zMax, creature.position[2])
                    )
                }

                // Keep within depth band
                const profile = WILDLIFE_PROFILES[species]
                creature.position[1] = Math.max(
                    profile.depthRange[0],
                    Math.min(profile.depthRange[1], creature.position[1])
                )

                // Whales prefer slow horizontal cruising
                if (isWhale) {
                    creature.position[0] += Math.cos(creature.phase) * 0.3 * delta
                    creature.position[2] += Math.sin(creature.phase) * 0.3 * delta
                }

                // Seabirds get a broader soaring motion
                if (isAirborne) {
                    creature.position[0] += Math.cos(time * 0.2 + creature.phase) * 1.2 * delta
                    creature.position[2] += Math.sin(time * 0.2 + creature.phase) * 1.2 * delta
                }
            }
        }
    }

    clear() {
        this.state.creatures = {
            moon_jellyfish: [],
            fish_school: [],
            night_plankton: [],
            gray_whale: [],
            seabird_flock: [],
            kelp_bed: []
        }
        this.state.lastTargetCounts = {
            moon_jellyfish: 0,
            fish_school: 0,
            night_plankton: 0,
            gray_whale: 0,
            seabird_flock: 0,
            kelp_bed: 0
        }
        this.spawnAccumulator = 0
    }
}

export const ambientMarineLifeSystem = new AmbientMarineLifeSystem()
