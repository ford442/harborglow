import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'

import { useGameStore, ShipType, Ship, CameraMode, GameMode } from '../store/useGameStore'
import { TrainingModuleId, trainingSystem } from '../systems/trainingSystem'
import { reputationSystem } from '../systems/reputationSystem'
import { economySystem } from '../systems/economySystem'
import { musicSystem } from '../systems/musicSystem'
import { lightingSystem } from '../systems/lightingSystem'
import { weatherSystem, WeatherType } from '../systems/weatherSystem'
import { swaySystem } from '../systems/swaySystem'
import { useCinematicCamera } from '../systems/cameraSystem'
import { useAudioVisualSync } from '../systems/audioVisualSync'
import { timeSystem, DayPhase, PHASES, getPhaseDescription } from '../systems/timeSystem'
import { moonSystem, MOON_PHASES, MoonPhaseName, getPhaseGameplayEffects } from '../systems/moonSystem'
import { trafficSystem } from '../systems/trafficSystem'
import AttachmentSystemManager from '../components/AttachmentSystemManager'
import { startAmbientSystem, stopAmbientSystem, playRadioChatter, playBirdCall, playFoghorn, playShipHorn } from '../systems/ambientSoundSystem'
import { setCraneSoundVolume, setCraneSoundsEnabled, playContainerImpact, playTwistlockEngage } from '../systems/craneSoundSystem'

import ShipComponent from './Ship'
import Crane from './Crane'
import Tugboat from './Tugboat'
import TugboatTargetShip from './TugboatTargetShip'
import Dock from './Dock'
import Water from './Water'
import FoamSystem from './FoamSystem'
import { stormSystem } from '../systems/StormSystem'
import { waveSystem } from '../systems/WaveSystem'
import { useCameraTransition } from '../hooks/useCameraTransition'
import GlobalIllumination from './GlobalIllumination'
import AudioReactiveLightShow from './AudioReactiveLightShow'
import { HolographicElements } from './HolographicUI'
import EnhancedWeather from './EnhancedWeather'
import PostProcessing from './PostProcessing'
import WildlifeRenderer from './Wildlife'
import SeaEvents from './SeaEvents'
import ControlBooth from './ControlBooth'
import OnDockRail from './OnDockRail'
import SeaBirds from './SeaBirds'
import DistantShipQueue from './DistantShipQueue'
import { wildlifeSystem } from '../systems/wildlifeSystem'
import { seaEventsSystem } from '../systems/seaEventsSystem'
import { harborEventSystem } from '../systems/eventSystem/HarborEventSystem'
import { dynamicEventSystem } from '../systems/dynamicEventSystem'
import { experimentalTechSystem } from '../systems/techSystem'

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
    // Store selectors
    const ships = useGameStore(s => s.ships)
    const currentShipId = useGameStore(s => s.currentShipId)
    const spectatorState = useGameStore(s => s.spectatorState)
    const cameraMode = useGameStore(s => s.cameraMode)
    const isNight = useGameStore(s => s.isNight)
    const timeOfDay = useGameStore(s => s.timeOfDay)
    const stormIntensity = useGameStore(s => s.stormIntensity)
    const weather = useGameStore(s => s.weather)
    const multiviewMode = useGameStore(s => s.multiviewMode)
    const underwaterIntensity = useGameStore(s => s.underwaterIntensity)
    const cabinViewMode = useGameStore(s => s.cabinViewMode)
    const operationMode = useGameStore(s => s.operationMode)
    const tugboatObjectives = useGameStore(s => s.tugboatObjectives)
    const tugboatDockedCount = useGameStore(s => s.tugboatDockedCount)
    const tugboatWinTriggered = useGameStore(s => s.tugboatWinTriggered)
    
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
    const setTugboatObjectives = useGameStore(s => s.setTugboatObjectives)
    const completeTugboatObjective = useGameStore(s => s.completeTugboatObjective)
    const triggerTugboatWin = useGameStore(s => s.triggerTugboatWin)
    const resetTugboatMode = useGameStore(s => s.resetTugboatMode)

    // Local state
    const [departingShips, setDepartingShips] = useState<Set<string>>(new Set())
    
    // Refs
    const orbitControlsRef = useRef<any>(null)
    const spectatorAngleRef = useRef(0)
    const atSeaShipsRef = useRef<Map<string, AtSeaShip>>(new Map())
    const shipPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map())
    // Reusable vector for swaySystem — avoids per-frame allocation
    const swayTrolleyVecRef = useRef(new THREE.Vector3())
    
    // Derived values
    const currentShip = useMemo(() => 
        ships.find(s => s.id === currentShipId),
        [ships, currentShipId]
    )

    // Initialize systems
    useCinematicCamera()
    useCameraTransition()
    const { audioData } = useAudioVisualSync()

    // Tugboat mode: spawn objectives when entering tugboat mode
    useEffect(() => {
        if (operationMode === 'tugboat' && tugboatObjectives.length === 0 && !tugboatWinTriggered) {
            const objectives = [
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
            stormSystem.start(180)
        }
        if (operationMode === 'crane') {
            resetTugboatMode()
            stormSystem.stop()
        }
    }, [operationMode, tugboatObjectives.length, tugboatWinTriggered, setTugboatObjectives, resetTugboatMode])

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
        cabinViewMode
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
        seaEventsSystem.update(delta)
        
        // Update harbor business events
        harborEventSystem.update(delta)
        
        // Update dynamic event system
        dynamicEventSystem.update(delta)
        
        // Update experimental tech
        experimentalTechSystem.update(delta)

        // Update wave system (drives shader + physics sync)
        waveSystem.update(delta)

        // Update storm system in tugboat mode
        if (operationMode === 'tugboat') {
            stormSystem.update(delta)
            
            // Win condition check
            if (tugboatDockedCount >= 3 && !tugboatWinTriggered) {
                triggerTugboatWin()
                // Trigger celebration on first completed ship's type
                const firstCompleted = tugboatObjectives.find(o => o.completed)
                if (firstCompleted) {
                    musicSystem.startMusic(firstCompleted.shipType)
                    lightingSystem.startHarborShow('tugboat-win', firstCompleted.shipType)
                    lightingSystem.triggerClimax(firstCompleted.shipType)
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
            {isNight && <NightDockLights />}

            {/* Scene Objects */}
            <Water isNight={isNight} />
            <FoamSystem />
            <Dock isNight={isNight} />
            
            {/* Crane or Tugboat depending on mode */}
            {operationMode === 'crane' && <Crane />}
            {operationMode === 'tugboat' && <Tugboat />}
            
            {/* On-Dock Rail System */}
            <OnDockRail isNight={isNight} />
            
            {/* Sea Birds */}
            <SeaBirds 
                isNight={isNight} 
                cranePositions={[[0, 0, 0], [-20, 0, -10], [20, 0, -10]]}
            />
            
            {/* Distant Ship Queue */}
            <DistantShipQueue isNight={isNight} />
            
            {/* Wildlife and Sea Events */}
            <WildlifeRenderer />
            <SeaEvents />

            {/* Effects */}
            <GlobalIllumination enabled={true} quality="high" />
            <AudioReactiveLightShow enabled={true} />
            <HolographicElements />
            <EnhancedWeather enabled={true} />
            <PostProcessing enabled={true} audioData={audioData} />

            {/* Ships — hidden in tugboat mode */}
            {operationMode === 'crane' && ships.map(ship => (
                <ShipWrapper
                    key={ship.id}
                    ship={ship}
                    departingShips={departingShips}
                    shipPositionsRef={shipPositionsRef}
                    atSeaShipsRef={atSeaShipsRef}
                />
            ))}
            
            {/* Tugboat target ships */}
            {operationMode === 'tugboat' && tugboatObjectives.map((obj, i) => (
                <TugboatTargetShip
                    key={obj.id}
                    id={obj.id}
                    shipType={obj.shipType}
                    startPosition={[
                        obj.berthCenter[0] + (Math.random() - 0.5) * 20,
                        0,
                        obj.berthCenter[2] + 25 + Math.random() * 15
                    ]}
                    startRotation={Math.PI + (Math.random() - 0.5) * 0.5}
                    berthCenter={obj.berthCenter}
                    berthRadius={obj.berthRadius}
                    onDocked={(id) => completeTugboatObjective(id)}
                />
            ))}
        </>
    )

    // ================================================================
    // RENDER: Based on cabin view mode
    // ================================================================
    
    if (cabinViewMode === 'immersive') {
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
            {operationMode !== 'tugboat' && (
                <PerspectiveCamera
                    makeDefault
                    position={[18, 24, 8]}
                    fov={60}
                    near={0.1}
                    far={1000}
                />
            )}
            
            {operationMode === 'crane' && (
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

function NightDockLights() {
    return (
        <>
            {/* Dock amber lights */}
            {[[-20, 8, -8], [0, 8, -8], [20, 8, -8]].map((pos, i) => (
                <pointLight
                    key={i}
                    position={pos as [number, number, number]}
                    intensity={2}
                    color="#ffaa00"
                    distance={30}
                    decay={2}
                />
            ))}
            
            {/* Blue underwater glow */}
            <pointLight position={[-30, -3, 10]} intensity={1.5} color="#00aaff" distance={40} decay={2} />
            <pointLight position={[30, -3, 10]} intensity={1.5} color="#00aaff" distance={40} decay={2} />
            
            
            {/* Red warning beacons */}
            <pointLight position={[-25, 15, 0]} intensity={1} color="#ff0000" distance={20} />
            <pointLight position={[25, 15, 0]} intensity={1} color="#ff0000" distance={20} />
        </>
    )
}

function ShipWrapper({ 
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

function SpectatorOverlay({ ship, remainingTime }: { ship?: Ship; remainingTime: number }) {
    if (!ship) return null

    const labels: Record<ShipType, string> = {
        cruise: 'Ocean Symphony',
        container: 'Neon Stack',
        tanker: 'Flame Runner',
        bulk: 'Iron Mountain',
        lng: 'Cryo Titan',
        roro: 'Vehicle Voyager',
        research: 'Deep Discoverer',
        droneship: 'Of Course I Still Love You'
    }

    const colors: Record<ShipType, string> = {
        cruise: '#ff6b9d',
        container: '#00d4aa',
        tanker: '#ff9500',
        bulk: '#8b4513',
        lng: '#00ffff',
        roro: '#ff6b35',
        research: '#4169e1',
        droneship: '#ffffff'
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

interface LevaControlsConfig {
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
}

// Business pattern trigger functions for Leva
function triggerGeopoliticalEvent() {
    const regions: ('red_sea' | 'hormuz' | 'panama')[] = ['red_sea', 'hormuz', 'panama']
    const region = regions[Math.floor(Math.random() * regions.length)]
    harborEventSystem.triggerGeopoliticalEvent(region)
}

function triggerTariffEvent() {
    harborEventSystem.triggerTariffEvent()
}

function triggerLaborAction() {
    harborEventSystem.triggerLaborAction()
}

function triggerPeakSeason() {
    harborEventSystem.triggerPeakSeason()
}

function useLevaControls(config: LevaControlsConfig) {
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
        cabinViewMode
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
            options: ['clear', 'rain', 'fog', 'storm'],
            onChange: (w: string) => {
                setWeather(w as any)
                weatherSystem.forceWeather(w as any)
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
        // Tugboat Mode Controls
        'Force Operation Mode': {
            value: 'crane',
            options: ['crane', 'tugboat'],
            folder: 'Tugboat Mode',
            onChange: (value: string) => {
                useGameStore.getState().setOperationMode(value as 'crane' | 'tugboat')
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

interface ShipSchedulingConfig {
    ships: Ship[]
    departingShips: Set<string>
    setDepartingShips: (ships: Set<string>) => void
    atSeaShipsRef: React.MutableRefObject<Map<string, AtSeaShip>>
    shipPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
    scheduleDeparture: (shipId: string) => void
    returnToDock: (shipId: string) => void
}

function useShipScheduling(config: ShipSchedulingConfig) {
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

function getSunPosition(hour: number): [number, number, number] {
    const angle = ((hour - 12) / 12) * Math.PI
    return [
        Math.sin(angle) * 50,
        Math.cos(angle) * 50,
        20
    ]
}

interface SpectatorCameraConfig {
    spectatorState: { isActive: boolean; targetShipId: string | null }
    ships: Ship[]
    delta: number
    spectatorAngleRef: React.MutableRefObject<number>
    cameraMode: string
    orbitControlsRef: React.MutableRefObject<any>
}

function updateSpectatorCamera(config: SpectatorCameraConfig) {
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

interface DepartingShipsConfig {
    departingShips: Set<string>
    shipPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
    delta: number
    setDepartingShips: (ships: Set<string>) => void
    atSeaShipsRef: React.MutableRefObject<Map<string, AtSeaShip>>
    returnToDock: (shipId: string) => void
}

function animateDepartingShips(config: DepartingShipsConfig) {
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
