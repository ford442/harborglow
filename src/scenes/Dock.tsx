import { useMemo, useRef } from 'react'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAudioData } from '../systems/audioVisualSync'

// =============================================================================
// DOCK COMPONENT
// Night dock with volumetric lighting effects
// =============================================================================

interface DockProps {
    isNight?: boolean
}

// Fender X positions spread evenly across the 80-unit dock face
const FENDER_X_POSITIONS = [-35, -25, -15, -5, 5, 15, 25, 35]
// World-space Z of the ship-facing dock edge (dock body at y=-2, platform at z=7.5)
const FENDER_Z = 7.5
const FENDER_Y = -1.0   // approximately at waterline

export default function Dock({ isNight = true }: DockProps) {
    // Wood texture-like colors
    const woodColor = isNight ? '#3d2817' : '#8B4513'
    const pierColor = isNight ? '#2a1b0f' : '#654321'

    return (
        <>
        <RigidBody type="fixed" position={[0, -2, 0]}>
            <group>
                {/* Main dock platform */}
                <mesh position={[0, 0, 0]} receiveShadow castShadow>
                    <boxGeometry args={[80, 1, 15]} />
                    <meshStandardMaterial 
                        color={woodColor} 
                        roughness={0.9} 
                        metalness={0.1}
                    />
                </mesh>

                {/* Wooden planks detail */}
                {Array.from({ length: 40 }, (_, i) => (
                    <mesh 
                        key={`plank-${i}`} 
                        position={[-39 + i * 2, 0.55, 0]}
                        receiveShadow
                    >
                        <boxGeometry args={[1.9, 0.05, 14.5]} />
                        <meshStandardMaterial 
                            color={i % 2 === 0 ? woodColor : adjustColor(woodColor, -10)}
                            roughness={0.95}
                        />
                    </mesh>
                ))}

                {/* Pier edge */}
                <mesh position={[0, 1, -7]} castShadow>
                    <boxGeometry args={[80, 2, 1]} />
                    <meshStandardMaterial 
                        color={pierColor} 
                        roughness={0.9}
                    />
                </mesh>

                {/* Bollards (mooring posts) */}
                {[-30, -10, 10, 30].map((x, i) => (
                    <group key={`bollard-${i}`}>
                        <mesh position={[x, 1.5, -6]} castShadow>
                            <cylinderGeometry args={[0.3, 0.4, 1, 8]} />
                            <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.4} />
                        </mesh>
                        <mesh position={[x, 2, -6]} rotation={[Math.PI / 2, 0, 0]}>
                            <torusGeometry args={[0.35, 0.1, 6, 12]} />
                            <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
                        </mesh>
                    </group>
                ))}

                {/* Dock lights */}
                {isNight && <DockLights />}

                {/* Pilings (support posts in water) */}
                <Pilings />

                {/* Crane rails */}
                <mesh position={[0, 0.3, 5]}>
                    <boxGeometry args={[70, 0.2, 0.5]} />
                    <meshStandardMaterial color="#666666" metalness={0.6} roughness={0.4} />
                </mesh>
            </group>
        </RigidBody>

        {/* Rubber fenders — separate fixed RigidBodies so they can carry their
            own restitution / friction independent of the main dock body.        */}
        <DockFenders />
        </>
    )
}

// =============================================================================
// DOCK FENDERS
// Fixed cylindrical Rapier colliders with high restitution + low friction.
// Positioned along the ship-facing water edge so hulls bounce and slide
// rather than stopping dead — the "Pachinko" docking effect.
// Restitution 0.65 → returns ~65% of kinetic energy elastically.
// Friction   0.05 → near-zero, lets the hull glide along the dock face.
// =============================================================================

function DockFenders() {
    return (
        <>
            {FENDER_X_POSITIONS.map((x, i) => (
                <RigidBody
                    key={`fender-${i}`}
                    type="fixed"
                    position={[x, FENDER_Y, FENDER_Z]}
                    restitution={0.65}
                    friction={0.05}
                >
                    {/* Physics collider */}
                    <CylinderCollider args={[0.5, 0.5]} />
                    {/* Visual rubber fender (dark cylinder lying on its side) */}
                    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.5, 0.5, 1.0, 12]} />
                        <meshStandardMaterial color="#1a1a1a" roughness={0.95} metalness={0.0} />
                    </mesh>
                    {/* Yellow stripe detail */}
                    <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.52, 0.52, 0.15, 12]} />
                        <meshStandardMaterial color="#ccaa00" roughness={0.8} metalness={0.1} />
                    </mesh>
                </RigidBody>
            ))}
        </>
    )
}

// =============================================================================
// DOCK LIGHTS
// Volumetric-style point lights with music reactivity for night atmosphere
// =============================================================================

function DockLights() {
    const audioData = useAudioData()

    const lightPositions = useMemo(() => [
        { x: -35, z: -4, color: '#ffaa44', intensity: 3 },
        { x: -15, z: -4, color: '#ffaa44', intensity: 3 },
        { x: 0, z: -4, color: '#ffaa44', intensity: 3 },
        { x: 15, z: -4, color: '#ffaa44', intensity: 3 },
        { x: 35, z: -4, color: '#ffaa44', intensity: 3 },
    ], [])

    const lightRefs = useRef<(THREE.PointLight | null)[]>(new Array(lightPositions.length).fill(null))
    const coneRefs = useRef<(THREE.Mesh | null)[]>(new Array(lightPositions.length).fill(null))
    const coneMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>(new Array(lightPositions.length).fill(null))

    // Smoothed state
    const currentIntensities = useRef<number[]>(lightPositions.map(l => l.intensity))
    const currentOpacities = useRef<number[]>(lightPositions.map(() => 0.05))
    const currentScales = useRef<number[]>(lightPositions.map(() => 1))
    const currentColors = useRef<THREE.Color[]>(lightPositions.map(l => new THREE.Color(l.color)))

    // Reusable color objects to avoid allocations in useFrame
    const baseColor = useMemo(() => new THREE.Color(), [])
    const targetColor = useMemo(() => new THREE.Color(), [])

    useFrame(() => {
        const reactive = audioData.energy > 0.1

        for (let i = 0; i < lightPositions.length; i++) {
            const light = lightPositions[i]

            // Target values based on audio
            const targetIntensity = reactive
                ? light.intensity + audioData.energy * 2 + (audioData.beat ? 2 : 0)
                : light.intensity
            const targetOpacity = reactive ? 0.05 + audioData.energy * 0.1 : 0.05
            const targetScale = reactive ? 1 + audioData.bass * 0.3 : 1

            // Color temperature shift toward amber when bass is high
            baseColor.set(light.color)
            if (reactive && audioData.bass > 0.5) {
                targetColor.set('#ff8800')
                baseColor.lerp(targetColor, (audioData.bass - 0.5) * 2 * 0.6)
            }

            // Smooth lerp toward targets
            currentIntensities.current[i] = THREE.MathUtils.lerp(currentIntensities.current[i], targetIntensity, 0.1)
            currentOpacities.current[i] = THREE.MathUtils.lerp(currentOpacities.current[i], targetOpacity, 0.08)
            currentScales.current[i] = THREE.MathUtils.lerp(currentScales.current[i], targetScale, 0.1)
            currentColors.current[i].lerp(baseColor, 0.1)

            // Apply to point lights
            const pl = lightRefs.current[i]
            if (pl) {
                pl.intensity = currentIntensities.current[i]
                pl.color.copy(currentColors.current[i])
            }

            // Apply to cone meshes (scale)
            const cone = coneRefs.current[i]
            if (cone) {
                cone.scale.setScalar(currentScales.current[i])
            }

            // Apply to cone materials (opacity + color)
            const mat = coneMatRefs.current[i]
            if (mat) {
                mat.opacity = currentOpacities.current[i]
                mat.color.copy(currentColors.current[i])
            }
        }
    })

    return (
        <>
            {lightPositions.map((light, i) => (
                <group key={`light-${i}`}>
                    {/* Light fixture */}
                    <mesh position={[light.x, 3, light.z]}>
                        <cylinderGeometry args={[0.2, 0.3, 0.5]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>
                    {/* Light pole */}
                    <mesh position={[light.x, 1.5, light.z]}>
                        <cylinderGeometry args={[0.1, 0.1, 3]} />
                        <meshStandardMaterial color="#444444" metalness={0.5} />
                    </mesh>
                    {/* Point light */}
                    <pointLight
                        ref={el => { lightRefs.current[i] = el }}
                        position={[light.x, 2.5, light.z]}
                        intensity={light.intensity}
                        color={light.color}
                        distance={25}
                        decay={2}
                        castShadow
                    />
                    {/* Fake volumetric cone */}
                    <mesh
                        ref={el => { coneRefs.current[i] = el }}
                        position={[light.x, 0.5, light.z]}
                    >
                        <coneGeometry args={[3, 4, 16, 1, true]} />
                        <meshBasicMaterial
                            ref={el => { coneMatRefs.current[i] = el }}
                            color={light.color}
                            transparent
                            opacity={0.05}
                            side={THREE.DoubleSide}
                            depthWrite={false}
                        />
                    </mesh>
                </group>
            ))}
        </>
    )
}

// =============================================================================
// PILINGS
// Support posts extending into water
// =============================================================================

function Pilings() {
    const pilingPositions = useMemo(() => [
        -38, -30, -20, -10, 0, 10, 20, 30, 38
    ], [])

    return (
        <>
            {pilingPositions.map((x, i) => (
                <group key={`piling-${i}`}>
                    {/* Front row */}
                    <mesh position={[x, -2, 6]}>
                        <cylinderGeometry args={[0.4, 0.3, 6, 8]} />
                        <meshStandardMaterial color="#4a3728" roughness={0.95} />
                    </mesh>
                    {/* Back row */}
                    <mesh position={[x, -2, -6]}>
                        <cylinderGeometry args={[0.4, 0.3, 6, 8]} />
                        <meshStandardMaterial color="#4a3728" roughness={0.95} />
                    </mesh>
                </group>
            ))}
        </>
    )
}

// =============================================================================
// HELPERS
// =============================================================================

function adjustColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, Math.max(0, (num >> 16) + amount))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`
}
