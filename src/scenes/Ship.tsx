// =============================================================================
// SHIP COMPONENT - HarborGlow Phase 9
// Ship rendering with LOD, attachment points, and music-reactive lighting
// =============================================================================

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import type { Ship } from '../store/useGameStore'
import { useGameStore } from '../store/useGameStore'
import { ProceduralShip } from './ProceduralShip'
import { useLOD } from '../systems/performanceSystem'
import AttachmentPointVisual from './AttachmentPoint'
import { 
  getRigTypeForPart, 
  AttachmentState,
  SHIP_TYPE_LIGHT_COLORS 
} from '../systems/attachmentSystem'

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
    const spreaderPos = useGameStore((state) => state.spreaderPos)
    const twistlockEngaged = useGameStore((state) => state.twistlockEngaged)
    const attachmentConfig = useGameStore((state) => state.attachmentSystemConfig)
    
    // PHASE 10: Get LOD level based on distance
    const lod = useLOD(ship.position)

    const shipUpgrades = useMemo(() => 
        installedUpgrades.filter(u => u.shipId === ship.id),
        [installedUpgrades, ship.id]
    )

    const isUpgraded = (partName: string) => shipUpgrades.some(u => u.partName === partName)
    
    // Calculate attachment point states
    const attachmentPointsWithState = useMemo(() => {
        if (!ship.attachmentPoints) return []
        
        return ship.attachmentPoints.map(point => {
            const worldPos: [number, number, number] = [
                ship.position[0] + point.position[0],
                ship.position[1] + point.position[1],
                ship.position[2] + point.position[2],
            ]
            
            const dx = worldPos[0] - spreaderPos.x
            const dy = worldPos[1] - spreaderPos.y
            const dz = worldPos[2] - spreaderPos.z
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
            
            let state: AttachmentState = 'available'
            let snapStrength = 0
            
            if (isUpgraded(point.partName)) {
                state = 'installed'
            } else if (distance <= attachmentConfig.installDistance && twistlockEngaged) {
                state = 'installing'
            } else if (distance <= attachmentConfig.snapRadius) {
                state = 'snapping'
                snapStrength = 1 - (distance / attachmentConfig.snapRadius)
            } else if (distance <= attachmentConfig.visibilityRange * 1.5) {
                state = 'hovered'
            }
            
            return {
                point,
                worldPos,
                state,
                distance,
                snapStrength,
                rigType: getRigTypeForPart(point.partName),
            }
        })
    }, [ship, spreaderPos, twistlockEngaged, attachmentConfig, shipUpgrades])

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
                    {/* PHASE 9: Enhanced attachment points */}
                    {attachmentConfig.showPoints && lod < 2 && attachmentPointsWithState.map(({ 
                        point, 
                        worldPos, 
                        state, 
                        distance,
                        snapStrength,
                        rigType 
                    }) => (
                        <AttachmentPointVisual
                            key={point.partName}
                            position={point.position}
                            rotation={point.rotation}
                            partName={point.partName}
                            shipType={ship.type}
                            state={state}
                            rigType={rigType}
                            distance={distance}
                            snapStrength={snapStrength}
                            visibilityRange={attachmentConfig.visibilityRange}
                            showDistance={true}
                        />
                    ))}
                </ProceduralShip>
            </group>
        </RigidBody>
    )
}
