import React, { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { Ship } from '../../store/useGameStore'
import { lightingSystem } from '../../systems/lightingSystem'
import { VolumetricLightCone } from '../VolumetricLighting'
import { buildGodRayMaterial, updateGodRay } from '../../shaders/lightShowNodes'

export function NightDockLights({ lightIntensity }: { lightIntensity: number }) {
    const beatPulse = lightingSystem.getBeatPulse()
    const pulseBoost = 1 + beatPulse * 0.35
    const scaled = lightIntensity * pulseBoost

    return (
        <>
            {/* Dock amber lights */}
            {[[-20, 8, -8], [0, 8, -8], [20, 8, -8]].map((pos, i) => (
                <pointLight
                    key={i}
                    position={pos as [number, number, number]}
                    intensity={1.2 * scaled}
                    color="#ffaa00"
                    distance={30}
                    decay={2}
                />
            ))}

            {/* Blue underwater glow */}
            <pointLight position={[-30, -3, 10]} intensity={0.8 * scaled} color="#00aaff" distance={40} decay={2} />
            <pointLight position={[30, -3, 10]} intensity={0.8 * scaled} color="#00aaff" distance={40} decay={2} />


            {/* Red warning beacons */}
            <pointLight position={[-25, 15, 0]} intensity={0.5 * scaled} color="#ff0000" distance={20} />
            <pointLight position={[25, 15, 0]} intensity={0.5 * scaled} color="#ff0000" distance={20} />
        </>
    )
}

export function NightVolumetricCones({ lightIntensity, currentShip }: { lightIntensity: number; currentShip?: Ship }) {
    const baseIntensity = Math.max(0.2, lightIntensity)
    const pulse = 1 + lightingSystem.getBeatPulse() * 0.25

    return (
        <>
            <VolumetricLightCone
                type="spot"
                position={[-20, 8, -8]}
                target={[-20, 0, -8]}
                color="#ffbb66"
                intensity={0.28 * baseIntensity}
                angle={Math.PI / 8}
                distance={18}
            />
            <VolumetricLightCone
                type="spot"
                position={[20, 8, -8]}
                target={[20, 0, -8]}
                color="#ffbb66"
                intensity={0.28 * baseIntensity}
                angle={Math.PI / 8}
                distance={18}
            />
            {currentShip && (
                <VolumetricLightCone
                    type="spot"
                    position={[currentShip.position[0], currentShip.position[1] + 10, currentShip.position[2]]}
                    target={[currentShip.position[0], currentShip.position[1] + 1, currentShip.position[2]]}
                    color="#7fc9ff"
                    intensity={0.22 * baseIntensity * pulse}
                    angle={Math.PI / 7}
                    distance={16}
                />
            )}
        </>
    )
}

export function WaterLightVolumes({
    lightIntensity,
    currentShip,
    spreaderPos,
    installedUpgrades,
}: {
    lightIntensity: number
    currentShip?: Ship
    spreaderPos: { x: number; y: number; z: number }
    installedUpgrades: Array<{ shipId: string; partName: string }>
}) {
    const beat = lightingSystem.getBeatPulse()
    const pulse = 1 + beat * 0.35
    const scale = Math.max(0.25, lightIntensity) * pulse

    const progress = currentShip
        ? Math.min(
            1,
            installedUpgrades.filter((u) => u.shipId === currentShip.id).length / Math.max(1, currentShip.attachmentPoints.length)
        )
        : 0

    return (
        <>
            {/* Dock light shafts toward waterline for low-angle/underwater reads */}
            <VolumetricLightCone
                type="spot"
                position={[-30, -1, 10]}
                target={[-30, -7, 10]}
                color="#35b8ff"
                intensity={0.24 * scale}
                angle={Math.PI / 7}
                distance={14}
            />
            <VolumetricLightCone
                type="spot"
                position={[30, -1, 10]}
                target={[30, -7, 10]}
                color="#35b8ff"
                intensity={0.24 * scale}
                angle={Math.PI / 7}
                distance={14}
            />

            {/* Crane hook working beam into water/ship deck vicinity */}
            <VolumetricLightCone
                type="spot"
                position={[spreaderPos.x, spreaderPos.y + 0.6, spreaderPos.z]}
                target={[spreaderPos.x, spreaderPos.y - 5, spreaderPos.z]}
                color="#ffd79e"
                intensity={0.22 * scale}
                angle={Math.PI / 5}
                distance={16}
            />

            {/* Bright ship source, stronger after upgrades */}
            {currentShip && (
                <VolumetricLightCone
                    type="spot"
                    position={[currentShip.position[0], currentShip.position[1] + 7, currentShip.position[2]]}
                    target={[currentShip.position[0], currentShip.position[1] - 2, currentShip.position[2]]}
                    color={currentShip.type === 'tanker' ? '#ff8b45' : '#7fd6ff'}
                    intensity={(0.18 + progress * 0.3) * scale}
                    angle={Math.PI / 6}
                    distance={18}
                />
            )}

            {/* Tanker flare stack ray */}
            {currentShip?.type === 'tanker' && (
                <VolumetricLightCone
                    type="spot"
                    position={[currentShip.position[0] - 2.5, currentShip.position[1] + 9.5, currentShip.position[2] - currentShip.length * 0.22]}
                    target={[currentShip.position[0] - 1.5, currentShip.position[1] - 3, currentShip.position[2] - currentShip.length * 0.05]}
                    color="#ff7d38"
                    intensity={(0.26 + progress * 0.34) * scale}
                    angle={Math.PI / 8}
                    distance={20}
                />
            )}
        </>
    )
}

export function SpectatorNightCinematicEffects({
    isNight,
    lightIntensity,
    spectatorState,
    ships,
    spectatorAngleRef,
}: {
    isNight: boolean
    lightIntensity: number
    spectatorState: { isActive: boolean; targetShipId: string | null; startTime: number; duration: number }
    ships: Ship[]
    spectatorAngleRef: React.MutableRefObject<number>
}) {
    const keyLightRef = useRef<THREE.SpotLight>(null)
    const keyTargetRef = useRef<THREE.Object3D>(null)
    const boostRef = useRef(0)
    const rayPrimaryRef = useRef<THREE.Mesh>(null)
    const raySecondaryRef = useRef<THREE.Mesh>(null)

    const primaryRayMaterial = useMemo(() => buildGodRayMaterial(), [])
    const secondaryRayMaterial = useMemo(() => buildGodRayMaterial(), [])

    useEffect(() => {
        primaryRayMaterial.uniforms.uColor.value = new THREE.Color('#8bd4ff')
        secondaryRayMaterial.uniforms.uColor.value = new THREE.Color('#ffb572')
        if (keyLightRef.current && keyTargetRef.current) {
            keyLightRef.current.target = keyTargetRef.current
        }
        return () => {
            primaryRayMaterial.dispose()
            secondaryRayMaterial.dispose()
        }
    }, [primaryRayMaterial, secondaryRayMaterial])

    useFrame((state) => {
        const targetShip = spectatorState.targetShipId
            ? ships.find((s) => s.id === spectatorState.targetShipId)
            : undefined
        const enabled = isNight && spectatorState.isActive && !!targetShip
        const beat = lightingSystem.getBeatPulse()
        const nowSec = Date.now() / 1000

        const duration = Math.max(1, spectatorState.duration || 10)
        const elapsed = enabled ? Math.max(0, nowSec - spectatorState.startTime / 1000) : 0
        const fadeIn = THREE.MathUtils.clamp(elapsed / 1.25, 0, 1)
        const fadeOut = THREE.MathUtils.clamp((duration - elapsed) / 1.5, 0, 1)
        const targetBoost = enabled
            ? fadeIn * fadeOut * (0.75 + beat * 0.3) * Math.max(0.25, lightIntensity / 1.5)
            : 0
        boostRef.current = THREE.MathUtils.lerp(boostRef.current, targetBoost, 0.08)

        const boost = boostRef.current
        if (!targetShip) {
            if (keyLightRef.current) keyLightRef.current.intensity = 0
            primaryRayMaterial.uniforms.uIntensity.value = 0
            secondaryRayMaterial.uniforms.uIntensity.value = 0
            return
        }

        const shipPos = targetShip.position
        const orbitAhead = spectatorAngleRef.current + Math.PI / 5
        const orbitRadius = Math.max(12, targetShip.length * 0.7)
        const shimmer = 0.85 + Math.sin(state.clock.elapsedTime * 0.55) * 0.15

        if (keyLightRef.current) {
            keyLightRef.current.position.set(
                shipPos[0] + Math.cos(orbitAhead) * orbitRadius,
                shipPos[1] + 8 + Math.sin(state.clock.elapsedTime * 0.3) * 0.5,
                shipPos[2] + Math.sin(orbitAhead) * orbitRadius
            )
            if (keyTargetRef.current) {
                keyTargetRef.current.position.set(shipPos[0], shipPos[1] + 3.2, shipPos[2])
                keyTargetRef.current.updateMatrixWorld()
            }
            keyLightRef.current.intensity = 1.8 * boost * shimmer
            keyLightRef.current.distance = 34
            keyLightRef.current.angle = Math.PI / 6
        }

        if (rayPrimaryRef.current) {
            rayPrimaryRef.current.position.set(shipPos[0], shipPos[1] + 8.5, shipPos[2] - targetShip.length * 0.12)
            rayPrimaryRef.current.rotation.set(0.14, orbitAhead, 0.18)
        }
        if (raySecondaryRef.current) {
            raySecondaryRef.current.position.set(
                shipPos[0] + Math.cos(orbitAhead + 0.8) * 3.8,
                shipPos[1] + 6.8,
                shipPos[2] + Math.sin(orbitAhead + 0.8) * 3.8
            )
            raySecondaryRef.current.rotation.set(0.22, orbitAhead + 0.9, -0.16)
        }

        primaryRayMaterial.uniforms.uIntensity.value = 0.8 * boost * (0.85 + beat * 0.2)
        secondaryRayMaterial.uniforms.uIntensity.value = 0.52 * boost * (0.8 + beat * 0.15)
        updateGodRay(primaryRayMaterial, state.clock.elapsedTime)
        updateGodRay(secondaryRayMaterial, state.clock.elapsedTime + 0.65)
    })

    return (
        <>
            <object3D ref={keyTargetRef} />
            <spotLight
                ref={keyLightRef}
                color="#ffd7a6"
                intensity={0}
                angle={Math.PI / 6}
                penumbra={0.55}
                distance={32}
                decay={2}
            />

            <mesh ref={rayPrimaryRef}>
                <coneGeometry args={[2.1, 16, 18, 1, true]} />
                <primitive object={primaryRayMaterial} attach="material" />
            </mesh>
            <mesh ref={raySecondaryRef}>
                <coneGeometry args={[1.55, 13, 14, 1, true]} />
                <primitive object={secondaryRayMaterial} attach="material" />
            </mesh>
        </>
    )
}
