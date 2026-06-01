import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, PointerLockControls, useKeyboardControls } from '@react-three/drei'
import { CapsuleCollider, RigidBody, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import * as Tone from 'tone'
import { useGameStore } from '../store/useGameStore'

type WalkingControls = 'forward' | 'backward' | 'left' | 'right' | 'jump' | 'sprint'

const WALK_SPEED = 5.2
const SPRINT_SPEED = 8.8
const JUMP_VELOCITY = 6.2
const INTERACTION_RANGE = 12
const FOOTSTEP_INTERVAL_WALK = 0.44
const FOOTSTEP_INTERVAL_SPRINT = 0.28

// Simple footstep synth — created lazily
let footSynth: Tone.MembraneSynth | null = null

function getFootSynth(): Tone.MembraneSynth {
    if (!footSynth) {
        footSynth = new Tone.MembraneSynth({
            pitchDecay: 0.06,
            octaves: 4,
            envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
            volume: -22,
        }).toDestination()
    }
    return footSynth
}

export default function Player() {
    const rigidBodyRef = useRef<RapierRigidBody>(null)
    const controlsRef = useRef<any>(null)
    const updateWalkingState = useGameStore((s) => s.updateWalkingState)
    const returnToCraneFromWalking = useGameStore((s) => s.returnToCraneFromWalking)
    const setCurrentShip = useGameStore((s) => s.setCurrentShip)
    const spawnPoint = useGameStore((s) => s.walkingSpawnPoint)
    const [, getKeys] = useKeyboardControls<WalkingControls>()
    const { camera } = useThree()

    const upRef = useRef(new THREE.Vector3(0, 1, 0))
    const forwardRef = useRef(new THREE.Vector3())
    const rightRef = useRef(new THREE.Vector3())
    const moveRef = useRef(new THREE.Vector3())
    const lastPublishRef = useRef(0)
    const jumpCooldownRef = useRef(0)
    const footstepTimerRef = useRef(0)

    // Pointer lock on mount
    useEffect(() => {
        const timer = window.setTimeout(() => {
            controlsRef.current?.lock?.()
        }, 100)

        return () => {
            window.clearTimeout(timer)
            controlsRef.current?.unlock?.()
        }
    }, [])

    // Q = return to crane, E = interact with nearest ship
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return

            if (e.key === 'q' || e.key === 'Q') {
                returnToCraneFromWalking()
                return
            }

            if (e.key === 'e' || e.key === 'E') {
                const rb = rigidBodyRef.current
                if (!rb) return
                const pos = rb.translation()
                const ships = useGameStore.getState().ships
                let nearestId: string | null = null
                let nearestDist = Infinity
                for (const ship of ships) {
                    if (ship.isDocked === false) continue
                    const dx = pos.x - ship.position[0]
                    const dz = pos.z - ship.position[2]
                    const dist = Math.sqrt(dx * dx + dz * dz)
                    if (dist < nearestDist) {
                        nearestDist = dist
                        nearestId = ship.id
                    }
                }
                if (nearestId && nearestDist <= INTERACTION_RANGE) {
                    setCurrentShip(nearestId)
                }
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [returnToCraneFromWalking, setCurrentShip])

    useFrame((state, delta) => {
        const rb = rigidBodyRef.current
        if (!rb) return

        jumpCooldownRef.current = Math.max(0, jumpCooldownRef.current - delta)

        const keys = getKeys()
        const velocity = rb.linvel()

        camera.getWorldDirection(forwardRef.current)
        forwardRef.current.y = 0
        if (forwardRef.current.lengthSq() < 1e-5) {
            forwardRef.current.set(0, 0, -1)
        } else {
            forwardRef.current.normalize()
        }

        rightRef.current.crossVectors(forwardRef.current, upRef.current).normalize()
        moveRef.current.set(0, 0, 0)

        if (keys.forward) moveRef.current.add(forwardRef.current)
        if (keys.backward) moveRef.current.sub(forwardRef.current)
        if (keys.left) moveRef.current.sub(rightRef.current)
        if (keys.right) moveRef.current.add(rightRef.current)

        const hasDirectionalInput = moveRef.current.lengthSq() > 0
        if (hasDirectionalInput) moveRef.current.normalize()

        const speed = keys.sprint ? SPRINT_SPEED : WALK_SPEED
        const desiredX = hasDirectionalInput ? moveRef.current.x * speed : 0
        const desiredZ = hasDirectionalInput ? moveRef.current.z * speed : 0

        const response = hasDirectionalInput ? 18 : 22
        const blend = Math.min(1, response * delta)
        const nextX = THREE.MathUtils.lerp(velocity.x, desiredX, blend)
        const nextZ = THREE.MathUtils.lerp(velocity.z, desiredZ, blend)

        const grounded = Math.abs(velocity.y) < 0.35 && rb.translation().y < 1.5
        const wantsJump = keys.jump && grounded && jumpCooldownRef.current <= 0
        const nextY = wantsJump ? JUMP_VELOCITY : velocity.y
        if (wantsJump) jumpCooldownRef.current = 0.18

        rb.setLinvel({ x: nextX, y: nextY, z: nextZ }, true)

        // Footstep sounds
        if (hasDirectionalInput && grounded) {
            footstepTimerRef.current -= delta
            if (footstepTimerRef.current <= 0) {
                footstepTimerRef.current = keys.sprint ? FOOTSTEP_INTERVAL_SPRINT : FOOTSTEP_INTERVAL_WALK
                try {
                    const synth = getFootSynth()
                    // Slight pitch variation for natural feel
                    const note = Math.random() > 0.5 ? 'C1' : 'A0'
                    synth.triggerAttackRelease(note, '32n', Tone.now())
                } catch {
                    // Ignore audio errors (e.g., context not started)
                }
            }
        } else {
            footstepTimerRef.current = 0
        }

        if (state.clock.elapsedTime - lastPublishRef.current > 0.1) {
            const pos = rb.translation()
            const vel = rb.linvel()
            updateWalkingState(
                [pos.x, pos.y, pos.z],
                [vel.x, vel.y, vel.z]
            )
            lastPublishRef.current = state.clock.elapsedTime
        }
    })

    return (
        <RigidBody
            ref={rigidBodyRef}
            type="dynamic"
            colliders={false}
            lockRotations
            position={spawnPoint}
            linearDamping={0}
            angularDamping={3}
            friction={0.2}
        >
            <CapsuleCollider args={[0.5, 0.5]} />
            <group position={[0, 1.6, 0]}>
                <PerspectiveCamera makeDefault fov={72} near={0.1} far={1000} />
            </group>
            <PointerLockControls ref={controlsRef} />
        </RigidBody>
    )
}
