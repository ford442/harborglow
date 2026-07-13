// =============================================================================
// AMBIENT MARINE LIFE RENDERER — HarborGlow
// Instanced moon jellyfish, fish schools, night plankton glow, gray whales,
// seabird flocks, and kelp beds. Reads transient creature state from
// AmbientMarineLifeSystem each frame.
// =============================================================================

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore, type Season } from '../store/useGameStore'
import { ambientMarineLifeSystem, type AmbientCreature } from '../systems/ambientMarineLifeSystem'
import { getAudioAnalysisData } from '../systems/audioVisualSync'
import { lightingSystem } from '../systems/lightingSystem'
import {
    WILDLIFE_PROFILES,
    getBeatReactiveMultiplier,
    getSeasonalColor,
    type AmbientSpecies
} from '../systems/wildlifeProfiles'

const tempMatrix = new THREE.Matrix4()
const tempPosition = new THREE.Vector3()
const tempQuaternion = new THREE.Quaternion()
const tempScale = new THREE.Vector3()
const tempColor = new THREE.Color()

interface InstancedSpeciesProps {
    species: AmbientSpecies
    season: Season
    geometry: THREE.BufferGeometry
    material: THREE.Material
    getScale?: (creature: AmbientCreature, baseScale: number, beatBoost: number, time: number) => [number, number, number]
    getRotation?: (creature: AmbientCreature, time: number) => THREE.Euler
}

function GenericInstancedSpecies({
    species,
    season,
    geometry,
    material,
    getScale,
    getRotation
}: InstancedSpeciesProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const baseColor = useMemo(() => new THREE.Color(getSeasonalColor(species, season)), [species, season])

    useFrame((state) => {
        if (!meshRef.current) return
        const creatures = ambientMarineLifeSystem.getState().creatures[species]
        const time = state.clock.elapsedTime
        const audioData = getAudioAnalysisData()
        const showActive = lightingSystem.isShowActive()
        const beatBoost = getBeatReactiveMultiplier(
            audioData.beatPhase,
            audioData.energy,
            showActive,
            ambientMarineLifeSystem.getBeatReactivity()
        )

        for (let i = 0; i < creatures.length; i++) {
            const c = creatures[i]
            tempPosition.set(...c.position)

            if (getRotation) {
                tempQuaternion.setFromEuler(getRotation(c, time))
            } else {
                tempQuaternion.setFromEuler(new THREE.Euler(0, time * 0.2 + c.phase, 0))
            }

            const baseScale = c.scale
            if (getScale) {
                tempScale.set(...getScale(c, baseScale, beatBoost, time))
            } else {
                tempScale.set(baseScale, baseScale, baseScale)
            }

            tempMatrix.compose(tempPosition, tempQuaternion, tempScale)
            meshRef.current.setMatrixAt(i, tempMatrix)

            // Per-instance color: base seasonal tint with slight individual variation
            // Disturbed creatures flash brighter; beat reactivity adds a global pulse
            const variation = 0.92 + Math.sin(c.phase) * 0.08
            const disturbanceBoost = 1 + c.disturbance * 0.5
            tempColor.copy(baseColor).multiplyScalar(variation * disturbanceBoost * beatBoost)
            meshRef.current.setColorAt(i, tempColor)
        }

        meshRef.current.count = creatures.length
        meshRef.current.instanceMatrix.needsUpdate = true
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true
        }
    })

    return (
        <instancedMesh
            ref={meshRef}
            args={[geometry, material, WILDLIFE_PROFILES[species].maxCount]}
            frustumCulled={true}
        />
    )
}

function MoonJellyfishInstanced(props: Omit<InstancedSpeciesProps, 'getScale'>) {
    return (
        <GenericInstancedSpecies
            {...props}
            getScale={(c, base, beatBoost, time) => {
                const breathe = 1 + Math.sin(time * 1.5 + c.phase) * 0.15 * beatBoost
                const s = base * breathe
                return [s, s * 0.6, s]
            }}
        />
    )
}

function FishSchoolInstanced(props: Omit<InstancedSpeciesProps, 'getScale' | 'getRotation'>) {
    return (
        <GenericInstancedSpecies
            {...props}
            getScale={(c) => {
                const s = c.scale * 0.08
                return [s, s * 0.4, s * 1.6]
            }}
            getRotation={(c, time) => {
                const weaveX = Math.sin(time * c.speed + c.phase) * 0.3
                const weaveZ = Math.sin(time * c.speed * 0.5 + c.phase) * 0.3
                const angle = Math.atan2(weaveZ, weaveX)
                return new THREE.Euler(0, -angle + Math.PI / 2, 0)
            }}
        />
    )
}

function GrayWhaleInstanced(props: Omit<InstancedSpeciesProps, 'getScale' | 'getRotation'>) {
    return (
        <GenericInstancedSpecies
            {...props}
            getScale={(c) => {
                const s = c.scale * 3.5 // ~12m scaled roughly
                return [s * 0.8, s * 0.55, s * 2.2]
            }}
            getRotation={(c, time) => {
                // Slow horizontal cruise direction
                const angle = Math.atan2(Math.sin(c.phase), Math.cos(c.phase))
                const roll = Math.sin(time * 0.4 + c.phase) * 0.05
                return new THREE.Euler(roll, -angle + Math.PI / 2, 0)
            }}
        />
    )
}

function SeabirdFlockInstanced(props: Omit<InstancedSpeciesProps, 'getScale' | 'getRotation'>) {
    return (
        <GenericInstancedSpecies
            {...props}
            getScale={(c) => {
                const s = c.scale * 0.35
                return [s * 1.4, s * 0.3, s * 0.6]
            }}
            getRotation={(c, time) => {
                const angle = Math.atan2(
                    Math.sin(time * 0.2 + c.phase),
                    Math.cos(time * 0.2 + c.phase)
                )
                const bank = Math.sin(time * 1.5 + c.phase) * 0.35
                return new THREE.Euler(bank, -angle + Math.PI / 2, -bank * 0.5)
            }}
        />
    )
}

function KelpBedInstanced(props: Omit<InstancedSpeciesProps, 'getScale' | 'getRotation'>) {
    return (
        <GenericInstancedSpecies
            {...props}
            getScale={(c, base, beatBoost, time) => {
                const sway = 1 + Math.sin(time * 0.8 + c.phase) * 0.08 * beatBoost
                const height = base * 5 * (1 + c.disturbance * 0.3)
                return [base * 0.25 * sway, height, base * 0.25]
            }}
            getRotation={(c, time) => {
                const lean = Math.sin(time * 0.7 + c.phase) * 0.15 * (1 + c.disturbance)
                return new THREE.Euler(0, c.phase, lean)
            }}
        />
    )
}

function NightPlanktonPoints({ species, season }: { species: AmbientSpecies; season: Season }) {
    const pointsRef = useRef<THREE.Points>(null)
    const baseColor = useMemo(() => new THREE.Color(getSeasonalColor(species, season)), [species, season])
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry()
        const positions = new Float32Array(WILDLIFE_PROFILES[species].maxCount * 3)
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        return geo
    }, [species])

    const material = useMemo(() => {
        return new THREE.PointsMaterial({
            color: baseColor,
            size: 0.35,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        })
    }, [baseColor])

    useFrame(() => {
        if (!pointsRef.current) return
        const creatures = ambientMarineLifeSystem.getState().creatures[species]
        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array

        for (let i = 0; i < creatures.length; i++) {
            const c = creatures[i]
            positions[i * 3] = c.position[0]
            positions[i * 3 + 1] = c.position[1]
            positions[i * 3 + 2] = c.position[2]
        }

        pointsRef.current.geometry.setDrawRange(0, creatures.length)
        pointsRef.current.geometry.attributes.position.needsUpdate = true

        const audioData = getAudioAnalysisData()
        const showActive = lightingSystem.isShowActive()
        const beatBoost = getBeatReactiveMultiplier(
            audioData.beatPhase,
            audioData.energy,
            showActive,
            ambientMarineLifeSystem.getBeatReactivity()
        )
        const mat = pointsRef.current.material as THREE.PointsMaterial
        mat.color.copy(baseColor).multiplyScalar(beatBoost)
        mat.opacity = 0.55 + (beatBoost - 1) * 0.25
    })

    return (
        <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={true} />
    )
}

export default function AmbientMarineLife() {
    const enableMarineLife = useGameStore((s) => s.enableMarineLife)
    const season = useGameStore((s) => s.season)

    const jellyfishGeometry = useMemo(() => new THREE.SphereGeometry(1, 16, 12), [])

    const jellyfishMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    }, [])

    const fishGeometry = useMemo(() => new THREE.ConeGeometry(0.5, 2, 5), [])

    const fishMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    }, [])

    const whaleGeometry = useMemo(() => new THREE.CapsuleGeometry(1, 3, 8, 16), [])

    const whaleMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: '#ffffff',
            roughness: 0.7,
            metalness: 0.1
        })
    }, [])

    const seabirdGeometry = useMemo(() => new THREE.ConeGeometry(0.5, 1.5, 3), [])

    const seabirdMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: 0.85,
            depthWrite: false
        })
    }, [])

    const kelpGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 1, 4), [])

    const kelpMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            depthWrite: false
        })
    }, [])

    if (!enableMarineLife) return null

    return (
        <group name="ambient-marine-life">
            <MoonJellyfishInstanced
                species="moon_jellyfish"
                season={season}
                geometry={jellyfishGeometry}
                material={jellyfishMaterial}
            />
            <FishSchoolInstanced
                species="fish_school"
                season={season}
                geometry={fishGeometry}
                material={fishMaterial}
            />
            <GrayWhaleInstanced
                species="gray_whale"
                season={season}
                geometry={whaleGeometry}
                material={whaleMaterial}
            />
            <SeabirdFlockInstanced
                species="seabird_flock"
                season={season}
                geometry={seabirdGeometry}
                material={seabirdMaterial}
            />
            <KelpBedInstanced
                species="kelp_bed"
                season={season}
                geometry={kelpGeometry}
                material={kelpMaterial}
            />
            <NightPlanktonPoints species="night_plankton" season={season} />
        </group>
    )
}
