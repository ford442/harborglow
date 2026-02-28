import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { useGameStore, ShipType } from '../store/useGameStore'
import { useControls } from 'leva'
import { musicSystem } from '../systems/musicSystem'
import * as THREE from 'three'
import Ship from './Ship'
import Crane from './Crane'
import Dock from './Dock'
import Water from './Water'

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

    const currentShip = ships.find(s => s.id === currentShipId)
    const orbitControlsRef = useRef<any>(null)
    const spectatorAngleRef = useRef(0)

    // Leva controls
    const controls = useControls({
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
        }
    })

    // Spectator drone camera movement
    useFrame((state, delta) => {
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

    // Calculate lighting based on time of day
    const sunPosition = getSunPosition(timeOfDay)
    const ambientIntensity = isNight ? 0.15 : 0.6
    const directionalIntensity = isNight ? 0.3 : 1.2
    const fogColor = isNight ? '#0a0a15' : '#87CEEB'
    const fogDensity = isNight ? controls['Fog Density'] : controls['Fog Density'] * 0.3

    return (
        <>
            {/* Fog for atmospheric depth */}
            <scene fog={new THREE.FogExp2(fogColor, fogDensity)} />

            {/* Camera controls */}
            <OrbitControls 
                ref={orbitControlsRef}
                enabled={!spectatorState.isActive && cameraMode === 'orbit'}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={5}
                maxDistance={100}
                target={currentShip ? currentShip.position : [0, 0, 0]}
            />

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

            {/* Ships */}
            {ships.map((ship) => (
                <Ship key={ship.id} ship={ship} />
            ))}

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
