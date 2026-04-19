// =============================================================================
// CRANE COMPONENT - HarborGlow Phase 9
// Animated dock crane with operational lights and dynamic cable system
// =============================================================================

import { useRef } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import CraneDashboard from '../components/CraneDashboard'
import CraneCable from './CraneCable'
import { useGameStore } from '../store/useGameStore'

export default function Crane() {
    const craneRef = useRef<THREE.Group>(null)
    const trolleyRef = useRef<THREE.Group>(null)
    const hookRef = useRef<THREE.Group>(null)
    
    // Get crane state from store
    const spreaderPos = useGameStore((state) => state.spreaderPos)
    const spreaderRotation = useGameStore((state) => state.spreaderRotation)
    const loadTension = useGameStore((state) => state.loadTension)
    const twistlockEngaged = useGameStore((state) => state.twistlockEngaged)
    const trolleyPosition = useGameStore((state) => state.trolleyPosition)

    // Animate crane operations
    useFrame((state) => {
        // Gentle idle movement
        const time = state.clock.elapsedTime
        
        // Trolley moves based on store position
        const newTrolleyPos = (trolleyPosition - 0.5) * 40
        
        // Hook follows spreader position from store
        const newHookHeight = spreaderPos.y - 20 // Relative to trolley
        
        if (trolleyRef.current) {
            trolleyRef.current.position.x = newTrolleyPos
        }
        if (hookRef.current) {
            hookRef.current.position.y = newHookHeight
            hookRef.current.rotation.y = spreaderRotation
        }
    })

    // Calculate tension normalized 0-1
    const normalizedTension = Math.min(1, loadTension / 50)
    
    // Calculate cable positions
    const trolleyWorldPos: [number, number, number] = [
        (trolleyPosition - 0.5) * 40,
        9.2,
        0
    ]
    const hookWorldPos: [number, number, number] = [
        trolleyWorldPos[0] + Math.sin(spreaderRotation) * 0.5,
        spreaderPos.y - 4, // Hook is below spreader
        trolleyWorldPos[2] + Math.cos(spreaderRotation) * 0.5
    ]

    return (
        <RigidBody type="fixed" position={[0, 4, 5]}>
            <group ref={craneRef}>
                {/* Dashboard - positioned in cabin */}
                <CraneDashboard position={[1.5, 8.5, 0]} />
                
                {/* === CRANE BASE === */}
                <mesh position={[0, -2, 0]} castShadow>
                    <boxGeometry args={[4, 4, 4]} />
                    <meshStandardMaterial color="#444444" metalness={0.5} roughness={0.6} />
                </mesh>
                
                {/* Base detail - bolts */}
                {[[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]].map(([x, z], i) => (
                    <mesh key={`bolt-${i}`} position={[x, -3.8, z]}>
                        <cylinderGeometry args={[0.15, 0.15, 0.3]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>
                ))}

                {/* === CRANE TOWER === */}
                <mesh position={[0, 4, 0]} castShadow>
                    <boxGeometry args={[2, 12, 2]} />
                    <meshStandardMaterial color="#555555" metalness={0.4} />
                </mesh>
                
                {/* Tower lattice pattern */}
                <mesh position={[0, 4, 1]}>
                    <boxGeometry args={[1.5, 10, 0.1]} />
                    <meshBasicMaterial color="#666666" transparent opacity={0.5} />
                </mesh>
                <mesh position={[0, 4, -1]}>
                    <boxGeometry args={[1.5, 10, 0.1]} />
                    <meshBasicMaterial color="#666666" transparent opacity={0.5} />
                </mesh>

                {/* Tower warning lights */}
                <mesh position={[0, 10, 1.1]}>
                    <sphereGeometry args={[0.15]} />
                    <meshBasicMaterial color="#ff0000" />
                </mesh>
                <pointLight 
                    position={[0, 10, 1.5]} 
                    intensity={2} 
                    color="#ff0000" 
                    distance={10}
                />

                {/* === CRANE CABIN === */}
                <mesh position={[1.5, 8, 0]} castShadow>
                    <boxGeometry args={[2, 2.5, 2]} />
                    <meshStandardMaterial color="#ffaa00" />
                </mesh>
                {/* Cabin windows */}
                <mesh position={[2.5, 8.5, 0]}>
                    <boxGeometry args={[0.1, 1, 1.5]} />
                    <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} />
                </mesh>

                {/* === JIB (ARM) === */}
                {/* Main jib */}
                <mesh position={[12, 10, 0]} castShadow>
                    <boxGeometry args={[24, 1.5, 2]} />
                    <meshStandardMaterial color="#666666" metalness={0.5} />
                </mesh>
                
                {/* Jib lattice pattern */}
                {Array.from({ length: 10 }, (_, i) => (
                    <mesh key={`jib-lattice-${i}`} position={[2 + i * 2, 10, 0]}>
                        <boxGeometry args={[0.1, 1.3, 2.1]} />
                        <meshBasicMaterial color="#777777" transparent opacity={0.4} />
                    </mesh>
                ))}

                {/* Counter-jib */}
                <mesh position={[-8, 10, 0]} castShadow>
                    <boxGeometry args={[12, 1.5, 2]} />
                    <meshStandardMaterial color="#666666" metalness={0.5} />
                </mesh>

                {/* Counterweights */}
                <mesh position={[-12, 9, 0]} castShadow>
                    <boxGeometry args={[3, 3, 2]} />
                    <meshStandardMaterial color="#444444" />
                </mesh>

                {/* === TOWER TOP (Apex) === */}
                <mesh position={[0, 10.5, 0]}>
                    <coneGeometry args={[1, 2, 4]} />
                    <meshStandardMaterial color="#ffaa00" />
                </mesh>

                {/* === SUPPORT CABLES === */}
                {/* Main cable from apex to jib tip */}
                <mesh position={[20, 10.5, 0]} rotation={[0, 0, -Math.PI / 6]}>
                    <cylinderGeometry args={[0.05, 0.05, 8]} />
                    <meshStandardMaterial color="#333333" />
                </mesh>
                {/* Connection cable */}
                <mesh position={[0, 12, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 3]} />
                    <meshStandardMaterial color="#333333" />
                </mesh>

                {/* === TROLLEY SYSTEM === */}
                <group ref={trolleyRef} position={trolleyWorldPos}>
                    {/* Trolley body */}
                    <mesh castShadow>
                        <boxGeometry args={[1.5, 0.8, 2.2]} />
                        <meshStandardMaterial color="#ff6600" />
                    </mesh>
                    {/* Trolley wheels */}
                    <mesh position={[-0.5, -0.5, 1]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.2, 0.2, 0.3]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>
                    <mesh position={[0.5, -0.5, 1]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.2, 0.2, 0.3]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>
                    <mesh position={[-0.5, -0.5, -1]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.2, 0.2, 0.3]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>
                    <mesh position={[0.5, -0.5, -1]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.2, 0.2, 0.3]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>

                    {/* === DYNAMIC HOIST CABLE === */}
                    {useGameStore.getState().attachmentSystemConfig?.showCable !== false && (
                        <CraneCable
                            startPos={trolleyWorldPos}
                            endPos={hookWorldPos}
                            tension={normalizedTension}
                            twistlockEngaged={twistlockEngaged}
                        />
                    )}

                    {/* === HOOK BLOCK === */}
                    <group ref={hookRef} position={[0, -4, 0]}>
                        {/* Hook block */}
                        <mesh castShadow>
                            <boxGeometry args={[0.6, 0.8, 0.6]} />
                            <meshStandardMaterial color="#ff6600" />
                        </mesh>
                        {/* The hook */}
                        <mesh position={[0, -0.8, 0]}>
                            <torusGeometry args={[0.3, 0.08, 8, 16, Math.PI]} />
                            <meshStandardMaterial color="#333333" metalness={0.8} />
                        </mesh>
                        
                        {/* Twistlock indicators */}
                        <group position={[0, 0.6, 0]}>
                            {/* Twistlock engaged indicator */}
                            <mesh position={[-0.2, 0, 0]}>
                                <boxGeometry args={[0.1, 0.1, 0.3]} />
                                <meshBasicMaterial color={twistlockEngaged ? '#00ff00' : '#ff0000'} />
                            </mesh>
                            <mesh position={[0.2, 0, 0]}>
                                <boxGeometry args={[0.1, 0.1, 0.3]} />
                                <meshBasicMaterial color={twistlockEngaged ? '#00ff00' : '#ff0000'} />
                            </mesh>
                            {/* Glow effect when engaged */}
                            {twistlockEngaged && (
                                <>
                                    <pointLight
                                        position={[0, 0.3, 0]}
                                        intensity={2}
                                        color="#00ff00"
                                        distance={3}
                                    />
                                    <mesh position={[0, 0.3, 0]}>
                                        <sphereGeometry args={[0.2]} />
                                        <meshBasicMaterial 
                                            color="#00ff00" 
                                            transparent 
                                            opacity={0.3}
                                        />
                                    </mesh>
                                </>
                            )}
                        </group>
                        
                        {/* Light on hook for visibility */}
                        <pointLight 
                            position={[0, 0, 0]} 
                            intensity={1} 
                            color="#ffffaa" 
                            distance={5}
                        />
                        <mesh position={[0, 0, 0]}>
                            <sphereGeometry args={[0.1]} />
                            <meshBasicMaterial color="#ffffaa" />
                        </mesh>
                    </group>
                </group>

                {/* === WARNING LIGHTS === */}
                {/* Aircraft warning light on jib tip */}
                <mesh position={[24, 11, 0]}>
                    <sphereGeometry args={[0.2]} />
                    <meshBasicMaterial color="#ff0000" />
                </mesh>
                <pointLight 
                    position={[24, 11.5, 0]} 
                    intensity={3} 
                    color="#ff0000" 
                    distance={20}
                />

                {/* Work lights on tower */}
                <spotLight
                    position={[2, 8, 2]}
                    target-position={[5, 0, 5]}
                    intensity={2}
                    angle={Math.PI / 4}
                    penumbra={0.5}
                    distance={30}
                />
            </group>
        </RigidBody>
    )
}
