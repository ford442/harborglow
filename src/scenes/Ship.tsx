// =============================================================================
// SHIP COMPONENT - HarborGlow Phase 9
// Ship rendering with LOD, attachment points, and music-reactive lighting.
//
// HARBOR ASSIST (tugboat mode):
// When operationMode === 'tugboat', ships switch from a fixed Rapier body to a
// full dynamic body (50 000 kg) with buoyancy probes.  The tug can then push
// them via collision impulses or tow them with the standard tow-line spring.
// Switching back to crane mode restores the fixed body so performance is not
// affected during crane play.
// =============================================================================

import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import type { Ship } from '../store/useGameStore'
import { useGameStore } from '../store/useGameStore'
import { ProceduralShip } from './ProceduralShip'
import NightShipLights from './NightShipLights'
import { useLOD } from '../systems/performanceSystem'
import AttachmentPointVisual from './AttachmentPoint'
import { 
  getRigTypeForPart, 
  AttachmentState,
} from '../systems/attachmentSystem'
import { waveSystem } from '../systems/WaveSystem'
import { stormSystem } from '../systems/StormSystem'
import {
  towLineState,
  towLineCableConfig,
} from '../systems/TowLineSystem'
import { TowLineVisual } from './TugboatTargetShip'
import {
  registerAssistShip,
  unregisterAssistShip,
} from '../systems/harborAssistSystem'

// =============================================================================
// HARBOR ASSIST PHYSICS CONSTANTS
// Matches TugboatTargetShip so fleet ships feel equally heavy and satisfying.
// =============================================================================

const FLEET_SHIP_MASS            = 50000
const FLEET_SHIP_LINEAR_DAMPING  = 0.8
const FLEET_SHIP_ANGULAR_DAMPING = 1.2
const FLEET_BUOYANCY_SCALE       = 30000
const FLEET_DAMPING_SCALE        = 1500
const FLEET_RESTORING_TORQUE     = 5000
const FLEET_MAX_SPEED            = 2       // m/s — heavy ships are slow
const BASE_MAX_TOW_LENGTH        = 12      // metres before tension builds

// Buoyancy probe offsets (ship-local space)
const FLEET_PROBE_OFFSETS = [
  { x: 0,    z:  4 },
  { x: 0,    z: -4 },
  { x: -1.5, z:  2 },
  { x:  1.5, z:  2 },
  { x: -1.5, z: -2 },
  { x:  1.5, z: -2 },
]

// Distance within which tow-attachment indicator is shown (metres)
const TOW_HINT_RADIUS = 25

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
        droneship: '#34495e',
        ferry: '#00cc88',
        trawler: '#cc8833',
        horizon: '#3388cc'
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
            case 'ferry': return [5.5, 1.8, 1.6] as [number, number, number]
            case 'trawler': return [4, 1.5, 1.2] as [number, number, number]
            case 'horizon': return [6, 2, 1.5] as [number, number, number]
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
    const groupRef    = useRef<THREE.Group>(null)
    const rbRef       = useRef<RapierRigidBody>(null)

    // Reusable vectors — allocated once, mutated in useFrame
    const _toTug        = useMemo(() => new THREE.Vector3(), [])
    const _prevTowDist  = useRef(0)

    const installedUpgrades = useGameStore((state) => state.installedUpgrades)
    const lightIntensity    = useGameStore((state) => state.lightIntensity)
    const musicPlaying      = useGameStore((state) => state.musicPlaying)
    const bpm               = useGameStore((state) => state.bpm)
    const spreaderPos       = useGameStore((state) => state.spreaderPos)
    const twistlockEngaged  = useGameStore((state) => state.twistlockEngaged)
    const attachmentConfig  = useGameStore((state) => state.attachmentSystemConfig)
    const operationMode     = useGameStore((state) => state.operationMode)

    const isDynamic = operationMode === 'tugboat'

    // PHASE 10: Get LOD level based on distance
    const lod = useLOD(ship.position)

    // -------------------------------------------------------------------------
    // HARBOR ASSIST — register / unregister in the shared rigid-body registry
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!isDynamic) return
        // rbRef may not be populated yet; the effect re-runs when rbRef changes
        // so we poll via a short delay.  The ref assignment happens inside
        // react-three-rapier after the first render.
        const register = () => {
            if (rbRef.current) {
                registerAssistShip(ship.id, rbRef.current)
            }
        }
        // Give react-three-rapier one tick to mount the physics body
        const id = setTimeout(register, 0)
        return () => {
            clearTimeout(id)
            unregisterAssistShip(ship.id)
        }
    }, [isDynamic, ship.id])

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

    useFrame((state, delta) => {
        if (!groupRef.current) return

        // -----------------------------------------------------------------------
        // DYNAMIC (tugboat) mode — full Rapier physics
        // -----------------------------------------------------------------------
        if (isDynamic && rbRef.current) {
            const rb = rbRef.current

            // Re-register each frame until the ref is populated (first tick race)
            registerAssistShip(ship.id, rb)

            const pos   = rb.translation()
            const rot   = rb.rotation()
            const quat  = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)
            const euler = new THREE.Euler().setFromQuaternion(quat)
            const vel   = rb.linvel()
            const time  = waveSystem.getTime()

            // --- Wind push ---
            const windForce = stormSystem.getWindForce()
            if (windForce.lengthSq() > 0) {
                rb.applyImpulse({ x: windForce.x * delta, y: 0, z: windForce.z * delta }, true)
            }

            // --- Simple surface current ---
            const current = waveSystem.getSurfaceCurrent(pos.x, pos.z)
            if (current.lengthSq() > 0) {
                rb.applyImpulse(
                    { x: current.x * delta * 0.15, y: 0, z: current.z * delta * 0.15 },
                    true
                )
            }

            // --- Buoyancy (multi-probe) ---
            for (const offset of FLEET_PROBE_OFFSETS) {
                const localOff = new THREE.Vector3(offset.x, 0, offset.z)
                localOff.applyQuaternion(quat)

                const probeX = pos.x + localOff.x
                const probeZ = pos.z + localOff.z
                const waterH = waveSystem.getWaterHeight(probeX, probeZ, time)
                const probeY = pos.y + localOff.y
                const submerged = waterH - 2.5 - probeY

                if (submerged > 0) {
                    const force = submerged * FLEET_BUOYANCY_SCALE * delta
                    rb.applyImpulseAtPoint(
                        { x: 0, y: force, z: 0 },
                        { x: probeX, y: probeY, z: probeZ },
                        true
                    )
                }
            }

            // --- Vertical damping ---
            if (vel.y !== 0) {
                rb.applyImpulse({ x: 0, y: -vel.y * FLEET_DAMPING_SCALE * delta, z: 0 }, true)
            }

            // --- Angular damping + restoring upright torque ---
            const angVel = rb.angvel()
            rb.applyTorqueImpulse(
                {
                    x: -angVel.x * FLEET_SHIP_ANGULAR_DAMPING * delta,
                    y: 0,
                    z: -angVel.z * FLEET_SHIP_ANGULAR_DAMPING * delta,
                },
                true
            )
            rb.applyTorqueImpulse(
                {
                    x: -euler.x * FLEET_RESTORING_TORQUE * delta,
                    y: 0,
                    z: -euler.z * FLEET_RESTORING_TORQUE * delta,
                },
                true
            )

            // --- Max horizontal speed clamp ---
            const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
            if (speed > FLEET_MAX_SPEED) {
                const scale = FLEET_MAX_SPEED / speed
                rb.setLinvel({ x: vel.x * scale, y: vel.y, z: vel.z * scale }, true)
            }

            // --- Tow-line spring (read store directly to avoid 60 fps React renders) ---
            const storeState = useGameStore.getState()
            if (storeState.towLineAttached && storeState.activeTowedShipId === ship.id) {
                const tugPos = storeState.tugboatState.position
                _toTug.set(tugPos[0] - pos.x, 0, tugPos[2] - pos.z)
                const towDist  = _toTug.length()
                const distRate = (towDist - _prevTowDist.current) / Math.max(delta, 0.001)
                _prevTowDist.current = towDist

                const hasHeavyWinch = storeState.tugboatUpgrades.heavy_tow_winch
                const hasDynamicAssist = storeState.tugboatUpgrades.dynamic_positioning_assist
                const maxTowLength = hasHeavyWinch
                    ? BASE_MAX_TOW_LENGTH + (hasDynamicAssist ? 6 : 4)
                    : BASE_MAX_TOW_LENGTH
                const excess = towDist - maxTowLength

                const tensionRaw = excess > 0
                    ? Math.max(0, excess * towLineCableConfig.springK + distRate * towLineCableConfig.damping * (hasDynamicAssist ? 0.75 : 1))
                    : 0
                const tension = Math.min(1, tensionRaw / towLineCableConfig.maxTension)

                if (excess > 0) {
                    _toTug.normalize()
                    const impulse = excess * towLineCableConfig.springK * delta
                    rb.applyImpulse({ x: _toTug.x * impulse, y: 0, z: _toTug.z * impulse }, true)
                }

                // Snap condition
                if (tension >= 1) {
                    towLineState.overloadTimer += delta
                } else {
                    towLineState.overloadTimer = Math.max(0, towLineState.overloadTimer - delta * 2)
                }
                const sustainedSnap = towLineState.overloadTimer >= (hasDynamicAssist ? towLineCableConfig.snapDelay * 1.25 : towLineCableConfig.snapDelay)
                const spikeSnap     = tensionRaw > towLineCableConfig.maxTension * 2.5

                if (sustainedSnap || spikeSnap) {
                    const whipImpulse = towLineCableConfig.maxTension * 0.0002
                    const away = _toTug.clone().negate().normalize()
                    rb.applyImpulse({ x: away.x * whipImpulse, y: 0, z: away.z * whipImpulse }, true)
                    towLineState.snapFlag = true
                    setTimeout(() => { towLineState.snapFlag = false }, 1200)
                    storeState.signalTowLineSnap()
                    towLineState.active        = false
                    towLineState.tension       = 0
                    towLineState.tensionRaw    = 0
                    towLineState.overloadTimer = 0
                } else {
                    towLineState.active     = true
                    towLineState.tension    = tension
                    towLineState.tensionRaw = tensionRaw
                    towLineState.shipPosition.set(pos.x, pos.y + 1, pos.z)
                    towLineState.tugPosition.set(tugPos[0], tugPos[1] + 0.5, tugPos[2])
                }
            } else {
                _prevTowDist.current = 0
                // Only reset towLineState if this ship was previously the active one
                if (useGameStore.getState().activeTowedShipId !== ship.id) {
                    // another ship or no ship is active — leave towLineState alone
                }
            }

            // --- Light rig pulse (same as fixed mode, skip at low LOD) ---
            if (lod < 2 && musicPlaying.get(ship.id)) {
                const beatDuration = 60 / bpm
                const pulse = (Math.sin(state.clock.elapsedTime * (Math.PI * 2 / beatDuration)) + 1) / 2
                groupRef.current.traverse((child) => {
                    if (child.type === 'PointLight' || child.type === 'SpotLight') {
                        const light = child as THREE.PointLight
                        light.intensity = 1.5 + pulse * lightIntensity
                    }
                })
            }

            return
        }

        // -----------------------------------------------------------------------
        // FIXED (crane) mode — visual bob only, no physics
        // -----------------------------------------------------------------------
        const bobOffsets: Record<Ship['type'], number> = {
            cruise: 0.08,
            container: 0.05,
            tanker: 0.03,
            bulk: 0.04,
            lng: 0.035,
            roro: 0.06,
            research: 0.05,
            droneship: 0.10,  // Barge is more stable
            ferry: 0.07,
            trawler: 0.09,
            horizon: 0.06
        }
        const bobOffset = bobOffsets[ship.type]
        const sineBob = Math.sin(state.clock.elapsedTime * 0.5 + ship.position[0]) * bobOffset
        
        // Wave-following visual offset (does not affect fixed rigid body)
        const waveH = waveSystem.getWaterHeight(ship.position[0], ship.position[2], waveSystem.getTime())
        const waveOffset = Math.max(-0.5, Math.min(0.5, waveH * 0.15))
        
        groupRef.current.position.y = sineBob + waveOffset
        
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

    // -------------------------------------------------------------------------
    // TOW ATTACHMENT INDICATOR
    // A glowing ring appears above the ship bow when the tug is close and
    // towing is unlocked, signalling that 'T' can attach a tow line.
    // -------------------------------------------------------------------------
    const TowHintIndicator = useMemo(() => {
        if (!isDynamic) return null
        return (
            <mesh position={[0, 3, 2]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.8, 1.1, 32]} />
                <meshBasicMaterial
                    color="#00ffcc"
                    transparent
                    opacity={0.55}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
        )
    }, [isDynamic])

    // PHASE 10: Render impostor at lowest LOD
    if (lod === 3) {
        return (
            <RigidBody
                ref={rbRef}
                type={isDynamic ? 'dynamic' : 'fixed'}
                mass={isDynamic ? FLEET_SHIP_MASS : undefined}
                linearDamping={isDynamic ? FLEET_SHIP_LINEAR_DAMPING : undefined}
                angularDamping={isDynamic ? FLEET_SHIP_ANGULAR_DAMPING : undefined}
                position={ship.position}
                enabledRotations={isDynamic ? [true, true, true] : undefined}
                colliders="cuboid"
            >
                <ShipImpostor type={ship.type} />
            </RigidBody>
        )
    }

    return (
        <>
            <RigidBody
                ref={rbRef}
                type={isDynamic ? 'dynamic' : 'fixed'}
                mass={isDynamic ? FLEET_SHIP_MASS : undefined}
                linearDamping={isDynamic ? FLEET_SHIP_LINEAR_DAMPING : undefined}
                angularDamping={isDynamic ? FLEET_SHIP_ANGULAR_DAMPING : undefined}
                position={ship.position}
                enabledRotations={isDynamic ? [true, true, true] : undefined}
                colliders="cuboid"
            >
                <group ref={groupRef}>
                    <ProceduralShip blueprintId={ship.type} version={ship.version}>
                        <NightShipLights ship={ship} lod={lod} />

                        {/* Tow attachment hint ring (tugboat mode only) */}
                        {isDynamic && TowHintIndicator}

                        {/* PHASE 9: Enhanced attachment points (crane mode) */}
                        {!isDynamic && attachmentConfig.showPoints && lod < 2 && attachmentPointsWithState.map(({ 
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

            {/* Tow-line visual cable — rendered at scene level (world space) */}
            {isDynamic && <TowLineVisual shipRbRef={rbRef} shipId={ship.id} />}
        </>
    )
}
