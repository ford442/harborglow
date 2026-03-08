import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { useControls } from 'leva'
import { useGameStore, ShipType, Ship } from '../store/useGameStore'
import { musicSystem } from '../systems/musicSystem'
import { lightingSystem } from '../systems/lightingSystem'
import { weatherSystem } from '../systems/weatherSystem'
import * as THREE from 'three'
import ShipComponent from './Ship'
import Crane from './Crane'
import Dock from './Dock'
import Water from './Water'
import GlobalIllumination from './GlobalIllumination'
import LightShow from './LightShow'

// Track ships that are currently at sea
const AT_SEA_DURATION = 10000 // 10 seconds at sea

interface AtSeaShip {
    shipId: string
    returnTime: number
    originalPosition: [number, number, number]
}

// =============================================================================
// MAIN SCENE COMPONENT
// Handles lighting, fog, spectator drone, and ship rendering
// =============================================================================

export default function MainScene() {
    const { camera } = useThree()
    const ships = useGameStore((state) => state.ships)
    const currentShipId = useGameStore((state) => state.currentShipId)
    const spectatorState = useGameStore((state) => state.spectatorState)
    const cameraMode = useGameStore((state) => state.cameraMode)
    const isNight = useGameStore((state) => state.isNight)
    const timeOfDay = useGameStore((state) => state.timeOfDay)
    const setBPM = useGameStore((state) => state.setBPM)
    const setLyricsSize = useGameStore((state) => state.setLyricsSize)
    const setLightIntensity = useGameStore((state) => state.setLightIntensity)
    const scheduleDeparture = useGameStore((state) => state.scheduleDeparture)
    const returnToDock = useGameStore((state) => state.returnToDock)
    const weather = useGameStore((state) => state.weather)
    const setWeather = useGameStore((state) => state.setWeather)

    const currentShip = ships.find(s => s.id === currentShipId)
    const orbitControlsRef = useRef<any>(null)
    const spectatorAngleRef = useRef(0)
    
    // Track ships currently sailing (departing animation)
    const [departingShips, setDepartingShips] = useState<Set<string>>(new Set())
    // Track ships at sea (invisible, waiting to return)
    const atSeaShipsRef = useRef<Map<string, AtSeaShip>>(new Map())
    // Track ship positions for animation
    const shipPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map())

    // Leva controls (rendered by Leva, values handled via onChange)
    useControls({
        'Current Ship Type': {
            value: currentShip?.type || 'cruise',
            options: ['cruise', 'container', 'tanker'],
            onChange: (value: ShipType) => {
                const ship = ships.find(s => s.type === value)
                if (ship) useGameStore.getState().setCurrentShip(ship.id)
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
            value: 22,
            min: 0,
            max: 24,
            step: 0.5,
            onChange: (hour: number) => {
                useGameStore.getState().setTimeOfDay(hour)
            }
        },
        'Fog Density': {
            value: 0.02,
            min: 0,
            max: 0.1,
            step: 0.001
        },
        'Camera Mode': {
            value: 'orbit',
            options: ['orbit', 'crane'],
            onChange: (mode: 'orbit' | 'crane') => {
                useGameStore.getState().setCameraMode(mode)
            }
        },
        'Weather': {
            value: weather,
            options: ['clear', 'rain', 'fog', 'storm'],
            onChange: (w: string) => {
                setWeather(w as any)
                weatherSystem.forceWeather(w as any)
            }
        }
    })

    // Spectator drone camera movement
    useFrame((state, delta) => {
        // Update lighting system and weather
        const bpm = useGameStore.getState().bpm
        lightingSystem.update(state.clock.elapsedTime, bpm)
        weatherSystem.updateLightning()
        
        if (spectatorState.isActive && spectatorState.targetShipId) {
            const targetShip = ships.find(s => s.id === spectatorState.targetShipId)
            if (targetShip) {
                // Orbit around the ship
                spectatorAngleRef.current += delta * 0.3 // Slow orbit
                const radius = targetShip.type === 'tanker' ? 50 : targetShip.type === 'container' ? 40 : 35
                const height = 15 + Math.sin(state.clock.elapsedTime * 0.5) * 5 // Gentle height variation
                
                const x = targetShip.position[0] + Math.cos(spectatorAngleRef.current) * radius
                const z = targetShip.position[2] + Math.sin(spectatorAngleRef.current) * radius
                
                camera.position.lerp(new THREE.Vector3(x, height, z), 0.05)
                camera.lookAt(targetShip.position[0], 5, targetShip.position[2])
            }
        } else if (cameraMode === 'orbit' && orbitControlsRef.current) {
            // Normal orbit controls
            orbitControlsRef.current.update()
        }
    })

    // Reset spectator angle when mode changes
    useEffect(() => {
        if (spectatorState.isActive) {
            spectatorAngleRef.current = 0
        }
    }, [spectatorState.isActive, spectatorState.targetShipId])

    // Ship scheduling timer - checks every second for ships that need to depart
    useEffect(() => {
        // Schedule initial departures for all docked ships that don't have a sailTime
        ships.forEach(ship => {
            if ((ship.isDocked !== false) && !ship.sailTime && !departingShips.has(ship.id) && !atSeaShipsRef.current.has(ship.id)) {
                scheduleDeparture(ship.id)
            }
        })

        const interval = setInterval(() => {
            const now = Date.now()
            
            ships.forEach(ship => {
                // Check if ship needs to depart
                if (ship.sailTime && now >= ship.sailTime && !departingShips.has(ship.id) && !atSeaShipsRef.current.has(ship.id)) {
                    console.log(`⛵ Ship ${ship.name || ship.id} departing for sea...`)
                    
                    // Store original position
                    shipPositionsRef.current.set(ship.id, new THREE.Vector3(...ship.position))
                    
                    // Mark as departing
                    setDepartingShips(prev => new Set(prev).add(ship.id))
                }
            })
            
            // Check for ships returning from sea
            atSeaShipsRef.current.forEach((atSeaShip, shipId) => {
                if (now >= atSeaShip.returnTime) {
                    console.log(`🔄 Ship ${ships.find(s => s.id === shipId)?.name || shipId} returning for upgrade`)
                    
                    // Remove from at-sea tracking
                    atSeaShipsRef.current.delete(shipId)
                    
                    // Return to dock (resets sailTime and isDocked)
                    returnToDock(shipId)
                    
                    // Schedule next departure
                    setTimeout(() => {
                        scheduleDeparture(shipId)
                    }, 5000) // Wait 5 seconds before scheduling next departure
                }
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [ships, scheduleDeparture, returnToDock, departingShips])

    // Animate departing ships
    useFrame((_, delta) => {
        departingShips.forEach(shipId => {
            const originalPos = shipPositionsRef.current.get(shipId)
            if (!originalPos) return
            
            // Get current animated position or start from original
            let currentPos = shipPositionsRef.current.get(`${shipId}_current`)
            if (!currentPos) {
                currentPos = originalPos.clone()
                shipPositionsRef.current.set(`${shipId}_current`, currentPos)
            }
            
            // Move ship away (increase Z position)
            currentPos.z += delta * 20 // Move at 20 units per second
            
            // If ship has moved far enough, mark it as at-sea
            if (currentPos.z > originalPos.z + 100) {
                // Ship is now at sea
                setDepartingShips(prev => {
                    const next = new Set(prev)
                    next.delete(shipId)
                    return next
                })
                
                // Add to at-sea tracking
                atSeaShipsRef.current.set(shipId, {
                    shipId,
                    returnTime: Date.now() + AT_SEA_DURATION,
                    originalPosition: [originalPos.x, originalPos.y, originalPos.z]
                })
                
                // Clean up position tracking
                shipPositionsRef.current.delete(`${shipId}_current`)
            }
        })
    })

    // Calculate lighting based on time of day and weather
    const sunPosition = getSunPosition(timeOfDay)
    const weatherEffects = weatherSystem.getWeatherEffects()
    const ambientIntensity = (isNight ? 0.15 : 0.6) * weatherEffects.ambientLight
    const directionalIntensity = (isNight ? 0.3 : 1.2) * weatherEffects.ambientLight
    const fogColor = weather === 'storm' ? '#1a202c' : isNight ? '#0a0a15' : '#87CEEB'
    const fogDensity = weatherEffects.fogDensity

    return (
        <>
            {/* Fog for atmospheric depth - weather affected */}
            <scene fog={new THREE.FogExp2(fogColor, fogDensity)} />

            {/* Camera controls */}
            {!spectatorState.isActive && cameraMode === 'orbit' && (
                <OrbitControls 
                    ref={orbitControlsRef}
                    target={currentShip ? currentShip.position : [0, 0, 0]}
                />
            )}

            {/* Environment */}
            <Environment preset={isNight ? 'night' : 'sunset'} />

            {/* Ambient light */}
            <ambientLight intensity={ambientIntensity} color={isNight ? '#1a1a2e' : '#ffffff'} />

            {/* Directional light (sun/moon) */}
            <directionalLight 
                position={sunPosition}
                intensity={directionalIntensity}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={100}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
                color={isNight ? '#8888ff' : '#fff8e7'}
            />

            {/* Lightning flash for storms */}
            {weather === 'storm' && weatherSystem.isLightningActive() && (
                <ambientLight intensity={2} color="#ffffff" />
            )}

            {/* Night dock lighting - multiple colored point lights for atmosphere */}
            {isNight && (
                <>
                    {/* Dock amber lights */}
                    <pointLight position={[-20, 8, -8]} intensity={2} color="#ffaa00" distance={30} decay={2} />
                    <pointLight position={[0, 8, -8]} intensity={2} color="#ffaa00" distance={30} decay={2} />
                    <pointLight position={[20, 8, -8]} intensity={2} color="#ffaa00" distance={30} decay={2} />
                    
                    {/* Blue underwater glow */}
                    <pointLight position={[-30, -3, 10]} intensity={1.5} color="#00aaff" distance={40} decay={2} />
                    <pointLight position={[30, -3, 10]} intensity={1.5} color="#00aaff" distance={40} decay={2} />
                    
                    {/* Red warning beacons */}
                    <pointLight position={[-25, 15, 0]} intensity={1} color="#ff0000" distance={20} />
                    <pointLight position={[25, 15, 0]} intensity={1} color="#ff0000" distance={20} />
                </>
            )}

            {/* Scene elements */}
            <Water isNight={isNight} />
            <Dock isNight={isNight} />
            <Crane />

            {/* Global Illumination for light bounce and color bleeding */}
            <GlobalIllumination enabled={true} quality="high" />
            
            {/* HDR Light Show for night mode */}
            <LightShow enabled={true} />

            {/* Ships */}
            {ships.map((ship) => {
                if (atSeaShipsRef.current.has(ship.id)) return null
                
                const animatedPos = departingShips.has(ship.id) 
                    ? shipPositionsRef.current.get(`${ship.id}_current`)
                    : null
                
                const displayShip: Ship = animatedPos 
                    ? { ...ship, position: [animatedPos.x, animatedPos.y, animatedPos.z] }
                    : ship
                
                return <ShipComponent key={ship.id} ship={displayShip} />
            })}

            {/* Post-processing effects */}
            <EffectComposer>
                {/* Bloom for all glowing elements - intensity boosts during v2.0 shows */}
                <Bloom 
                    intensity={lightingSystem.isShowActive() ? 2.5 : 1.5}
                    radius={0.8}
                    luminanceThreshold={0.4}
                    luminanceSmoothing={0.1}
                    mipmapBlur={true}
                />
                
                {/* Depth of field for cinematic feel */}
                <DepthOfField
                    focusDistance={0}
                    focalLength={0.02}
                    bokehScale={3}
                    height={480}
                />
                
                {/* Vignette for dramatic framing */}
                <Vignette
                    offset={0.3}
                    darkness={0.6}
                    eskil={false}
                />
                
                {/* Chromatic aberration for subtle distortion */}
                <ChromaticAberration
                    offset={[0.002, 0.002]}
                />
            </EffectComposer>

            {/* Spectator Mode Overlay */}
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
// SPECTATOR OVERLAY
// Shows drone camera info during cinematic
// =============================================================================

function SpectatorOverlay({ ship, remainingTime }: { ship: any, remainingTime: number }) {
    if (!ship) return null

    const shipTypeLabels: Record<string, string> = {
        cruise: 'Ocean Symphony',
        container: 'Neon Stack',
        tanker: 'Flame Runner'
    }

    const shipTypeColors: Record<string, string> = {
        cruise: '#ff6b9d',
        container: '#00d4aa',
        tanker: '#ff9500'
    }

    return (
        <>
            {/* Corner label */}
            <div style={{
                position: 'absolute',
                top: '80px',
                left: '20px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '12px 20px',
                borderRadius: '8px',
                border: `2px solid ${shipTypeColors[ship.type as string]}`,
                pointerEvents: 'none',
                zIndex: 100
            }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    Spectator Drone
                </div>
                <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: shipTypeColors[ship.type as string],
                    marginTop: '4px'
                }}>
                    {shipTypeLabels[ship.type as string]}
                </div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                    Auto-return in {remainingTime.toFixed(1)}s
                </div>
            </div>

            {/* Drone HUD elements */}
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
                    backgroundColor: shipTypeColors[ship.type as string],
                    borderRadius: '50%'
                }} />
            </div>
        </>
    )
}

// =============================================================================
// HELPERS
// =============================================================================

function getSunPosition(hour: number): [number, number, number] {
    // Simple sun position calculation
    // Noon (12) = directly overhead, Midnight (0/24) = below horizon
    const angle = ((hour - 12) / 12) * Math.PI // -PI to PI
    const x = Math.sin(angle) * 50
    const y = Math.cos(angle) * 50
    return [x, y, 20]
}
