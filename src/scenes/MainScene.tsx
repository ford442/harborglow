import { LevaControlsConfig, ShipSchedulingConfig, SpectatorCameraConfig, DepartingShipsConfig, NightDockLights, NightVolumetricCones, WaterLightVolumes, SpectatorNightCinematicEffects, ShipWrapper, SpectatorOverlay, triggerGeopoliticalEvent, triggerTariffEvent, triggerLaborAction, triggerPeakSeason, useLevaControls, useShipScheduling, UnderwaterEffects, getSunPosition, updateSpectatorCamera, animateDepartingShips } from './mainScene/MainSceneHelpers';
import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'

import { useGameStore, ShipType, Ship, CameraMode, GameMode } from '../store/useGameStore'
import { TrainingModuleId, trainingSystem } from '../systems/trainingSystem'
import { reputationSystem } from '../systems/reputationSystem'
import { economySystem } from '../systems/economySystem'
import { musicSystem } from '../systems/musicSystem'
import { lightingSystem } from '../systems/lightingSystem'
import { triggerUpgradeCinematic } from '../systems/cinematicSystem'
import { triggerTugObjectiveCinematic, triggerTugWinCinematic, triggerSalvageCinematic } from '../systems/tugCinematicSystem'
import { weatherSystem, WeatherType } from '../systems/weatherSystem'
import { swaySystem } from '../systems/swaySystem'
import { useCinematicCamera } from '../systems/cameraSystem'
import { useAudioVisualSync } from '../systems/audioVisualSync'
import { timeSystem, DayPhase, PHASES, getPhaseDescription } from '../systems/timeSystem'
import { moonSystem, MOON_PHASES, MoonPhaseName, getPhaseGameplayEffects } from '../systems/moonSystem'
import { trafficSystem } from '../systems/trafficSystem'
import AttachmentSystemManager from '../components/AttachmentSystemManager'
import CraneAutoPilot from '../components/CraneAutoPilot'
import { startAmbientSystem, stopAmbientSystem, playRadioChatter, playBirdCall, playFoghorn, playShipHorn } from '../systems/ambientSoundSystem'
import { setCraneSoundVolume, setCraneSoundsEnabled, playContainerImpact, playTwistlockEngage } from '../systems/craneSoundSystem'

import ShipComponent from './Ship'
import Crane from './Crane'
import Tugboat from './Tugboat'
import TugboatTargetShip from './TugboatTargetShip'
import DistressedShip from './DistressedShip'
import Player from './Player'
import Dock from './Dock'
import DockWalkEnvironment from './DockWalkEnvironment'
import BaseHarborLighting from './BaseHarborLighting'
import Water from './Water'
import FoamSystem from './FoamSystem'
import { stormSystem } from '../systems/StormSystem'
import { waveSystem } from '../systems/WaveSystem'
import { useCameraTransition } from '../hooks/useCameraTransition'
import { useVisualPolishControls } from '../hooks/useVisualPolishControls'
import GlobalIllumination from './GlobalIllumination'
import AudioReactiveLightShow from './AudioReactiveLightShow'
import { HolographicElements } from './HolographicUI'
import EnhancedWeather from './EnhancedWeather'
import PostProcessing from './PostProcessing'
import LightFlareSystem from './LightFlareSystem'
import { TankerFlareHeat } from './lightRigs'
import { buildGodRayMaterial, updateGodRay } from '../shaders/lightShowNodes'
import WildlifeRenderer from './Wildlife'
import AmbientMarineLife from './AmbientMarineLife'
import SeaEvents from './SeaEvents'
import ControlBooth from './ControlBooth'
import OnDockRail from './OnDockRail'
import SeaBirds from './SeaBirds'
import UnderwaterCamera from './UnderwaterCamera'
import HarborAmbiance from './HarborAmbiance'
import DistantShipQueue from './DistantShipQueue'
import { wildlifeSystem } from '../systems/wildlifeSystem'
import { ambientMarineLifeSystem } from '../systems/ambientMarineLifeSystem'
import { seaEventsSystem } from '../systems/seaEventsSystem'
import { harborEventSystem } from '../systems/eventSystem/HarborEventSystem'
import { dynamicEventSystem } from '../systems/dynamicEventSystem'
import { experimentalTechSystem } from '../systems/techSystem'
import { setSceneCamera } from '../utils/sceneCamera'

// =============================================================================
// CONSTANTS
// =============================================================================

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
    'booth'
] as const

// Total crane jib travel span in world units (matches Crane.tsx trolley calc)
const CRANE_JIB_SPAN = 40
// Trolley rail height above the scene origin (matches Crane.tsx jib Y)
const CRANE_TROLLEY_HEIGHT = 9.2

// =============================================================================
// TYPES
// =============================================================================

interface AtSeaShip {
    shipId: string
    returnTime: number
    originalPosition: [number, number, number]
}

interface MainSceneProps {
    /** Harbor theme for appearance */
    harborTheme?: 'industrial' | 'arctic' | 'tropical'
}

// =============================================================================
// MAIN SCENE COMPONENT
// =============================================================================

export default function MainScene({ harborTheme = 'industrial' }: MainSceneProps = {}) {
    useVisualPolishControls()

    // Store selectors
    const ships = useGameStore(s => s.ships)
    const currentShipId = useGameStore(s => s.currentShipId)
    const spectatorState = useGameStore(s => s.spectatorState)
    const cameraMode = useGameStore(s => s.cameraMode)
    const isNight = useGameStore(s => s.isNight)
    const timeOfDay = useGameStore(s => s.timeOfDay)
    const stormIntensity = useGameStore(s => s.stormIntensity)
    const weather = useGameStore(s => s.weather)
    const lightIntensity = useGameStore(s => s.lightIntensity)
    const spreaderPos = useGameStore(s => s.spreaderPos)
    const installedUpgrades = useGameStore(s => s.installedUpgrades)
    const multiviewMode = useGameStore(s => s.multiviewMode)
    const underwaterIntensity = useGameStore(s => s.underwaterIntensity)
    const cabinViewMode = useGameStore(s => s.cabinViewMode)
    const operationMode = useGameStore(s => s.operationMode)
    const gameMode = useGameStore(s => s.gameMode)
    const currentTrainingModule = useGameStore(s => s.currentTrainingModule)
    const tugboatObjectives = useGameStore(s => s.tugboatObjectives)
    const tugboatDockedCount = useGameStore(s => s.tugboatDockedCount)
    const tugboatWinTriggered = useGameStore(s => s.tugboatWinTriggered)
    const tugboatCareerStats = useGameStore(s => s.tugboatCareerStats)
    const season = useGameStore(s => s.season)
    const wildlifeDensity = useGameStore(s => s.wildlifeDensity)
    const enableMarineLife = useGameStore(s => s.enableMarineLife)
    
    // Actions
    const setBPM = useGameStore(s => s.setBPM)
    const setLyricsSize = useGameStore(s => s.setLyricsSize)
    const setLightIntensity = useGameStore(s => s.setLightIntensity)
    const setTimeOfDay = useGameStore(s => s.setTimeOfDay)
    const setCameraMode = useGameStore(s => s.setCameraMode)
    const setWeather = useGameStore(s => s.setWeather)
    const setCurrentShip = useGameStore(s => s.setCurrentShip)
    const scheduleDeparture = useGameStore(s => s.scheduleDeparture)
    const returnToDock = useGameStore(s => s.returnToDock)
    const setMultiviewMode = useGameStore(s => s.setMultiviewMode)
    const setUnderwaterIntensity = useGameStore(s => s.setUnderwaterIntensity)
    const setSeason = useGameStore(s => s.setSeason)
    const setWildlifeDensity = useGameStore(s => s.setWildlifeDensity)
    const setEnableMarineLife = useGameStore(s => s.setEnableMarineLife)
    const setTugboatObjectives = useGameStore(s => s.setTugboatObjectives)
    const completeTugboatObjective = useGameStore(s => s.completeTugboatObjective)
    const triggerTugboatWin = useGameStore(s => s.triggerTugboatWin)
    const resetTugboatMode = useGameStore(s => s.resetTugboatMode)
    const activeMission = useGameStore(s => s.activeMission)
    const setActiveMission = useGameStore(s => s.setActiveMission)
    const updateMission = useGameStore(s => s.updateMission)
    const completeMission = useGameStore(s => s.completeMission)
    const failMission = useGameStore(s => s.failMission)

    // Local state
    const [departingShips, setDepartingShips] = useState<Set<string>>(new Set())
    
    // Refs
    const orbitControlsRef = useRef<any>(null)
    const spectatorAngleRef = useRef(0)
    const atSeaShipsRef = useRef<Map<string, AtSeaShip>>(new Map())
    const shipPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map())
    // Reusable vector for swaySystem — avoids per-frame allocation
    const swayTrolleyVecRef = useRef(new THREE.Vector3())
    const { camera } = useThree()

    useEffect(() => {
        setSceneCamera(camera)
        return () => setSceneCamera(null)
    }, [camera])
    
    // Derived values
    const currentShip = useMemo(() => 
        ships.find(s => s.id === currentShipId),
        [ships, currentShipId]
    )

    // Initialize systems
    const cameraHooksEnabled = cameraMode !== 'onFoot'
    useCinematicCamera(cameraHooksEnabled)
    useCameraTransition(cameraHooksEnabled)
    const { audioData } = useAudioVisualSync()

    // Tugboat mode: spawn objectives when entering tugboat mode
    useEffect(() => {
        if (operationMode === 'tugboat' && tugboatObjectives.length === 0 && !tugboatWinTriggered) {
            const trainingObjectivesByModule: Partial<Record<TrainingModuleId, ReturnType<typeof useGameStore.getState>['tugboatObjectives']>> = {
                'tugboat-basics': [
                    {
                        id: 'tug-training-basics-1',
                        label: 'Training Berth Alpha',
                        berthCenter: [-10, 0, -18],
                        berthRadius: 10,
                        completed: false,
                        shipType: 'container',
                    },
                ],
                'twin-screw-differential': [
                    {
                        id: 'tug-training-diff-1',
                        label: 'Training Berth Beta',
                        berthCenter: [0, 0, -24],
                        berthRadius: 7,
                        completed: false,
                        shipType: 'tanker',
                    },
                    {
                        id: 'tug-training-diff-2',
                        label: 'Training Berth Alpha',
                        berthCenter: [-14, 0, -16],
                        berthRadius: 7,
                        completed: false,
                        shipType: 'container',
                    },
                ],
                'acoustic-handshake': [
                    {
                        id: 'tug-training-acoustic-1',
                        label: 'Signal Berth Echo',
                        berthCenter: [12, 0, -20],
                        berthRadius: 8,
                        completed: false,
                        shipType: 'bulk',
                    },
                ],
                'storm-rescue': [
                    {
                        id: 'tug-training-storm-1',
                        label: 'Rescue Berth Gamma',
                        berthCenter: [15, 0, -20],
                        berthRadius: 8,
                        completed: false,
                        shipType: 'container',
                    },
                    {
                        id: 'tug-training-storm-2',
                        label: 'Rescue Berth Beta',
                        berthCenter: [0, 0, -25],
                        berthRadius: 8,
                        completed: false,
                        shipType: 'tanker',
                    },
                ],
            }

            const objectives = gameMode === 'training' && currentTrainingModule
                ? (trainingObjectivesByModule[currentTrainingModule] ?? [])
                : [
                    {
                        id: 'tug-obj-1',
                        label: 'Berth Alpha',
                        berthCenter: [-15, 0, -20] as [number, number, number],
                        berthRadius: 8,
                        completed: false,
                        shipType: 'container' as ShipType,
                    },
                    {
                        id: 'tug-obj-2',
                        label: 'Berth Beta',
                        berthCenter: [0, 0, -25] as [number, number, number],
                        berthRadius: 8,
                        completed: false,
                        shipType: 'tanker' as ShipType,
                    },
                    {
                        id: 'tug-obj-3',
                        label: 'Berth Gamma',
                        berthCenter: [15, 0, -20] as [number, number, number],
                        berthRadius: 8,
                        completed: false,
                        shipType: 'bulk' as ShipType,
                    },
                ]
            setTugboatObjectives(objectives)
            if (gameMode === 'training' && currentTrainingModule === 'storm-rescue') {
                stormSystem.start(300)
            } else if (gameMode === 'training') {
                stormSystem.stop()
            } else {
                stormSystem.start(180)
            }
        }
        if (operationMode === 'crane') {
            resetTugboatMode()
            // Keep storm active for emergency training module
            if (!(gameMode === 'training' && currentTrainingModule === 'emergency')) {
                stormSystem.stop()
            }
        }
    }, [operationMode, tugboatObjectives.length, tugboatWinTriggered, gameMode, currentTrainingModule, setTugboatObjectives, resetTugboatMode])

    // Leva controls
    useLevaControls({
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
    })

    // Lighting calculations with enhanced California port atmosphere
    const { sunPosition, ambientIntensity, directionalIntensity, fogColor, fogDensity } = useMemo(() => {
        const sunPos = getSunPosition(timeOfDay)
        const weatherEffects = weatherSystem.getWeatherEffects()
        
        // California marine layer colors
        const marineLayerNight = '#0d1520'
        const marineLayerDawn = '#2a3540'
        const marineLayerDay = '#c8d4e0'
        
        let fogColorValue: string
        if (weather === 'storm') {
            fogColorValue = '#1a202c'
        } else if (weather === 'fog') {
            fogColorValue = isNight ? marineLayerNight : '#9ab0c0'
        } else if (isNight) {
            fogColorValue = marineLayerNight
        } else if (timeOfDay < 6 || timeOfDay > 18) {
            fogColorValue = marineLayerDawn
        } else {
            fogColorValue = marineLayerDay
        }
        
        const baseFogDensity = isNight ? 0.035 : 0.02
        const weatherFogMultiplier = weather === 'fog' ? 2.5 : weather === 'storm' ? 1.5 : 1
        
        // Storm darkens and thickens everything
        const stormDarken = 1 - stormIntensity * 0.6
        const stormFogMult = 1 + stormIntensity * 2.0
        
        return {
            sunPosition: sunPos,
            ambientIntensity: (isNight ? 0.12 : 0.55) * weatherEffects.ambientLight * stormDarken,
            directionalIntensity: (isNight ? 0.25 : 1.0) * weatherEffects.ambientLight * stormDarken,
            fogColor: fogColorValue,
            fogDensity: baseFogDensity * weatherFogMultiplier * stormFogMult
        }
    }, [timeOfDay, isNight, weather, stormIntensity])

    const sceneFog = useMemo(() => 
        new THREE.FogExp2(fogColor, fogDensity),
        [fogColor, fogDensity]
    )

    // Start ambient sound system
    useEffect(() => {
        startAmbientSystem()
        return () => stopAmbientSystem()
    }, [])

    // Storm toggle keybind (P)
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'p' || e.key === 'P') {
                stormSystem.toggle()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])

    // Ship scheduling effect
    useShipScheduling({
        ships,
        departingShips,
        setDepartingShips,
        atSeaShipsRef,
        shipPositionsRef,
        scheduleDeparture,
        returnToDock
    })

    // Animation frame updates
    useFrame((state, delta) => {
        // Update time system (accelerated day/night cycle)
        timeSystem.update(delta)
        
        // Update traffic system (ship scheduling and deadlines)
        trafficSystem.update(delta)
        
        // Update lighting and weather (full update drives transitions + lightning)
        const bpm = useGameStore.getState().bpm
        lightingSystem.update(state.clock.elapsedTime, bpm)
        weatherSystem.update(delta)
        
        // Update crane sway physics — driven by weather + trolley kinematics
        const trolleyPos = useGameStore.getState().trolleyPosition
        swayTrolleyVecRef.current.set(
            (trolleyPos - 0.5) * CRANE_JIB_SPAN,
            CRANE_TROLLEY_HEIGHT,
            0
        )
        swaySystem.update(delta, swayTrolleyVecRef.current)
        
        // Tugboat helm camera is handled inside Tugboat.tsx (first-person)
        
        // Update wildlife and sea events
        wildlifeSystem.update(delta)
        ambientMarineLifeSystem.update(delta, camera)
        seaEventsSystem.update(delta)
        
        // Update harbor business events
        harborEventSystem.update(delta)
        
        // Update dynamic event system
        dynamicEventSystem.update(delta)
        
        // Update experimental tech
        experimentalTechSystem.update(delta)

        // Update wave system (drives shader + physics sync)
        waveSystem.update(delta)

        // Update storm system in tugboat mode or emergency training
        if (operationMode === 'tugboat' || (gameMode === 'training' && currentTrainingModule === 'emergency')) {
            stormSystem.update(delta)
            
            // Win condition check
            if (tugboatObjectives.length > 0 && tugboatDockedCount >= tugboatObjectives.length && !tugboatWinTriggered) {
                triggerTugboatWin()
                triggerTugWinCinematic(tugboatCareerStats)
                const firstCompleted = tugboatObjectives.find(o => o.completed)
                if (firstCompleted) {
                    triggerUpgradeCinematic(firstCompleted.shipType, 'tugboat-win')
                }
            }
        }
        
        // Spectator drone camera
        updateSpectatorCamera({
            spectatorState,
            ships,
            delta,
            spectatorAngleRef,
            cameraMode,
            orbitControlsRef
        })
        
        // Animate departing ships
        animateDepartingShips({
            departingShips,
            shipPositionsRef,
            delta,
            setDepartingShips,
            atSeaShipsRef,
            returnToDock
        })
    })

    // ================================================================
    // SCENE CONTENT (shared between all modes)
    // ================================================================
    const sceneContent = (
        <>
            <scene fog={sceneFog} />
            
            {/* Environment */}
            <Environment preset={isNight ? 'night' : 'sunset'} />

            {/* Phase 9: Attachment System Manager */}
            <AttachmentSystemManager />

            {/* Crane Auto-Pilot for upgrade menu navigation */}
            <CraneAutoPilot />

            {/* Lighting */}
            <ambientLight 
                intensity={ambientIntensity} 
                color={isNight ? '#1a1a2e' : '#ffffff'} 
            />
            
            <directionalLight 
                position={sunPosition}
                intensity={directionalIntensity}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={100}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
                color={isNight ? '#8888ff' : '#fff8e7'}
            />

            {/* Storm lightning */}
            {weather === 'storm' && weatherSystem.isLightningActive() && (
                <ambientLight intensity={2} color="#ffffff" />
            )}

            {/* Night dock lighting */}
            {isNight && <NightDockLights lightIntensity={lightIntensity} />}
            {isNight && <NightVolumetricCones lightIntensity={lightIntensity} currentShip={currentShip} />}
            {isNight && (
                <WaterLightVolumes
                    lightIntensity={lightIntensity}
                    currentShip={currentShip}
                    spreaderPos={spreaderPos}
                    installedUpgrades={installedUpgrades}
                />
            )}
            <BaseHarborLighting />
            <SpectatorNightCinematicEffects
                isNight={isNight}
                lightIntensity={lightIntensity}
                spectatorState={spectatorState}
                ships={ships}
                spectatorAngleRef={spectatorAngleRef}
            />

            {/* Scene Objects */}
            <Water isNight={isNight} />
            <FoamSystem />
            <Dock isNight={isNight} />
            
            {/* Crane or Tugboat depending on mode */}
            {(operationMode === 'crane' || cameraMode === 'onFoot') && <Crane />}
            {operationMode === 'tugboat' && <Tugboat />}
            {cameraMode === 'onFoot' && <Player />}
            <DockWalkEnvironment isNight={isNight} />
            
            {/* On-Dock Rail System */}
            <OnDockRail isNight={isNight} />
            
            {/* Sea Birds */}
            <SeaBirds isNight={isNight} />
            
            {/* Distant Ship Queue */}
            <DistantShipQueue isNight={isNight} />
            
            {/* Wildlife and Sea Events */}
            <WildlifeRenderer />
            <AmbientMarineLife />
            <SeaEvents />
            <UnderwaterEffects />
            <HarborAmbiance />

            {/* Effects */}
            <GlobalIllumination enabled={true} quality="high" />
            <AudioReactiveLightShow enabled={true} />
            <TankerFlareHeat />
            <HolographicElements />
            <EnhancedWeather enabled={true} />
            <LightFlareSystem />
            <PostProcessing enabled={true} audioData={audioData} />

            {/* Ships — visible in all modes so the glowing fleet coexists with the tug */}
            {ships.map(ship => (
                <ShipWrapper
                    key={ship.id}
                    ship={ship}
                    departingShips={departingShips}
                    shipPositionsRef={shipPositionsRef}
                    atSeaShipsRef={atSeaShipsRef}
                />
            ))}
            
            {/* Tugboat target ships */}
            {operationMode === 'tugboat' && tugboatObjectives.map((obj, i) => {
                const fallbackStart: [number, number, number] = [
                    obj.berthCenter[0] + (Math.random() - 0.5) * 20,
                    0,
                    obj.berthCenter[2] + 25 + Math.random() * 15,
                ]
                const missionStart = activeMission?.type === 'salvage' && activeMission.distressPosition
                    ? activeMission.distressPosition
                    : fallbackStart
                const isDistressed = activeMission?.status === 'active' &&
                    (activeMission.targetShipId === obj.id || (activeMission.type !== 'salvage' && i === 0))
                if (isDistressed) {
                    return (
                        <DistressedShip
                            key={obj.id}
                            id={obj.id}
                            shipType={obj.shipType}
                            startPosition={missionStart}
                            startRotation={Math.PI + (Math.random() - 0.5) * 0.5}
                            berthCenter={obj.berthCenter}
                            berthRadius={obj.berthRadius}
                            timeLimit={activeMission!.timeLimit}
                            maxDamage={activeMission!.maxDamage}
                            onDamageUpdate={(dmg) => updateMission({ damage: dmg })}
                            onDocked={(id) => {
                                completeTugboatObjective(id)
                                completeMission()
                                if (activeMission?.vesselLabel) {
                                    triggerSalvageCinematic(
                                        activeMission.vesselLabel,
                                        obj.shipType,
                                        tugboatCareerStats,
                                    )
                                }
                            }}
                            onDestroyed={(id) => {
                                failMission()
                            }}
                        />
                    )
                }
                return (
                    <TugboatTargetShip
                        key={obj.id}
                        id={obj.id}
                        shipType={obj.shipType}
                        startPosition={fallbackStart}
                        startRotation={Math.PI + (Math.random() - 0.5) * 0.5}
                        berthCenter={obj.berthCenter}
                        berthRadius={obj.berthRadius}
                        onDocked={(id) => {
                            completeTugboatObjective(id)
                            triggerTugObjectiveCinematic(obj.shipType, obj.label, tugboatCareerStats)
                        }}
                    />
                )
            })}
        </>
    )

    // ================================================================
    // RENDER: Based on cabin view mode
    // ================================================================
    
    if (operationMode === 'crane' && cabinViewMode === 'immersive') {
        // IMMERSIVE CAB MODE - First person inside cabin
        return (
            <>
                <ControlBooth harborTheme={harborTheme} debug={false}>
                    {sceneContent}
                </ControlBooth>
            </>
        )
    }
    
    // DEFAULT: MULTIVIEW MODE - 4 camera panels (rendered in HTML overlay via OperatorCabinUI)
    return (
        <>
            {/* Main Camera - Crane Cab POV (hidden in tugboat mode; helm cam is inside Tugboat.tsx) */}
            {operationMode === 'crane' && cameraMode !== 'onFoot' && (
                <PerspectiveCamera
                    makeDefault
                    position={[18, 24, 8]}
                    fov={60}
                    near={0.1}
                    far={1000}
                />
            )}
            
            {operationMode === 'crane' && cameraMode !== 'onFoot' && (
                <OrbitControls 
                    ref={orbitControlsRef}
                    target={currentShip?.position || [0, 0, 0]}
                    enableDamping
                    dampingFactor={0.05}
                    maxPolarAngle={Math.PI / 2 - 0.1}
                    minDistance={10}
                    maxDistance={100}
                />
            )}

            {sceneContent}
        </>
    )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

