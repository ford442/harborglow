/**
 * Thin compatibility barrel — implementation lives in sibling modules.
 * @see ./index.ts
 */
export type {
    AtSeaShip,
    LevaControlsConfig,
    ShipSchedulingConfig,
    SpectatorCameraConfig,
    DepartingShipsConfig,
} from './index'

export {
    NightDockLights,
    NightVolumetricCones,
    WaterLightVolumes,
    SpectatorNightCinematicEffects,
    ShipWrapper,
    SpectatorOverlay,
    triggerGeopoliticalEvent,
    triggerTariffEvent,
    triggerLaborAction,
    triggerPeakSeason,
    useLevaControls,
    useShipScheduling,
    UnderwaterEffects,
    getSunPosition,
    updateSpectatorCamera,
    animateDepartingShips,
} from './index'
import React, { useRef, useMemo, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { Ship, useGameStore, ShipType, CameraMode } from '../../store/useGameStore'
import { musicSystem } from '../../systems/musicSystem'
import { economySystem } from '../../systems/economySystem'
import { lightingSystem } from '../../systems/lightingSystem'
import { ambientMarineLifeSystem } from '../../systems/ambientMarineLifeSystem'
import { timeSystem, DayPhase } from '../../systems/timeSystem'
import { weatherSystem, WeatherType } from '../../systems/weatherSystem'
import { moonSystem, MoonPhaseName } from '../../systems/moonSystem'
import { trafficSystem } from '../../systems/trafficSystem'
import { swaySystem } from '../../systems/swaySystem'
import { stormSystem } from '../../systems/StormSystem'
import { waveSystem } from '../../systems/WaveSystem'
import { trainingSystem, TrainingModuleId } from '../../systems/trainingSystem'
import { dynamicEventSystem } from '../../systems/dynamicEventSystem'
import { reputationSystem } from '../../systems/reputationSystem'
import { harborEventSystem } from '../../systems/eventSystem/HarborEventSystem'
import {
    setCraneSoundVolume,
    setCraneSoundsEnabled,
    playContainerImpact,
    playTwistlockEngage,
} from '../../systems/craneSoundSystem'
import {
    playBirdCall,
    playFoghorn,
    playShipHorn,
    playRadioChatter,
} from '../../systems/ambientSoundSystem'
import ShipComponent from '../Ship'
import { VolumetricLightCone } from '../VolumetricLighting'
import { buildGodRayMaterial, updateGodRay } from '../../shaders/lightShowNodes'
import UnderwaterCamera from '../UnderwaterCamera'

const CAMERA_MODES = [
    'orbit',
    'crane-cockpit',
    'crane-shoulder',
    'crane-top',
    'ship-low',
    'ship-aerial',
    'ship-water',
    'ship-rig',
    'spectator',
    'crane',
    'booth',
] as const

export interface AtSeaShip {
    shipId: string
    returnTime: number
    originalPosition: [number, number, number]
}







export function NightDockLights({ lightIntensity }: { lightIntensity: number }) {
    const beatPulse = lightingSystem.getBeatPulse()
    const pulseBoost = 1 + beatPulse * 0.35
    const scaled = lightIntensity * pulseBoost

    return (
        <>
            {/* Dock amber lights */}
            {[[-20, 8, -8], [0, 8, -8], [20, 8, -8]].map((pos, i) => (
                <pointLight
                    key={i}
                    position={pos as [number, number, number]}
                    intensity={1.2 * scaled}
                    color="#ffaa00"
                    distance={30}
                    decay={2}
                />
            ))}

            {/* Blue underwater glow */}
            <pointLight position={[-30, -3, 10]} intensity={0.8 * scaled} color="#00aaff" distance={40} decay={2} />
            <pointLight position={[30, -3, 10]} intensity={0.8 * scaled} color="#00aaff" distance={40} decay={2} />


            {/* Red warning beacons */}
            <pointLight position={[-25, 15, 0]} intensity={0.5 * scaled} color="#ff0000" distance={20} />
            <pointLight position={[25, 15, 0]} intensity={0.5 * scaled} color="#ff0000" distance={20} />
        </>
    )
}

export function NightVolumetricCones({ lightIntensity, currentShip }: { lightIntensity: number; currentShip?: Ship }) {
    const baseIntensity = Math.max(0.2, lightIntensity)
    const pulse = 1 + lightingSystem.getBeatPulse() * 0.25

    return (
        <>
            <VolumetricLightCone
                type="spot"
                position={[-20, 8, -8]}
                target={[-20, 0, -8]}
                color="#ffbb66"
                intensity={0.28 * baseIntensity}
                angle={Math.PI / 8}
                distance={18}
            />
            <VolumetricLightCone
                type="spot"
                position={[20, 8, -8]}
                target={[20, 0, -8]}
                color="#ffbb66"
                intensity={0.28 * baseIntensity}
                angle={Math.PI / 8}
                distance={18}
            />
            {currentShip && (
                <VolumetricLightCone
                    type="spot"
                    position={[currentShip.position[0], currentShip.position[1] + 10, currentShip.position[2]]}
                    target={[currentShip.position[0], currentShip.position[1] + 1, currentShip.position[2]]}
                    color="#7fc9ff"
                    intensity={0.22 * baseIntensity * pulse}
                    angle={Math.PI / 7}
                    distance={16}
                />
            )}
        </>
    )
}

export function WaterLightVolumes({
    lightIntensity,
    currentShip,
    spreaderPos,
    installedUpgrades,
}: {
    lightIntensity: number
    currentShip?: Ship
    spreaderPos: { x: number; y: number; z: number }
    installedUpgrades: Array<{ shipId: string; partName: string }>
}) {
    const beat = lightingSystem.getBeatPulse()
    const pulse = 1 + beat * 0.35
    const scale = Math.max(0.25, lightIntensity) * pulse

    const progress = currentShip
        ? Math.min(
            1,
            installedUpgrades.filter((u) => u.shipId === currentShip.id).length / Math.max(1, currentShip.attachmentPoints.length)
        )
        : 0

    return (
        <>
            {/* Dock light shafts toward waterline for low-angle/underwater reads */}
            <VolumetricLightCone
                type="spot"
                position={[-30, -1, 10]}
                target={[-30, -7, 10]}
                color="#35b8ff"
                intensity={0.24 * scale}
                angle={Math.PI / 7}
                distance={14}
            />
            <VolumetricLightCone
                type="spot"
                position={[30, -1, 10]}
                target={[30, -7, 10]}
                color="#35b8ff"
                intensity={0.24 * scale}
                angle={Math.PI / 7}
                distance={14}
            />

            {/* Crane hook working beam into water/ship deck vicinity */}
            <VolumetricLightCone
                type="spot"
                position={[spreaderPos.x, spreaderPos.y + 0.6, spreaderPos.z]}
                target={[spreaderPos.x, spreaderPos.y - 5, spreaderPos.z]}
                color="#ffd79e"
                intensity={0.22 * scale}
                angle={Math.PI / 5}
                distance={16}
            />

            {/* Bright ship source, stronger after upgrades */}
            {currentShip && (
                <VolumetricLightCone
                    type="spot"
                    position={[currentShip.position[0], currentShip.position[1] + 7, currentShip.position[2]]}
                    target={[currentShip.position[0], currentShip.position[1] - 2, currentShip.position[2]]}
                    color={currentShip.type === 'tanker' ? '#ff8b45' : '#7fd6ff'}
                    intensity={(0.18 + progress * 0.3) * scale}
                    angle={Math.PI / 6}
                    distance={18}
                />
            )}

            {/* Tanker flare stack ray */}
            {currentShip?.type === 'tanker' && (
                <VolumetricLightCone
                    type="spot"
                    position={[currentShip.position[0] - 2.5, currentShip.position[1] + 9.5, currentShip.position[2] - currentShip.length * 0.22]}
                    target={[currentShip.position[0] - 1.5, currentShip.position[1] - 3, currentShip.position[2] - currentShip.length * 0.05]}
                    color="#ff7d38"
                    intensity={(0.26 + progress * 0.34) * scale}
                    angle={Math.PI / 8}
                    distance={20}
                />
            )}
        </>
    )
}

export function SpectatorNightCinematicEffects({
    isNight,
    lightIntensity,
    spectatorState,
    ships,
    spectatorAngleRef,
}: {
    isNight: boolean
    lightIntensity: number
    spectatorState: { isActive: boolean; targetShipId: string | null; startTime: number; duration: number }
    ships: Ship[]
    spectatorAngleRef: React.MutableRefObject<number>
}) {
    const keyLightRef = useRef<THREE.SpotLight>(null)
    const keyTargetRef = useRef<THREE.Object3D>(null)
    const boostRef = useRef(0)
    const rayPrimaryRef = useRef<THREE.Mesh>(null)
    const raySecondaryRef = useRef<THREE.Mesh>(null)

    const primaryRayMaterial = useMemo(() => buildGodRayMaterial(), [])
    const secondaryRayMaterial = useMemo(() => buildGodRayMaterial(), [])

    useEffect(() => {
        primaryRayMaterial.uniforms.uColor.value = new THREE.Color('#8bd4ff')
        secondaryRayMaterial.uniforms.uColor.value = new THREE.Color('#ffb572')
        if (keyLightRef.current && keyTargetRef.current) {
            keyLightRef.current.target = keyTargetRef.current
        }
        return () => {
            primaryRayMaterial.dispose()
            secondaryRayMaterial.dispose()
        }
    }, [primaryRayMaterial, secondaryRayMaterial])

    useFrame((state) => {
        const targetShip = spectatorState.targetShipId
            ? ships.find((s) => s.id === spectatorState.targetShipId)
            : undefined
        const enabled = isNight && spectatorState.isActive && !!targetShip
        const beat = lightingSystem.getBeatPulse()
        const nowSec = Date.now() / 1000

        const duration = Math.max(1, spectatorState.duration || 10)
        const elapsed = enabled ? Math.max(0, nowSec - spectatorState.startTime / 1000) : 0
        const fadeIn = THREE.MathUtils.clamp(elapsed / 1.25, 0, 1)
        const fadeOut = THREE.MathUtils.clamp((duration - elapsed) / 1.5, 0, 1)
        const targetBoost = enabled
            ? fadeIn * fadeOut * (0.75 + beat * 0.3) * Math.max(0.25, lightIntensity / 1.5)
            : 0
        boostRef.current = THREE.MathUtils.lerp(boostRef.current, targetBoost, 0.08)

        const boost = boostRef.current
        if (!targetShip) {
            if (keyLightRef.current) keyLightRef.current.intensity = 0
            primaryRayMaterial.uniforms.uIntensity.value = 0
            secondaryRayMaterial.uniforms.uIntensity.value = 0
            return
        }

        const shipPos = targetShip.position
        const orbitAhead = spectatorAngleRef.current + Math.PI / 5
        const orbitRadius = Math.max(12, targetShip.length * 0.7)
        const shimmer = 0.85 + Math.sin(state.clock.elapsedTime * 0.55) * 0.15

        if (keyLightRef.current) {
            keyLightRef.current.position.set(
                shipPos[0] + Math.cos(orbitAhead) * orbitRadius,
                shipPos[1] + 8 + Math.sin(state.clock.elapsedTime * 0.3) * 0.5,
                shipPos[2] + Math.sin(orbitAhead) * orbitRadius
            )
            if (keyTargetRef.current) {
                keyTargetRef.current.position.set(shipPos[0], shipPos[1] + 3.2, shipPos[2])
                keyTargetRef.current.updateMatrixWorld()
            }
            keyLightRef.current.intensity = 1.8 * boost * shimmer
            keyLightRef.current.distance = 34
            keyLightRef.current.angle = Math.PI / 6
        }

        if (rayPrimaryRef.current) {
            rayPrimaryRef.current.position.set(shipPos[0], shipPos[1] + 8.5, shipPos[2] - targetShip.length * 0.12)
            rayPrimaryRef.current.rotation.set(0.14, orbitAhead, 0.18)
        }
        if (raySecondaryRef.current) {
            raySecondaryRef.current.position.set(
                shipPos[0] + Math.cos(orbitAhead + 0.8) * 3.8,
                shipPos[1] + 6.8,
                shipPos[2] + Math.sin(orbitAhead + 0.8) * 3.8
            )
            raySecondaryRef.current.rotation.set(0.22, orbitAhead + 0.9, -0.16)
        }

        primaryRayMaterial.uniforms.uIntensity.value = 0.8 * boost * (0.85 + beat * 0.2)
        secondaryRayMaterial.uniforms.uIntensity.value = 0.52 * boost * (0.8 + beat * 0.15)
        updateGodRay(primaryRayMaterial, state.clock.elapsedTime)
        updateGodRay(secondaryRayMaterial, state.clock.elapsedTime + 0.65)
    })

    return (
        <>
            <object3D ref={keyTargetRef} />
            <spotLight
                ref={keyLightRef}
                color="#ffd7a6"
                intensity={0}
                angle={Math.PI / 6}
                penumbra={0.55}
                distance={32}
                decay={2}
            />

            <mesh ref={rayPrimaryRef}>
                <coneGeometry args={[2.1, 16, 18, 1, true]} />
                <primitive object={primaryRayMaterial} attach="material" />
            </mesh>
            <mesh ref={raySecondaryRef}>
                <coneGeometry args={[1.55, 13, 14, 1, true]} />
                <primitive object={secondaryRayMaterial} attach="material" />
            </mesh>
        </>
    )
}

export function ShipWrapper({
    ship,
    departingShips,
    shipPositionsRef,
    atSeaShipsRef
}: {
    ship: Ship
    departingShips: Set<string>
    shipPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
    atSeaShipsRef: React.MutableRefObject<Map<string, AtSeaShip>>
}) {
    if (atSeaShipsRef.current.has(ship.id)) return null

    const animatedPos = departingShips.has(ship.id)
        ? shipPositionsRef.current.get(`${ship.id}_current`)
        : null

    const displayShip: Ship = animatedPos
        ? { ...ship, position: [animatedPos.x, animatedPos.y, animatedPos.z] }
        : ship

    return <ShipComponent ship={displayShip} />
}

export function SpectatorOverlay({ ship, remainingTime }: { ship?: Ship; remainingTime: number }) {
    if (!ship) return null

    const labels: Record<ShipType, string> = {
        cruise: 'Ocean Symphony',
        container: 'Neon Stack',
        tanker: 'Flame Runner',
        bulk: 'Iron Mountain',
        lng: 'Cryo Titan',
        roro: 'Vehicle Voyager',
        research: 'Deep Discoverer',
        droneship: 'Of Course I Still Love You',
        ferry: 'Harbour Light',
        trawler: 'Saltwater',
        horizon: 'Meridian',
        fireboat: 'Rescue Pulse'
    }

    const colors: Record<ShipType, string> = {
        cruise: '#ff6b9d',
        container: '#00d4aa',
        tanker: '#ff9500',
        bulk: '#8b4513',
        lng: '#00ffff',
        roro: '#ff6b35',
        research: '#4169e1',
        droneship: '#ffffff',
        ferry: '#00cc88',
        trawler: '#cc8833',
        horizon: '#3388cc',
        fireboat: '#ff3333'
    }

    return (
        <>
            <div style={{
                position: 'absolute',
                top: '80px',
                left: '20px',
                background: 'rgba(0,0,0,0.7)',
                padding: '12px 20px',
                borderRadius: '8px',
                border: `2px solid ${colors[ship.type]}`,
                pointerEvents: 'none',
                zIndex: 100
            }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    Spectator Drone
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors[ship.type], marginTop: '4px' }}>
                    {labels[ship.type]}
                </div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                    Auto-return in {remainingTime.toFixed(1)}s
                </div>
            </div>

            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100px',
                height: '100px',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 50
            }}>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '4px',
                    height: '4px',
                    backgroundColor: colors[ship.type],
                    borderRadius: '50%'
                }} />
            </div>
        </>
    )
}

// =============================================================================
// HOOKS
// =============================================================================

export interface LevaControlsConfig {
    currentShip?: Ship
    ships: Ship[]
    timeOfDay: number
    setBPM: (bpm: number) => void
    setLyricsSize: (size: number) => void
    setLightIntensity: (intensity: number) => void
    setTimeOfDay: (hour: number) => void
    setCameraMode: (mode: CameraMode) => void
    weather: string
    setWeather: (weather: any) => void
    setCurrentShip: (id: string | null) => void
    multiviewMode: string
    setMultiviewMode: (mode: 'single' | 'quad') => void
    underwaterIntensity: number
    setUnderwaterIntensity: (intensity: number) => void
    cabinViewMode: string
    season: string
    setSeason: (season: any) => void
    wildlifeDensity: number
    setWildlifeDensity: (density: number) => void
    enableMarineLife: boolean
    setEnableMarineLife: (enabled: boolean) => void
}

// Business pattern trigger export functions for Leva
export function triggerGeopoliticalEvent() {
    const regions: ('red_sea' | 'hormuz' | 'panama')[] = ['red_sea', 'hormuz', 'panama']
    const region = regions[Math.floor(Math.random() * regions.length)]
    harborEventSystem.triggerGeopoliticalEvent(region)
}

export function triggerTariffEvent() {
    harborEventSystem.triggerTariffEvent()
}

export function triggerLaborAction() {
    harborEventSystem.triggerLaborAction()
}

export function triggerPeakSeason() {
    harborEventSystem.triggerPeakSeason()
}

export function useLevaControls(config: LevaControlsConfig) {
    const {
        currentShip,
        ships,
        timeOfDay,
        setBPM,
        setLyricsSize,
        setLightIntensity,
        setTimeOfDay,
        setCameraMode,
        weather,
        setWeather,
        setCurrentShip,
        multiviewMode,
        setMultiviewMode,
        underwaterIntensity,
        setUnderwaterIntensity,
        cabinViewMode,
        season,
        setSeason,
        wildlifeDensity,
        setWildlifeDensity,
        enableMarineLife,
        setEnableMarineLife
    } = config

    useControls({
        'Current Ship': {
            value: currentShip?.type || 'cruise',
            options: ['cruise', 'container', 'tanker'],
            onChange: (value: ShipType) => {
                const ship = ships.find(s => s.type === value)
                if (ship) setCurrentShip(ship.id)
            }
        },
        'Music BPM': {
            value: 128,
            min: 60,
            max: 200,
            onChange: (value: number) => {
                setBPM(value)
                musicSystem.setBPM(value)
            }
        },
        'Lyrics Size': {
            value: 28,
            min: 12,
            max: 72,
            onChange: setLyricsSize
        },
        'Light Intensity': {
            value: 1.5,
            min: 0.1,
            max: 5,
            onChange: setLightIntensity
        },
        'Time of Day': {
            value: timeOfDay,
            min: 0,
            max: 24,
            step: 0.5,
            onChange: (hour: number) => {
                setTimeOfDay(hour)
                timeSystem.setGameTime(hour)
            }
        },
        'Time Speed': {
            value: 20,
            min: 1,
            max: 120,
            step: 1,
            onChange: (speed: number) => {
                timeSystem.setTimeScale(speed)
            }
        },
        'Jump to Phase': {
            value: 'sunrise',
            options: ['pre_dawn', 'sunrise', 'mid_morning', 'midday', 'golden_hour', 'night'],
            onChange: (phase: DayPhase) => {
                timeSystem.jumpToPhase(phase)
            }
        },
        'Fog Density': {
            value: 0.02,
            min: 0,
            max: 0.1,
            step: 0.001
        },
        'Marine Layer': {
            value: true
        },
        'Rail Activity': {
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.1
        },
        'Camera Mode': {
            value: 'orbit',
            options: CAMERA_MODES,
            onChange: (mode: string) => {
                setCameraMode(mode as CameraMode)
            }
        },
        'Weather': {
            value: weather,
            options: ['clear', 'rain', 'fog', 'storm', 'golden_hour'],
            onChange: (w: string) => {
                setWeather(w as any)
                weatherSystem.forceWeather(w as WeatherType)
            }
        },
        'Cabin View': {
            value: cabinViewMode,
            options: ['multiview', 'immersive'],
            onChange: (mode: string) => {
                useGameStore.getState().setCabinViewMode(mode as any)
            }
        },
        'Underwater Intensity': {
            value: underwaterIntensity,
            min: 0,
            max: 2,
            step: 0.1,
            onChange: setUnderwaterIntensity
        },
        // Marine Life folder
        'Enable Marine Life': {
            value: enableMarineLife,
            folder: 'Marine Life',
            onChange: setEnableMarineLife
        },
        'Wildlife Density': {
            value: wildlifeDensity,
            min: 0,
            max: 1,
            step: 0.05,
            folder: 'Marine Life',
            onChange: setWildlifeDensity
        },
        'Beat Reactivity': {
            value: ambientMarineLifeSystem.getBeatReactivity(),
            min: 0,
            max: 1,
            step: 0.05,
            folder: 'Marine Life',
            onChange: (value: number) => {
                ambientMarineLifeSystem.setBeatReactivity(value)
            }
        },
        'Season': {
            value: season,
            options: ['spring', 'summer', 'fall', 'winter'],
            folder: 'Marine Life',
            onChange: setSeason
        },
        // Phase 9: Attachment System Controls
        'Show Attachments': {
            value: true,
            folder: 'Attachment System',
            onChange: (value: boolean) => {
                useGameStore.getState().setAttachmentSystemConfig({ showPoints: value })
            }
        },
        'Attachment Range': {
            value: 15,
            min: 5,
            max: 50,
            step: 1,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ visibilityRange: value })
            }
        },
        'Snap Radius': {
            value: 5,
            min: 1,
            max: 10,
            step: 0.5,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ snapRadius: value })
            }
        },
        'Snap Strength': {
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.1,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ snapStrength: value })
            }
        },
        'Cable Visibility': {
            value: true,
            folder: 'Attachment System',
            onChange: (value: boolean) => {
                useGameStore.getState().setAttachmentSystemConfig({ showCable: value })
            }
        },
        'Magnetic Enabled': {
            value: true,
            folder: 'Attachment System',
            onChange: (value: boolean) => {
                useGameStore.getState().setAttachmentSystemConfig({ magneticEnabled: value })
            }
        },
        'Magnetic Strength': {
            value: 4.0,
            min: 0.5,
            max: 12,
            step: 0.25,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ magneticStrength: value })
            }
        },
        'Magnetic Damping': {
            value: 0.85,
            min: 0.3,
            max: 1.2,
            step: 0.05,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ magneticDampingRatio: value })
            }
        },
        'Magnetic Curve': {
            value: 2.0,
            min: 0.5,
            max: 5,
            step: 0.25,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ magneticCurve: value })
            }
        },
        'Release Hysteresis': {
            value: 1.5,
            min: 1.0,
            max: 2.5,
            step: 0.1,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ releaseHysteresis: value })
            }
        },
        'Settle Damping': {
            value: 0.8,
            min: 0.5,
            max: 1.0,
            step: 0.05,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ settleDampingMultiplier: value })
            }
        },
        'Settle Duration (ms)': {
            value: 1000,
            min: 200,
            max: 3000,
            step: 100,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ settleDurationMs: value })
            }
        },
        'Capture Velocity': {
            value: 6.0,
            min: 1,
            max: 15,
            step: 0.5,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ captureVelocity: value })
            }
        },
        // Moon System Controls
        'Moon Phase': {
            value: 'full_moon',
            options: ['new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous', 'full_moon', 'waning_gibbous', 'last_quarter', 'waning_crescent'],
            folder: 'Moon System',
            onChange: (phase: MoonPhaseName) => {
                moonSystem.setPhaseOverride(phase)
            }
        },
        'Clear Moon Override': {
            value: false,
            folder: 'Moon System',
            onChange: () => {
                moonSystem.setPhaseOverride(null)
            }
        },
        'Moon Brightness': {
            value: 1.0,
            min: 0,
            max: 2,
            step: 0.1,
            folder: 'Moon System',
            onChange: (value: number) => {
                moonSystem.setBrightnessMultiplier(value)
            }
        },
        'Tide Strength': {
            value: 1.0,
            min: 0,
            max: 3,
            step: 0.1,
            folder: 'Moon System',
            onChange: (value: number) => {
                moonSystem.setTideStrength(value)
            }
        },
        'Jump to Next Phase': {
            value: false,
            folder: 'Moon System',
            onChange: () => {
                const phases: MoonPhaseName[] = ['new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous', 'full_moon', 'waning_gibbous', 'last_quarter', 'waning_crescent']
                const currentPhase = moonSystem.getPhase()
                const nextIndex = (phases.indexOf(currentPhase) + 1) % phases.length
                moonSystem.jumpToPhase(phases[nextIndex])
            }
        },
        // Traffic System Controls
        'Traffic Density': {
            value: 1.0,
            min: 0.1,
            max: 3.0,
            step: 0.1,
            folder: 'Traffic System',
            onChange: (value: number) => {
                trafficSystem.setDensityMultiplier(value)
            }
        },
        'Time Pressure': {
            value: 1.0,
            min: 0.5,
            max: 2.0,
            step: 0.1,
            folder: 'Traffic System',
            onChange: (value: number) => {
                trafficSystem.setTimePressureMultiplier(value)
            }
        },
        'Simulate Event': {
            value: 'none',
            options: ['none', 'surge', 'strike', 'storm_delay'],
            folder: 'Traffic System',
            onChange: (value: string) => {
                trafficSystem.setSimulationEvent(value === 'none' ? null : value)
            }
        },
        'Force Next Ship': {
            value: false,
            folder: 'Traffic System',
            onChange: () => {
                const docked = trafficSystem.getDockedShip()
                if (docked) {
                    trafficSystem.requestEarlyDeparture(docked.id)
                }
            }
        },
        // Sway System Controls
        'Base Damping': {
            value: 1.0,
            min: 0.5,
            max: 2.0,
            step: 0.1,
            folder: 'Sway System',
            onChange: (value: number) => {
                swaySystem.setDebugDampingMultiplier(value)
            }
        },
        'Load Weight Mult': {
            value: 1.0,
            min: 0.5,
            max: 3.0,
            step: 0.1,
            folder: 'Sway System',
            onChange: (value: number) => {
                swaySystem.setDebugLoadMultiplier(value)
            }
        },
        'Gust Multiplier': {
            value: 1.0,
            min: 0,
            max: 3.0,
            step: 0.1,
            folder: 'Sway System',
            onChange: (value: number) => {
                swaySystem.setDebugGustMultiplier(value)
            }
        },
        'Gust Frequency': {
            value: 1.0,
            min: 0.1,
            max: 3.0,
            step: 0.1,
            folder: 'Sway System',
            onChange: (value: number) => {
                swaySystem.setDebugGustFrequencyMultiplier(value)
            }
        },
        'Gust Duration Min': {
            value: 0.8,
            min: 0.2,
            max: 2.0,
            step: 0.1,
            folder: 'Sway System',
            onChange: (value: number) => {
                swaySystem.setDebugGustDurationRange(value, 4.0)
            }
        },
        'Gust Duration Max': {
            value: 4.0,
            min: 1.0,
            max: 8.0,
            step: 0.1,
            folder: 'Sway System',
            onChange: (value: number) => {
                swaySystem.setDebugGustDurationRange(0.8, value)
            }
        },
        'Show Debug': {
            value: false,
            folder: 'Sway System',
            onChange: (value: boolean) => {
                swaySystem.setShowDebugLines(value)
            }
        },
        // Weather Controls
        'Force Weather': {
            value: 'clear',
            options: ['clear', 'fog', 'rain', 'storm', 'golden_hour'],
            folder: 'Weather',
            onChange: (value: WeatherType) => {
                weatherSystem.forceWeather(value)
            }
        },
        'Clear Weather Override': {
            value: false,
            folder: 'Weather',
            onChange: () => {
                weatherSystem.clearOverride()
            }
        },
        // Storm System Controls
        'Storm Active': {
            value: false,
            folder: 'Storm System',
            onChange: (value: boolean) => {
                useGameStore.getState().setStormActive(value)
                if (value) {
                    stormSystem.start(180)
                } else {
                    stormSystem.stop()
                }
            }
        },
        'Storm Intensity': {
            value: 0,
            min: 0,
            max: 1,
            step: 0.05,
            folder: 'Storm System',
            onChange: (value: number) => {
                useGameStore.getState().setStormIntensity(value)
                waveSystem.setStormIntensity(value)
            }
        },
        'Wind Direction': {
            value: 0,
            min: 0,
            max: 360,
            step: 5,
            folder: 'Storm System',
            onChange: (value: number) => {
                useGameStore.getState().setWindDirection((value * Math.PI) / 180)
            }
        },
        'Wind Strength': {
            value: 0,
            min: 0,
            max: 30,
            step: 1,
            folder: 'Storm System',
            onChange: (value: number) => {
                useGameStore.getState().setWindStrength(value)
            }
        },
        'Rain Density': {
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.05,
            folder: 'Storm System',
            onChange: (value: number) => {
                useGameStore.getState().setRainDensity(value)
            }
        },
        'Start Storm Rescue': {
            value: false,
            folder: 'Storm System',
            onChange: () => {
                const store = useGameStore.getState()
                if (store.operationMode !== 'tugboat') {
                    store.setOperationMode('tugboat')
                }
                // Wait for objectives to spawn then replace first with mission
                setTimeout(() => {
                    const objectives = store.tugboatObjectives
                    if (objectives.length > 0 && !store.activeMission) {
                        const target = objectives[0]
                        const rewards: Record<string, number> = {
                            cruise: 800, container: 1200, tanker: 1500,
                            bulk: 1000, lng: 1400, roro: 900,
                            research: 700, droneship: 600
                        }
                        store.setActiveMission({
                            id: `rescue-${Date.now()}`,
                            type: 'storm_rescue',
                            targetShipType: target.shipType,
                            targetShipId: target.id,
                            timeLimit: 120,
                            timeRemaining: 120,
                            damage: 0,
                            maxDamage: 100,
                            reward: rewards[target.shipType] || 1000,
                            status: 'active',
                            berthCenter: target.berthCenter,
                            berthRadius: target.berthRadius,
                        })
                        stormSystem.start(180)
                        console.log('🆘 Storm Rescue mission started!')
                    }
                }, 100)
            }
        },
        // Tugboat Mode Controls
        'Force Operation Mode': {
            value: 'crane',
            options: ['crane', 'tugboat', 'walking'],
            folder: 'Tugboat Mode',
            onChange: (value: string) => {
                useGameStore.getState().setOperationMode(value as 'crane' | 'tugboat' | 'walking')
            }
        },
        'Storm Duration': {
            value: 180,
            min: 60,
            max: 300,
            step: 10,
            folder: 'Tugboat Mode',
            onChange: (value: number) => {
                if (stormSystem.isActive()) {
                    stormSystem.start(value)
                }
            }
        },
        'Wind Force Multiplier': {
            value: 1.0,
            min: 0,
            max: 3,
            step: 0.1,
            folder: 'Tugboat Mode',
        },
        // Tugboat Environment — hydrodynamic shear tuning
        'Crosscurrent Strength': {
            value: 1.0,
            min: 0,
            max: 3,
            step: 0.1,
            folder: 'Tugboat Environment',
            onChange: (value: number) => {
                stormSystem.crosscurrentStrength = value
            }
        },
        'Wind Shear Scale': {
            value: 1.0,
            min: 0,
            max: 4,
            step: 0.1,
            folder: 'Tugboat Environment',
            onChange: (value: number) => {
                stormSystem.shearTorqueScale = value
            }
        },
        // Training System Controls
        'Quick Start Module': {
            value: 'none',
            options: ['none', 'basic-hooks', 'precision', 'wind-sway', 'night-ops', 'multi-crane', 'emergency', 'light-show'],
            folder: 'Training System',
            onChange: (value: string) => {
                if (value !== 'none') {
                    trainingSystem.startModule(value as TrainingModuleId)
                }
            }
        },
        'Unlock All Modules': {
            value: false,
            folder: 'Training System',
            onChange: () => {
                trainingSystem.unlockAll()
            }
        },
        'Complete All Modules': {
            value: false,
            folder: 'Training System',
            onChange: () => {
                trainingSystem.completeAll()
            }
        },
        'Reset Training': {
            value: false,
            folder: 'Training System',
            onChange: () => {
                trainingSystem.reset()
            }
        },
        // Dynamic Event System Controls
        'Force Storm Event': {
            value: false,
            folder: 'Dynamic Events',
            onChange: () => {
                dynamicEventSystem.forceEvent('atmospheric_river', 0.9)
            }
        },
        'Force Whale Migration': {
            value: false,
            folder: 'Dynamic Events',
            onChange: () => {
                dynamicEventSystem.forceEvent('whale_migration', 0.8)
            }
        },
        'Force Ship Fire': {
            value: false,
            folder: 'Dynamic Events',
            onChange: () => {
                dynamicEventSystem.forceEvent('ship_fire', 0.9)
            }
        },
        'Force Navy Visit': {
            value: false,
            folder: 'Dynamic Events',
            onChange: () => {
                dynamicEventSystem.forceEvent('navy_fleet_week', 0.8)
            }
        },
        'Force Plankton Bloom': {
            value: false,
            folder: 'Dynamic Events',
            onChange: () => {
                dynamicEventSystem.forceEvent('plankton_bloom', 0.85)
            }
        },
        'Clear Dynamic Events': {
            value: false,
            folder: 'Dynamic Events',
            onChange: () => {
                dynamicEventSystem.clearAllEvents()
            }
        },
        'Event Spawn Rate': {
            value: 1.0,
            min: 0,
            max: 3,
            step: 0.1,
            folder: 'Dynamic Events',
            onChange: (value: number) => {
                // Modify event spawn rates
            }
        },
        // Reputation System Controls
        'Add Reputation': {
            value: 100,
            min: 0,
            max: 1000,
            step: 50,
            folder: 'Reputation System',
            onChange: (value: number) => {
                reputationSystem.addDebugReputation(value)
            }
        },
        'Set Tier': {
            value: 'novice',
            options: ['novice', 'apprentice', 'operator', 'veteran', 'expert', 'master', 'legendary'],
            folder: 'Reputation System',
            onChange: (tier: string) => {
                reputationSystem.forceTier(tier as any)
            }
        },
        'Reset Reputation': {
            value: false,
            folder: 'Reputation System',
            onChange: () => {
                reputationSystem.reset()
            }
        },
        'Simulate Installation': {
            value: false,
            folder: 'Reputation System',
            onChange: () => {
                reputationSystem.recordInstallation({
                    success: true,
                    timeSeconds: 25,
                    swayPercent: 0.15,
                    damage: 0
                })
            }
        },
        'Simulate Perfect Install': {
            value: false,
            folder: 'Reputation System',
            onChange: () => {
                reputationSystem.recordInstallation({
                    success: true,
                    timeSeconds: 20,
                    swayPercent: 0.05,
                    damage: 0
                })
            }
        },
        // Sound System Controls
        'Master Volume': {
            value: -8,
            min: -30,
            max: 0,
            step: 1,
            folder: 'Sound Design',
            onChange: (value: number) => {
                setCraneSoundVolume(value)
            }
        },
        'Crane Sounds': {
            value: true,
            folder: 'Sound Design',
            onChange: (enabled: boolean) => {
                setCraneSoundsEnabled(enabled)
            }
        },
        'Play Bird Call': {
            value: false,
            folder: 'Sound Design',
            onChange: () => playBirdCall()
        },
        'Play Foghorn': {
            value: false,
            folder: 'Sound Design',
            onChange: () => playFoghorn()
        },
        'Play Ship Horn': {
            value: false,
            folder: 'Sound Design',
            onChange: () => playShipHorn('far')
        },
        'Play Radio Chatter': {
            value: false,
            folder: 'Sound Design',
            onChange: () => {
                playRadioChatter()
            }
        },
        'Test Impact Sound': {
            value: false,
            folder: 'Sound Design',
            onChange: () => playContainerImpact('medium')
        },
        'Test Lock Sound': {
            value: false,
            folder: 'Sound Design',
            onChange: () => playTwistlockEngage()
        },
        // Economy System Controls
        'Set Credits': {
            value: 0,
            min: 0,
            max: 10000,
            step: 100,
            folder: 'Economy System',
            onChange: (value: number) => {
                economySystem.setCredits(value)
            }
        },
        'Set Reputation': {
            value: 0,
            min: 0,
            max: 1000,
            step: 10,
            folder: 'Economy System',
            onChange: (value: number) => {
                economySystem.setReputation(value)
            }
        },
        'Eco: Simulate Install': {
            value: false,
            folder: 'Economy System',
            onChange: () => {
                economySystem.recordInstallation({
                    rigType: 'rgb_matrix',
                    timeSeconds: 25,
                    targetTimeSeconds: 30,
                    swayPercent: 0.15,
                    syncAccuracy: 0.7,
                    weather: 'clear',
                    isEventActive: false
                })
            }
        },
        'Eco: Simulate Perfect': {
            value: false,
            folder: 'Economy System',
            onChange: () => {
                economySystem.recordInstallation({
                    rigType: 'rgb_matrix',
                    timeSeconds: 20,
                    targetTimeSeconds: 30,
                    swayPercent: 0.05,
                    syncAccuracy: 0.9,
                    weather: 'clear',
                    isEventActive: false
                })
            }
        },
        'Simulate Shift': {
            value: false,
            folder: 'Economy System',
            onChange: () => {
                economySystem.simulateShift(5, 0.6)
            }
        },
        'End Shift': {
            value: false,
            folder: 'Economy System',
            onChange: () => {
                const result = economySystem.endShift()
                console.log(`Shift ended: ${result.credits} HC earned, ${result.reputation} rep gained`)
            }
        },
        'Reset Economy': {
            value: false,
            folder: 'Economy System',
            onChange: () => {
                economySystem.reset()
            }
        },
        // Wave System Controls
        'Wave Amplitude': {
            value: 1.0,
            min: 0.1,
            max: 3.0,
            step: 0.1,
            folder: 'Wave System',
            onChange: (value: number) => {
                useGameStore.getState().setWaveParams({ amplitude: value })
                waveSystem.setParams({ amplitude: value })
            }
        },
        'Wave Speed': {
            value: 1.0,
            min: 0.1,
            max: 3.0,
            step: 0.1,
            folder: 'Wave System',
            onChange: (value: number) => {
                useGameStore.getState().setWaveParams({ speed: value })
                waveSystem.setParams({ speed: value })
            }
        },
        'Wave Chaos': {
            value: 0.0,
            min: 0,
            max: 1.0,
            step: 0.05,
            folder: 'Wave System',
            onChange: (value: number) => {
                useGameStore.getState().setWaveParams({ chaos: value })
                waveSystem.setParams({ chaos: value })
            }
        },
        'Reset Waves': {
            value: false,
            folder: 'Wave System',
            onChange: () => {
                useGameStore.getState().setWaveParams({ amplitude: 1.0, speed: 1.0, chaos: 0.0 })
                waveSystem.setParams({ amplitude: 1.0, speed: 1.0, chaos: 0.0 })
            }
        }
    })
}

export interface ShipSchedulingConfig {
    ships: Ship[]
    departingShips: Set<string>
    setDepartingShips: (ships: Set<string>) => void
    atSeaShipsRef: React.MutableRefObject<Map<string, AtSeaShip>>
    shipPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
    scheduleDeparture: (shipId: string) => void
    returnToDock: (shipId: string) => void
}

export function useShipScheduling(config: ShipSchedulingConfig) {
    const {
        ships,
        departingShips,
        setDepartingShips,
        atSeaShipsRef,
        shipPositionsRef,
        scheduleDeparture,
        returnToDock
    } = config

    useEffect(() => {
        // Schedule initial departures
        ships.forEach(ship => {
            if (ship.isDocked !== false && !ship.sailTime &&
                !departingShips.has(ship.id) &&
                !atSeaShipsRef.current.has(ship.id)) {
                scheduleDeparture(ship.id)
            }
        })

        const interval = setInterval(() => {
            const now = Date.now()

            // Check for departing ships
            ships.forEach(ship => {
                if (ship.sailTime && now >= ship.sailTime &&
                    !departingShips.has(ship.id) &&
                    !atSeaShipsRef.current.has(ship.id)) {

                    shipPositionsRef.current.set(ship.id, new THREE.Vector3(...ship.position))
                    setDepartingShips(new Set([...departingShips, ship.id]))
                }
            })

            // Check for returning ships
            atSeaShipsRef.current.forEach((atSeaShip, shipId) => {
                if (now >= atSeaShip.returnTime) {
                    atSeaShipsRef.current.delete(shipId)
                    returnToDock(shipId)
                    setTimeout(() => scheduleDeparture(shipId), 5000)
                }
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [ships, departingShips, scheduleDeparture, returnToDock, atSeaShipsRef, shipPositionsRef, setDepartingShips])
}

// =============================================================================
// HELPERS
// =============================================================================

export function UnderwaterEffects() {
  const cameraMode = useGameStore(s => s.cameraMode)
  const { camera } = useThree()
  const [show, setShow] = useState(false)

  useFrame(() => {
    setShow(cameraMode === 'ship-water' || camera.position.y < -1)
  })

  if (!show) return null
  return <UnderwaterCamera intensity={1.2} />
}

export function getSunPosition(hour: number): [number, number, number] {
    const angle = ((hour - 12) / 12) * Math.PI
    return [
        Math.sin(angle) * 50,
        Math.cos(angle) * 50,
        20
    ]
}

export interface SpectatorCameraConfig {
    spectatorState: { isActive: boolean; targetShipId: string | null }
    ships: Ship[]
    delta: number
    spectatorAngleRef: React.MutableRefObject<number>
    cameraMode: string
    orbitControlsRef: React.MutableRefObject<any>
}

export function updateSpectatorCamera(config: SpectatorCameraConfig) {
    const { spectatorState, ships, delta, spectatorAngleRef, cameraMode, orbitControlsRef } = config

    if (spectatorState.isActive && spectatorState.targetShipId) {
        const targetShip = ships.find(s => s.id === spectatorState.targetShipId)
        if (targetShip) {
            spectatorAngleRef.current += delta * 0.3
        }
    } else if (cameraMode === 'orbit' && orbitControlsRef.current) {
        orbitControlsRef.current.update()
    }
}

export interface DepartingShipsConfig {
    departingShips: Set<string>
    shipPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
    delta: number
    setDepartingShips: (ships: Set<string>) => void
    atSeaShipsRef: React.MutableRefObject<Map<string, AtSeaShip>>
    returnToDock: (shipId: string) => void
}

export function animateDepartingShips(config: DepartingShipsConfig) {
    const { departingShips, shipPositionsRef, delta, setDepartingShips, atSeaShipsRef, returnToDock } = config

    departingShips.forEach(shipId => {
        const originalPos = shipPositionsRef.current.get(shipId)
        if (!originalPos) return

        let currentPos = shipPositionsRef.current.get(`${shipId}_current`)
        if (!currentPos) {
            currentPos = originalPos.clone()
            shipPositionsRef.current.set(`${shipId}_current`, currentPos)
        }

        currentPos.z += delta * 20

        if (currentPos.z > originalPos.z + 100) {
            setDepartingShips(new Set([...departingShips].filter(id => id !== shipId)))

            atSeaShipsRef.current.set(shipId, {
                shipId,
                returnTime: Date.now() + 10000,
                originalPosition: [originalPos.x, originalPos.y, originalPos.z]
            })

            shipPositionsRef.current.delete(`${shipId}_current`)
            returnToDock(shipId)
        }
    })
}
