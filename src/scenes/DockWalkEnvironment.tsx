import { CuboidCollider, RigidBody } from '@react-three/rapier'

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
