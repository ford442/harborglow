import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, PointerLockControls, useKeyboardControls } from '@react-three/drei'
import { CapsuleCollider, RigidBody, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'

type WalkingControls = 'forward' | 'backward' | 'left' | 'right' | 'jump' | 'sprint'

const WALK_SPEED = 5.2
const SPRINT_SPEED = 8.8
const JUMP_VELOCITY = 6.2

export default function Player() {
    const rigidBodyRef = useRef<RapierRigidBody>(null)
    const controlsRef = useRef<any>(null)
    const updateWalkingState = useGameStore((s) => s.updateWalkingState)
    const spawnPoint = useGameStore((s) => s.walkingSpawnPoint)
    const [, getKeys] = useKeyboardControls<WalkingControls>()
    const { camera } = useThree()

    const upRef = useRef(new THREE.Vector3(0, 1, 0))
    const forwardRef = useRef(new THREE.Vector3())
    const rightRef = useRef(new THREE.Vector3())
    const moveRef = useRef(new THREE.Vector3())
    const lastPublishRef = useRef(0)
    const jumpCooldownRef = useRef(0)

    useEffect(() => {
        const timer = window.setTimeout(() => {
            controlsRef.current?.lock?.()
        }, 100)

        return () => {
            window.clearTimeout(timer)
            controlsRef.current?.unlock?.()
        }
    }, [])

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

        const grounded = Math.abs(velocity.y) < 0.05 && rb.translation().y <= 0.15
        const wantsJump = keys.jump && grounded && jumpCooldownRef.current <= 0
        const nextY = wantsJump ? JUMP_VELOCITY : velocity.y
        if (wantsJump) jumpCooldownRef.current = 0.18

        rb.setLinvel({ x: nextX, y: nextY, z: nextZ }, true)

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
