// =============================================================================
// CRANE B — Simplified NPC gantry for Multi-Crane Coordination training
// Driven by craneBSystem local kinematics (cyan beacon, no dashboard).
// =============================================================================

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
    craneBSystem,
    CRANE_B_BASE,
    CRANE_B_JIB_SPAN,
} from '../systems/craneBSystem'

export default function CraneB() {
    const trolleyRef = useRef<THREE.Group>(null)
    const hookRef = useRef<THREE.Group>(null)
    const beaconRef = useRef<THREE.MeshBasicMaterial>(null)
    const zoneMatRef = useRef<THREE.MeshBasicMaterial>(null)

    useEffect(() => {
        craneBSystem.start()
        return () => craneBSystem.stop()
    }, [])

    useFrame(() => {
        const state = craneBSystem.getState()
        if (!state.active) return

        const trolleyLocalX = (state.trolleyPosition - 0.5) * CRANE_B_JIB_SPAN
        // RigidBody/group is at CRANE_B_BASE; trolley Y matches player crane local 9.2
        if (trolleyRef.current) {
            trolleyRef.current.position.x = trolleyLocalX
            trolleyRef.current.position.y = 9.2
            trolleyRef.current.position.z = 0
        }
        if (hookRef.current) {
            // Local Y relative to trolley so world Y ≈ baseY + trolleyY + localY
            hookRef.current.position.y = state.spreaderY - (CRANE_B_BASE[1] + 9.2)
        }
        if (beaconRef.current) {
            const pulse = 0.55 + 0.45 * Math.sin(state.beaconPulse)
            beaconRef.current.opacity = pulse
        }
        if (zoneMatRef.current) {
            zoneMatRef.current.opacity = state.zoneHot ? 0.18 : 0.06
            zoneMatRef.current.color.set(state.zoneHot ? '#ff6644' : '#22d3ee')
        }
    })

    return (
        <group position={CRANE_B_BASE} name="crane-b">
            {/* Shared-zone floor marker (world-aligned approximation under jib overlap) */}
            <mesh
                position={[-CRANE_B_BASE[0] + 15, -3.9, -2]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[14, 16]} />
                <meshBasicMaterial
                    ref={zoneMatRef}
                    color="#22d3ee"
                    transparent
                    opacity={0.06}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Base */}
            <mesh position={[0, -2, 0]} castShadow>
                <boxGeometry args={[3.2, 3.5, 3.2]} />
                <meshStandardMaterial color="#3a4550" metalness={0.55} roughness={0.45} />
            </mesh>

            {/* Tower */}
            <mesh position={[0, 4, 0]} castShadow>
                <boxGeometry args={[1.6, 11, 1.6]} />
                <meshStandardMaterial color="#4a5560" metalness={0.5} roughness={0.5} />
            </mesh>

            {/* Cabin (simplified, cyan-tinted for NPC identity) */}
            <mesh position={[1.2, 7.5, 0]} castShadow>
                <boxGeometry args={[1.6, 2, 1.6]} />
                <meshStandardMaterial color="#1a3a44" metalness={0.4} roughness={0.5} />
            </mesh>
            <mesh position={[1.9, 7.7, 0]}>
                <boxGeometry args={[0.08, 1.2, 1.2]} />
                <meshBasicMaterial color="#67e8f9" transparent opacity={0.55} />
            </mesh>

            {/* Main jib */}
            <mesh position={[10, 10, 0]} castShadow>
                <boxGeometry args={[20, 1.2, 1.6]} />
                <meshStandardMaterial color="#5a6570" metalness={0.5} roughness={0.5} />
            </mesh>

            {/* Counter-jib */}
            <mesh position={[-6.5, 10, 0]} castShadow>
                <boxGeometry args={[10, 1.2, 1.6]} />
                <meshStandardMaterial color="#5a6570" metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[-10, 9, 0]} castShadow>
                <boxGeometry args={[2.4, 2.4, 1.6]} />
                <meshStandardMaterial color="#333940" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Cyan identity beacon on tower apex */}
            <mesh position={[0, 11.2, 0]}>
                <sphereGeometry args={[0.35, 12, 12]} />
                <meshBasicMaterial
                    ref={beaconRef}
                    color="#22d3ee"
                    transparent
                    opacity={0.9}
                />
            </mesh>
            <pointLight position={[0, 11.5, 0]} color="#22d3ee" intensity={2.2} distance={18} />

            {/* Trolley + spreader */}
            <group ref={trolleyRef} position={[0, 9.2, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[1.2, 0.65, 1.8]} />
                    <meshStandardMaterial color="#0e7490" metalness={0.45} roughness={0.4} />
                </mesh>

                {/* Cable stub */}
                <mesh position={[0, -2, 0]}>
                    <cylinderGeometry args={[0.04, 0.04, 4]} />
                    <meshStandardMaterial color="#222222" />
                </mesh>

                <group ref={hookRef} position={[0, -4, 0]}>
                    {/* Spreader bar */}
                    <mesh castShadow>
                        <boxGeometry args={[2.4, 0.35, 0.9]} />
                        <meshStandardMaterial color="#155e75" metalness={0.5} roughness={0.4} />
                    </mesh>
                    {/* Twistlock stubs */}
                    {[-0.8, 0.8].map((x) => (
                        <mesh key={x} position={[x, -0.45, 0]}>
                            <boxGeometry args={[0.25, 0.5, 0.25]} />
                            <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={0.4} />
                        </mesh>
                    ))}
                    <pointLight position={[0, -0.2, 0]} color="#67e8f9" intensity={1.2} distance={8} />
                </group>
            </group>
        </group>
    )
}
