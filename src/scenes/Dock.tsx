import { useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

// =============================================================================
// DOCK COMPONENT
// Night dock with volumetric lighting effects
// =============================================================================

interface DockProps {
    isNight?: boolean
}

export default function Dock({ isNight = true }: DockProps) {
    // Wood texture-like colors
    const woodColor = isNight ? '#3d2817' : '#8B4513'
    const pierColor = isNight ? '#2a1b0f' : '#654321'

    return (
        <RigidBody type="fixed" position={[0, -2, 0]}>
            <group>
                {/* Main dock platform */}
                <mesh position={[0, 0, 0]} receiveShadow castShadow>
                    <boxGeometry args={[80, 1, 15]} />
                    <meshStandardMaterial 
                        color={woodColor} 
                        roughness={0.9} 
                        metalness={0.1}
                    />
                </mesh>

                {/* Wooden planks detail */}
                {Array.from({ length: 40 }, (_, i) => (
                    <mesh 
                        key={`plank-${i}`} 
                        position={[-39 + i * 2, 0.55, 0]}
                        receiveShadow
                    >
                        <boxGeometry args={[1.9, 0.05, 14.5]} />
                        <meshStandardMaterial 
                            color={i % 2 === 0 ? woodColor : adjustColor(woodColor, -10)}
                            roughness={0.95}
                        />
                    </mesh>
                ))}

                {/* Pier edge */}
                <mesh position={[0, 1, -7]} castShadow>
                    <boxGeometry args={[80, 2, 1]} />
                    <meshStandardMaterial 
                        color={pierColor} 
                        roughness={0.9}
                    />
                </mesh>

                {/* Bollards (mooring posts) */}
                {[-30, -10, 10, 30].map((x, i) => (
                    <group key={`bollard-${i}`}>
                        <mesh position={[x, 1.5, -6]} castShadow>
                            <cylinderGeometry args={[0.3, 0.4, 1, 8]} />
                            <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.4} />
                        </mesh>
                        <mesh position={[x, 2, -6]} rotation={[Math.PI / 2, 0, 0]}>
                            <torusGeometry args={[0.35, 0.1, 6, 12]} />
                            <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
                        </mesh>
                    </group>
                ))}

                {/* Dock lights */}
                {isNight && <DockLights />}

                {/* Pilings (support posts in water) */}
                <Pilings />

                {/* Crane rails */}
                <mesh position={[0, 0.3, 5]}>
                    <boxGeometry args={[70, 0.2, 0.5]} />
                    <meshStandardMaterial color="#666666" metalness={0.6} roughness={0.4} />
                </mesh>
            </group>
        </RigidBody>
    )
}

// =============================================================================
// DOCK LIGHTS
// Volumetric-style point lights for night atmosphere
// =============================================================================

function DockLights() {
    const lightPositions = useMemo(() => [
        { x: -35, z: -4, color: '#ffaa44', intensity: 3 },
        { x: -15, z: -4, color: '#ffaa44', intensity: 3 },
        { x: 0, z: -4, color: '#ffaa44', intensity: 3 },
        { x: 15, z: -4, color: '#ffaa44', intensity: 3 },
        { x: 35, z: -4, color: '#ffaa44', intensity: 3 },
    ], [])

    return (
        <>
            {lightPositions.map((light, i) => (
                <group key={`light-${i}`}>
                    {/* Light fixture */}
                    <mesh position={[light.x, 3, light.z]}>
                        <cylinderGeometry args={[0.2, 0.3, 0.5]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>
                    {/* Light pole */}
                    <mesh position={[light.x, 1.5, light.z]}>
                        <cylinderGeometry args={[0.1, 0.1, 3]} />
                        <meshStandardMaterial color="#444444" metalness={0.5} />
                    </mesh>
                    {/* Point light */}
                    <pointLight
                        position={[light.x, 2.5, light.z]}
                        intensity={light.intensity}
                        color={light.color}
                        distance={25}
                        decay={2}
                        castShadow
                    />
                    {/* Fake volumetric cone */}
                    <mesh position={[light.x, 0.5, light.z]}>
                        <coneGeometry args={[3, 4, 16, 1, true]} />
                        <meshBasicMaterial 
                            color={light.color} 
                            transparent 
                            opacity={0.05} 
                            side={THREE.DoubleSide}
                            depthWrite={false}
                        />
                    </mesh>
                </group>
            ))}
        </>
    )
}

// =============================================================================
// PILINGS
// Support posts extending into water
// =============================================================================

function Pilings() {
    const pilingPositions = useMemo(() => [
        -38, -30, -20, -10, 0, 10, 20, 30, 38
    ], [])

    return (
        <>
            {pilingPositions.map((x, i) => (
                <group key={`piling-${i}`}>
                    {/* Front row */}
                    <mesh position={[x, -2, 6]}>
                        <cylinderGeometry args={[0.4, 0.3, 6, 8]} />
                        <meshStandardMaterial color="#4a3728" roughness={0.95} />
                    </mesh>
                    {/* Back row */}
                    <mesh position={[x, -2, -6]}>
                        <cylinderGeometry args={[0.4, 0.3, 6, 8]} />
                        <meshStandardMaterial color="#4a3728" roughness={0.95} />
                    </mesh>
                </group>
            ))}
        </>
    )
}

// =============================================================================
// HELPERS
// =============================================================================

function adjustColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, Math.max(0, (num >> 16) + amount))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`
}
