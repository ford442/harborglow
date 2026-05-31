// =============================================================================
// CRANE AUTO PILOT - HarborGlow
// Bridges the 2D UpgradeMenu with the 3D crane, driving magical auto-installation
// =============================================================================

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'
import { findBindCandidate, triggerInstallation } from '../systems/attachmentSystem'

// -------------------------------------------------------------------------
// SMOOTHSTEP
// -------------------------------------------------------------------------
function smoothstep(t: number): number {
    return t * t * (3 - 2 * t)
}

// -------------------------------------------------------------------------
// DASHED LINE MATERIAL (shared)
// -------------------------------------------------------------------------
function createDashedLineMaterial() {
    const material = new THREE.LineDashedMaterial({
        color: '#00ffff',
        dashSize: 0.4,
        gapSize: 0.2,
        linewidth: 1,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    })
    return material
}

// -------------------------------------------------------------------------
// PULSING TARGET RING
// -------------------------------------------------------------------------
function PulsingTargetRing({ position }: { position: THREE.Vector3 }) {
    const ringRef = useRef<THREE.Mesh>(null)
    const innerRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (!ringRef.current || !innerRef.current) return
        const t = state.clock.elapsedTime
        const pulse = 1 + Math.sin(t * 4) * 0.15
        ringRef.current.scale.setScalar(pulse)
        ringRef.current.rotation.x = Math.PI / 2
        ringRef.current.rotation.z = t * 0.5
        innerRef.current.scale.setScalar(pulse * 0.7)
        innerRef.current.rotation.x = Math.PI / 2
        innerRef.current.rotation.z = -t * 0.7
    })

    return (
        <group position={position}>
            <mesh ref={ringRef}>
                <ringGeometry args={[0.6, 0.75, 32]} />
                <meshBasicMaterial
                    color="#00ffff"
                    transparent
                    opacity={0.5}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            <mesh ref={innerRef}>
                <ringGeometry args={[0.3, 0.35, 32]} />
                <meshBasicMaterial
                    color="#00d4aa"
                    transparent
                    opacity={0.4}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            {/* Vertical beacon beam */}
            <mesh position={[0, 2.5, 0]}>
                <cylinderGeometry args={[0.05, 0.15, 5, 8, 1, true]} />
                <meshBasicMaterial
                    color="#00ffff"
                    transparent
                    opacity={0.12}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    )
}

// -------------------------------------------------------------------------
// GUIDE LINE
// -------------------------------------------------------------------------
function GuideLine({ start, end }: { start: THREE.Vector3; end: THREE.Vector3 }) {
    const lineRef = useRef<THREE.Line>(null)

    const { geometry, material } = useMemo(() => {
        const geo = new THREE.BufferGeometry().setFromPoints([start, end])
        const mat = createDashedLineMaterial()
        return { geometry: geo, material: mat }
    }, [start, end])

    useEffect(() => {
        if (lineRef.current) {
            lineRef.current.computeLineDistances()
        }
    }, [geometry])

    return <primitive object={new THREE.Line(geometry, material)} ref={lineRef} />
}

// -------------------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------------------
export default function CraneAutoPilot() {
    const pendingAutoInstall = useGameStore((state) => state.pendingAutoInstall)

    // Local refs to track autopilot state without React re-renders
    const phaseRef = useRef<'idle' | 'approach' | 'lock' | 'bind'>('idle')
    const targetRef = useRef<THREE.Vector3 | null>(null)
    const startSpreaderRef = useRef<{ x: number; y: number; z: number } | null>(null)
    const bindStartTimeRef = useRef(0)
    const shipIdRef = useRef<string | null>(null)
    const partNameRef = useRef<string | null>(null)
    const prevPendingRef = useRef<string | null>(null)

    const _startVec = useMemo(() => new THREE.Vector3(), [])
    const _targetVec = useMemo(() => new THREE.Vector3(), [])
    const _currentVec = useMemo(() => new THREE.Vector3(), [])
    const _guideStart = useMemo(() => new THREE.Vector3(), [])
    const _guideEnd = useMemo(() => new THREE.Vector3(), [])

    useFrame((state, delta) => {
        const store = useGameStore.getState()
        const pending = store.pendingAutoInstall

        // -----------------------------------------------------------------
        // Detect pendingAutoInstall start / cancellation
        // -----------------------------------------------------------------
        const pendingKey = pending ? `${pending.shipId}-${pending.partName}` : null

        if (pendingKey !== prevPendingRef.current) {
            if (pending) {
                // New auto-install request
                const ship = store.ships.find((s) => s.id === pending.shipId)
                const point = ship?.attachmentPoints.find((p) => p.partName === pending.partName)
                if (ship && point) {
                    phaseRef.current = 'approach'
                    targetRef.current = new THREE.Vector3(
                        ship.position[0] + point.position[0],
                        ship.position[1] + point.position[1],
                        ship.position[2] + point.position[2]
                    )
                    startSpreaderRef.current = { ...store.spreaderPos }
                    shipIdRef.current = pending.shipId
                    partNameRef.current = pending.partName
                } else {
                    // Invalid target — clear pending
                    store.setPendingAutoInstall(null)
                    phaseRef.current = 'idle'
                    targetRef.current = null
                }
            } else {
                // Pending cleared externally
                phaseRef.current = 'idle'
                targetRef.current = null
                startSpreaderRef.current = null
                shipIdRef.current = null
                partNameRef.current = null
            }
            prevPendingRef.current = pendingKey
        }

        // -----------------------------------------------------------------
        // Idle — do nothing
        // -----------------------------------------------------------------
        if (phaseRef.current === 'idle' || !targetRef.current) {
            return
        }

        const target = targetRef.current
        const spreader = store.spreaderPos
        const speed = 8 // m/s

        _currentVec.set(spreader.x, spreader.y, spreader.z)
        _targetVec.copy(target)

        const distance = _currentVec.distanceTo(_targetVec)

        // -----------------------------------------------------------------
        // APPROACH phase
        // -----------------------------------------------------------------
        if (phaseRef.current === 'approach') {
            if (distance <= store.attachmentSystemConfig.installDistance) {
                // Transition to lock phase
                phaseRef.current = 'lock'
                store.setTwistlockEngaged(true)
                bindStartTimeRef.current = state.clock.elapsedTime
                startSpreaderRef.current = { ...store.spreaderPos }
                return
            }

            // Move toward target at ~8 m/s
            const direction = _targetVec.clone().sub(_currentVec).normalize()
            const step = Math.min(distance, speed * delta)
            const nextPos = _currentVec.add(direction.multiplyScalar(step))

            store.setSpreaderPos({ x: nextPos.x, y: nextPos.y, z: nextPos.z })

            // Update trolley position to match X (mapped from world x to trolley 0..1)
            const CRANE_JIB_SPAN = 40
            const trolleyNormalized = THREE.MathUtils.clamp(
                (nextPos.x + CRANE_JIB_SPAN / 2) / CRANE_JIB_SPAN,
                0,
                1
            )
            store.setTrolleyPosition(trolleyNormalized)

            // Update cable depth to match Y (cable length from trolley height)
            const CRANE_TROLLEY_HEIGHT = 9.2
            const cableDepth = Math.max(0, CRANE_TROLLEY_HEIGHT - nextPos.y)
            store.setCableDepth(cableDepth)

            // Face the ship (look toward target on XZ plane)
            const angle = Math.atan2(target.z - nextPos.z, target.x - nextPos.x)
            store.setSpreaderRotation(angle)
        }

        // -----------------------------------------------------------------
        // LOCK phase — engage twistlock, then bind-interpolate
        // -----------------------------------------------------------------
        if (phaseRef.current === 'lock') {
            // Wait one frame for twistlock to register, then start binding
            const elapsed = (state.clock.elapsedTime - bindStartTimeRef.current) * 1000
            const duration = store.attachmentSystemConfig.bindDurationMs
            const rawProgress = Math.min(1, elapsed / duration)
            const t = smoothstep(rawProgress)

            if (startSpreaderRef.current) {
                const start = startSpreaderRef.current
                store.setSpreaderPos({
                    x: start.x + (target.x - start.x) * t,
                    y: start.y + (target.y - start.y) * t,
                    z: start.z + (target.z - start.z) * t,
                })
            }

            if (rawProgress >= 1) {
                // Binding complete — fire installation
                const ship = store.ships.find((s) => s.id === shipIdRef.current)
                if (ship && partNameRef.current) {
                    triggerInstallation(
                        shipIdRef.current!,
                        partNameRef.current,
                        [target.x, target.y, target.z]
                    )
                }

                // Clear pending to signal completion
                store.setPendingAutoInstall(null)
                store.setTwistlockEngaged(false)

                phaseRef.current = 'idle'
                targetRef.current = null
                startSpreaderRef.current = null
                shipIdRef.current = null
                partNameRef.current = null
            }
        }
    })

    // -----------------------------------------------------------------
    // Visual feedback
    // -----------------------------------------------------------------
    if (phaseRef.current === 'idle' || !targetRef.current) {
        return null
    }

    const store = useGameStore.getState()
    _guideStart.set(store.spreaderPos.x, store.spreaderPos.y, store.spreaderPos.z)
    _guideEnd.copy(targetRef.current)

    return (
        <group>
            <GuideLine start={_guideStart} end={_guideEnd} />
            <PulsingTargetRing position={targetRef.current} />
        </group>
    )
}
