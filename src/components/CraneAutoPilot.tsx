// =============================================================================
// CRANE AUTO PILOT - HarborGlow
// Bridges the 2D UpgradeMenu with the 3D crane, driving magical auto-installation
// =============================================================================

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'
import { findBindCandidate, triggerInstallation } from '../systems/attachmentSystem'
import { startQueueTravelHum, stopQueueTravelHum } from '../systems/soundEffects'

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

function QueuePathLine({ points }: { points: THREE.Vector3[] }) {
    const lineRef = useRef<THREE.Line>(null)

    const { geometry, material } = useMemo(() => {
        const geo = new THREE.BufferGeometry().setFromPoints(points)
        const mat = createDashedLineMaterial()
        mat.opacity = 0.3
        return { geometry: geo, material: mat }
    }, [points])

    useEffect(() => {
        lineRef.current?.computeLineDistances()
    }, [geometry])

    return <primitive object={new THREE.Line(geometry, material)} ref={lineRef} />
}

// -------------------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------------------
export default function CraneAutoPilot() {
    const pendingAutoInstall = useGameStore((state) => state.pendingAutoInstall)
    const installQueue = useGameStore((state) => state.installQueue)
    const installQueueIndex = useGameStore((state) => state.installQueueIndex)
    const isQueueRunning = useGameStore((state) => state.isQueueRunning)
    const isQueuePaused = useGameStore((state) => state.isQueuePaused)
    const queuePausedAt = useGameStore((state) => state.queuePausedAt)
    const queuePausedShipId = useGameStore((state) => state.queuePausedShipId)

    // Local refs to track autopilot state without React re-renders
    const phaseRef = useRef<'idle' | 'approach' | 'lock' | 'bind' | 'staging'>('idle')
    const targetRef = useRef<THREE.Vector3 | null>(null)
    const startSpreaderRef = useRef<{ x: number; y: number; z: number } | null>(null)
    const bindStartTimeRef = useRef(0)
    const shipIdRef = useRef<string | null>(null)
    const partNameRef = useRef<string | null>(null)
    const prevActiveKeyRef = useRef<string | null>(null)
    const queueTravelHumActiveRef = useRef(false)

    const _startVec = useMemo(() => new THREE.Vector3(), [])
    const _targetVec = useMemo(() => new THREE.Vector3(), [])
    const _currentVec = useMemo(() => new THREE.Vector3(), [])
    const _guideStart = useMemo(() => new THREE.Vector3(), [])
    const _guideEnd = useMemo(() => new THREE.Vector3(), [])
    const _queuePointBuffer = useMemo(() => new THREE.Vector3(), [])

    useEffect(() => {
        return () => stopQueueTravelHum()
    }, [])

    const queuePathPoints = useMemo(() => {
        if (!isQueueRunning) return []
        const store = useGameStore.getState()
        const active = installQueue.slice(installQueueIndex)
        if (active.length === 0) return []

        const points: THREE.Vector3[] = [
            _queuePointBuffer.set(store.spreaderPos.x, store.spreaderPos.y, store.spreaderPos.z).clone(),
        ]

        for (const item of active) {
            const ship = store.ships.find((s) => s.id === item.shipId)
            const point = ship?.attachmentPoints.find((p) => p.partName === item.partName)
            if (!ship || !point) continue
            points.push(new THREE.Vector3(
                ship.position[0] + point.position[0],
                ship.position[1] + point.position[1],
                ship.position[2] + point.position[2],
            ))
        }

        return points.length >= 2 ? points : []
    }, [installQueue, installQueueIndex, isQueueRunning, _queuePointBuffer])

    const setActiveTarget = (store: ReturnType<typeof useGameStore.getState>, pending: { shipId: string; partName: string } | null) => {
        if (!pending) {
            phaseRef.current = 'idle'
            targetRef.current = null
            startSpreaderRef.current = null
            shipIdRef.current = null
            partNameRef.current = null
            stopQueueTravelHum()
            queueTravelHumActiveRef.current = false
            return null
        }

        const ship = store.ships.find((s) => s.id === pending.shipId)
        const point = ship?.attachmentPoints.find((p) => p.partName === pending.partName)
        if (!ship || !point) {
            return null
        }

        targetRef.current = new THREE.Vector3(
            ship.position[0] + point.position[0],
            ship.position[1] + point.position[1],
            ship.position[2] + point.position[2]
        )
        startSpreaderRef.current = { ...store.spreaderPos }
        shipIdRef.current = pending.shipId
        partNameRef.current = pending.partName
        return targetRef.current
    }

    useFrame((state, delta) => {
        const store = useGameStore.getState()
        const pending = store.isQueueRunning ? store.installQueue[store.installQueueIndex] ?? null : store.pendingAutoInstall
        const activeKey = pending ? `${store.isQueueRunning ? 'queue' : 'single'}-${store.installQueueIndex}-${pending.shipId}-${pending.partName}` : null

        // -----------------------------------------------------------------
        // Detect active auto-install start / cancellation / queue step changes
        // -----------------------------------------------------------------
        if (activeKey !== prevActiveKeyRef.current) {
            if (!pending) {
                phaseRef.current = 'idle'
                targetRef.current = null
                startSpreaderRef.current = null
                shipIdRef.current = null
                partNameRef.current = null
                stopQueueTravelHum()
                queueTravelHumActiveRef.current = false
            } else if (!store.isQueuePaused) {
                const resolved = setActiveTarget(store, pending)
                if (resolved) {
                    phaseRef.current = 'approach'
                } else if (store.isQueueRunning) {
                    phaseRef.current = 'idle'
                    targetRef.current = null
                    startSpreaderRef.current = null
                    shipIdRef.current = null
                    partNameRef.current = null
                    store.pauseInstallQueue(pending.shipId)
                } else {
                    store.setPendingAutoInstall(null)
                    phaseRef.current = 'idle'
                    targetRef.current = null
                }
            }
            prevActiveKeyRef.current = activeKey
        }

        if (store.isQueuePaused) {
            const pausedShip = store.ships.find((s) => s.id === queuePausedShipId)
            const expired = queuePausedAt ? Date.now() - queuePausedAt > 60_000 : false
            if (expired) {
                store.abortInstallQueue()
                stopQueueTravelHum()
                queueTravelHumActiveRef.current = false
                phaseRef.current = 'idle'
                targetRef.current = null
                return
            }

            if (pausedShip?.isDocked && pending) {
                store.resumeInstallQueue()
                phaseRef.current = 'approach'
                if (!targetRef.current) {
                    setActiveTarget(store, pending)
                }
            }
            return
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
                if (queueTravelHumActiveRef.current) {
                    stopQueueTravelHum()
                    queueTravelHumActiveRef.current = false
                }
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

                store.setTwistlockEngaged(false)

                if (store.isQueueRunning) {
                    phaseRef.current = 'staging'
                    if (!queueTravelHumActiveRef.current) {
                        void startQueueTravelHum(0.8)
                        queueTravelHumActiveRef.current = true
                    }
                } else {
                    store.setPendingAutoInstall(null)
                    phaseRef.current = 'idle'
                    targetRef.current = null
                    startSpreaderRef.current = null
                    shipIdRef.current = null
                    partNameRef.current = null
                }
            }
        }

        if (phaseRef.current === 'staging' && targetRef.current) {
            const safeY = targetRef.current.y + 5
            const dist = Math.abs(store.spreaderPos.y - safeY)
            if (dist < 0.2) {
                store.advanceInstallQueue()
                phaseRef.current = 'idle'
                targetRef.current = null
                startSpreaderRef.current = null
                shipIdRef.current = null
                partNameRef.current = null
                stopQueueTravelHum()
                queueTravelHumActiveRef.current = false
            } else {
                const dy = Math.sign(safeY - store.spreaderPos.y) * Math.min(dist, speed * delta)
                const nextY = store.spreaderPos.y + dy
                store.setSpreaderPos({ ...store.spreaderPos, y: nextY })
                const CRANE_TROLLEY_HEIGHT = 9.2
                store.setCableDepth(Math.max(0, CRANE_TROLLEY_HEIGHT - nextY))
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
            {queuePathPoints.length >= 2 ? <QueuePathLine points={queuePathPoints} /> : <GuideLine start={_guideStart} end={_guideEnd} />}
            <PulsingTargetRing position={targetRef.current} />
        </group>
    )
}
