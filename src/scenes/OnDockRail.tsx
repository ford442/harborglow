// =============================================================================
// ON-DOCK RAIL SYSTEM - HarborGlow Bay
// Intermodal rail yard with RMG cranes and container trains
//
// Real-world reference: Port of Oakland has extensive on-dock rail facilities
// connecting to the BNSF and UP rail networks across the US
// =============================================================================

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { harborEventSystem } from '../systems/eventSystem'

// =============================================================================
// TYPES
// =============================================================================

interface RMGCraneProps {
    position: [number, number, number]
    trackLength: number
    craneId: number
}

interface TrainProps {
    position: [number, number, number]
    direction: 'inbound' | 'outbound'
    trainId: number
}

interface RailYardProps {
    isNight: boolean
}

// =============================================================================
// RAIL-MOUNTED GANTRY CRANE (RMG)
// These move on rails alongside the container stacks
// =============================================================================

function RMGCrane({ position, trackLength, craneId }: RMGCraneProps) {
    const craneRef = useRef<THREE.Group>(null)
    const trolleyRef = useRef<THREE.Group>(null)
    const spreaderRef = useRef<THREE.Group>(null)
    
    // Get operational state
    const operations = harborEventSystem.getOperations()
    const railActivity = operations.railActivity
    
    useFrame((state) => {
        if (!craneRef.current || !trolleyRef.current || !spreaderRef.current) return
        
        const time = state.clock.elapsedTime
        const craneSpeed = 0.1 + railActivity * 0.15
        
        // Crane moves along the track (gantry travel)
        const gantryPos = Math.sin(time * craneSpeed * 0.3 + craneId) * (trackLength * 0.4)
        craneRef.current.position.x = position[0] + gantryPos
        
        // Trolley moves across the span
        const trolleyPos = Math.sin(time * craneSpeed * 0.5 + craneId * 1.5) * 8
        trolleyRef.current.position.z = trolleyPos
        
        // Spreader (container grabber) hoists
        const hoistHeight = 8 + Math.sin(time * craneSpeed * 0.8 + craneId * 2) * 4
        spreaderRef.current.position.y = -hoistHeight
        
        // Subtle crane sway based on wind/operations
        const swayAmount = operations.craneSwayFactor * 0.02
        craneRef.current.rotation.z = Math.sin(time * 0.5) * swayAmount
    })
    
    // Silhouette material for foggy atmosphere
    const craneMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#2a2a2a',
        roughness: 0.7,
        metalness: 0.3
    }), [])
    
    const lightMaterial = useMemo(() => new THREE.MeshBasicMaterial({
        color: '#ffaa00',
        transparent: true,
        opacity: 0.8
    }), [])
    
    return (
        <group ref={craneRef} position={position}>
            {/* Gantry legs - 4 tall legs on rails */}
            <group position={[-12, 15, -6]}>
                <mesh material={craneMaterial}>
                    <boxGeometry args={[1.5, 30, 1.5]} />
                </mesh>
            </group>
            <group position={[-12, 15, 6]}>
                <mesh material={craneMaterial}>
                    <boxGeometry args={[1.5, 30, 1.5]} />
                </mesh>
            </group>
            <group position={[12, 15, -6]}>
                <mesh material={craneMaterial}>
                    <boxGeometry args={[1.5, 30, 1.5]} />
                </mesh>
            </group>
            <group position={[12, 15, 6]}>
                <mesh material={craneMaterial}>
                    <boxGeometry args={[1.5, 30, 1.5]} />
                </mesh>
            </group>
            
            {/* Gantry beam (top structure) */}
            <mesh position={[0, 30, 0]} material={craneMaterial}>
                <boxGeometry args={[26, 2, 14]} />
            </mesh>
            
            {/* Machinery house */}
            <mesh position={[8, 32, 0]} material={craneMaterial}>
                <boxGeometry args={[6, 3, 8]} />
            </mesh>
            
            {/* Trolley (moves across the span) */}
            <group ref={trolleyRef} position={[0, 29, 0]}>
                <mesh material={craneMaterial}>
                    <boxGeometry args={[3, 1.5, 4]} />
                </mesh>
                
                {/* Hoist cables */}
                <mesh position={[0, -4, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 8]} />
                    <meshBasicMaterial color="#1a1a1a" />
                </mesh>
                
                {/* Spreader (container spreader beam) */}
                <group ref={spreaderRef} position={[0, 0, 0]}>
                    <mesh material={craneMaterial}>
                        <boxGeometry args={[2.8, 0.5, 12]} />
                    </mesh>
                    
                    {/* Twist locks (container corners) */}
                    {[[-1, -5.5], [1, -5.5], [-1, 5.5], [1, 5.5]].map(([x, z], i) => (
                        <mesh key={i} position={[x, -0.5, z]}>
                            <boxGeometry args={[0.3, 0.8, 0.3]} />
                            <meshBasicMaterial color="#333" />
                        </mesh>
                    ))}
                </group>
            </group>
            
            {/* Safety lights */}
            <mesh position={[0, 31, 7]} material={lightMaterial}>
                <sphereGeometry args={[0.3]} />
            </mesh>
            <mesh position={[0, 31, -7]} material={lightMaterial}>
                <sphereGeometry args={[0.3]} />
            </mesh>
            
            {/* Navigation lights on legs */}
            <mesh position={[-12, 28, 6]} material={lightMaterial}>
                <sphereGeometry args={[0.2]} />
            </mesh>
            <mesh position={[12, 28, -6]} material={lightMaterial}>
                <sphereGeometry args={[0.2]} />
            </mesh>
        </group>
    )
}

// =============================================================================
// INTERMODAL CONTAINER TRAIN
// Double-stack well cars carrying containers
// =============================================================================

function IntermodalTrain({ position, direction, trainId }: TrainProps) {
    const trainRef = useRef<THREE.Group>(null)
    const operations = harborEventSystem.getOperations()
    
    useFrame((state) => {
        if (!trainRef.current) return
        
        const time = state.clock.elapsedTime
        const railActivity = operations.railActivity
        
        // Train moves slowly through the yard
        const speed = 0.5 + railActivity * 2  // 0.5-2.5 m/s
        const directionMultiplier = direction === 'outbound' ? 1 : -1
        
        // Movement along track with occasional stops
        const cycle = (time * speed * 0.1 + trainId * 100) % 200
        let xPos = cycle - 100  // -100 to 100
        
        // Stop at loading position (near RMG cranes)
        if (Math.abs(xPos) < 20 && railActivity > 0.5) {
            xPos = Math.sign(xPos) * 20  // Hold position
        }
        
        trainRef.current.position.x = xPos
    })
    
    const carCount = 8 + trainId * 2  // 8-12 cars per train
    
    return (
        <group ref={trainRef} position={position}>
            {/* Locomotive */}
            <TrainLocomotive direction={direction} />
            
            {/* Well cars with containers */}
            {Array.from({ length: carCount }).map((_, i) => (
                <WellCar 
                    key={i} 
                    position={[-20 - i * 16, 0, 0]} 
                    hasContainers={Math.random() > 0.3}
                    containerColors={['#00d4aa', '#ff9500', '#ff6b9d', '#00bfff']}
                />
            ))}
        </group>
    )
}

function TrainLocomotive({ direction }: { direction: 'inbound' | 'outbound' }) {
    const locoMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#1a1a2a',
        roughness: 0.6,
        metalness: 0.4
    }), [])
    
    const headlightMaterial = useMemo(() => new THREE.MeshBasicMaterial({
        color: '#ffffff'
    }), [])
    
    const isOutbound = direction === 'outbound'
    
    return (
        <group position={[8, 2, 0]} rotation={[0, isOutbound ? 0 : Math.PI, 0]}>
            {/* Main body */}
            <mesh position={[0, 2, 0]} material={locoMaterial}>
                <boxGeometry args={[16, 6, 5]} />
            </mesh>
            
            {/* Cab */}
            <mesh position={[5, 5, 0]} material={locoMaterial}>
                <boxGeometry args={[5, 5, 5]} />
            </mesh>
            
            {/* Fuel tank */}
            <mesh position={[-2, 0.5, 0]} material={locoMaterial}>
                <boxGeometry args={[8, 2, 4]} />
            </mesh>
            
            {/* Wheels */}
            {[-5, -2, 1, 4].map((x, i) => (
                <group key={i} position={[x, 1, 0]}>
                    <mesh position={[0, 0, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.8, 0.8, 0.5, 16]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                    <mesh position={[0, 0, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.8, 0.8, 0.5, 16]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                </group>
            ))}
            
            {/* Headlight */}
            <mesh position={[8.1, 3, 0]} material={headlightMaterial}>
                <sphereGeometry args={[0.4]} />
            </mesh>
            
            {/* Ditch lights */}
            <mesh position={[8, 1, 2]} material={headlightMaterial}>
                <sphereGeometry args={[0.2]} />
            </mesh>
            <mesh position={[8, 1, -2]} material={headlightMaterial}>
                <sphereGeometry args={[0.2]} />
            </mesh>
            
            {/* Roof horns */}
            <mesh position={[3, 7.5, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 1]} />
                <meshStandardMaterial color="#gold" />
            </mesh>
        </group>
    )
}

function WellCar({ 
    position, 
    hasContainers,
    containerColors 
}: { 
    position: [number, number, number]
    hasContainers: boolean
    containerColors: string[]
}) {
    const wellMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#2a2a2a',
        roughness: 0.8
    }), [])
    
    return (
        <group position={position}>
            {/* Well car frame */}
            <mesh position={[0, 1, 0]} material={wellMaterial}>
                <boxGeometry args={[14, 1, 10]} />
            </mesh>
            
            {/* Wheels */}
            <mesh position={[-5, 0.8, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.6, 0.6, 0.4, 12]} />
                <meshStandardMaterial color="#444" />
            </mesh>
            <mesh position={[-5, 0.8, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.6, 0.6, 0.4, 12]} />
                <meshStandardMaterial color="#444" />
            </mesh>
            <mesh position={[5, 0.8, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.6, 0.6, 0.4, 12]} />
                <meshStandardMaterial color="#444" />
            </mesh>
            <mesh position={[5, 0.8, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.6, 0.6, 0.4, 12]} />
                <meshStandardMaterial color="#444" />
            </mesh>
            
            {/* Double-stack containers */}
            {hasContainers && (
                <>
                    {/* Bottom container */}
                    <mesh position={[0, 3, 0]}>
                        <boxGeometry args={[12, 2.9, 8]} />
                        <meshStandardMaterial 
                            color={containerColors[Math.floor(Math.random() * containerColors.length)]} 
                            roughness={0.4}
                        />
                    </mesh>
                    {/* Top container */}
                    <mesh position={[0, 6, 0]}>
                        <boxGeometry args={[12, 2.9, 8]} />
                        <meshStandardMaterial 
                            color={containerColors[Math.floor(Math.random() * containerColors.length)]}
                            roughness={0.4}
                        />
                    </mesh>
                </>
            )}
        </group>
    )
}

// =============================================================================
// RAIL TRACKS
// =============================================================================

function RailTracks({ position }: { position: [number, number, number] }) {
    const trackLength = 200
    const sleeperSpacing = 1.5
    const sleeperCount = Math.floor(trackLength / sleeperSpacing)
    
    const railMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#4a4a4a',
        roughness: 0.9
    }), [])
    
    const sleeperMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#5c4033',
        roughness: 1.0
    }), [])
    
    return (
        <group position={position}>
            {/* Rails */}
            <mesh position={[0, 0.3, 2.5]} material={railMaterial}>
                <boxGeometry args={[trackLength, 0.15, 0.15]} />
            </mesh>
            <mesh position={[0, 0.3, -2.5]} material={railMaterial}>
                <boxGeometry args={[trackLength, 0.15, 0.15]} />
            </mesh>
            
            {/* Sleepers (instanced for performance) */}
            {Array.from({ length: sleeperCount }).map((_, i) => (
                <mesh 
                    key={i}
                    position={[-trackLength/2 + i * sleeperSpacing, 0.1, 0]}
                    material={sleeperMaterial}
                >
                    <boxGeometry args={[0.8, 0.2, 6]} />
                </mesh>
            ))}
            
            {/* Ballast (simplified as ground plane) */}
            <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[trackLength, 12]} />
                <meshStandardMaterial color="#3a3a3a" roughness={1} />
            </mesh>
        </group>
    )
}

// =============================================================================
// CONTAINER STACKS (in rail yard)
// =============================================================================

function ContainerStack({ 
    position, 
    height = 4,
    isNight 
}: { 
    position: [number, number, number]
    height?: number
    isNight: boolean
}) {
    const colors = ['#00d4aa', '#ff9500', '#ff6b9d', '#00bfff', '#8b4513', '#9b59b6']
    
    return (
        <group position={position}>
            {Array.from({ length: height }).map((_, y) => (
                <mesh key={y} position={[0, 1.5 + y * 3, 0]}>
                    <boxGeometry args={[12.2, 2.9, 8.2]} />
                    <meshStandardMaterial 
                        color={colors[Math.floor(Math.random() * colors.length)]}
                        roughness={0.4}
                        metalness={0.1}
                    />
                </mesh>
            ))}
            
            {/* Safety lights on top of stacks */}
            {isNight && (
                <mesh position={[0, 1.5 + height * 3, 0]}>
                    <sphereGeometry args={[0.2]} />
                    <meshBasicMaterial color="#ff0000" />
                </mesh>
            )}
        </group>
    )
}

// =============================================================================
// MAIN RAIL YARD COMPONENT
// =============================================================================

export default function OnDockRail({ isNight }: RailYardProps) {
    const operations = harborEventSystem.getOperations()
    
    // Generate container stack positions
    const stackPositions = useMemo(() => {
        const positions: [number, number, number][] = []
        for (let x = -80; x <= 80; x += 25) {
            for (let z = 30; z <= 70; z += 20) {
                if (Math.random() > 0.3) {
                    positions.push([x, 0, z])
                }
            }
        }
        return positions
    }, [])
    
    return (
        <group>
            {/* Rail tracks */}
            <RailTracks position={[0, 0, 15]} />
            
            {/* RMG Cranes on tracks */}
            <RMGCrane position={[-60, 0, 15]} trackLength={120} craneId={0} />
            <RMGCrane position={[-20, 0, 15]} trackLength={120} craneId={1} />
            <RMGCrane position={[20, 0, 15]} trackLength={120} craneId={2} />
            <RMGCrane position={[60, 0, 15]} trackLength={120} craneId={3} />
            
            {/* Container trains */}
            <IntermodalTrain position={[0, 0, 15]} direction="outbound" trainId={0} />
            <IntermodalTrain position={[0, 0, 15]} direction="inbound" trainId={1} />
            
            {/* Container stacks in yard */}
            {stackPositions.map((pos, i) => (
                <ContainerStack 
                    key={i} 
                    position={pos} 
                    height={3 + Math.floor(Math.random() * 3)}
                    isNight={isNight}
                />
            ))}
            
            {/* Yard lighting */}
            {isNight && (
                <>
                    {/* High mast lights */}
                    {[-60, -20, 20, 60].map((x, i) => (
                        <group key={i} position={[x, 0, 50]}>
                            <mesh position={[0, 15, 0]}>
                                <cylinderGeometry args={[0.3, 0.5, 30]} />
                                <meshStandardMaterial color="#2a2a2a" />
                            </mesh>
                            <mesh position={[0, 30, 0]}>
                                <boxGeometry args={[8, 1, 3]} />
                                <meshBasicMaterial color="#ffffee" transparent opacity={0.9} />
                            </mesh>
                            <pointLight 
                                position={[0, 28, 0]} 
                                intensity={2} 
                                color="#ffaa00" 
                                distance={60}
                                decay={2}
                            />
                        </group>
                    ))}
                </>
            )}
            
            {/* Operations indicator (subtle glow during high activity) */}
            {operations.railActivity > 0.7 && (
                <ambientLight intensity={0.1} color="#ffaa00" />
            )}
        </group>
    )
}

// Export individual components for use elsewhere
export { RMGCrane, IntermodalTrain, RailTracks, ContainerStack }
