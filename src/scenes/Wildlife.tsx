// =============================================================================
// WILDLIFE SCENE COMPONENT - HarborGlow
// Renders scientifically-accurate marine wildlife
//
// Species:
// - Humpback Whale (Megaptera novaeangliae): 14m, breaching behavior
// - Great White Shark (Carcharodon carcharias): 5m, patrol pattern
// - Bottlenose Dolphin (Tursiops truncatus): 3m, bow-riding, pod behavior
// - Bioluminescent Plankton: Dinoflagellate blooms
// =============================================================================

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore, WildlifeEntity, WildlifeType } from '../store/useGameStore'
import { WILDLIFE_SPECS } from '../systems/wildlifeSystem'

interface WildlifeProps {
    entity: WildlifeEntity
}

// -------------------------------------------------------------------------
// HUMPBACK WHALE - Megaptera novaeangliae
// Length: ~14m, Weight: 25-30 tonnes
// Known for spectacular breaching behavior
// -------------------------------------------------------------------------
function HumpbackWhale({ entity }: WildlifeProps) {
    const groupRef = useRef<THREE.Group>(null)
    const specs = WILDLIFE_SPECS.humpback_whale
    
    // Whale coloration - dark gray dorsal, lighter ventral
    const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#2c3e50',
        roughness: 0.7,
        metalness: 0.1
    }), [])
    
    const bellyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#95a5a6',
        roughness: 0.8
    }), [])
    
    useFrame((state) => {
        if (!groupRef.current) return
        
        // Update position from entity
        groupRef.current.position.set(...entity.position)
        
        // Calculate movement direction for rotation
        if (entity.velocity[0] !== 0 || entity.velocity[2] !== 0) {
            const angle = Math.atan2(entity.velocity[2], entity.velocity[0])
            groupRef.current.rotation.y = -angle + Math.PI / 2
        }
        
        // Breaching animation - rotate upward when breaching
        if (entity.behaviorState === 'breaching') {
            const time = state.clock.elapsedTime
            groupRef.current.rotation.x = -Math.PI / 4 * Math.sin(time * 2)
        } else {
            groupRef.current.rotation.x = 0
        }
        
        // Subtle body undulation
        const undulation = Math.sin(state.clock.elapsedTime * 2) * 0.05
        groupRef.current.rotation.z = undulation
    })
    
    // Scale based on actual length (14m)
    const scale = 0.1
    
    return (
        <group ref={groupRef} scale={[scale, scale, scale]}>
            {/* Main body - torpedo shaped */}
            <mesh material={bodyMaterial}>
                <capsuleGeometry args={[3.5, 10, 8, 16]} />
            </mesh>
            
            {/* Belly (lighter underside) */}
            <mesh position={[0, -1, 0]} material={bellyMaterial}>
                <capsuleGeometry args={[3.3, 9.5, 8, 16]} />
            </mesh>
            
            {/* Head with distinctive bumps (tubercles) */}
            <mesh position={[0, 0.5, 7]} material={bodyMaterial}>
                <sphereGeometry args={[3.2, 16, 16]} />
            </mesh>
            
            {/* Rostrum (snout) */}
            <mesh position={[0, 0, 9]} material={bodyMaterial}>
                <coneGeometry args={[2, 3, 16]} />
            </mesh>
            
            {/* Pectoral fins - humpbacks have long, wing-like fins (~5m each) */}
            <mesh position={[-4, -1, 2]} rotation={[0, 0, 0.5]} material={bodyMaterial}>
                <boxGeometry args={[5, 0.5, 2]} />
            </mesh>
            <mesh position={[4, -1, 2]} rotation={[0, 0, -0.5]} material={bodyMaterial}>
                <boxGeometry args={[5, 0.5, 2]} />
            </mesh>
            
            {/* Dorsal fin - small and triangular on humpbacks */}
            <mesh position={[0, 4, -2]} material={bodyMaterial}>
                <coneGeometry args={[1, 2, 4]} />
            </mesh>
            
            {/* Tail flukes */}
            <group position={[0, 0, -6]}>
                <mesh position={[-2, 0, 0]} rotation={[0, 0, 0.3]} material={bodyMaterial}>
                    <boxGeometry args={[4, 0.3, 3]} />
                </mesh>
                <mesh position={[2, 0, 0]} rotation={[0, 0, -0.3]} material={bodyMaterial}>
                    <boxGeometry args={[4, 0.3, 3]} />
                </mesh>
            </group>
            
            {/* Blowhole spray when surfacing */}
            {entity.position[1] > 0 && (
                <mesh position={[0, 5, 6]}>
                    <sphereGeometry args={[0.5, 8, 8]} />
                    <meshBasicMaterial color="white" transparent opacity={0.6} />
                </mesh>
            )}
        </group>
    )
}

// -------------------------------------------------------------------------
// GREAT WHITE SHARK - Carcharodon carcharias
// Length: ~5m, streamlined predator with distinctive dorsal fin
// -------------------------------------------------------------------------
function GreatWhiteShark({ entity }: WildlifeProps) {
    const groupRef = useRef<THREE.Group>(null)
    const specs = WILDLIFE_SPECS.great_white_shark
    
    const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#5d6d7e',  // Gray dorsal
        roughness: 0.6,
        metalness: 0.2
    }), [])
    
    const bellyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#ecf0f1',  // White ventral (countershading)
        roughness: 0.7
    }), [])
    
    useFrame(() => {
        if (!groupRef.current) return
        groupRef.current.position.set(...entity.position)
        
        if (entity.velocity[0] !== 0 || entity.velocity[2] !== 0) {
            const angle = Math.atan2(entity.velocity[2], entity.velocity[0])
            groupRef.current.rotation.y = -angle + Math.PI / 2
        }
    })
    
    const scale = 0.08  // ~5m length
    
    return (
        <group ref={groupRef} scale={[scale, scale, scale]}>
            {/* Streamlined body */}
            <mesh material={bodyMaterial}>
                <capsuleGeometry args={[1.2, 4, 8, 12]} />
            </mesh>
            
            {/* White belly */}
            <mesh position={[0, -0.5, 0]} material={bellyMaterial}>
                <capsuleGeometry args={[1, 3.5, 8, 12]} />
            </mesh>
            
            {/* Conical snout */}
            <mesh position={[0, 0, 2.5]} material={bodyMaterial}>
                <coneGeometry args={[1, 2, 12]} />
            </mesh>
            
            {/* Iconic triangular dorsal fin */}
            <mesh position={[0, 2, -0.5]} rotation={[0, 0, 0]} material={bodyMaterial}>
                <coneGeometry args={[1.2, 2.5, 3]} />
            </mesh>
            
            {/* Pectoral fins */}
            <mesh position={[-1.5, -0.5, 0.5]} rotation={[0, 0, 0.8]} material={bodyMaterial}>
                <boxGeometry args={[2, 0.2, 1]} />
            </mesh>
            <mesh position={[1.5, -0.5, 0.5]} rotation={[0, 0, -0.8]} material={bodyMaterial}>
                <boxGeometry args={[2, 0.2, 1]} />
            </mesh>
            
            {/* Caudal fin (tail) - heterocercal (upper lobe longer) */}
            <group position={[0, 0, -2.5]}>
                <mesh position={[0, 0.8, -1]} rotation={[0.5, 0, 0]} material={bodyMaterial}>
                    <boxGeometry args={[0.3, 2.5, 1.5]} />
                </mesh>
                <mesh position={[0, -0.5, -0.5]} rotation={[-0.3, 0, 0]} material={bellyMaterial}>
                    <boxGeometry args={[0.3, 1.5, 1]} />
                </mesh>
            </group>
            
            {/* Gill slits (5 on each side) */}
            {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
                <mesh key={i} position={[-1.22, 0, x]}>
                    <boxGeometry args={[0.05, 0.8, 0.1]} />
                    <meshBasicMaterial color="#2c3e50" />
                </mesh>
            ))}
        </group>
    )
}

// -------------------------------------------------------------------------
// BOTTLENOSE DOLPHIN - Tursiops truncatus
// Length: ~3m, intelligent, social, known for bow-riding
// -------------------------------------------------------------------------
function BottlenoseDolphin({ entity }: WildlifeProps) {
    const groupRef = useRef<THREE.Group>(null)
    const specs = WILDLIFE_SPECS.bottlenose_dolphin
    
    const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#3498db',  // Blue-gray
        roughness: 0.4,
        metalness: 0.3
    }), [])
    
    const bellyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#ecf0f1',
        roughness: 0.5
    }), [])
    
    useFrame((state) => {
        if (!groupRef.current) return
        groupRef.current.position.set(...entity.position)
        
        if (entity.velocity[0] !== 0 || entity.velocity[2] !== 0) {
            const angle = Math.atan2(entity.velocity[2], entity.velocity[0])
            groupRef.current.rotation.y = -angle + Math.PI / 2
        }
        
        // Porpoising animation (jumping motion)
        if (entity.position[1] > 0) {
            groupRef.current.rotation.x = -0.3
        } else {
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 8) * 0.1
        }
    })
    
    const scale = 0.06  // ~3m length
    
    return (
        <group ref={groupRef} scale={[scale, scale, scale]}>
            {/* Streamlined body */}
            <mesh material={bodyMaterial}>
                <capsuleGeometry args={[0.9, 3, 8, 12]} />
            </mesh>
            
            {/* White belly */}
            <mesh position={[0, -0.4, 0]} material={bellyMaterial}>
                <capsuleGeometry args={[0.8, 2.8, 8, 12]} />
            </mesh>
            
            {/* Bottlenose - distinctive beak */}
            <mesh position={[0, 0.1, 2]} material={bodyMaterial}>
                <coneGeometry args={[0.6, 1.5, 12]} />
            </mesh>
            
            {/* Melon (forehead bulge for echolocation) */}
            <mesh position={[0, 0.5, 1.2]} material={bodyMaterial}>
                <sphereGeometry args={[0.7, 12, 12]} />
            </mesh>
            
            {/* Curved dorsal fin */}
            <mesh position={[0, 1.5, -0.3]} rotation={[0, 0, 0]} material={bodyMaterial}>
                <coneGeometry args={[0.6, 1.5, 8]} />
            </mesh>
            
            {/* Pectoral flippers */}
            <mesh position={[-1.2, -0.3, 0.3]} rotation={[0.3, 0, 0.6]} material={bodyMaterial}>
                <boxGeometry args={[1.2, 0.15, 0.7]} />
            </mesh>
            <mesh position={[1.2, -0.3, 0.3]} rotation={[0.3, 0, -0.6]} material={bodyMaterial}>
                <boxGeometry args={[1.2, 0.15, 0.7]} />
            </mesh>
            
            {/* Flukes (tail) */}
            <group position={[0, 0, -2]}>
                <mesh position={[-1, 0, -0.3]} rotation={[0, 0.2, 0]} material={bodyMaterial}>
                    <boxGeometry args={[1.5, 0.1, 0.8]} />
                </mesh>
                <mesh position={[1, 0, -0.3]} rotation={[0, -0.2, 0]} material={bodyMaterial}>
                    <boxGeometry args={[1.5, 0.1, 0.8]} />
                </mesh>
            </group>
            
            {/* Blowhole */}
            <mesh position={[0, 0.95, 0.5]}>
                <cylinderGeometry args={[0.1, 0.1, 0.05]} />
                <meshBasicMaterial color="#2c3e50" />
            </mesh>
        </group>
    )
}

// -------------------------------------------------------------------------
// BIOLUMINESCENT PLANKTON - Dinoflagellates
// Microscopic organisms that flash when disturbed
// -------------------------------------------------------------------------
function BioluminescentPlankton({ entity }: WildlifeProps) {
    const groupRef = useRef<THREE.Group>(null)
    const specs = WILDLIFE_SPECS.bioluminescent_plankton
    
    // Flash intensity from velocity (set by system when disturbed)
    const flashIntensity = entity.velocity[0] || 0
    
    useFrame((state) => {
        if (!groupRef.current) return
        groupRef.current.position.set(...entity.position)
        
        // Pulsing glow
        const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.3 + 0.7
        const intensity = flashIntensity > 0 ? flashIntensity : pulse * 0.3
        
        const material = groupRef.current.children[0] as THREE.Mesh
        if (material && material.material) {
            const mat = material.material as THREE.MeshBasicMaterial
            mat.opacity = intensity
        }
    })
    
    return (
        <group ref={groupRef}>
            {/* Glowing particle cloud */}
            <mesh>
                <sphereGeometry args={[8, 16, 16]} />
                <meshBasicMaterial 
                    color="#00ffff" 
                    transparent 
                    opacity={0.3}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
            
            {/* Individual sparkles */}
            {Array.from({ length: 20 }).map((_, i) => (
                <mesh 
                    key={i}
                    position={[
                        (Math.random() - 0.5) * 10,
                        (Math.random() - 0.5) * 4,
                        (Math.random() - 0.5) * 10
                    ]}
                >
                    <sphereGeometry args={[0.1 + Math.random() * 0.2, 4, 4]} />
                    <meshBasicMaterial 
                        color="#88ffff" 
                        transparent 
                        opacity={0.5}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            ))}
        </group>
    )
}

// -------------------------------------------------------------------------
// WILDLIFE RENDERER - Main component that renders all wildlife entities
// -------------------------------------------------------------------------
export default function WildlifeRenderer() {
    const wildlife = useGameStore((state) => state.wildlife)
    
    const renderWildlife = (entity: WildlifeEntity) => {
        switch (entity.type) {
            case 'humpback_whale':
                return <HumpbackWhale key={entity.id} entity={entity} />
            case 'great_white_shark':
                return <GreatWhiteShark key={entity.id} entity={entity} />
            case 'bottlenose_dolphin':
                return <BottlenoseDolphin key={entity.id} entity={entity} />
            case 'bioluminescent_plankton':
                return <BioluminescentPlankton key={entity.id} entity={entity} />
            default:
                return null
        }
    }
    
    return <>{wildlife.map(renderWildlife)}</>
}

export { HumpbackWhale, GreatWhiteShark, BottlenoseDolphin, BioluminescentPlankton }
