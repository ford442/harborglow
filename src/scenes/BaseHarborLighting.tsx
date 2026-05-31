// =============================================================================
// BASE HARBOR LIGHTING
// Always-on welcome lighting for docks, crane, and idle berths.
// Keeps the harbor feeling premium on first load, while staying cheap and
// heavily dimmed in storm/fog conditions.
// =============================================================================

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useGameStore } from '../store/useGameStore'

const WELCOME_BERTHS: Array<[number, number, number]> = [
    [-28, -0.15, 7.2],
    [0, -0.15, 7.2],
    [28, -0.15, 7.2],
]

export default function BaseHarborLighting() {
    const timeOfDay = useGameStore((s) => s.timeOfDay)
    const weather = useGameStore((s) => s.weather)
    const stormIntensity = useGameStore((s) => s.stormIntensity)
    const lightIntensity = useGameStore((s) => s.lightIntensity)

    const {
        'Base Light Level': baseLightLevel,
        'Night Glow Strength': nightGlowStrength,
        'Welcome Lights': welcomeLights,
    } = useControls({
        'Base Light Level': { value: 1.15, min: 0.6, max: 1.8, step: 0.05, folder: 'Harbor Ambiance' },
        'Night Glow Strength': { value: 1.25, min: 0.5, max: 2.2, step: 0.05, folder: 'Harbor Ambiance' },
        'Welcome Lights': { value: 1, min: 0, max: 2, step: 0.05, folder: 'Harbor Ambiance' },
    }) as {
        'Base Light Level': number
        'Night Glow Strength': number
        'Welcome Lights': number
    }

    const dockEdgeRefs = useRef<THREE.PointLight[]>([])
    const craneWarmRefs = useRef<THREE.PointLight[]>([])
    const berthRefs = useRef<THREE.PointLight[]>([])
    const emissiveRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([])

    const nightBlend = useMemo(() => {
        if (timeOfDay >= 22 || timeOfDay <= 5) return 1
        if (timeOfDay >= 20 && timeOfDay < 22) return (timeOfDay - 20) / 2
        if (timeOfDay > 5 && timeOfDay < 8) return (8 - timeOfDay) / 3
        if (timeOfDay > 18 && timeOfDay < 20) return (timeOfDay - 18) / 2
        return 0
    }, [timeOfDay])

    useFrame((state) => {
        const t = state.clock.elapsedTime
        const breath = 0.88 + Math.sin(t / 28) * 0.12
        const weatherDim = weather === 'storm' ? 0.18 : weather === 'fog' ? 0.42 : weather === 'rain' ? 0.72 : 1
        const stormDim = 1 - stormIntensity * 0.68
        const dayGlow = 0.35 + nightBlend * 0.95
        const base = lightIntensity * baseLightLevel * breath * weatherDim * stormDim * dayGlow
        const nightBoost = nightGlowStrength * (0.35 + nightBlend * 1.15)
        const berthBoost = welcomeLights * (0.2 + nightBlend * 0.75)

        dockEdgeRefs.current.forEach((light, i) => {
            if (!light) return
            light.intensity = 1.2 * base * nightBoost * (0.9 + Math.sin(t * 0.18 + i) * 0.05)
        })

        craneWarmRefs.current.forEach((light, i) => {
            if (!light) return
            light.intensity = 0.95 * base * nightBoost * (0.92 + Math.sin(t * 0.14 + i * 1.5) * 0.04)
        })

        berthRefs.current.forEach((light, i) => {
            if (!light) return
            light.intensity = 0.55 * base * berthBoost * (0.94 + Math.sin(t * 0.11 + i * 2) * 0.05)
        })

        emissiveRefs.current.forEach((mat, i) => {
            if (!mat) return
            const emissive = 0.05 + base * (0.06 + nightBlend * 0.08) + (i % 2 === 0 ? berthBoost * 0.04 : nightBoost * 0.03)
            mat.emissive.set(i % 3 === 0 ? '#84c8ff' : '#ffbb77')
            mat.emissiveIntensity = emissive
        })
    })

    return (
        <group>
            {/* Dock edge markers: always-on navigation glow, dimmed hard in bad weather. */}
            {[-34, -18, 0, 18, 34].map((x, i) => (
                <group key={`base-edge-${i}`}>
                    <pointLight
                        ref={(ref) => { if (ref) dockEdgeRefs.current[i] = ref }}
                        position={[x, 2.55, -4.2]}
                        color="#9ed7ff"
                        intensity={1}
                        distance={18}
                        decay={2}
                    />
                    <mesh position={[x, 2.2, -4.2]}>
                        <sphereGeometry args={[0.09, 8, 8]} />
                        <meshStandardMaterial
                            ref={(ref) => { emissiveRefs.current[i] = ref }}
                            color="#1d2a36"
                            emissive="#84c8ff"
                            emissiveIntensity={0.12}
                            roughness={0.7}
                        />
                    </mesh>
                </group>
            ))}

            {/* Crane welcome glow: warm cabin + boom safety read without overpowering the scene. */}
            <pointLight
                ref={(ref) => { if (ref) craneWarmRefs.current[0] = ref }}
                position={[-10, 16.2, 4.8]}
                color="#ffd39a"
                intensity={1}
                distance={22}
                decay={2}
            />
            <pointLight
                ref={(ref) => { if (ref) craneWarmRefs.current[1] = ref }}
                position={[10, 17.4, 5.2]}
                color="#ffb36a"
                intensity={1}
                distance={20}
                decay={2}
            />
            <mesh position={[-10, 16.1, 4.8]}>
                <boxGeometry args={[1.2, 0.8, 0.5]} />
                <meshStandardMaterial
                    ref={(ref) => { emissiveRefs.current[20] = ref }}
                    color="#2a2433"
                    emissive="#ffb36a"
                    emissiveIntensity={0.08}
                />
            </mesh>

            {/* Welcome lights on the three starting berths: tiny lingering rig markers. */}
            {WELCOME_BERTHS.map((pos, i) => (
                <group key={`welcome-berth-${i}`}>
                    <pointLight
                        ref={(ref) => { if (ref) berthRefs.current[i] = ref }}
                        position={pos}
                        color={i % 2 === 0 ? '#8fd7ff' : '#ffb873'}
                        intensity={1}
                        distance={16}
                        decay={2}
                    />
                    <mesh position={[pos[0], pos[1] + 0.15, pos[2]]}>
                        <sphereGeometry args={[0.12, 8, 8]} />
                        <meshStandardMaterial
                            ref={(ref) => { emissiveRefs.current[30 + i] = ref }}
                            color="#1f2630"
                            emissive={i % 2 === 0 ? '#8fd7ff' : '#ffb873'}
                            emissiveIntensity={0.18}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    )
}
