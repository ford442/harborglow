import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import type { Ship } from '../store/useGameStore'
import { useGameStore } from '../store/useGameStore'
import { ProceduralShip } from './ProceduralShip'
import { useLOD } from '../systems/performanceSystem'

interface ShipProps {
    ship: Ship
}

// PHASE 10: LOD Impostor for distant ships
function ShipImpostor({ type }: { type: Ship['type'] }) {
    const colors: Record<Ship['type'], string> = {
        cruise: '#ff6b9d',
        container: '#00d4aa',
        tanker: '#ff9500',
        bulk: '#8b4513',
        lng: '#00bfff',
        roro: '#9b59b6',
        research: '#2ecc71',
        droneship: '#34495e'
    }
    const color = colors[type]
    
    const size = useMemo(() => {
        switch (type) {
            case 'cruise': return [6, 2, 1.5] as [number, number, number]
            case 'container': return [10, 1.5, 2] as [number, number, number]
            case 'tanker': return [8, 2, 2.5] as [number, number, number]
            case 'bulk': return [12, 3, 2] as [number, number, number]
            case 'lng': return [14, 3.5, 2.2] as [number, number, number]
            case 'roro': return [7, 2.5, 1.8] as [number, number, number]
            case 'research': return [5, 2, 1.5] as [number, number, number]
            case 'droneship': return [4.6, 1, 3] as [number, number, number]
        }
    }, [type])
    
    return (
        <mesh>
            <boxGeometry args={size} />
            <meshBasicMaterial color={color} />
        </mesh>
    )
}

export default function ShipComponent({ ship }: ShipProps) {
    const groupRef = useRef<THREE.Group>(null)
    const installedUpgrades = useGameStore((state) => state.installedUpgrades)
    const lightIntensity = useGameStore((state) => state.lightIntensity)
    const musicPlaying = useGameStore((state) => state.musicPlaying)
    const bpm = useGameStore((state) => state.bpm)
    
    // PHASE 10: Get LOD level based on distance
    const lod = useLOD(ship.position)

    const shipUpgrades = useMemo(() => 
        installedUpgrades.filter(u => u.shipId === ship.id),
        [installedUpgrades, ship.id]
    )

    const isUpgraded = (partName: string) => shipUpgrades.some(u => u.partName === partName)

    useFrame((state) => {
        if (!groupRef.current) return
        
        const bobOffsets: Record<Ship['type'], number> = {
            cruise: 0.08,
            container: 0.05,
            tanker: 0.03,
            bulk: 0.04,
            lng: 0.035,
            roro: 0.06,
            research: 0.05,
            droneship: 0.10  // Barge is more stable
        }
        const bobOffset = bobOffsets[ship.type]
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5 + ship.position[0]) * bobOffset
        
        // PHASE 10: Skip light updates at low LOD
        if (lod >= 2) return
        
        if (musicPlaying.get(ship.id)) {
            const beatDuration = 60 / bpm
            const pulse = (Math.sin(state.clock.elapsedTime * (Math.PI * 2 / beatDuration)) + 1) / 2
            
            groupRef.current.traverse((child) => {
                if (child.type === 'PointLight' || child.type === 'SpotLight') {
                    const light = child as THREE.PointLight
                    light.intensity = 1.5 + pulse * lightIntensity
                }
            })
        }
    })

    // PHASE 10: Render impostor at lowest LOD
    if (lod === 3) {
        return (
            <RigidBody type="fixed" position={ship.position}>
                <ShipImpostor type={ship.type} />
            </RigidBody>
        )
    }

    return (
        <RigidBody type="fixed" position={ship.position}>
            <group ref={groupRef}>
                <ProceduralShip blueprintId={ship.type} version={ship.version}>
                    {/* PHASE 10: Skip attachment points at medium+ LOD */}
                    {lod < 2 && ship.attachmentPoints?.map((point) => {
                        const isInstalled = isUpgraded(point.partName)
                        return (
                            <group key={point.partName}>
                                {!isInstalled && lod < 1 && (
                                    <mesh position={[point.position[0], point.position[1] + 0.5, point.position[2]]}>
                                        <sphereGeometry args={[0.12]} />
                                        <meshBasicMaterial color="#ffff00" transparent opacity={0.4} />
                                    </mesh>
                                )}
                                {isInstalled && (
                                    <>
                                        {/* PHASE 10: Skip lights at medium LOD */}
                                        {lod < 1 && (
                                            <pointLight
                                                position={[point.position[0], point.position[1] + 0.8, point.position[2]]}
                                                intensity={2 * lightIntensity}
                                                color={getLightColor(ship.type, point.partName)}
                                                distance={15}
                                                decay={2}
                                            />
                                        )}
                                        <mesh position={[point.position[0], point.position[1] + 0.8, point.position[2]]}>
                                            <sphereGeometry args={[0.15]} />
                                            <meshBasicMaterial color={getLightColor(ship.type, point.partName)} />
                                        </mesh>
                                    </>
                                )}
                            </group>
                        )
                    })}
                </ProceduralShip>
            </group>
        </RigidBody>
    )
}

function getLightColor(type: Ship['type'], partName: string): string {
    switch (type) {
        case 'cruise':
            return partName.includes('funnel') ? '#ff6600' : '#ffffff'
        case 'container':
            return partName.includes('mast') ? '#ff00ff' : '#00ff88'
        case 'tanker':
            return partName.includes('flare') ? '#ff4400' : '#ff6600'
        case 'bulk':
            return partName.includes('crane') ? '#ffaa00' : '#ffdd88'
        case 'lng':
            return partName.includes('membrane') ? '#00ccff' : partName.includes('loading') ? '#silver' : '#ffffff'
        case 'roro':
            return partName.includes('lifeboat') ? '#ff4444' : '#ffdd00'
        case 'research':
            return partName.includes('sonar') ? '#00ff88' : partName.includes('radar') ? '#4488ff' : '#ffffff'
        case 'droneship':
            return partName.includes('thruster') ? '#ff6600' : partName.includes('octagrabber') ? '#ffaa00' : '#00ccff'
        default:
            return '#ffffff'
    }
}
