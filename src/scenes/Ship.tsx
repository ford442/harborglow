import { useRef, useMemo } from 'react'
import { Group, PointLight as PointLightType } from 'three'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import type { Ship } from '../store/useGameStore'
import { useGameStore } from '../store/useGameStore'

interface ShipProps {
    ship: Ship
}

// =============================================================================
// SCALE CONFIGURATION - TODO: tune scale after testing with real models
// =============================================================================
const SHIP_SCALES: Record<Ship['type'], number> = {
    cruise: 0.8,    // Mega Cruise Liner scale
    container: 1.1, // Ultra Container Vessel scale
    tanker: 0.9     // VLCC Oil Tanker scale
}

// Preload GLB models to avoid loading delays
// TODO: Ensure these files exist in /public/models/
useGLTF.preload('/models/cruise_liner.glb')
useGLTF.preload('/models/container_vessel.glb')
useGLTF.preload('/models/oil_tanker.glb')

// =============================================================================
// MAIN SHIP COMPONENT
// =============================================================================
export default function Ship({ ship }: ShipProps) {
    const groupRef = useRef<Group>(null)
    const installedUpgrades = useGameStore((state) => state.installedUpgrades)
    const lightIntensity = useGameStore((state) => state.lightIntensity)
    const musicPlaying = useGameStore((state) => state.musicPlaying)
    const bpm = useGameStore((state) => state.bpm)

    // Pulse lights to the beat when music is playing
    useFrame((state) => {
        if (groupRef.current) {
            // Gentle bobbing motion - unique per ship
            const bobOffset = ship.type === 'tanker' ? 0.05 : ship.type === 'container' ? 0.08 : 0.1
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5 + ship.position[0]) * bobOffset
            
            // Pulse lights to BPM if music is playing
            if (musicPlaying.get(ship.id)) {
                const beatDuration = 60 / bpm
                const pulse = (Math.sin(state.clock.elapsedTime * (Math.PI * 2 / beatDuration)) + 1) / 2
                
                // Find all point lights in this ship and pulse them
                groupRef.current.traverse((child) => {
                    if (child.type === 'PointLight' || child.type === 'SpotLight') {
                        const light = child as PointLightType
                        light.intensity = 1.5 + pulse * lightIntensity
                    }
                })
            }
        }
    })

    const renderShip = () => {
        switch (ship.type) {
            case 'cruise':
                return <CruiseShip ship={ship} installedUpgrades={installedUpgrades} lightIntensity={lightIntensity} />
            case 'container':
                return <ContainerShip ship={ship} installedUpgrades={installedUpgrades} lightIntensity={lightIntensity} />
            case 'tanker':
                return <TankerShip ship={ship} installedUpgrades={installedUpgrades} lightIntensity={lightIntensity} />
            default:
                return <PlaceholderShip />
        }
    }

    return (
        <RigidBody type="fixed" position={ship.position}>
            <group ref={groupRef}>
                {renderShip()}
            </group>
        </RigidBody>
    )
}

// =============================================================================
// GLB MODEL LOADER COMPONENT
// Loads the actual 3D model with fallback to primitives
// =============================================================================
function ShipModel({ modelName, type }: { modelName: string; type: Ship['type'] }) {
    // TODO: tune scale after testing with real models
    const scale = SHIP_SCALES[type]
    
    // Attempt to load the GLB model
    let gltf: any = null
    let loadError = false
    
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        gltf = useGLTF(`/models/${modelName}.glb`)
    } catch (error) {
        // Model not found or failed to load - will use fallback
        loadError = true
        console.warn(`[ShipModel] Could not load /models/${modelName}.glb, using fallback primitives`)
    }
    
    // If model loaded successfully, render it
    if (gltf && gltf.scene && !loadError) {
        return (
            <primitive 
                object={gltf.scene} 
                scale={scale}
                position={[0, 0, 0]}
                castShadow
                receiveShadow
            />
        )
    }
    
    // Fallback to primitive geometry if model fails to load
    return <FallbackShip type={type} />
}

// =============================================================================
// FALLBACK SHIP - Primitive geometry when GLB is not available
// =============================================================================
function FallbackShip({ type }: { type: Ship['type'] }) {
    const scale = SHIP_SCALES[type]
    
    switch (type) {
        case 'cruise':
            return <FallbackCruiseShip scale={scale} />
        case 'container':
            return <FallbackContainerShip scale={scale} />
        case 'tanker':
            return <FallbackTankerShip scale={scale} />
        default:
            return <PlaceholderShip />
    }
}

function FallbackCruiseShip({ scale }: { scale: number }) {
    return (
        <group scale={scale}>
            {/* Main hull body */}
            <mesh position={[0, -1.5, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[3, 2.5, 22, 16]} />
                <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.4} />
            </mesh>
            {/* Bow curve */}
            <mesh position={[0, -1, 11]} castShadow receiveShadow>
                <coneGeometry args={[2.5, 4, 16]} />
                <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.4} />
            </mesh>
            {/* Main funnel */}
            <mesh position={[0, 5, -7]} castShadow>
                <cylinderGeometry args={[0.8, 1, 3, 12]} />
                <meshStandardMaterial color="#ff3333" />
            </mesh>
        </group>
    )
}

function FallbackContainerShip({ scale }: { scale: number }) {
    return (
        <group scale={scale}>
            {/* Main hull */}
            <mesh position={[0, -1, 0]} castShadow receiveShadow>
                <boxGeometry args={[26, 2.5, 5.5]} />
                <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.6} />
            </mesh>
            {/* Bridge */}
            <mesh position={[-10, 2, 0]} castShadow>
                <boxGeometry args={[3, 4, 4]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
        </group>
    )
}

function FallbackTankerShip({ scale }: { scale: number }) {
    return (
        <group scale={scale}>
            {/* Main tanker body */}
            <mesh position={[0, -1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
                <cylinderGeometry args={[3.5, 3.2, 45, 20]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.7} />
            </mesh>
            {/* Superstructure */}
            <mesh position={[-12, 5, 0]} castShadow>
                <boxGeometry args={[6, 6, 5]} />
                <meshStandardMaterial color="#dddddd" />
            </mesh>
        </group>
    )
}

// =============================================================================
// MEGA CRUISE LINER - "Ocean Symphony"
// Orchestral + choir synth, tall multi-deck design
// =============================================================================
function CruiseShip({ ship, installedUpgrades, lightIntensity }: { 
    ship: Ship, 
    installedUpgrades: any[], 
    lightIntensity: number 
}) {
    const shipUpgrades = useMemo(() => 
        installedUpgrades.filter(u => u.shipId === ship.id),
        [installedUpgrades, ship.id]
    )

    const isUpgraded = (partName: string) => shipUpgrades.some(u => u.partName === partName)

    return (
        <group>
            {/* Load the actual GLB model or fallback */}
            <ShipModel modelName={ship.modelName} type="cruise" />

            {/* === UPGRADE POINTS - LIGHTS === */}
            {/* Balcony lights (8 points) */}
            {ship.attachmentPoints
                .filter(p => p.partName.startsWith('balcony'))
                .map((point) => {
                    const isInstalled = isUpgraded(point.partName)
                    return (
                        <group key={point.partName}>
                            {/* Preview indicator when not installed */}
                            {!isInstalled && (
                                <mesh position={[point.position[0], point.position[1] + 0.5, point.position[2]]}>
                                    <sphereGeometry args={[0.15]} />
                                    <meshBasicMaterial color="#ffff00" transparent opacity={0.5} />
                                </mesh>
                            )}
                            {/* Light when installed */}
                            {isInstalled && (
                                <>
                                    <pointLight
                                        position={[point.position[0], point.position[1] + 0.8, point.position[2]]}
                                        intensity={2 * lightIntensity}
                                        color="#ffffff"
                                        distance={15}
                                        decay={2}
                                    />
                                    <mesh position={[point.position[0], point.position[1] + 0.8, point.position[2]]}>
                                        <sphereGeometry args={[0.2]} />
                                        <meshBasicMaterial color="#ffffff" />
                                    </mesh>
                                </>
                            )}
                        </group>
                    )
                })}

            {/* Funnel lights */}
            {isUpgraded('funnel') && (
                <>
                    <pointLight position={[0, 6, -7]} intensity={3 * lightIntensity} color="#ff6600" distance={20} />
                    <spotLight 
                        position={[0, 7, -7]} 
                        target-position={[0, 0, -7]}
                        intensity={2 * lightIntensity} 
                        color="#ff6600" 
                        angle={Math.PI / 4}
                        penumbra={0.5}
                    />
                    <mesh position={[0, 6, -7]}>
                        <sphereGeometry args={[0.5]} />
                        <meshBasicMaterial color="#ff6600" transparent opacity={0.3} />
                    </mesh>
                </>
            )}

            {/* Stern water-curtain lights */}
            {isUpgraded('stern') && (
                <>
                    {/* Water curtain effect */}
                    {Array.from({ length: 10 }, (_, i) => (
                        <mesh key={`water-${i}`} position={[-1.8 + i * 0.4, 0, 10.5]}>
                            <planeGeometry args={[0.3, 3]} />
                            <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
                        </mesh>
                    ))}
                    <pointLight position={[0, 2, 11]} intensity={4 * lightIntensity} color="#00ffff" distance={15} />
                    <pointLight position={[-1.5, 1, 11]} intensity={2 * lightIntensity} color="#ff00ff" distance={10} />
                    <pointLight position={[1.5, 1, 11]} intensity={2 * lightIntensity} color="#ff00ff" distance={10} />
                </>
            )}
        </group>
    )
}

// =============================================================================
// ULTRA LARGE CONTAINER VESSEL - "Neon Stack"
// Heavy techno / future bass, long flat deck with 20+ container stacks
// =============================================================================
function ContainerShip({ ship, installedUpgrades, lightIntensity }: { 
    ship: Ship, 
    installedUpgrades: any[], 
    lightIntensity: number 
}) {
    const shipUpgrades = useMemo(() => 
        installedUpgrades.filter(u => u.shipId === ship.id),
        [installedUpgrades, ship.id]
    )

    const isUpgraded = (partName: string) => shipUpgrades.some(u => u.partName === partName)

    return (
        <group>
            {/* Load the actual GLB model or fallback */}
            <ShipModel modelName={ship.modelName} type="container" />

            {/* === UPGRADE POINTS - LED BILLBOARD EFFECTS === */}
            {/* Stack top lights */}
            {ship.attachmentPoints
                .filter(p => p.partName.startsWith('stack'))
                .map((point, idx) => {
                    const isInstalled = isUpgraded(point.partName)
                    return (
                        <group key={point.partName}>
                            {!isInstalled && (
                                <mesh position={[point.position[0], point.position[1] + 1, point.position[2]]}>
                                    <sphereGeometry args={[0.12]} />
                                    <meshBasicMaterial color="#00ff00" transparent opacity={0.4} />
                                </mesh>
                            )}
                            {isInstalled && (
                                <>
                                    <pointLight
                                        position={[point.position[0], point.position[1] + 1, point.position[2]]}
                                        intensity={2.5 * lightIntensity}
                                        color={idx % 2 === 0 ? "#00ff00" : "#00ffff"}
                                        distance={12}
                                    />
                                    <mesh position={[point.position[0], point.position[1] + 1, point.position[2]]}>
                                        <boxGeometry args={[0.3, 0.3, 0.3]} />
                                        <meshBasicMaterial color={idx % 2 === 0 ? "#00ff00" : "#00ffff"} />
                                    </mesh>
                                </>
                            )}
                        </group>
                    )
                })}

            {/* Top lights (highest points) */}
            {ship.attachmentPoints
                .filter(p => p.partName.startsWith('top'))
                .map((point) => {
                    const isInstalled = isUpgraded(point.partName)
                    return (
                        <group key={point.partName}>
                            {!isInstalled && (
                                <mesh position={[point.position[0], point.position[1] + 2, point.position[2]]}>
                                    <sphereGeometry args={[0.15]} />
                                    <meshBasicMaterial color="#ffff00" transparent opacity={0.4} />
                                </mesh>
                            )}
                            {isInstalled && (
                                <>
                                    <spotLight
                                        position={[point.position[0], point.position[1] + 3, point.position[2]]}
                                        target-position={[point.position[0], 0, point.position[2]]}
                                        intensity={3 * lightIntensity}
                                        color="#ff00ff"
                                        angle={Math.PI / 3}
                                        penumbra={0.8}
                                        distance={30}
                                    />
                                    <mesh position={[point.position[0], point.position[1] + 3, point.position[2]]}>
                                        <boxGeometry args={[0.5, 0.5, 0.5]} />
                                        <meshBasicMaterial color="#ff00ff" />
                                    </mesh>
                                </>
                            )}
                        </group>
                    )
                })}

            {/* Side wall LED billboard effect */}
            {ship.attachmentPoints
                .filter(p => p.partName.startsWith('side'))
                .map((point, idx) => {
                    const isInstalled = isUpgraded(point.partName)
                    const isLeft = point.partName === 'side1'
                    return (
                        <group key={point.partName}>
                            {!isInstalled && (
                                <mesh position={[point.position[0], 0, point.position[2] + (isLeft ? -0.5 : 0.5)]}>
                                    <boxGeometry args={[0.5, 0.5, 0.1]} />
                                    <meshBasicMaterial color="#ff00ff" transparent opacity={0.3} />
                                </mesh>
                            )}
                            {isInstalled && (
                                <>
                                    {/* LED strip along hull side */}
                                    {Array.from({ length: 20 }, (_, ledIdx) => (
                                        <mesh 
                                            key={ledIdx}
                                            position={[
                                                -10 + ledIdx * 1, 
                                                0, 
                                                isLeft ? -2.8 : 2.8
                                            ]}
                                        >
                                            <boxGeometry args={[0.6, 0.15, 0.05]} />
                                            <meshBasicMaterial 
                                                color={`hsl(${(ledIdx * 18 + idx * 180) % 360}, 100%, 60%)`} 
                                            />
                                        </mesh>
                                    ))}
                                    <pointLight
                                        position={[point.position[0], 1, point.position[2]]}
                                        intensity={4 * lightIntensity}
                                        color={isLeft ? "#ff00ff" : "#00ffff"}
                                        distance={20}
                                    />
                                </>
                            )}
                        </group>
                    )
                })}

            {/* Full upgrade celebration */}
            {shipUpgrades.length >= 10 && (
                <>
                    <pointLight position={[0, 5, 0]} intensity={2 * lightIntensity} color="#ffffff" distance={30} />
                    <mesh position={[0, 6, 0]}>
                        <sphereGeometry args={[0.3]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                </>
            )}
        </group>
    )
}

// =============================================================================
// VLCC OIL TANKER - "Flame Runner"
// Gritty industrial / dubstep, massive bulbous bow, central superstructure
// =============================================================================
function TankerShip({ ship, installedUpgrades, lightIntensity }: { 
    ship: Ship, 
    installedUpgrades: any[], 
    lightIntensity: number 
}) {
    const shipUpgrades = useMemo(() => 
        installedUpgrades.filter(u => u.shipId === ship.id),
        [installedUpgrades, ship.id]
    )

    const isUpgraded = (partName: string) => shipUpgrades.some(u => u.partName === partName)

    return (
        <group>
            {/* Load the actual GLB model or fallback */}
            <ShipModel modelName={ship.modelName} type="tanker" />

            {/* === UPGRADE POINTS === */}
            {/* Flare stack - the flame effect projector */}
            {ship.attachmentPoints
                .filter(p => p.partName === 'flare')
                .map((point) => {
                    const isInstalled = isUpgraded(point.partName)
                    return (
                        <group key={point.partName}>
                            {/* Flare stack structure */}
                            <mesh position={[point.position[0], point.position[1] + 3, point.position[2]]}>
                                <cylinderGeometry args={[0.3, 0.4, 6]} />
                                <meshStandardMaterial color="#444444" />
                            </mesh>
                            <mesh 
                                position={[point.position[0] + 2, point.position[1] + 5, point.position[2]]}
                                rotation={[0, 0, -Math.PI / 6]}
                            >
                                <cylinderGeometry args={[0.15, 0.15, 4]} />
                                <meshStandardMaterial color="#666666" />
                            </mesh>
                            
                            {!isInstalled && (
                                <mesh position={[point.position[0] + 3.5, point.position[1] + 3, point.position[2]]}>
                                    <sphereGeometry args={[0.2]} />
                                    <meshBasicMaterial color="#ff0000" transparent opacity={0.4} />
                                </mesh>
                            )}
                            {isInstalled && (
                                <>
                                    <pointLight
                                        position={[point.position[0] + 3.5, point.position[1] + 5, point.position[2]]}
                                        intensity={5 * lightIntensity}
                                        color="#ff4400"
                                        distance={25}
                                    />
                                    <mesh position={[point.position[0] + 3.5, point.position[1] + 5, point.position[2]]}>
                                        <coneGeometry args={[0.5, 2, 8]} />
                                        <meshBasicMaterial color="#ff6600" transparent opacity={0.7} />
                                    </mesh>
                                    <mesh position={[point.position[0] + 3.5, point.position[1] + 6, point.position[2]]}>
                                        <coneGeometry args={[0.3, 1.5, 8]} />
                                        <meshBasicMaterial color="#ffff00" transparent opacity={0.5} />
                                    </mesh>
                                    {/* Smoke particles */}
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <mesh 
                                            key={i}
                                            position={[
                                                point.position[0] + 3.5 + (Math.random() - 0.5), 
                                                point.position[1] + 7 + i * 0.8, 
                                                point.position[2] + (Math.random() - 0.5)
                                            ]}
                                        >
                                            <sphereGeometry args={[0.3 + i * 0.1]} />
                                            <meshBasicMaterial color="#444444" transparent opacity={0.3 - i * 0.05} />
                                        </mesh>
                                    ))}
                                </>
                            )}
                        </group>
                    )
                })}

            {/* Deck rail lights */}
            {ship.attachmentPoints
                .filter(p => p.partName.startsWith('rail'))
                .map((point) => {
                    const isInstalled = isUpgraded(point.partName)
                    return (
                        <group key={point.partName}>
                            <mesh position={[point.position[0], point.position[1] + 1, point.position[2] + 2.3]}>
                                <cylinderGeometry args={[0.1, 0.1, 1.5]} />
                                <meshStandardMaterial color="#666666" />
                            </mesh>
                            <mesh position={[point.position[0], point.position[1] + 1, point.position[2] - 2.3]}>
                                <cylinderGeometry args={[0.1, 0.1, 1.5]} />
                                <meshStandardMaterial color="#666666" />
                            </mesh>
                            
                            {!isInstalled && (
                                <>
                                    <mesh position={[point.position[0], point.position[1] + 2, point.position[2] + 2.3]}>
                                        <sphereGeometry args={[0.1]} />
                                        <meshBasicMaterial color="#ff4400" transparent opacity={0.4} />
                                    </mesh>
                                    <mesh position={[point.position[0], point.position[1] + 2, point.position[2] - 2.3]}>
                                        <sphereGeometry args={[0.1]} />
                                        <meshBasicMaterial color="#ff4400" transparent opacity={0.4} />
                                    </mesh>
                                </>
                            )}
                            {isInstalled && (
                                <>
                                    <pointLight
                                        position={[point.position[0], point.position[1] + 2.5, point.position[2] + 2.3]}
                                        intensity={2 * lightIntensity}
                                        color="#ff6600"
                                        distance={10}
                                    />
                                    <pointLight
                                        position={[point.position[0], point.position[1] + 2.5, point.position[2] - 2.3]}
                                        intensity={2 * lightIntensity}
                                        color="#ff6600"
                                        distance={10}
                                    />
                                    <mesh position={[point.position[0], point.position[1] + 2.5, point.position[2] + 2.3]}>
                                        <sphereGeometry args={[0.15]} />
                                        <meshBasicMaterial color="#ff6600" />
                                    </mesh>
                                    <mesh position={[point.position[0], point.position[1] + 2.5, point.position[2] - 2.3]}>
                                        <sphereGeometry args={[0.15]} />
                                        <meshBasicMaterial color="#ff6600" />
                                    </mesh>
                                </>
                            )}
                        </group>
                    )
                })}

            {/* Hull side lights */}
            {ship.attachmentPoints
                .filter(p => p.partName.startsWith('hull'))
                .map((point) => {
                    const isInstalled = isUpgraded(point.partName)
                    return (
                        <group key={point.partName}>
                            {!isInstalled && (
                                <mesh position={[point.position[0], point.position[1] - 1, point.position[2] + 3.3]}>
                                    <boxGeometry args={[0.3, 0.3, 0.1]} />
                                    <meshBasicMaterial color="#ff6600" transparent opacity={0.3} />
                                </mesh>
                            )}
                            {isInstalled && (
                                <>
                                    <spotLight
                                        position={[point.position[0], point.position[1] - 1, point.position[2] + 3.5]}
                                        target-position={[point.position[0], -5, point.position[2] + 5]}
                                        intensity={3 * lightIntensity}
                                        color="#ff4400"
                                        angle={Math.PI / 4}
                                        penumbra={0.5}
                                        distance={20}
                                    />
                                    <mesh position={[point.position[0], point.position[1] - 1, point.position[2] + 3.3]}>
                                        <boxGeometry args={[0.4, 0.2, 0.1]} />
                                        <meshBasicMaterial color="#ff4400" />
                                    </mesh>
                                </>
                            )}
                        </group>
                    )
                })}

            {/* Full upgrade celebration */}
            {shipUpgrades.length >= 8 && (
                <>
                    <pointLight position={[0, -2, 0]} intensity={1.5 * lightIntensity} color="#ff2200" distance={30} />
                    <pointLight position={[0, 4, 0]} intensity={1 * lightIntensity} color="#ff6600" distance={20} />
                </>
            )}
        </group>
    )
}

// =============================================================================
// PLACEHOLDER SHIP (fallback)
// =============================================================================
function PlaceholderShip() {
    return (
        <mesh castShadow receiveShadow>
            <boxGeometry args={[5, 2, 10]} />
            <meshStandardMaterial color="#888888" />
        </mesh>
    )
}
