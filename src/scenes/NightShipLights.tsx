import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { Ship } from '../store/useGameStore'
import { useGameStore, selectIsShipFullyUpgraded } from '../store/useGameStore'
import { lightingSystem } from '../systems/lightingSystem'

interface AccentLight {
    position: [number, number, number]
    color: string
    intensity: number
    distance: number
}

interface MarkerCluster {
    color: string
    size: number
    intensity: number
    positions: Array<[number, number, number]>
}

interface NightShipLightsProps {
    ship: Ship
    lod: number
}

interface NightShipLayout {
    markers: MarkerCluster[]
    accents: AccentLight[]
}

function getShipBeamEstimate(ship: Ship): number {
    switch (ship.type) {
        case 'lng': return 9.5
        case 'bulk': return 8.5
        case 'container': return 7.5
        case 'tanker': return 7.2
        case 'roro': return 6.2
        case 'cruise': return 6
        case 'research': return 4.8
        case 'droneship': return 4
        case 'ferry': return 4.2
        case 'trawler': return 3.6
        case 'horizon': return 4.6
    }
}

function sampleLine(count: number, start: number, end: number): number[] {
    if (count <= 1) return [start]
    const step = (end - start) / (count - 1)
    return Array.from({ length: count }, (_, i) => start + i * step)
}

function getNightFactor(hour: number): number {
    if (hour >= 22 || hour <= 5) return 1
    if (hour > 5 && hour < 8) return (8 - hour) / 3
    if (hour >= 18 && hour < 22) return (hour - 18) / 4
    return 0
}

function buildLayout(ship: Ship): NightShipLayout {
    const L = ship.length
    const W = getShipBeamEstimate(ship)
    const halfL = L * 0.5
    const halfW = W * 0.5

    const genericRails = sampleLine(16, -halfL * 0.85, halfL * 0.85).flatMap((z) => ([
        [-halfW - 0.2, 3.2, z] as [number, number, number],
        [halfW + 0.2, 3.2, z] as [number, number, number],
    ]))

    switch (ship.type) {
        case 'cruise': {
            const balconies = [4.2, 6.4, 8.6].flatMap((y) =>
                sampleLine(18, -halfL * 0.8, halfL * 0.8).flatMap((z) => ([
                    [-halfW - 0.15, y, z] as [number, number, number],
                    [halfW + 0.15, y, z] as [number, number, number],
                ]))
            )
            return {
                markers: [
                    { color: '#ffd27d', size: 0.12, intensity: 0.9, positions: balconies },
                    { color: '#8ad8ff', size: 0.16, intensity: 0.55, positions: genericRails },
                ],
                accents: [
                    { position: [0, 10.5, -L * 0.1], color: '#ff9a3d', intensity: 1.2, distance: 18 },
                    { position: [0, 1.5, 0], color: '#4da3ff', intensity: 0.55, distance: 28 },
                ],
            }
        }
        case 'container': {
            const deckLEDs = sampleLine(22, -halfL * 0.9, halfL * 0.9).flatMap((z) => ([
                [-halfW - 0.25, 3.4, z] as [number, number, number],
                [halfW + 0.25, 3.4, z] as [number, number, number],
            ]))
            const stackDots = sampleLine(10, -halfL * 0.65, halfL * 0.65).flatMap((z, i) => ([
                [-W * 0.25, 5.2 + (i % 2) * 1.2, z] as [number, number, number],
                [W * 0.25, 5.8 + ((i + 1) % 2) * 1.2, z] as [number, number, number],
            ]))
            return {
                markers: [
                    { color: '#5fdfff', size: 0.11, intensity: 0.85, positions: deckLEDs },
                    { color: '#91ffcc', size: 0.14, intensity: 0.7, positions: stackDots },
                ],
                accents: [
                    { position: [-W * 0.2, 11.5, L * 0.2], color: '#ff3f3f', intensity: 0.85, distance: 20 },
                    { position: [W * 0.2, 11.5, L * 0.2], color: '#49ff7f', intensity: 0.8, distance: 20 },
                    { position: [0, 1.3, 0], color: '#2c8dff', intensity: 0.5, distance: 30 },
                ],
            }
        }
        case 'tanker': {
            const pipeWalk = sampleLine(20, -halfL * 0.78, halfL * 0.78).map((z) => [0, 4.4, z] as [number, number, number])
            return {
                markers: [
                    { color: '#ffd37f', size: 0.13, intensity: 0.65, positions: genericRails },
                    { color: '#ffc36a', size: 0.11, intensity: 0.75, positions: pipeWalk },
                ],
                accents: [
                    { position: [-W * 0.35, 9.6, -L * 0.25], color: '#ff5a2a', intensity: 1.35, distance: 22 },
                    { position: [0, 1.3, 0], color: '#4a97ff', intensity: 0.45, distance: 30 },
                ],
            }
        }
        default: {
            return {
                markers: [
                    { color: '#95c9ff', size: 0.11, intensity: 0.6, positions: genericRails },
                ],
                accents: [
                    { position: [0, 6.5, -L * 0.2], color: '#ffd48d', intensity: 0.75, distance: 18 },
                    { position: [0, 1.2, 0], color: '#3a8dff', intensity: 0.4, distance: 24 },
                ],
            }
        }
    }
}

export default function NightShipLights({ ship, lod }: NightShipLightsProps) {
    const timeOfDay = useGameStore((s) => s.timeOfDay)
    const lightIntensity = useGameStore((s) => s.lightIntensity)
    const isNight = useGameStore((s) => s.isNight)
    const musicPlaying = useGameStore((s) => s.musicPlaying.get(ship.id) ?? false)
    const isFullyUpgraded = useGameStore((s) => selectIsShipFullyUpgraded(s, ship.id))

    const layout = useMemo(() => buildLayout(ship), [ship])
    const markerRefs = useRef<Array<THREE.InstancedMesh | null>>([])
    const markerMaterials = useRef<Array<THREE.MeshStandardMaterial | null>>([])
    const accentRefs = useRef<Array<THREE.PointLight | null>>([])

    const sampleStep = lod >= 2 ? 3 : 1

    const markerPositions = useMemo(
        () => layout.markers.map((cluster) => cluster.positions.filter((_, i) => i % sampleStep === 0)),
        [layout.markers, sampleStep]
    )

    useEffect(() => {
        markerPositions.forEach((positions, clusterIdx) => {
            const mesh = markerRefs.current[clusterIdx]
            if (!mesh) return
            const dummy = new THREE.Object3D()
            positions.forEach((p, i) => {
                dummy.position.set(p[0], p[1], p[2])
                dummy.updateMatrix()
                mesh.setMatrixAt(i, dummy.matrix)
            })
            mesh.instanceMatrix.needsUpdate = true
        })
    }, [markerPositions])

    useFrame(() => {
        const nightFactor = getNightFactor(timeOfDay)
        if (!isNight && nightFactor <= 0) {
            markerMaterials.current.forEach((material) => {
                if (!material) return
                material.emissiveIntensity = 0
            })
            accentRefs.current.forEach((light) => {
                if (!light) return
                light.intensity = 0
            })
            return
        }

        const beat = lightingSystem.getBeatPulse()
        const upgradeTier = ship.version === '2.0' || isFullyUpgraded ? 2 : ship.version === '1.5' ? 1.35 : 1
        const musicBoost = musicPlaying ? 1 + beat * 0.85 : 1
        const shared = Math.max(0, nightFactor) * lightIntensity * upgradeTier * musicBoost

        markerMaterials.current.forEach((material, idx) => {
            if (!material) return
            const cluster = layout.markers[idx]
            material.emissiveIntensity = cluster.intensity * shared
        })

        accentRefs.current.forEach((light, idx) => {
            if (!light) return
            const accent = layout.accents[idx]
            const underHull = idx === layout.accents.length - 1
            const underHullScale = underHull ? 0.7 : 1
            light.intensity = accent.intensity * shared * underHullScale
        })
    })

    if (lod >= 3) return null

    return (
        <group>
            {layout.markers.map((cluster, idx) => (
                <instancedMesh
                    key={`markers-${idx}`}
                    ref={(ref) => { markerRefs.current[idx] = ref }}
                    args={[undefined, undefined, markerPositions[idx].length]}
                >
                    <sphereGeometry args={[cluster.size, 6, 6]} />
                    <meshStandardMaterial
                        ref={(ref) => { markerMaterials.current[idx] = ref }}
                        color="#101418"
                        emissive={new THREE.Color(cluster.color)}
                        emissiveIntensity={0}
                        toneMapped={false}
                    />
                </instancedMesh>
            ))}

            {layout.accents.map((accent, idx) => (
                <pointLight
                    key={`accent-${idx}`}
                    ref={(ref) => { accentRefs.current[idx] = ref }}
                    position={accent.position}
                    color={accent.color}
                    intensity={0}
                    distance={accent.distance}
                    decay={2}
                />
            ))}
        </group>
    )
}
