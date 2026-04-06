// =============================================================================
// DISTANT SHIP QUEUE - HarborGlow Bay
// Ships waiting to enter port, visible on the horizon
// Creates depth and shows port capacity/busyness
// =============================================================================

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore, ShipType } from '../store/useGameStore'
import { harborEventSystem } from '../systems/eventSystem'

// =============================================================================
// TYPES
// =============================================================================

interface DistantShipProps {
    position: [number, number, number]
    type: ShipType
    scale: number
    isNight: boolean
}

interface DistantShipQueueProps {
    isNight: boolean
}

// =============================================================================
// DISTANT SHIP (simplified silhouette)
// =============================================================================

function DistantShip({ position, type, scale, isNight }: DistantShipProps) {
    const shipRef = useRef<THREE.Group>(null)
    const lightsRef = useRef<THREE.Group>(null)
    
    useFrame((state) => {
        if (!shipRef.current) return
        
        const time = state.clock.elapsedTime
        
        // Subtle bobbing on the waves
        shipRef.current.position.y = position[1] + Math.sin(time * 0.5 + position[0]) * 0.3
        
        // Very slow drift
        shipRef.current.position.x = position[0] + Math.sin(time * 0.05) * 2
        
        // Slight rotation with waves
        shipRef.current.rotation.z = Math.sin(time * 0.3 + position[2]) * 0.02
        shipRef.current.rotation.x = Math.sin(time * 0.25) * 0.01
    })
    
    // Ship silhouette color - darker at night
    const shipColor = useMemo(() => {
        const colors: Record<ShipType, string> = {
            cruise: isNight ? '#1a0a10' : '#4a3a40',
            container: isNight ? '#0a1a15' : '#3a4a45',
            tanker: isNight ? '#1a150a' : '#4a453a',
            bulk: isNight ? '#15100a' : '#453a35',
            lng: isNight ? '#0a151a' : '#3a454a',
            roro: isNight ? '#1a0a15' : '#4a3a45',
            research: isNight ? '#0a1a0a' : '#3a4a3a',
            droneship: isNight ? '#0a0a0a' : '#3a3a3a'
        }
        return colors[type]
    }, [type, isNight])
    
    const shipMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: shipColor,
        roughness: 0.9,
        metalness: 0.1
    }), [shipColor])
    
    // Ship dimensions based on type
    const dimensions = useMemo(() => {
        switch (type) {
            case 'cruise': return { length: 30, width: 6, height: 8 }
            case 'container': return { length: 35, width: 5, height: 6 }
            case 'tanker': return { length: 40, width: 7, height: 5 }
            case 'bulk': return { length: 38, width: 6, height: 6 }
            case 'lng': return { length: 42, width: 6, height: 6 }
            case 'roro': return { length: 28, width: 6, height: 7 }
            case 'research': return { length: 18, width: 4, height: 5 }
            case 'droneship': return { length: 15, width: 8, height: 2 }
        }
    }, [type])
    
    return (
        <group ref={shipRef} position={position} scale={[scale, scale, scale]}>
            {/* Main hull */}
            <mesh position={[0, dimensions.height * 0.3, 0]} material={shipMaterial}>
                <boxGeometry args={[dimensions.length, dimensions.height * 0.6, dimensions.width]} />
            </mesh>
            
            {/* Superstructure */}
            <mesh 
                position={[dimensions.length * 0.25, dimensions.height * 0.8, 0]} 
                material={shipMaterial}
            >
                <boxGeometry args={[dimensions.length * 0.3, dimensions.height * 0.4, dimensions.width * 0.7]} />
            </mesh>
            
            {/* Funnel/smokestack */}
            <mesh 
                position={[dimensions.length * 0.15, dimensions.height * 1.1, 0]}
            >
                <cylinderGeometry args={[0.8, 1, 2, 8]} />
                <meshStandardMaterial color="#2a2a2a" />
            </mesh>
            
            {/* Type-specific details */}
            {type === 'container' && (
                // Container stacks silhouette
                <mesh position={[-5, dimensions.height * 0.9, 0]}>
                    <boxGeometry args={[20, 3, 4]} />
                    <meshStandardMaterial color={isNight ? '#081210' : '#2a3a35'} />
                </mesh>
            )}
            
            {type === 'tanker' && (
                // Tanker deck structures
                <>
                    <mesh position={[-10, dimensions.height * 0.75, 0]}>
                        <cylinderGeometry args={[2, 2, 1.5, 8]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                    <mesh position={[5, dimensions.height * 0.75, 0]}>
                        <cylinderGeometry args={[2, 2, 1.5, 8]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                </>
            )}
            
            {/* Navigation lights (only visible at night) */}
            {isNight && (
                <group ref={lightsRef}>
                    {/* Masthead light (white) */}
                    <mesh position={[dimensions.length * 0.48, dimensions.height * 1.2, 0]}>
                        <sphereGeometry args={[0.3]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <pointLight 
                        position={[dimensions.length * 0.5, dimensions.height * 1.2, 0]}
                        color="#ffffff"
                        intensity={1}
                        distance={30}
                        decay={2}
                    />
                    
                    {/* Port light (red) - left side */}
                    <mesh position={[dimensions.length * 0.3, dimensions.height * 0.5, dimensions.width * 0.55]}>
                        <sphereGeometry args={[0.2]} />
                        <meshBasicMaterial color="#ff0000" />
                    </mesh>
                    <pointLight 
                        position={[dimensions.length * 0.3, dimensions.height * 0.5, dimensions.width * 0.6]}
                        color="#ff0000"
                        intensity={0.8}
                        distance={20}
                        decay={2}
                    />
                    
                    {/* Starboard light (green) - right side */}
                    <mesh position={[dimensions.length * 0.3, dimensions.height * 0.5, -dimensions.width * 0.55]}>
                        <sphereGeometry args={[0.2]} />
                        <meshBasicMaterial color="#00ff00" />
                    </mesh>
                    <pointLight 
                        position={[dimensions.length * 0.3, dimensions.height * 0.5, -dimensions.width * 0.6]}
                        color="#00ff00"
                        intensity={0.8}
                        distance={20}
                        decay={2}
                    />
                    
                    {/* Stern light (white) */}
                    <mesh position={[-dimensions.length * 0.48, dimensions.height * 0.5, 0]}>
                        <sphereGeometry args={[0.2]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    
                    {/* Cabin lights (warm glow) */}
                    <pointLight
                        position={[dimensions.length * 0.25, dimensions.height * 0.9, 0]}
                        color="#ffaa44"
                        intensity={0.5}
                        distance={15}
                        decay={2}
                    />
                </group>
            )}
            
            {/* Wake effect (subtle) */}
            <mesh position={[-dimensions.length * 0.6, -dimensions.height * 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[dimensions.length * 0.5, dimensions.width * 1.5]} />
                <meshBasicMaterial 
                    color={isNight ? '#0a1a2a' : '#4682B4'} 
                    transparent 
                    opacity={0.3}
                />
            </mesh>
        </group>
    )
}

// =============================================================================
// WAITING SHIP CARDINAL MARKERS
// Buoys marking the waiting area
// =============================================================================

function CardinalMarker({ position, type }: { position: [number, number, number]; type: 'north' | 'south' | 'east' | 'west' }) {
    const markerRef = useRef<THREE.Mesh>(null)
    
    useFrame((state) => {
        if (!markerRef.current) return
        const time = state.clock.elapsedTime
        
        // Bobbing on waves
        markerRef.current.position.y = position[1] + Math.sin(time * 1.5) * 0.5
    })
    
    // IALA cardinal marker colors
    const colors = {
        north: { top: '#000000', bottom: '#ffff00', flash: 'VQ' },  // Black over yellow
        south: { top: '#ffff00', bottom: '#000000', flash: 'VQ(3)' }, // Yellow over black
        east: { top: '#000000', center: '#ffff00', bottom: '#000000', flash: 'VQ(3)' }, // Black-yellow-black
        west: { top: '#ffff00', center: '#000000', bottom: '#ffff00', flash: 'VQ(9)' }  // Yellow-black-yellow
    }
    
    const color = colors[type]
    
    return (
        <group position={position}>
            <mesh ref={markerRef} position={[0, 2, 0]}>
                <cylinderGeometry args={[0.8, 1.2, 4, 8]} />
                <meshStandardMaterial color={color.bottom} />
            </mesh>
            
            {/* Top mark (triangle) */}
            <mesh position={[0, 4.5, 0]}>
                <coneGeometry args={[1, 1.5, 4]} />
                <meshStandardMaterial color={color.top} />
            </mesh>
            
            {/* Light */}
            <mesh position={[0, 5.5, 0]}>
                <sphereGeometry args={[0.3]} />
                <meshBasicMaterial color="#ffff00" />
            </mesh>
            <pointLight
                position={[0, 5.5, 0]}
                color="#ffff00"
                intensity={2}
                distance={25}
                decay={2}
            />
        </group>
    )
}

// =============================================================================
// MARINE LAYER FOG EFFECT
// Enhanced atmospheric perspective
// =============================================================================

function MarineLayer({ isNight }: { isNight: boolean }) {
    const fogRef = useRef<THREE.Mesh>(null)
    
    useFrame((state) => {
        if (!fogRef.current) return
        const time = state.clock.elapsedTime
        
        // Subtle fog movement
        fogRef.current.position.y = Math.sin(time * 0.1) * 2
    })
    
    return (
        <mesh ref={fogRef} position={[0, 10, -100]}>
            <boxGeometry args={[400, 20, 200]} />
            <meshBasicMaterial 
                color={isNight ? '#0a1520' : '#b8c5d0'}
                transparent
                opacity={isNight ? 0.15 : 0.25}
            />
        </mesh>
    )
}

// =============================================================================
// MAIN DISTANT SHIP QUEUE COMPONENT
// =============================================================================

export default function DistantShipQueue({ isNight }: DistantShipQueueProps) {
    const queue = harborEventSystem.getDistantShipQueue()
    const operations = harborEventSystem.getOperations()
    
    // Generate additional atmospheric ships
    const distantShips = useMemo(() => {
        const ships: { type: ShipType; position: [number, number, number]; scale: number }[] = []
        
        // Ships from the event system queue
        queue.forEach((queuedShip, i) => {
            ships.push({
                type: queuedShip.type,
                position: [
                    120 + i * 25 + (Math.random() - 0.5) * 10,
                    0,
                    -80 + (Math.random() - 0.5) * 40
                ],
                scale: 0.3 + Math.random() * 0.1
            })
        })
        
        // Additional atmospheric ships
        const extraCount = 3 + Math.floor(Math.random() * 4)
        const types: ShipType[] = ['container', 'tanker', 'bulk', 'cruise', 'lng']
        
        for (let i = 0; i < extraCount; i++) {
            ships.push({
                type: types[Math.floor(Math.random() * types.length)],
                position: [
                    150 + i * 30 + Math.random() * 20,
                    0,
                    -120 + (Math.random() - 0.5) * 60
                ],
                scale: 0.25 + Math.random() * 0.1
            })
        }
        
        return ships
    }, [queue])
    
    // Cardinal markers for waiting area
    const markers = useMemo(() => [
        { position: [100, 0, -60] as [number, number, number], type: 'north' as const },
        { position: [100, 0, -100] as [number, number, number], type: 'south' as const },
        { position: [140, 0, -80] as [number, number, number], type: 'east' as const },
        { position: [60, 0, -80] as [number, number, number], type: 'west' as const }
    ], [])
    
    return (
        <group>
            {/* Marine layer fog */}
            <MarineLayer isNight={isNight} />
            
            {/* Distant ships */}
            {distantShips.map((ship, i) => (
                <DistantShip
                    key={`distant-${i}`}
                    position={ship.position}
                    type={ship.type}
                    scale={ship.scale}
                    isNight={isNight}
                />
            ))}
            
            {/* Cardinal markers */}
            {markers.map((marker, i) => (
                <CardinalMarker
                    key={`marker-${i}`}
                    position={marker.position}
                    type={marker.type}
                />
            ))}
            
            {/* Queue length indicator (subtle glow based on business) */}
            {operations.queueLength > 3 && (
                <ambientLight 
                    intensity={0.05 * operations.queueLength} 
                    color="#ffaa00" 
                />
            )}
        </group>
    )
}

// Export components
export { DistantShip, CardinalMarker, MarineLayer }
