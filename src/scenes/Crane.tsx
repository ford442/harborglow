// =============================================================================
// CRANE COMPONENT - HarborGlow Phase 9
// Animated dock crane with operational lights and dynamic cable system
// =============================================================================

import { useMemo, useRef } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import CraneDashboard from '../components/CraneDashboard'
import CraneCable from './CraneCable'
import { useCraneMaterial } from './CraneMaterials'
import { CabinGlassPane, CraneLabels, CraneTowerRivets, SpreaderAssembly } from './CraneDetails'
import { useGameStore } from '../store/useGameStore'
import { lightingSystem } from '../systems/lightingSystem'
import { getLookDevSettings } from '../utils/lookDevControls'

export default function Crane() {
    const craneRef = useRef<THREE.Group>(null)
    const trolleyRef = useRef<THREE.Group>(null)
    const hookRef = useRef<THREE.Group>(null)
    const hookOrbMatRef = useRef<THREE.MeshBasicMaterial>(null)
    const towerSpotRef = useRef<THREE.SpotLight>(null)
    const hookSpotRef = useRef<THREE.SpotLight>(null)
    const hookFillRef = useRef<THREE.PointLight>(null)
    const cabinWarmRef = useRef<THREE.PointLight>(null)
    const cabinCoolRef = useRef<THREE.PointLight>(null)
    const spreaderRimRefs = useRef<Array<THREE.PointLight | null>>([])
    
    // Get crane state from store
    const spreaderPos = useGameStore((state) => state.spreaderPos)
    const spreaderRotation = useGameStore((state) => state.spreaderRotation)
    const loadTension = useGameStore((state) => state.loadTension)
    const twistlockEngaged = useGameStore((state) => state.twistlockEngaged)
    const trolleyPosition = useGameStore((state) => state.trolleyPosition)
    const ships = useGameStore((state) => state.ships)
    const attachmentSystemConfig = useGameStore((state) => state.attachmentSystemConfig)
    const isNight = useGameStore((state) => state.isNight)
    const timeOfDay = useGameStore((state) => state.timeOfDay)
    const lightIntensity = useGameStore((state) => state.lightIntensity)
    const musicPlaying = useGameStore((state) => state.musicPlaying)
    const lastInstallation = useGameStore((state) => state.lastInstallation)

    const safetyStripPositions = useMemo(() =>
        Array.from({ length: 12 }, (_, i) => {
            const x = 1.5 + i * 2
            return [
                [x, 10.95, 1.05] as [number, number, number],
                [x, 10.95, -1.05] as [number, number, number],
            ]
        }).flat(),
    [])

    const paintedSteelMat = useCraneMaterial('paintedSteel')
    const structuralSteelMat = useCraneMaterial('structuralSteel')
    const cautionStripeMat = useCraneMaterial('cautionStripe')

    const nearAttachmentDistance = useMemo(() => {
        let minDistance = Infinity
        for (const ship of ships) {
            for (const point of ship.attachmentPoints || []) {
                const worldX = ship.position[0] + point.position[0]
                const worldY = ship.position[1] + point.position[1]
                const worldZ = ship.position[2] + point.position[2]
                const dx = worldX - spreaderPos.x
                const dy = worldY - spreaderPos.y
                const dz = worldZ - spreaderPos.z
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
                if (dist < minDistance) minDistance = dist
            }
        }
        return minDistance
    }, [ships, spreaderPos.x, spreaderPos.y, spreaderPos.z])

    const nearAttachment = nearAttachmentDistance <= Math.max(attachmentSystemConfig.snapRadius, 4)

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

        const nightFactor = isNight
            ? 1
            : timeOfDay < 8
                ? (8 - timeOfDay) / 3
                : timeOfDay > 18
                    ? (timeOfDay - 18) / 4
                    : 0
        const baseNight = Math.max(0, Math.min(1, nightFactor))
        const beatPulse = lightingSystem.getBeatPulse()
        const harborShowActive = lightingSystem.isShowActive() || Array.from(musicPlaying.values()).some(Boolean)
        const pulseBoost = harborShowActive ? 1 + beatPulse * 0.45 : 1
        const installAgeMs = lastInstallation ? Date.now() - lastInstallation.timestamp : Number.POSITIVE_INFINITY
        const installBoost = installAgeMs < 1600 ? 1 - (installAgeMs / 1600) : 0
        const loweredHookBoost = 1 + Math.max(0, (8 - spreaderPos.y) * 0.08)
        const sharedNight = lightIntensity * baseNight * pulseBoost
        const lookDev = getLookDevSettings()
        const sheen = lookDev.craneSheen
        const wearRough = lookDev.craneWear

        if (paintedSteelMat) {
            paintedSteelMat.emissive.set('#ff9b30')
            paintedSteelMat.emissiveIntensity = 0.18 * sharedNight * sheen
            paintedSteelMat.roughness = 0.6 * wearRough
        }
        if (hookOrbMatRef.current) {
            hookOrbMatRef.current.color.set('#ffe7ad')
        }

        if (cabinWarmRef.current) {
            cabinWarmRef.current.intensity = 0.7 * sharedNight * sheen
        }
        if (cabinCoolRef.current) {
            cabinCoolRef.current.intensity = 0.35 * sharedNight * sheen
        }
        if (towerSpotRef.current) {
            towerSpotRef.current.intensity = 1.1 * sharedNight * sheen * (0.9 + beatPulse * 0.2)
        }
        if (hookSpotRef.current) {
            hookSpotRef.current.intensity = (1.4 + installBoost * 1.1) * sharedNight * sheen * loweredHookBoost
        }
        if (hookFillRef.current) {
            hookFillRef.current.intensity = (0.6 + installBoost * 0.7 + (nearAttachment ? 0.3 : 0)) * sharedNight * sheen
        }
        spreaderRimRefs.current.forEach((ref) => {
            if (!ref) return
            ref.intensity = (0.45 + (nearAttachment ? 0.35 : 0) + installBoost * 0.5) * sharedNight * sheen
        })
        if (cautionStripeMat) {
            cautionStripeMat.emissive.set('#ffb658')
            cautionStripeMat.emissiveIntensity = (0.22 + beatPulse * 0.08) * sharedNight * sheen
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
                <mesh position={[0, -2, 0]} castShadow material={structuralSteelMat}>
                    <boxGeometry args={[4, 4, 4]} />
                </mesh>
                
                {/* Base detail - bolts */}
                {[[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]].map(([x, z], i) => (
                    <mesh key={`bolt-${i}`} position={[x, -3.8, z]}>
                        <cylinderGeometry args={[0.15, 0.15, 0.3]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>
                ))}

                <CraneLabels />

                {/* === CRANE TOWER === */}
                <mesh position={[0, 4, 0]} castShadow material={structuralSteelMat}>
                    <boxGeometry args={[2, 12, 2]} />
                </mesh>
                <CraneTowerRivets />
                
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
                <mesh position={[1.5, 8, 0]} castShadow material={paintedSteelMat}>
                    <boxGeometry args={[2, 2.5, 2]} />
                </mesh>
                <CabinGlassPane />
                <pointLight ref={cabinWarmRef} position={[1.5, 8.4, 0]} intensity={0} color="#ffbe7a" distance={9} />
                <pointLight ref={cabinCoolRef} position={[2.1, 8.5, 0.6]} intensity={0} color="#75bfff" distance={6} />

                {/* === JIB (ARM) === */}
                {/* Main jib */}
                <mesh position={[12, 10, 0]} castShadow material={structuralSteelMat}>
                    <boxGeometry args={[24, 1.5, 2]} />
                </mesh>
                
                {/* Jib lattice pattern */}
                {Array.from({ length: 10 }, (_, i) => (
                    <mesh key={`jib-lattice-${i}`} position={[2 + i * 2, 10, 0]}>
                        <boxGeometry args={[0.1, 1.3, 2.1]} />
                        <meshBasicMaterial color="#777777" transparent opacity={0.4} />
                    </mesh>
                ))}
                {safetyStripPositions.map((position, i) => (
                    <mesh key={`jib-safety-${i}`} position={position} material={cautionStripeMat}>
                        <boxGeometry args={[0.35, 0.08, 0.08]} />
                    </mesh>
                ))}

                {/* Counter-jib */}
                <mesh position={[-8, 10, 0]} castShadow material={structuralSteelMat}>
                    <boxGeometry args={[12, 1.5, 2]} />
                </mesh>

                {/* Counterweights */}
                <mesh position={[-12, 9, 0]} castShadow material={structuralSteelMat}>
                    <boxGeometry args={[3, 3, 2]} />
                </mesh>

                {/* === TOWER TOP (Apex) === */}
                <mesh position={[0, 10.5, 0]} material={paintedSteelMat}>
                    <coneGeometry args={[1, 2, 4]} />
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
                    <mesh castShadow material={paintedSteelMat}>
                        <boxGeometry args={[1.5, 0.8, 2.2]} />
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
                            nearAttachment={nearAttachment}
                            installBoost={
                                lastInstallation && Date.now() - lastInstallation.timestamp < 1600
                                    ? 1 - ((Date.now() - lastInstallation.timestamp) / 1600)
                                    : 0
                            }
                            lightIntensity={lightIntensity}
                            isNight={isNight}
                            climaxPulse={lightingSystem.getBeatPulse()}
                        />
                    )}

                    {/* === HOOK BLOCK === */}
                    <group ref={hookRef} position={[0, -4, 0]}>
                        <SpreaderAssembly
                            twistlockEngaged={twistlockEngaged}
                            tension={normalizedTension}
                            nearAttachment={nearAttachment}
                        />

                        {/* Twistlock engaged indicator lights */}
                        {twistlockEngaged && (
                            <pointLight
                                position={[0, 0.3, 0]}
                                intensity={2}
                                color="#00ff00"
                                distance={3}
                            />
                        )}
                        
                        {/* Light on hook for visibility */}
                        <pointLight 
                            ref={hookFillRef}
                            position={[0, 0, 0]} 
                            intensity={0}
                            color="#ffffaa" 
                            distance={8}
                        />
                        <spotLight
                            ref={hookSpotRef}
                            position={[0, 0, 0]}
                            target-position={[0, -3.2, 0]}
                            intensity={0}
                            angle={Math.PI / 3}
                            penumbra={0.8}
                            distance={13}
                            color="#ffd78c"
                            castShadow
                        />
                        <pointLight
                            ref={(ref) => { spreaderRimRefs.current[0] = ref }}
                            position={[-0.45, 0.05, 0]}
                            intensity={0}
                            color="#77c7ff"
                            distance={5}
                        />
                        <pointLight
                            ref={(ref) => { spreaderRimRefs.current[1] = ref }}
                            position={[0.45, 0.05, 0]}
                            intensity={0}
                            color="#77c7ff"
                            distance={5}
                        />
                        <mesh position={[0, 0, 0]}>
                            <sphereGeometry args={[0.1]} />
                            <meshBasicMaterial ref={hookOrbMatRef} color="#ffffaa" />
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
                    ref={towerSpotRef}
                    position={[2, 8, 2]}
                    target-position={[5, 0, 5]}
                    intensity={0}
                    angle={Math.PI / 4}
                    penumbra={0.5}
                    distance={30}
                />
            </group>
        </RigidBody>
    )
}
