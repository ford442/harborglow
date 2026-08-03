// =============================================================================
// EXPERIMENTAL PORT TECH VISUALS - HarborGlow Bay
// Spectacular 2025-2026 technology visualizations
// =============================================================================

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { experimentalTechSystem, ExperimentalTechType } from '../systems/techSystem'

// =============================================================================
// 1. REMOTE CABLESS CRANES
// Empty crane cabs with glowing status, distant control tower
// =============================================================================

export function CablessCraneVisual({ position, intensity }: { position: [number, number, number]; intensity: number }) {
    const cabRef = useRef<THREE.Group>(null)
    const fiberRef = useRef<THREE.Group>(null)
    
    useFrame((state) => {
        if (!cabRef.current) return
        const time = state.clock.elapsedTime
        
        // Pulsing status LEDs on empty cab
        const pulse = (Math.sin(time * 2) + 1) / 2
        cabRef.current.children.forEach((child, i) => {
            if (child.userData.isLed) {
                const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
                mat.opacity = 0.5 + pulse * 0.5
            }
        })
    })
    
    // Control tower in distance
    return (
        <group>
            {/* Empty crane cab with status LEDs */}
            <group ref={cabRef} position={[0, 25, -10]}>
                {/* Cab structure */}
                <mesh>
                    <boxGeometry args={[3, 2.5, 2]} />
                    <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
                </mesh>
                
                {/* Status LED ring */}
                {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (i / 8) * Math.PI * 2
                    return (
                        <mesh
                            key={i}
                            userData={{ isLed: true }}
                            position={[Math.cos(angle) * 1.6, Math.sin(angle) * 1.3, 0]}
                        >
                            <sphereGeometry args={[0.1]} />
                            <meshBasicMaterial color="#00ff88" transparent opacity={0.8} />
                        </mesh>
                    )
                })}
                
                {/* Fiber optic cable runs */}
                <group ref={fiberRef}>
                    <mesh position={[-1.5, -1, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 25]} />
                        <meshBasicMaterial color="#00aaff" transparent opacity={0.6} />
                    </mesh>
                    <mesh position={[1.5, -1, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 25]} />
                        <meshBasicMaterial color="#00aaff" transparent opacity={0.6} />
                    </mesh>
                </group>
            </group>
            
            {/* Distant control tower */}
            <group position={position}>
                <mesh position={[0, 15, 0]}>
                    <cylinderGeometry args={[8, 10, 30]} />
                    <meshStandardMaterial color="#1a1a2a" roughness={0.5} />
                </mesh>
                
                {/* Video wall glow from windows */}
                <mesh position={[0, 20, 8]}>
                    <boxGeometry args={[12, 8, 1]} />
                    <meshBasicMaterial color="#4488ff" transparent opacity={0.3 * intensity} />
                </mesh>
                <pointLight position={[0, 20, 10]} color="#4488ff" intensity={2 * intensity} distance={50} />
                
                {/* Tower beacon */}
                <mesh position={[0, 32, 0]}>
                    <sphereGeometry args={[0.5]} />
                    <meshBasicMaterial color="#ff0000" />
                </mesh>
            </group>
        </group>
    )
}

// =============================================================================
// 2. DIGITAL TWIN OVERLAY
// Holographic wireframe port with data streams
// =============================================================================

export function DigitalTwinVisual({ position, intensity }: { position: [number, number, number]; intensity: number }) {
    const twinRef = useRef<THREE.Group>(null)
    
    useFrame((state) => {
        if (!twinRef.current) return
        const time = state.clock.elapsedTime
        
        // Rotate slowly
        twinRef.current.rotation.y = time * 0.05
        
        // Pulse holographic opacity
        twinRef.current.children.forEach(child => {
            if (child.userData.isHologram) {
                const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
                mat.opacity = 0.1 + (Math.sin(time * 1.5) + 1) / 4 * intensity
            }
        })
    })
    
    return (
        <group ref={twinRef} position={position}>
            {/* Wireframe port outline */}
            <mesh userData={{ isHologram: true }} position={[0, 0, 0]}>
                <boxGeometry args={[100, 1, 80]} />
                <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.2 * intensity} />
            </mesh>
            
            {/* Data streams */}
            {Array.from({ length: 20 }).map((_, i) => (
                <mesh
                    key={i}
                    userData={{ isHologram: true }}
                    position={[
                        (Math.random() - 0.5) * 80,
                        5 + Math.random() * 20,
                        (Math.random() - 0.5) * 60
                    ]}
                >
                    <cylinderGeometry args={[0.1, 0.1, 10]} />
                    <meshBasicMaterial color="#00ffff" transparent opacity={0.3 * intensity} />
                </mesh>
            ))}
            
            {/* Floating AR labels */}
            <group position={[20, 10, 20]}>
                <mesh>
                    <planeGeometry args={[4, 1]} />
                    <meshBasicMaterial color="#00aaff" transparent opacity={0.5 * intensity} />
                </mesh>
                <mesh position={[0, 0, 0.1]}>
                    <boxGeometry args={[0.1, 0.1, 2]} />
                    <meshBasicMaterial color="#00aaff" />
                </mesh>
            </group>
            
            {/* Central holographic projection glow */}
            <pointLight position={[0, 10, 0]} color="#00ffff" intensity={3 * intensity} distance={60} />
        </group>
    )
}

// =============================================================================
// 3. UNDERWATER ROV SWARM
// Glowing inspection drones with laser scanning
// =============================================================================

export function ROVSwarmVisual({ position, intensity }: { position: [number, number, number]; intensity: number }) {
    const swarmRef = useRef<THREE.Group>(null)
    const rovData = experimentalTechSystem.getROVSwarmData()
    
    useFrame((state) => {
        if (!swarmRef.current) return
        const time = state.clock.elapsedTime
        
        // Animate each ROV
        swarmRef.current.children.forEach((rov, i) => {
            const data = rovData[i]
            if (!data) return
            
            // Orbit around center
            const angle = time * 0.3 + data.phase
            rov.position.x = Math.cos(angle) * Math.abs(data.offset[0])
            rov.position.z = Math.sin(angle) * Math.abs(data.offset[2])
            rov.position.y = data.offset[1] + Math.sin(time * 0.5 + i) * 0.5
            
            // Rotate to face movement
            rov.rotation.y = -angle
        })
    })
    
    return (
        <group ref={swarmRef} position={position}>
            {rovData.map((data, i) => (
                <group key={i}>
                    {/* ROV body */}
                    <mesh>
                        <boxGeometry args={[0.8, 0.4, 0.5]} />
                        <meshStandardMaterial color="#1a2a3a" roughness={0.3} metalness={0.7} />
                    </mesh>
                    
                    {/* LED status ring */}
                    <mesh position={[0, 0.3, 0]}>
                        <torusGeometry args={[0.3, 0.05, 8, 16]} />
                        <meshBasicMaterial color="#00ff88" transparent opacity={0.8 * intensity} />
                    </mesh>
                    
                    {/* Laser scan beam */}
                    <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.02, 0.02, 3]} />
                        <meshBasicMaterial color="#00ff88" transparent opacity={0.3 * intensity} />
                    </mesh>
                    
                    {/* Propeller glow */}
                    <mesh position={[-0.5, 0, 0]}>
                        <sphereGeometry args={[0.1]} />
                        <meshBasicMaterial color="#4488ff" transparent opacity={0.6 * intensity} />
                    </mesh>
                </group>
            ))}
            
            {/* Swarm center glow */}
            <pointLight position={[0, -5, 0]} color="#00ff88" intensity={2 * intensity} distance={30} />
        </group>
    )
}

// =============================================================================
// 4. HYDROGEN FUEL CELL AGVs
// Silent blue-glowing autonomous vehicles
// =============================================================================

export function HydrogenAGVsVisual({ position, intensity }: { position: [number, number, number]; intensity: number }) {
    const agvsRef = useRef<THREE.Group>(null)
    
    useFrame((state) => {
        if (!agvsRef.current) return
        const time = state.clock.elapsedTime
        
        // Animate AGVs moving in yard patterns
        agvsRef.current.children.forEach((agv, i) => {
            const offset = i * 10
            agv.position.x = position[0] + Math.sin(time * 0.2 + i) * 30 + offset
            agv.position.z = position[2] + Math.cos(time * 0.15 + i) * 20
            agv.rotation.y = time * 0.2 + i
        })
    })
    
    return (
        <group ref={agvsRef}>
            {Array.from({ length: 6 }).map((_, i) => (
                <group key={i}>
                    {/* AGV body */}
                    <mesh position={[0, 0.8, 0]}>
                        <boxGeometry args={[4, 1.2, 2.5]} />
                        <meshStandardMaterial color="#f0f0f0" roughness={0.2} metalness={0.5} />
                    </mesh>
                    
                    {/* H2 tank (visible) */}
                    <mesh position={[0, 1.8, 0]}>
                        <cylinderGeometry args={[0.6, 0.6, 2]} />
                        <meshStandardMaterial color="#silver" roughness={0.1} metalness={0.9} />
                    </mesh>
                    
                    {/* Blue accent lighting */}
                    <mesh position={[0, 0.5, 1.3]}>
                        <boxGeometry args={[3, 0.1, 0.1]} />
                        <meshBasicMaterial color="#0088ff" transparent opacity={0.8 * intensity} />
                    </mesh>
                    <mesh position={[0, 0.5, -1.3]}>
                        <boxGeometry args={[3, 0.1, 0.1]} />
                        <meshBasicMaterial color="#0088ff" transparent opacity={0.8 * intensity} />
                    </mesh>
                    
                    {/* H2 tank level indicator */}
                    <mesh position={[0.8, 1.8, 0]}>
                        <boxGeometry args={[0.05, 1.5, 0.1]} />
                        <meshBasicMaterial color="#00aaff" transparent opacity={0.9 * intensity} />
                    </mesh>
                    
                    {/* Vapor exhaust (water only) */}
                    <mesh position={[-2.2, 0.5, 0]}>
                        <sphereGeometry args={[0.2]} />
                        <meshBasicMaterial color="#ffffff" transparent opacity={0.2 * intensity} />
                    </mesh>
                </group>
            ))}
        </group>
    )
}

// =============================================================================
// 5. AERIAL DRONE SWARM
// Formation-flying security drones with searchlights
// =============================================================================

export function AerialDroneSwarmVisual({ position, intensity }: { position: [number, number, number]; intensity: number }) {
    const swarmRef = useRef<THREE.Group>(null)
    const formationData = experimentalTechSystem.getDroneFormationData()
    
    useFrame((state) => {
        if (!swarmRef.current) return
        const time = state.clock.elapsedTime
        
        // Animate formation
        swarmRef.current.children.forEach((drone, i) => {
            const data = formationData[i]
            if (!data) return
            
            // V-formation movement
            const formationX = Math.cos(data.angle + time * 0.1) * 20
            const formationZ = Math.sin(data.angle + time * 0.1) * 15
            const formationY = data.altitude + Math.sin(time * 0.3 + i) * 5
            
            drone.position.x = position[0] + formationX
            drone.position.y = formationY
            drone.position.z = position[2] + formationZ
            
            drone.rotation.y = -time * 0.1
        })
    })
    
    return (
        <group ref={swarmRef}>
            {formationData.map((data, i) => (
                <group key={i}>
                    {/* Drone body */}
                    <mesh>
                        <boxGeometry args={[0.8, 0.3, 0.8]} />
                        <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
                    </mesh>
                    
                    {/* Arms with rotors */}
                    {[[1, 0], [0, 1], [-1, 0], [0, -1]].map(([x, z], j) => (
                        <group key={j} position={[x * 0.5, 0.1, z * 0.5]}>
                            <mesh>
                                <cylinderGeometry args={[0.3, 0.3, 0.05]} />
                                <meshBasicMaterial color="#444" transparent opacity={0.3} />
                            </mesh>
                            {/* Rotor blur */}
                            <mesh position={[0, 0.05, 0]}>
                                <cylinderGeometry args={[0.35, 0.35, 0.02]} />
                                <meshBasicMaterial color="#666" transparent opacity={0.5} />
                            </mesh>
                        </group>
                    ))}
                    
                    {/* Status LED */}
                    <mesh position={[0, 0.2, 0]}>
                        <sphereGeometry args={[0.08]} />
                        <meshBasicMaterial color="#ff6600" transparent opacity={0.9 * intensity} />
                    </mesh>
                    
                    {/* Searchlight beam */}
                    <mesh position={[0, -0.5, 0]} rotation={[0, 0, 0]}>
                        <coneGeometry args={[0.5, 10, 16, 1, true]} />
                        <meshBasicMaterial color="#ffaa00" transparent opacity={0.1 * intensity} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            ))}
        </group>
    )
}

// =============================================================================
// 6. AI SMART CRANES
// Glowing status lights, predictive path projections
// =============================================================================

export function AISmartCraneVisual({ position, intensity }: { position: [number, number, number]; intensity: number }) {
    const craneRef = useRef<THREE.Group>(null)
    const pathRef = useRef<THREE.Group>(null)
    
    useFrame((state) => {
        if (!craneRef.current || !pathRef.current) return
        const time = state.clock.elapsedTime
        
        // Pulse status LEDs
        craneRef.current.children.forEach(child => {
            if (child.userData.isStatusLed) {
                const pulse = (Math.sin(time * 3) + 1) / 2
                const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
                mat.opacity = 0.4 + pulse * 0.6 * intensity
            }
        })
        
        // Animate predictive path
        pathRef.current.children.forEach((arc, i) => {
            const mat = (arc as THREE.Mesh).material as THREE.MeshBasicMaterial
            mat.opacity = (0.3 + Math.sin(time * 2 + i) * 0.2) * intensity
        })
    })
    
    return (
        <group position={position}>
            {/* Crane structure with status LEDs */}
            <group ref={craneRef}>
                {/* Main boom */}
                <mesh position={[0, 20, 0]}>
                    <boxGeometry args={[2, 40, 2]} />
                    <meshStandardMaterial color="#2a2a2a" />
                </mesh>
                
                {/* Status LED strips on joints */}
                {[[0, 35, 0], [0, 25, 0], [0, 15, 0]].map((pos, i) => (
                    <mesh key={i} userData={{ isStatusLed: true }} position={pos as [number, number, number]}>
                        <torusGeometry args={[1.2, 0.1, 8, 16]} />
                        <meshBasicMaterial color="#00aaff" transparent opacity={0.8} />
                    </mesh>
                ))}
                
                {/* Laser scanner */}
                <mesh position={[0, 30, 2]}>
                    <boxGeometry args={[0.5, 0.5, 0.2]} />
                    <meshBasicMaterial color="#ff0000" transparent opacity={0.8 * intensity} />
                </mesh>
                {/* Laser sweep line */}
                <mesh position={[0, 30, 10]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[20, 0.05]} />
                    <meshBasicMaterial color="#ff0000" transparent opacity={0.3 * intensity} side={THREE.DoubleSide} />
                </mesh>
            </group>
            
            {/* Predictive path arcs */}
            <group ref={pathRef}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <mesh key={i} position={[10 + i * 5, 25 - i * 5, 0]} rotation={[0, 0, Math.PI / 4]}>
                        <torusGeometry args={[5 + i * 2, 0.1, 8, 32]} />
                        <meshBasicMaterial color="#00aaff" transparent opacity={0.3 * intensity} />
                    </mesh>
                ))}
            </group>
            
            {/* AI processing glow */}
            <pointLight position={[0, 30, 0]} color="#00aaff" intensity={2 * intensity} distance={40} />
        </group>
    )
}

// =============================================================================
// 7. EMISSIONS CAPTURE BARGES
// Giant exhaust processing systems with glowing fans
// =============================================================================

export function EmissionsBargeVisual({ 
    position, 
    intensity,
    targetShipId
}: { 
    position: [number, number, number]; 
    intensity: number;
    targetShipId?: string
}) {
    const bargeRef = useRef<THREE.Group>(null)
    const armRef = useRef<THREE.Group>(null)
    const fanRef = useRef<THREE.Mesh>(null)
    
    useFrame((state) => {
        if (!bargeRef.current || !armRef.current || !fanRef.current) return
        const time = state.clock.elapsedTime
        
        // Rotate fan
        fanRef.current.rotation.z = time * 2
        
        // Pulse capture glow
        const pulse = (Math.sin(time * 1.5) + 1) / 2
        const glowMeshes = bargeRef.current.children.filter(c => c.userData.isGlowElement)
        glowMeshes.forEach(mesh => {
            const mat = (mesh as THREE.Mesh).material as THREE.MeshBasicMaterial
            mat.opacity = (0.5 + pulse * 0.5) * intensity
        })
    })
    
    return (
        <group ref={bargeRef} position={position}>
            {/* Barge deck */}
            <mesh position={[0, 2, 0]}>
                <boxGeometry args={[45, 4, 12]} />
                <meshStandardMaterial color="#3a3a3a" roughness={0.8} />
            </mesh>
            
            {/* Processing equipment housing */}
            <mesh position={[0, 6, 0]}>
                <boxGeometry args={[30, 6, 8]} />
                <meshStandardMaterial color="#2a2a2a" />
            </mesh>
            
            {/* Glowing status panels */}
            <mesh userData={{ isGlowElement: true }} position={[10, 6, 4.1]}>
                <planeGeometry args={[4, 2]} />
                <meshBasicMaterial color="#00ff88" transparent opacity={0.7 * intensity} />
            </mesh>
            <mesh userData={{ isGlowElement: true }} position={[-10, 6, 4.1]}>
                <planeGeometry args={[4, 2]} />
                <meshBasicMaterial color="#00ff88" transparent opacity={0.7 * intensity} />
            </mesh>
            
            {/* Articulating arm */}
            <group ref={armRef} position={[15, 8, 0]}>
                {/* Arm segments */}
                <mesh position={[10, 10, 0]} rotation={[0, 0, Math.PI / 6]}>
                    <cylinderGeometry args={[0.8, 0.8, 25]} />
                    <meshStandardMaterial color="#4a4a4a" />
                </mesh>
                
                {/* Capture hood at end */}
                <mesh position={[20, 20, 0]}>
                    <cylinderGeometry args={[3, 2, 4]} />
                    <meshStandardMaterial color="#2a2a2a" />
                </mesh>
                
                {/* Giant intake fan */}
                <mesh ref={fanRef} position={[20, 20, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <cylinderGeometry args={[2.5, 2.5, 0.5, 16]} />
                    <meshBasicMaterial color="#1a1a1a" />
                </mesh>
                
                {/* Fan blades (cross) */}
                <mesh position={[20.3, 20, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[0.2, 4, 0.5]} />
                    <meshStandardMaterial color="#666" />
                </mesh>
                <mesh position={[20.3, 20, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
                    <boxGeometry args={[0.2, 4, 0.5]} />
                    <meshStandardMaterial color="#666" />
                </mesh>
                
                {/* Fan glow ring */}
                <mesh userData={{ isGlowElement: true }} position={[20, 20, 0]}>
                    <torusGeometry args={[2.6, 0.1, 8, 32]} />
                    <meshBasicMaterial color="#00ff88" transparent opacity={0.8 * intensity} />
                </mesh>
            </group>
            
            {/* Exhaust plume (purified) */}
            <mesh position={[25, 25, 0]}>
                <coneGeometry args={[2, 8, 16, 1, true]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.15 * intensity} side={THREE.DoubleSide} />
            </mesh>
            
            {/* Warning beacons */}
            <mesh position={[-20, 10, 0]}>
                <sphereGeometry args={[0.3]} />
                <meshBasicMaterial color="#ff0000" transparent opacity={0.9 * intensity} />
            </mesh>
            <mesh position={[20, 10, 0]}>
                <sphereGeometry args={[0.3]} />
                <meshBasicMaterial color="#ff0000" transparent opacity={0.9 * intensity} />
            </mesh>
            
            {/* Area lighting */}
            <pointLight position={[0, 15, 0]} color="#00ff88" intensity={3 * intensity} distance={60} />
            <pointLight position={[20, 22, 0]} color="#ffffff" intensity={2 * intensity} distance={40} />
        </group>
    )
}

// =============================================================================
// MAIN EXPERIMENTAL TECH RENDERER
// =============================================================================

export default function ExperimentalTechRenderer() {
    const activeTech = experimentalTechSystem.getActiveTech()
    const isNight = useGameStore(state => state.isNight)
    
    // Auto-activate default tech on mount
    useMemo(() => {
        experimentalTechSystem.activateTech('cabless_cranes')
        experimentalTechSystem.activateTech('ai_smart_cranes')
    }, [])
    
    return (
        <>
            {activeTech.map(tech => {
                const intensity = tech.intensity * (isNight ? 1.2 : 0.6)
                
                switch (tech.type) {
                    case 'cabless_cranes':
                        return (
                            <CablessCraneVisual
                                key={tech.id}
                                position={tech.position}
                                intensity={intensity}
                            />
                        )
                    case 'digital_twin':
                        return (
                            <DigitalTwinVisual
                                key={tech.id}
                                position={tech.position}
                                intensity={intensity}
                            />
                        )
                    case 'underwater_rov_swarm':
                        return (
                            <ROVSwarmVisual
                                key={tech.id}
                                position={tech.position}
                                intensity={intensity}
                            />
                        )
                    case 'hydrogen_agvs':
                        return (
                            <HydrogenAGVsVisual
                                key={tech.id}
                                position={tech.position}
                                intensity={intensity}
                            />
                        )
                    case 'aerial_drone_swarm':
                        return (
                            <AerialDroneSwarmVisual
                                key={tech.id}
                                position={tech.position}
                                intensity={intensity}
                            />
                        )
                    case 'ai_smart_cranes':
                        return (
                            <AISmartCraneVisual
                                key={tech.id}
                                position={tech.position}
                                intensity={intensity}
                            />
                        )
                    case 'emissions_barges':
                        return (
                            <EmissionsBargeVisual
                                key={tech.id}
                                position={tech.position}
                                intensity={intensity}
                                targetShipId={tech.metadata?.targetShipId as string}
                            />
                        )
                    default:
                        return null
                }
            })}
        </>
    )
}


