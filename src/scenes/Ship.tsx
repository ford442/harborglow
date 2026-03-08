import { useRef, useMemo } from 'react'
import { Group, PointLight as PointLightType } from 'three'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import type { Ship } from '../store/useGameStore'
import { useGameStore } from '../store/useGameStore'
import { ProceduralShip } from './ProceduralShip'

interface ShipProps {
    ship: Ship
}

export default function Ship({ ship }: ShipProps) {
    const groupRef = useRef<Group>(null)
    const installedUpgrades = useGameStore((state) => state.installedUpgrades)
    const lightIntensity = useGameStore((state) => state.lightIntensity)
    const musicPlaying = useGameStore((state) => state.musicPlaying)
    const bpm = useGameStore((state) => state.bpm)

    const shipUpgrades = useMemo(() => 
        installedUpgrades.filter(u => u.shipId === ship.id),
        [installedUpgrades, ship.id]
    )

    const isUpgraded = (partName: string) => shipUpgrades.some(u => u.partName === partName)

    useFrame((state) => {
        if (groupRef.current) {
            const bobOffset = ship.type === 'tanker' ? 0.03 : ship.type === 'container' ? 0.05 : 0.08
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5 + ship.position[0]) * bobOffset
            
            if (musicPlaying.get(ship.id)) {
                const beatDuration = 60 / bpm
                const pulse = (Math.sin(state.clock.elapsedTime * (Math.PI * 2 / beatDuration)) + 1) / 2
                
                groupRef.current.traverse((child) => {
                    if (child.type === 'PointLight' || child.type === 'SpotLight') {
                        const light = child as PointLightType
                        light.intensity = 1.5 + pulse * lightIntensity
                    }
                })
            }
        }
    })

    return (
        <RigidBody type="fixed" position={ship.position}>
            <group ref={groupRef}>
                <ProceduralShip blueprintId={ship.type} version={ship.version} >
                    {ship.attachmentPoints?.map((point) => {
                        const isInstalled = isUpgraded(point.partName)
                        return (
                            <group key={point.partName}>
                                {!isInstalled && (
                                    <mesh position={[point.position[0], point.position[1] + 0.5, point.position[2]]}>
                                        <sphereGeometry args={[0.12]} />
                                        <meshBasicMaterial color="#ffff00" transparent opacity={0.4} />
                                    </mesh>
                                )}
                                {isInstalled && (
                                    <>
                                        <pointLight
                                            position={[point.position[0], point.position[1] + 0.8, point.position[2]]}
                                            intensity={2 * lightIntensity}
                                            color={getLightColor(ship.type, point.partName)}
                                            distance={15}
                                            decay={2}
                                        />
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
        default:
            return '#ffffff'
    }
}
