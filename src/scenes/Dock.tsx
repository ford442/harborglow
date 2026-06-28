import { useMemo, useRef, useEffect } from 'react'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAudioData } from '../systems/audioVisualSync'
import {
  buildDeckBoltTransforms,
  createHarborMaterial,
  useHarborEnvironment,
  useHarborMaterial,
} from './HarborPBRMaterials'

// =============================================================================
// DOCK COMPONENT
// Weather-reactive harbor geometry: procedural wood deck, worn steel, rubber fenders
// =============================================================================

interface DockProps {
    isNight?: boolean
}

const FENDER_X_POSITIONS = [-35, -25, -15, -5, 5, 15, 25, 35]
const FENDER_Z = 7.5
const FENDER_Y = -1.0

export default function Dock({ isNight = true }: DockProps) {
    const platformMat = useHarborMaterial('weatheredWood', {}, {
        day: '#8B4513',
        night: '#3d2817',
    })
    const deckMat = useHarborMaterial('weatheredWoodDeck', {}, {
        day: '#9a5c2e',
        night: '#4a3020',
    })
    const pierMat = useHarborMaterial('weatheredWood', { weathering: 0.72 }, {
        day: '#654321',
        night: '#2a1b0f',
    })
    const bollardMat = useHarborMaterial('corrodedSteel', { weathering: 0.82 })
    const bollardCapMat = useHarborMaterial('corrodedSteel', {
        baseColor: '#555555',
        roughness: 0.28,
        metalness: 0.88,
        weathering: 0.35,
    })
    const railMat = useHarborMaterial('railSteel', { weathering: 0.7 })
    const boltMat = useHarborMaterial('corrodedSteel', {
        baseColor: '#3a3a3a',
        roughness: 0.35,
        metalness: 0.85,
        weathering: 0.45,
    })

    const boltGeo = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 6), [])
    const boltMatrices = useMemo(() => buildDeckBoltTransforms(36), [])
    const boltsRef = useRef<THREE.InstancedMesh>(null)

    useEffect(() => {
        const mesh = boltsRef.current
        if (!mesh) return
        boltMatrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix))
        mesh.instanceMatrix.needsUpdate = true
    }, [boltMatrices])

    return (
        <>
        <RigidBody type="fixed" position={[0, -2, 0]}>
            <group>
                {/* Main dock platform */}
                <mesh position={[0, 0, 0]} receiveShadow castShadow>
                    <boxGeometry args={[80, 1, 15]} />
                    <primitive object={platformMat} attach="material" />
                </mesh>

                {/* Single procedural deck overlay (replaces 40 plank boxes) */}
                <mesh position={[0, 0.55, 0]} receiveShadow>
                    <boxGeometry args={[79.5, 0.05, 14.5]} />
                    <primitive object={deckMat} attach="material" />
                </mesh>

                {/* Bolt heads at plank seams */}
                <instancedMesh
                    ref={boltsRef}
                    args={[boltGeo, boltMat, boltMatrices.length]}
                    castShadow
                    receiveShadow
                />

                {/* Pier edge — ship contact scuffs via weathered wood shader */}
                <mesh position={[0, 1, -7]} castShadow receiveShadow>
                    <boxGeometry args={[80, 2, 1]} />
                    <primitive object={pierMat} attach="material" />
                </mesh>

                {/* Bollards (mooring posts) */}
                {[-30, -10, 10, 30].map((x, i) => (
                    <group key={`bollard-${i}`}>
                        <mesh position={[x, 1.5, -6]} castShadow>
                            <cylinderGeometry args={[0.3, 0.4, 1, 10]} />
                            <primitive object={bollardMat} attach="material" />
                        </mesh>
                        <mesh position={[x, 2.05, -6]} castShadow>
                            <cylinderGeometry args={[0.32, 0.32, 0.12, 10]} />
                            <primitive object={bollardCapMat} attach="material" />
                        </mesh>
                        <mesh position={[x, 2, -6]} rotation={[Math.PI / 2, 0, 0]}>
                            <torusGeometry args={[0.35, 0.1, 8, 16]} />
                            <primitive object={bollardCapMat} attach="material" />
                        </mesh>
                    </group>
                ))}

                {isNight && <DockLights />}

                <Pilings />

                {/* Crane rails */}
                <mesh position={[0, 0.3, 5]} castShadow receiveShadow>
                    <boxGeometry args={[70, 0.2, 0.5]} />
                    <primitive object={railMat} attach="material" />
                </mesh>
            </group>
        </RigidBody>

        <DockFenders />
        </>
    )
}

// =============================================================================
// DOCK FENDERS
// =============================================================================

function DockFenders() {
    const rubberMat = useHarborMaterial('wetRubber', { weathering: 0.55 })
    const stripeMat = useHarborMaterial('cautionStripe', { weathering: 0.68 })

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
                    <CylinderCollider args={[0.5, 0.5]} />
                    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.5, 0.5, 1.0, 14]} />
                        <primitive object={rubberMat} attach="material" />
                    </mesh>
                    <mesh rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.52, 0.52, 0.15, 14]} />
                        <primitive object={stripeMat} attach="material" />
                    </mesh>
                </RigidBody>
            ))}
        </>
    )
}

// =============================================================================
// DOCK LIGHTS
// =============================================================================

function DockLights() {
    const audioData = useAudioData()
    const env = useHarborEnvironment()
    const poleMat = useMemo(() => createHarborMaterial('corrodedSteel', { weathering: 0.6 }), [])
    const fixtureMat = useMemo(
        () => createHarborMaterial('corrodedSteel', { baseColor: '#333333', weathering: 0.5 }),
        []
    )

    useFrame((state) => {
        const wet = env.wetness
        poleMat.roughness = THREE.MathUtils.clamp(0.48 - wet * 0.15, 0.12, 0.95)
        fixtureMat.roughness = THREE.MathUtils.clamp(0.42 - wet * 0.12, 0.1, 0.95)
        const uniforms = poleMat.userData.harborUniforms as { uWetness?: { value: number } } | undefined
        if (uniforms?.uWetness) {
            uniforms.uWetness.value = wet
            const fixtureUniforms = fixtureMat.userData.harborUniforms as typeof uniforms
            if (fixtureUniforms?.uWetness) fixtureUniforms.uWetness.value = wet
        }
        if (poleMat.userData.harborUniforms) {
            ;(poleMat.userData.harborUniforms as { uTime: { value: number } }).uTime.value =
                state.clock.elapsedTime
        }
    })

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

    const currentIntensities = useRef<number[]>(lightPositions.map(l => l.intensity))
    const currentOpacities = useRef<number[]>(lightPositions.map(() => 0.05))
    const currentScales = useRef<number[]>(lightPositions.map(() => 1))
    const currentColors = useRef<THREE.Color[]>(lightPositions.map(l => new THREE.Color(l.color)))

    const baseColor = useMemo(() => new THREE.Color(), [])
    const targetColor = useMemo(() => new THREE.Color(), [])

    useFrame(() => {
        const reactive = audioData.energy > 0.1

        for (let i = 0; i < lightPositions.length; i++) {
            const light = lightPositions[i]

            const targetIntensity = reactive
                ? light.intensity + audioData.energy * 2 + (audioData.beat ? 2 : 0)
                : light.intensity
            const targetOpacity = reactive ? 0.05 + audioData.energy * 0.1 : 0.05
            const targetScale = reactive ? 1 + audioData.bass * 0.3 : 1

            baseColor.set(light.color)
            if (reactive && audioData.bass > 0.5) {
                targetColor.set('#ff8800')
                baseColor.lerp(targetColor, (audioData.bass - 0.5) * 2 * 0.6)
            }

            currentIntensities.current[i] = THREE.MathUtils.lerp(currentIntensities.current[i], targetIntensity, 0.1)
            currentOpacities.current[i] = THREE.MathUtils.lerp(currentOpacities.current[i], targetOpacity, 0.08)
            currentScales.current[i] = THREE.MathUtils.lerp(currentScales.current[i], targetScale, 0.1)
            currentColors.current[i].lerp(baseColor, 0.1)

            const pl = lightRefs.current[i]
            if (pl) {
                pl.intensity = currentIntensities.current[i]
                pl.color.copy(currentColors.current[i])
            }

            const cone = coneRefs.current[i]
            if (cone) {
                cone.scale.setScalar(currentScales.current[i])
            }

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
                    <mesh position={[light.x, 3, light.z]}>
                        <cylinderGeometry args={[0.2, 0.3, 0.5, 10]} />
                        <primitive object={fixtureMat} attach="material" />
                    </mesh>
                    <mesh position={[light.x, 1.5, light.z]}>
                        <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
                        <primitive object={poleMat} attach="material" />
                    </mesh>
                    <pointLight
                        ref={el => { lightRefs.current[i] = el }}
                        position={[light.x, 2.5, light.z]}
                        intensity={light.intensity}
                        color={light.color}
                        distance={25}
                        decay={2}
                        castShadow
                    />
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
// =============================================================================

function Pilings() {
    const pilingMat = useHarborMaterial('pilingTimber', { weathering: 0.78 })

    const pilingPositions = useMemo(() => [
        -38, -30, -20, -10, 0, 10, 20, 30, 38
    ], [])

    return (
        <>
            {pilingPositions.map((x, i) => (
                <group key={`piling-${i}`}>
                    <mesh position={[x, -2, 6]} castShadow>
                        <cylinderGeometry args={[0.4, 0.3, 6, 10]} />
                        <primitive object={pilingMat} attach="material" />
                    </mesh>
                    <mesh position={[x, -2, -6]} castShadow>
                        <cylinderGeometry args={[0.4, 0.3, 6, 10]} />
                        <primitive object={pilingMat} attach="material" />
                    </mesh>
                </group>
            ))}
        </>
    )
}
