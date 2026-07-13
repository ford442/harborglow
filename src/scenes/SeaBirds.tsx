// =============================================================================
// SEA BIRDS - HarborGlow Bay Atmosphere
// Night-aware seabird life with crane perching and subtle show reactivity
// =============================================================================

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { useGameStore } from '../store/useGameStore'
import { lightingSystem } from '../systems/lightingSystem'
import { playBirdCall } from '../systems/ambientSoundSystem'

type BirdSpecies = 'gull' | 'pelican' | 'cormorant' | 'tern'
type BirdBehavior = 'flying' | 'soaring' | 'diving'

interface BirdInstance {
    id: string
    species: BirdSpecies
    behavior: BirdBehavior
    center: [number, number, number]
    radius: number
    speed: number
    heightAmp: number
    flapSpeed: number
    flapAmp: number
    phase: number
}

interface BirdProps {
    instance: BirdInstance
    isNight: boolean
    nightBlend: number
    activityScale: number
    lightIntensity: number
    reactivity: number
    attractTarget?: [number, number, number]
}

interface PerchedBirdProps {
    species: 'gull' | 'cormorant'
    getPerchTarget: () => [number, number, number]
    nightBlend: number
    lightIntensity: number
    reactivity: number
}

interface SeaBirdsProps {
    isNight: boolean
}

const NIGHT_SPECIES_ACTIVITY: Record<BirdSpecies, number> = {
    gull: 1,
    cormorant: 0.95,
    pelican: 0.35,
    tern: 0.3,
}

const NIGHT_AIRBORNE_TARGET: Record<'low' | 'medium' | 'high', number> = {
    low: 8,
    medium: 10,
    high: 12,
}

const DAY_AIRBORNE_TARGET: Record<'low' | 'medium' | 'high', number> = {
    low: 12,
    medium: 16,
    high: 22,
}

function getNightBlend(hour: number): number {
    if (hour >= 22 || hour <= 5) return 1
    if (hour > 5 && hour < 8) return (8 - hour) / 3
    if (hour >= 18 && hour < 22) return (hour - 18) / 4
    return 0
}

function buildBirdPool(type: 'day' | 'night'): BirdInstance[] {
    const entries: BirdInstance[] = []
    const add = (species: BirdSpecies, behavior: BirdBehavior, count: number, range = 1) => {
        for (let i = 0; i < count; i++) {
            const baseX = (Math.random() - 0.5) * 120 * range
            const baseZ = (Math.random() - 0.5) * 90 * range
            const baseY = behavior === 'soaring' ? 34 + Math.random() * 16 : 12 + Math.random() * 20
            entries.push({
                id: `${species}-${behavior}-${i}-${type}`,
                species,
                behavior,
                center: [baseX, baseY, baseZ],
                radius: behavior === 'soaring' ? 36 + Math.random() * 18 : 14 + Math.random() * 14,
                speed: behavior === 'soaring' ? 0.12 + Math.random() * 0.05 : 0.24 + Math.random() * 0.16,
                heightAmp: behavior === 'diving' ? 2 : 2 + Math.random() * 4,
                flapSpeed: species === 'tern' ? 14 : species === 'pelican' ? 5 : 8 + Math.random() * 4,
                flapAmp: species === 'pelican' ? 0.25 : species === 'cormorant' ? 0.45 : 0.58,
                phase: Math.random() * 100,
            })
        }
    }

    if (type === 'day') {
        add('gull', 'flying', 14)
        add('cormorant', 'flying', 5)
        add('pelican', 'soaring', 4, 1.15)
        add('tern', 'diving', 4)
        return entries
    }

    add('gull', 'flying', 8)
    add('cormorant', 'flying', 5)
    add('pelican', 'soaring', 2)
    add('tern', 'diving', 2)
    return entries
}

function getBirdColor(species: BirdSpecies): string {
    switch (species) {
        case 'gull': return '#f0f0f0'
        case 'pelican': return '#e8ddd0'
        case 'cormorant': return '#1f1f22'
        case 'tern': return '#ffffff'
    }
}

function Bird({
    instance,
    isNight,
    nightBlend,
    activityScale,
    lightIntensity,
    reactivity,
    attractTarget,
}: BirdProps) {
    const birdRef = useRef<THREE.Group>(null)
    const wingsRef = useRef<THREE.Group>(null)
    const bodyMats = useRef<Array<THREE.MeshStandardMaterial | null>>([])
    const hadTargetRef = useRef(false)
    const scatterUntilRef = useRef(0)

    useFrame((state) => {
        const bird = birdRef.current
        if (!bird) return

        const t = state.clock.elapsedTime + instance.phase
        const beat = lightingSystem.getBeatPulse()
        const showActive = lightingSystem.isShowActive()
        const showBoost = showActive ? 1 + (0.2 + beat * 0.5) * reactivity : 1
        const speed = instance.speed * Math.max(0.2, activityScale) * showBoost

        const targetCenter = attractTarget && (isNight || showActive) && (instance.species === 'gull' || instance.species === 'cormorant')
            ? attractTarget
            : instance.center

        // One-shot scatter when a show first starts, then let the existing gather logic pull them back
        if (attractTarget && !hadTargetRef.current) {
            scatterUntilRef.current = state.clock.elapsedTime + 0.7 + Math.random() * 0.3
        }
        hadTargetRef.current = !!attractTarget
        const scatterRemaining = Math.max(0, scatterUntilRef.current - state.clock.elapsedTime)
        const scatterStrength = scatterRemaining > 0 ? scatterRemaining / 1.0 : 0

        const centerBlend = attractTarget ? Math.min(0.75, 0.25 + nightBlend * 0.35 + (showActive ? 0.2 : 0)) : 0
        const cx = THREE.MathUtils.lerp(instance.center[0], targetCenter[0], centerBlend)
        const cy = THREE.MathUtils.lerp(instance.center[1], targetCenter[1] + 2.5, centerBlend)
        const cz = THREE.MathUtils.lerp(instance.center[2], targetCenter[2], centerBlend)
        const radius = instance.radius * (attractTarget ? 0.68 : 1)

        // Scatter direction: away from the attract target, seeded by phase for variety
        const scatterAngle = instance.phase
        const scatterX = Math.cos(scatterAngle) * scatterStrength * 4
        const scatterZ = Math.sin(scatterAngle) * scatterStrength * 4
        const scatterY = scatterStrength * 1.5

        if (instance.behavior === 'soaring') {
            bird.position.x = cx + Math.cos(t * speed) * radius + scatterX
            bird.position.y = cy + Math.sin(t * speed * 0.6) * instance.heightAmp + scatterY
            bird.position.z = cz + Math.sin(t * speed) * radius + scatterZ
            bird.rotation.y = -t * speed + Math.PI / 2
            bird.rotation.z = Math.cos(t * speed) * 0.18
        } else if (instance.behavior === 'diving') {
            const diveCycle = (t * speed * 1.2) % (Math.PI * 2)
            bird.position.x = cx + Math.cos(diveCycle) * (radius * 0.45) + scatterX
            bird.position.z = cz + Math.sin(diveCycle * 0.7) * (radius * 0.6) + scatterZ
            bird.position.y = Math.max(2.5, cy + 7 - Math.abs(Math.sin(diveCycle)) * 12 + scatterY)
            bird.rotation.x = Math.sin(diveCycle) * 0.75
            bird.rotation.y = Math.atan2(Math.cos(diveCycle), -Math.sin(diveCycle))
        } else {
            bird.position.x = cx + Math.cos(t * speed) * radius + scatterX
            bird.position.y = Math.max(5, cy + Math.sin(t * speed * 0.8) * instance.heightAmp + scatterY)
            bird.position.z = cz + Math.sin(t * speed) * radius + scatterZ
            bird.rotation.y = -t * speed + Math.PI / 2
            bird.rotation.z = Math.cos(t * speed) * 0.27
        }

        if (wingsRef.current) {
            const flap = Math.sin(t * instance.flapSpeed * showBoost) * (instance.flapAmp * Math.max(0.2, activityScale))
            wingsRef.current.rotation.z = flap
        }

        const visible = activityScale > 0.08
        bird.visible = visible
        if (!visible) return

        const rim = nightBlend * lightIntensity
        bodyMats.current.forEach((mat) => {
            if (!mat) return
            mat.emissive.set(instance.species === 'cormorant' ? '#4f74b3' : '#8ab7ff')
            mat.emissiveIntensity = (instance.species === 'cormorant' ? 0.05 : 0.1) * rim * (0.75 + beat * 0.5 * reactivity)
            mat.roughness = isNight ? 0.85 : 0.65
            mat.metalness = isNight ? 0.05 : 0.1
        })
    })

    const bodyColor = getBirdColor(instance.species)
    const wingSpan = instance.species === 'pelican' ? 2.2 : instance.species === 'gull' ? 1.15 : instance.species === 'cormorant' ? 1.05 : 0.85
    const bodyLength = wingSpan * 0.4

    return (
        <group ref={birdRef} position={instance.center}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.08 * wingSpan, bodyLength, 4, 8]} />
                <meshStandardMaterial ref={(ref) => { bodyMats.current[0] = ref }} color={bodyColor} />
            </mesh>
            <mesh position={[bodyLength * 0.4, 0.1, 0]}>
                <sphereGeometry args={[0.1 * wingSpan, 8, 8]} />
                <meshStandardMaterial ref={(ref) => { bodyMats.current[1] = ref }} color={bodyColor} />
            </mesh>
            <mesh position={[bodyLength * 0.5 + 0.1, 0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.03 * wingSpan, 0.25 * wingSpan, 8]} />
                <meshStandardMaterial color={instance.species === 'tern' ? '#ff6600' : '#ffaa00'} />
            </mesh>
            <group ref={wingsRef}>
                <mesh position={[0, 0, wingSpan * 0.4]}>
                    <boxGeometry args={[bodyLength * 0.6, 0.02, wingSpan * 0.6]} />
                    <meshStandardMaterial ref={(ref) => { bodyMats.current[2] = ref }} color={bodyColor} />
                </mesh>
                <mesh position={[0, 0, -wingSpan * 0.4]}>
                    <boxGeometry args={[bodyLength * 0.6, 0.02, wingSpan * 0.6]} />
                    <meshStandardMaterial ref={(ref) => { bodyMats.current[3] = ref }} color={bodyColor} />
                </mesh>
            </group>
            <mesh position={[-bodyLength * 0.4, 0, 0]}>
                <boxGeometry args={[0.3 * wingSpan, 0.02, 0.4 * wingSpan]} />
                <meshStandardMaterial ref={(ref) => { bodyMats.current[4] = ref }} color={instance.species === 'tern' ? '#666666' : bodyColor} />
            </mesh>
        </group>
    )
}

function PerchedBird({ species, getPerchTarget, nightBlend, lightIntensity, reactivity }: PerchedBirdProps) {
    const birdRef = useRef<THREE.Group>(null)
    const wingsRef = useRef<THREE.Group>(null)
    const matRef = useRef<THREE.MeshStandardMaterial>(null)

    useFrame((state) => {
        const bird = birdRef.current
        if (!bird) return

        const t = state.clock.elapsedTime
        const beat = lightingSystem.getBeatPulse()
        const [tx, ty, tz] = getPerchTarget()

        bird.position.x = THREE.MathUtils.lerp(bird.position.x, tx, 0.08)
        bird.position.y = THREE.MathUtils.lerp(bird.position.y, ty + Math.sin(t * 1.8) * 0.02, 0.1)
        bird.position.z = THREE.MathUtils.lerp(bird.position.z, tz, 0.08)
        bird.rotation.y = Math.sin(t * 0.45) * 0.24
        bird.rotation.z = Math.sin(t * 0.3) * 0.04

        if (wingsRef.current) {
            wingsRef.current.rotation.z = Math.sin(t * (1.8 + reactivity) + 0.5) * (0.05 + beat * 0.08 * reactivity)
        }

        if (matRef.current) {
            matRef.current.emissive.set(species === 'cormorant' ? '#5678a8' : '#8bb0ee')
            matRef.current.emissiveIntensity = (species === 'cormorant' ? 0.06 : 0.1) * nightBlend * lightIntensity
        }
    })

    const color = species === 'gull' ? '#f0f0f0' : '#1a1a1a'

    return (
        <group ref={birdRef}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
                <meshStandardMaterial ref={matRef} color={color} />
            </mesh>
            <mesh position={[0.25, 0.08, 0]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0.35, 0.08, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.02, 0.12, 8]} />
                <meshStandardMaterial color="#ffaa00" />
            </mesh>
            <group ref={wingsRef}>
                <mesh position={[0, 0.05, 0.15]} rotation={[0, 0, 0.3]}>
                    <boxGeometry args={[0.3, 0.03, 0.2]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                <mesh position={[0, 0.05, -0.15]} rotation={[0, 0, -0.3]}>
                    <boxGeometry args={[0.3, 0.03, 0.2]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            </group>
            <mesh position={[-0.05, -0.15, 0.05]}>
                <cylinderGeometry args={[0.01, 0.01, 0.15]} />
                <meshStandardMaterial color="#ff6600" />
            </mesh>
            <mesh position={[-0.05, -0.15, -0.05]}>
                <cylinderGeometry args={[0.01, 0.01, 0.15]} />
                <meshStandardMaterial color="#ff6600" />
            </mesh>
        </group>
    )
}

export default function SeaBirds({ isNight }: SeaBirdsProps) {
    const timeOfDay = useGameStore((s) => s.timeOfDay)
    const qualityPreset = useGameStore((s) => s.qualityPreset)
    const lightIntensity = useGameStore((s) => s.lightIntensity)
    const ships = useGameStore((s) => s.ships)
    const currentShipId = useGameStore((s) => s.currentShipId)
    const installedUpgrades = useGameStore((s) => s.installedUpgrades)
    const musicPlaying = useGameStore((s) => s.musicPlaying)
    const { camera } = useThree()

    const {
        'Count Scale': countScale,
        'Night Activity': nightActivity,
        'Music Reactivity': musicReactivity,
    } = useControls('Wildlife / Birds', {
        'Count Scale': { value: 1, min: 0.5, max: 1.5, step: 0.05 },
        'Night Activity': { value: 1, min: 0, max: 1.5, step: 0.05 },
        'Music Reactivity': { value: 1, min: 0, max: 2, step: 0.05 },
    })

    const dayPool = useMemo(() => buildBirdPool('day'), [])
    const nightPool = useMemo(() => buildBirdPool('night'), [])
    const nextBirdCallAt = useRef(0)

    const nightBlend = getNightBlend(timeOfDay)
    const targetCount = (isNight ? NIGHT_AIRBORNE_TARGET[qualityPreset] : DAY_AIRBORNE_TARGET[qualityPreset]) * countScale
    const activeBirds = (isNight ? nightPool : dayPool).slice(0, Math.max(2, Math.round(targetCount)))

    const currentShip = currentShipId ? ships.find((s) => s.id === currentShipId) : undefined
    const showShip = useMemo(() => {
        for (const [shipId, active] of musicPlaying.entries()) {
            if (active) return ships.find((s) => s.id === shipId)
        }
        if (!currentShip) return undefined
        const installedCount = installedUpgrades.filter((u) => u.shipId === currentShip.id).length
        const fullyUpgraded = installedCount >= Math.max(1, currentShip.attachmentPoints.length)
        return fullyUpgraded || currentShip.version === '2.0' ? currentShip : undefined
    }, [currentShip, installedUpgrades, musicPlaying, ships])

    const heroTarget: [number, number, number] | undefined = showShip
        ? [showShip.position[0], showShip.position[1] + 4.5, showShip.position[2]]
        : undefined

    const getJibPerchTarget = useMemo(() => () => {
        const { trolleyPosition } = useGameStore.getState()
        const trolleyX = (trolleyPosition - 0.5) * 40
        return [trolleyX + 0.9, 15.15, 6.15] as [number, number, number]
    }, [])

    const getCounterweightPerchTarget = useMemo(
        () => () => [-12.35, 13.1, 5.8] as [number, number, number],
        []
    )

    const getShipRoostTarget = useMemo(
        () => () => {
            if (!showShip) return [-10, 13.1, 4.8] as [number, number, number]
            return [
                showShip.position[0] - 1.2,
                showShip.position[1] + 8.3,
                showShip.position[2] + showShip.length * 0.2,
            ] as [number, number, number]
        },
        [showShip]
    )

    useFrame((state) => {
        const t = state.clock.elapsedTime
        const showActive = lightingSystem.isShowActive() || !!showShip
        const interval = (isNight ? 11 : 8) / Math.max(0.3, nightActivity)
        if (t < nextBirdCallAt.current) return
        nextBirdCallAt.current = t + interval + Math.random() * 5

        const source = heroTarget ?? getJibPerchTarget()
        const type = isNight && !showActive ? 'distant' : 'seagull'
        void playBirdCall(type, {
            sourcePosition: source,
            listenerPosition: [camera.position.x, camera.position.y, camera.position.z],
        })
    })

    return (
        <group>
            {activeBirds.map((bird) => {
                const speciesScale = isNight
                    ? NIGHT_SPECIES_ACTIVITY[bird.species] * nightActivity
                    : 1

                return (
                    <Bird
                        key={bird.id}
                        instance={bird}
                        isNight={isNight}
                        nightBlend={nightBlend}
                        activityScale={speciesScale}
                        lightIntensity={lightIntensity}
                        reactivity={musicReactivity}
                        attractTarget={heroTarget}
                    />
                )
            })}

            <PerchedBird
                species="gull"
                getPerchTarget={getJibPerchTarget}
                nightBlend={nightBlend}
                lightIntensity={lightIntensity}
                reactivity={musicReactivity}
            />
            <PerchedBird
                species="cormorant"
                getPerchTarget={getCounterweightPerchTarget}
                nightBlend={nightBlend}
                lightIntensity={lightIntensity}
                reactivity={musicReactivity}
            />
            {showShip && (
                <PerchedBird
                    species="gull"
                    getPerchTarget={getShipRoostTarget}
                    nightBlend={nightBlend}
                    lightIntensity={lightIntensity}
                    reactivity={musicReactivity}
                />
            )}
        </group>
    )
}
