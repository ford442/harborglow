import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Dock-edge bollards with animated glow for night mode
const BOLLARD_X_POSITIONS = [-36, -28, -20, -12, -4, 4, 12, 20, 28, 36]
const BOLLARD_Z = 6.8   // ship-facing edge of walkable deck
const BOLLARD_Y = -1.1  // deck surface + half bollard height

function DockBollard({ x, isNight }: { x: number; isNight: boolean }) {
    const glowRef = useRef<THREE.Mesh>(null)
    const lightRef = useRef<THREE.PointLight>(null)

    useFrame(({ clock }) => {
        const t = clock.elapsedTime
        const pulse = 0.7 + 0.3 * Math.sin(t * 1.8 + x * 0.4)
        if (glowRef.current) {
            const mat = glowRef.current.material as THREE.MeshBasicMaterial
            mat.opacity = isNight ? pulse * 0.85 : 0.3
        }
        if (lightRef.current && isNight) {
            lightRef.current.intensity = pulse * 1.4
        }
    })

    return (
        <group position={[x, BOLLARD_Y, BOLLARD_Z]}>
            {/* Cast iron bollard body */}
            <mesh castShadow>
                <cylinderGeometry args={[0.18, 0.22, 0.9, 10]} />
                <meshStandardMaterial color="#3a3f46" roughness={0.6} metalness={0.55} />
            </mesh>
            {/* Bollard cap */}
            <mesh position={[0, 0.52, 0]}>
                <sphereGeometry args={[0.22, 10, 8]} />
                <meshStandardMaterial color="#444a52" roughness={0.5} metalness={0.5} />
            </mesh>
            {/* Amber glow ring */}
            <mesh ref={glowRef} position={[0, 0.3, 0]}>
                <torusGeometry args={[0.24, 0.045, 8, 20]} />
                <meshBasicMaterial color="#ffaa22" transparent opacity={0.7} />
            </mesh>
            {isNight && (
                <pointLight
                    ref={lightRef}
                    position={[0, 0.5, 0]}
                    color="#ffaa22"
                    intensity={1.2}
                    distance={4.5}
                    decay={2}
                />
            )}
        </group>
    )
}

interface DockWalkEnvironmentProps {
    isNight?: boolean
}

export default function DockWalkEnvironment({ isNight = true }: DockWalkEnvironmentProps) {
    const wallColor = isNight ? '#384047' : '#697784'
    const roofColor = isNight ? '#2a2f34' : '#58646f'
    const containerColors = ['#a33a36', '#355f92', '#3f7d57', '#9a7a33']

    return (
        <>
            {/* Walkable apron and hard blockers for the terminal slice */}
            <RigidBody type="fixed" colliders="cuboid">
                <group>
                    {/* Transit shed */}
                    <mesh position={[-36, 3.2, -22]} castShadow receiveShadow>
                        <boxGeometry args={[30, 6.4, 14]} />
                        <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.15} />
                    </mesh>
                    <mesh position={[-36, 6.8, -22]} castShadow>
                        <boxGeometry args={[30.6, 0.6, 14.6]} />
                        <meshStandardMaterial color={roofColor} roughness={0.9} />
                    </mesh>

                    {/* Operations building near crane base */}
                    <mesh position={[7, 4.5, 12.5]} castShadow receiveShadow>
                        <boxGeometry args={[11, 9, 9]} />
                        <meshStandardMaterial color={isNight ? '#4b5259' : '#7b8791'} roughness={0.75} />
                    </mesh>

                    {/* Maintenance shed + fuel point */}
                    <mesh position={[33, 2.4, -20]} castShadow receiveShadow>
                        <boxGeometry args={[11, 4.8, 8]} />
                        <meshStandardMaterial color={isNight ? '#525a61' : '#87929d'} roughness={0.8} />
                    </mesh>
                    <mesh position={[39, 1.2, -16]} castShadow receiveShadow>
                        <cylinderGeometry args={[1.5, 1.5, 2.4, 16]} />
                        <meshStandardMaterial color="#6f7b86" roughness={0.5} metalness={0.45} />
                    </mesh>

                    {/* Container stacks */}
                    {Array.from({ length: 10 }, (_, i) => {
                        const row = Math.floor(i / 5)
                        const col = i % 5
                        const x = -20 + col * 8.5
                        const z = -2 - row * 7.5
                        const height = row === 0 ? 2 : 3
                        return (
                            <mesh
                                key={`stack-${i}`}
                                position={[x, height, z]}
                                castShadow
                                receiveShadow
                            >
                                <boxGeometry args={[7, height * 2, 3.4]} />
                                <meshStandardMaterial color={containerColors[i % containerColors.length]} roughness={0.65} metalness={0.2} />
                            </mesh>
                        )
                    })}

                    {/* Idle container crane silhouettes */}
                    {[-28, -8, 16].map((x) => (
                        <group key={`yard-crane-${x}`} position={[x, 0, -34]}>
                            <mesh position={[0, 7, 0]} castShadow>
                                <boxGeometry args={[1.8, 14, 1.8]} />
                                <meshStandardMaterial color="#6c7178" metalness={0.35} roughness={0.55} />
                            </mesh>
                            <mesh position={[0, 14.5, 0]} castShadow>
                                <boxGeometry args={[12, 1.2, 1.6]} />
                                <meshStandardMaterial color="#777d86" metalness={0.35} roughness={0.55} />
                            </mesh>
                            <mesh position={[4, 13, 0]} castShadow>
                                <boxGeometry args={[1, 3, 1]} />
                                <meshStandardMaterial color="#f6a21a" roughness={0.5} metalness={0.2} />
                            </mesh>
                        </group>
                    ))}

                    {/* Utility poles / blockers */}
                    {[-30, -15, 0, 15, 30].map((x) => (
                        <mesh key={`utility-${x}`} position={[x, 4, -12]} castShadow>
                            <boxGeometry args={[0.9, 8, 0.9]} />
                            <meshStandardMaterial color="#5f666d" roughness={0.7} metalness={0.3} />
                        </mesh>
                    ))}
                </group>
            </RigidBody>

            <RigidBody type="fixed" position={[0, 2, 5]}>
                <CuboidCollider args={[2.1, 2.1, 2.1]} />
            </RigidBody>

            {/* Dock-edge bollards */}
            {BOLLARD_X_POSITIONS.map(x => (
                <DockBollard key={`bollard-${x}`} x={x} isNight={isNight} />
            ))}

            {/* Breakwater + lighthouse silhouette */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[0, -1.2, 95]} receiveShadow>
                    <boxGeometry args={[140, 1.6, 10]} />
                    <meshStandardMaterial color={isNight ? '#2f3438' : '#606a72'} roughness={0.95} />
                </mesh>
                <mesh position={[60, 1.8, 95]} castShadow>
                    <cylinderGeometry args={[1.5, 2.2, 6, 12]} />
                    <meshStandardMaterial color={isNight ? '#f1f1f1' : '#ffffff'} roughness={0.4} />
                </mesh>
            </RigidBody>
        </>
    )
}
