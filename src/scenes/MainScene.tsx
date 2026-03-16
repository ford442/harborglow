import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'

import { useGameStore, ShipType, Ship } from '../store/useGameStore'
import { musicSystem } from '../systems/musicSystem'
import { lightingSystem } from '../systems/lightingSystem'
import { weatherSystem } from '../systems/weatherSystem'
import { useCinematicCamera } from '../systems/cameraSystem'
import { useAudioVisualSync } from '../systems/audioVisualSync'

import ShipComponent from './Ship'
import Crane from './Crane'
import Dock from './Dock'
import Water from './Water'
import GlobalIllumination from './GlobalIllumination'
import AudioReactiveLightShow from './AudioReactiveLightShow'
import { HolographicElements } from './HolographicUI'
import EnhancedWeather from './EnhancedWeather'
import PostProcessing from './PostProcessing'
import MultiviewSystem from './MultiviewSystem'
import WildlifeRenderer from './Wildlife'
import SeaEvents from './SeaEvents'
import { wildlifeSystem } from '../systems/wildlifeSystem'
import { seaEventsSystem } from '../systems/seaEventsSystem'

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
    'crane'
] as const

// =============================================================================
// TYPES
// =============================================================================

interface AtSeaShip {
    shipId: string
    returnTime: number
    originalPosition: [number, number, number]
}

// =============================================================================
// MAIN SCENE COMPONENT
// =============================================================================

export default function MainScene() {
    // Store selectors
    const ships = useGameStore(s => s.ships)
    const currentShipId = useGameStore(s => s.currentShipId)
    const spectatorState = useGameStore(s => s.spectatorState)
    const cameraMode = useGameStore(s => s.cameraMode)
    const isNight = useGameStore(s => s.isNight)
    const timeOfDay = useGameStore(s => s.timeOfDay)
    const weather = useGameStore(s => s.weather)
    const multiviewMode = useGameStore(s => s.multiviewMode)
    const underwaterIntensity = useGameStore(s => s.underwaterIntensity)
    
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

    // Local state
    const [departingShips, setDepartingShips] = useState<Set<string>>(new Set())
    
    // Refs
    const orbitControlsRef = useRef<any>(null)
    const spectatorAngleRef = useRef(0)
    const atSeaShipsRef = useRef<Map<string, AtSeaShip>>(new Map())
    const shipPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map())
    
    // Derived values
    const currentShip = useMemo(() => 
        ships.find(s => s.id === currentShipId),
        [ships, currentShipId]
    )

    // Initialize systems
    useCinematicCamera()
    const { audioData } = useAudioVisualSync()

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
        setUnderwaterIntensity
    })

    // Lighting calculations
    const { sunPosition, ambientIntensity, directionalIntensity, fogColor, fogDensity } = useMemo(() => {
        const sunPos = getSunPosition(timeOfDay)
        const weatherEffects = weatherSystem.getWeatherEffects()
        
        return {
            sunPosition: sunPos,
            ambientIntensity: (isNight ? 0.15 : 0.6) * weatherEffects.ambientLight,
            directionalIntensity: (isNight ? 0.3 : 1.2) * weatherEffects.ambientLight,
            fogColor: weather === 'storm' ? '#1a202c' : isNight ? '#0a0a15' : '#87CEEB',
            fogDensity: weatherEffects.fogDensity
        }
    }, [timeOfDay, isNight, weather])

    const sceneFog = useMemo(() => 
        new THREE.FogExp2(fogColor, fogDensity),
        [fogColor, fogDensity]
    )

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
        // Update lighting and weather
        const bpm = useGameStore.getState().bpm
        lightingSystem.update(state.clock.elapsedTime, bpm)
        weatherSystem.updateLightning()
        
        // Update wildlife and sea events
        wildlifeSystem.update(delta)
        seaEventsSystem.update(delta)
        
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

    return (
        <>
            <scene fog={sceneFog} />
            
            {/* Camera Controls */}
            {!spectatorState.isActive && cameraMode === 'orbit' && (
                <OrbitControls 
                    ref={orbitControlsRef}
                    target={currentShip?.position || [0, 0, 0]}
                    enableDamping
                    dampingFactor={0.05}
                />
            )}

            {/* Environment */}
            <Environment preset={isNight ? 'night' : 'sunset'} />

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
            <Dock isNight={isNight} />
            <Crane />
            
            {/* Wildlife and Sea Events */}
            <WildlifeRenderer />
            <SeaEvents />

            {/* Effects */}
            <GlobalIllumination enabled={true} quality="high" />
            <AudioReactiveLightShow enabled={true} />
            <HolographicElements />
            <EnhancedWeather enabled={true} />
            <PostProcessing enabled={true} audioData={audioData} />
            
            {/* Multiview Camera System */}
            <MultiviewSystem 
                enabled={multiviewMode === 'quad'} 
                underwaterIntensity={underwaterIntensity}
            />

            {/* Ships */}
            {ships.map(ship => (
                <ShipWrapper
                    key={ship.id}
                    ship={ship}
                    departingShips={departingShips}
                    shipPositionsRef={shipPositionsRef}
                    atSeaShipsRef={atSeaShipsRef}
                />
            ))}

            {/* Spectator Overlay */}
            {spectatorState.isActive && (
                <SpectatorOverlay 
                    ship={ships.find(s => s.id === spectatorState.targetShipId)}
                    remainingTime={Math.max(0, spectatorState.duration - (Date.now() - spectatorState.startTime) / 1000)}
                />
            )}
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
        tanker: 'Flame Runner'
    }

    const colors: Record<ShipType, string> = {
        cruise: '#ff6b9d',
        container: '#00d4aa',
        tanker: '#ff9500'
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
    setCameraMode: (mode: 'orbit' | 'spectator' | 'crane') => void
    weather: string
    setWeather: (weather: any) => void
    setCurrentShip: (id: string | null) => void
    multiviewMode: string
    setMultiviewMode: (mode: 'single' | 'quad') => void
    underwaterIntensity: number
    setUnderwaterIntensity: (intensity: number) => void
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
        setUnderwaterIntensity
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
            onChange: setTimeOfDay
        },
        'Fog Density': {
            value: 0.02,
            min: 0,
            max: 0.1,
            step: 0.001
        },
        'Camera Mode': {
            value: 'orbit',
            options: CAMERA_MODES,
            onChange: setCameraMode
        },
        'Weather': {
            value: weather,
            options: ['clear', 'rain', 'fog', 'storm'],
            onChange: (w: string) => {
                setWeather(w as any)
                weatherSystem.forceWeather(w as any)
            }
        },
        'Multiview Layout': {
            value: multiviewMode,
            options: ['single', 'quad'],
            onChange: (mode: 'single' | 'quad') => setMultiviewMode(mode)
        },
        'Underwater Intensity': {
            value: underwaterIntensity,
            min: 0,
            max: 2,
            step: 0.1,
            onChange: setUnderwaterIntensity
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
