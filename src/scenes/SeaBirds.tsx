// =============================================================================
// SEA BIRDS - HarborGlow Bay Atmosphere
// California coastal birds: gulls, pelicans, cormorants, terns
// Perched on cranes, flying formations, diving for fish
// =============================================================================

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// =============================================================================
// TYPES
// =============================================================================

interface BirdProps {
    position: [number, number, number]
    type: 'gull' | 'pelican' | 'cormorant' | 'tern'
    behavior: 'perched' | 'flying' | 'diving' | 'soaring'
    perchTarget?: [number, number, number]
}

interface SeaBirdsProps {
    isNight: boolean
    cranePositions: [number, number, number][]
}

// =============================================================================
// INDIVIDUAL BIRD COMPONENT
// =============================================================================

function Bird({ position, type, behavior, perchTarget }: BirdProps) {
    const birdRef = useRef<THREE.Group>(null)
    const wingsRef = useRef<THREE.Group>(null)
    const startTime = useMemo(() => Math.random() * 100, [])
    
    useFrame((state) => {
        if (!birdRef.current) return
        
        const time = state.clock.elapsedTime + startTime
        const delta = state.clock.getDelta()
        
        switch (behavior) {
            case 'flying': {
                // Gull-like flight pattern - soaring with wing beats
                const flyRadius = 30 + Math.random() * 20
                const flySpeed = 0.3 + Math.random() * 0.2
                const height = position[1] + Math.sin(time * 0.5) * 5
                
                birdRef.current.position.x = position[0] + Math.cos(time * flySpeed) * flyRadius
                birdRef.current.position.y = Math.max(5, height)
                birdRef.current.position.z = position[2] + Math.sin(time * flySpeed) * flyRadius
                birdRef.current.rotation.y = -time * flySpeed + Math.PI / 2
                
                // Banking in turns
                birdRef.current.rotation.z = Math.cos(time * flySpeed) * 0.3
                
                // Wing flapping
                if (wingsRef.current) {
                    const flapSpeed = type === 'tern' ? 15 : 8
                    const flapAmp = type === 'pelican' ? 0.3 : 0.6
                    wingsRef.current.rotation.z = Math.sin(time * flapSpeed) * flapAmp
                }
                break
            }
                
            case 'soaring': {
                // Pelican-style soaring in circles
                const soarRadius = 50 + Math.random() * 30
                const soarSpeed = 0.15
                const soarHeight = 40 + Math.sin(time * 0.2) * 10
                
                birdRef.current.position.x = Math.cos(time * soarSpeed) * soarRadius
                birdRef.current.position.y = soarHeight
                birdRef.current.position.z = Math.sin(time * soarSpeed) * soarRadius
                birdRef.current.rotation.y = -time * soarSpeed
                
                // Minimal wing movement when soaring
                if (wingsRef.current) {
                    wingsRef.current.rotation.z = Math.sin(time * 2) * 0.1
                }
                break
            }
                
            case 'perched':
                // Stationary with slight head movements
                if (perchTarget) {
                    birdRef.current.position.set(...perchTarget)
                    birdRef.current.rotation.y = Math.sin(time * 0.5) * 0.3
                    
                    // Subtle body shift
                    birdRef.current.rotation.z = Math.sin(time * 0.3) * 0.05
                }
                
                if (wingsRef.current) {
                    wingsRef.current.rotation.z = 0  // Wings folded
                }
                break
                
            case 'diving': {
                // Tern-style dive for fish
                const diveCycle = (time * 0.5) % (Math.PI * 2)
                const diveX = position[0] + Math.cos(diveCycle) * 10
                const diveY = Math.max(2, 20 - Math.abs(Math.sin(diveCycle)) * 25)
                const diveZ = position[2] + Math.sin(diveCycle * 0.5) * 15
                
                birdRef.current.position.set(diveX, diveY, diveZ)
                birdRef.current.rotation.x = Math.sin(diveCycle) * 0.8  // Point down when diving
                
                if (wingsRef.current) {
                    // Wings swept back in dive
                    wingsRef.current.rotation.z = Math.PI * 0.4
                }
                break
            }
        }
    })
    
    // Bird geometry based on type
    const birdColor = useMemo(() => {
        switch (type) {
            case 'gull': return '#f0f0f0'
            case 'pelican': return '#e8ddd0'
            case 'cormorant': return '#2a2a2a'
            case 'tern': return '#ffffff'
        }
    }, [type])
    
    const wingSpan = useMemo(() => {
        switch (type) {
            case 'gull': return 1.2
            case 'pelican': return 2.5
            case 'cormorant': return 1.0
            case 'tern': return 0.8
        }
    }, [type])
    
    const bodyLength = wingSpan * 0.4
    
    return (
        <group ref={birdRef} position={position}>
            {/* Body */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.08 * wingSpan, bodyLength, 4, 8]} />
                <meshStandardMaterial color={birdColor} />
            </mesh>
            
            {/* Head */}
            <mesh position={[bodyLength * 0.4, 0.1, 0]}>
                <sphereGeometry args={[0.1 * wingSpan, 8, 8]} />
                <meshStandardMaterial color={birdColor} />
            </mesh>
            
            {/* Beak */}
            <mesh position={[bodyLength * 0.5 + 0.1, 0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.03 * wingSpan, 0.3 * wingSpan, 8]} />
                <meshStandardMaterial color={type === 'tern' ? '#ff6600' : '#ffaa00'} />
            </mesh>
            
            {/* Wings */}
            <group ref={wingsRef}>
                {/* Left wing */}
                <mesh position={[0, 0, wingSpan * 0.4]}>
                    <boxGeometry args={[bodyLength * 0.6, 0.02, wingSpan * 0.6]} />
                    <meshStandardMaterial color={birdColor} />
                </mesh>
                {/* Right wing */}
                <mesh position={[0, 0, -wingSpan * 0.4]}>
                    <boxGeometry args={[bodyLength * 0.6, 0.02, wingSpan * 0.6]} />
                    <meshStandardMaterial color={birdColor} />
                </mesh>
            </group>
            
            {/* Tail */}
            <mesh position={[-bodyLength * 0.4, 0, 0]}>
                <boxGeometry args={[0.3 * wingSpan, 0.02, 0.4 * wingSpan]} />
                <meshStandardMaterial color={type === 'tern' ? '#666' : birdColor} />
            </mesh>
        </group>
    )
}

// =============================================================================
// PERCHED BIRD (simplified for crane decoration)
// =============================================================================

function PerchedBird({ position, type }: { position: [number, number, number]; type: 'gull' | 'cormorant' }) {
    const birdRef = useRef<THREE.Group>(null)
    
    useFrame((state) => {
        if (!birdRef.current) return
        const time = state.clock.elapsedTime
        
        // Subtle movements
        birdRef.current.rotation.y = Math.sin(time * 0.5) * 0.2
        birdRef.current.position.y = position[1] + Math.sin(time * 2) * 0.02
    })
    
    const color = type === 'gull' ? '#f0f0f0' : '#1a1a1a'
    
    return (
        <group ref={birdRef} position={position}>
            {/* Body */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
                <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Head */}
            <mesh position={[0.25, 0.08, 0]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Beak */}
            <mesh position={[0.35, 0.08, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.02, 0.12, 8]} />
                <meshStandardMaterial color="#ffaa00" />
            </mesh>
            
            {/* Folded wings */}
            <mesh position={[0, 0.05, 0.15]} rotation={[0, 0, 0.3]}>
                <boxGeometry args={[0.3, 0.03, 0.2]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, 0.05, -0.15]} rotation={[0, 0, -0.3]}>
                <boxGeometry args={[0.3, 0.03, 0.2]} />
                <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Legs */}
            <mesh position={[-0.05, -0.15, 0.05]}>
                <cylinderGeometry args={[0.01, 0.01, 0.15]} />
                <meshStandardMaterial color="#ff6600" />
            </mesh>
            <mesh position={[-0.05, -0.15, -0.05]}>
                <cylinderGeometry args={[0.01, 0.01, 0.15]} />
                <meshStandardMaterial color="#ff6600" />
            </mesh>
        </group>
    )
}

// =============================================================================
// BIRD FORMATION (flying in V-shape)
// =============================================================================

function BirdFormation({ 
    centerPosition, 
    birdCount = 7,
    isNight 
}: { 
    centerPosition: [number, number, number]
    birdCount?: number
    isNight: boolean
}) {
    const formationRef = useRef<THREE.Group>(null)
    
    useFrame((state) => {
        if (!formationRef.current || isNight) return
        
        const time = state.clock.elapsedTime
        const speed = 0.2
        
        // Formation drifts across the sky
        formationRef.current.position.x = centerPosition[0] + Math.cos(time * speed) * 80
        formationRef.current.position.y = centerPosition[1] + Math.sin(time * speed * 0.3) * 10
        formationRef.current.position.z = centerPosition[2] + Math.sin(time * speed) * 40
        formationRef.current.rotation.y = -time * speed + Math.PI / 2
    })
    
    // Generate V-formation positions
    const birdPositions = useMemo(() => {
        const positions: [number, number, number][] = []
        const leaderPos: [number, number, number] = [0, 0, 0]
        positions.push(leaderPos)
        
        const wingCount = Math.floor((birdCount - 1) / 2)
        for (let i = 1; i <= wingCount; i++) {
            // Left wing
            positions.push([-i * 0.8, -i * 0.2, i * 1.5])
            // Right wing
            positions.push([-i * 0.8, -i * 0.2, -i * 1.5])
        }
        
        return positions.slice(0, birdCount)
    }, [birdCount])
    
    if (isNight) return null  // Birds don't fly in formation at night
    
    return (
        <group ref={formationRef} position={centerPosition}>
            {birdPositions.map((pos, i) => (
                <Bird
                    key={i}
                    position={pos}
                    type="gull"
                    behavior="flying"
                />
            ))}
        </group>
    )
}

// =============================================================================
// MAIN SEA BIRDS COMPONENT
// =============================================================================

export default function SeaBirds({ isNight, cranePositions }: SeaBirdsProps) {
    // Generate random flying birds
    const flyingBirds = useMemo(() => {
        const birds: { position: [number, number, number]; type: 'gull' | 'pelican' | 'tern'; behavior: 'flying' | 'soaring' | 'diving' }[] = []
        
        // Gulls - most common, flying near the port
        for (let i = 0; i < 12; i++) {
            birds.push({
                position: [
                    (Math.random() - 0.5) * 150,
                    15 + Math.random() * 25,
                    (Math.random() - 0.5) * 100
                ],
                type: 'gull',
                behavior: 'flying'
            })
        }
        
        // Pelicans - soaring higher
        for (let i = 0; i < 4; i++) {
            birds.push({
                position: [
                    (Math.random() - 0.5) * 200,
                    40 + Math.random() * 30,
                    (Math.random() - 0.5) * 150
                ],
                type: 'pelican',
                behavior: 'soaring'
            })
        }
        
        // Terns - diving for fish
        for (let i = 0; i < 3; i++) {
            birds.push({
                position: [
                    (Math.random() - 0.5) * 100,
                    20,
                    (Math.random() - 0.5) * 80
                ],
                type: 'tern',
                behavior: 'diving'
            })
        }
        
        return birds
    }, [])
    
    // Generate perched birds on cranes
    const perchedBirds = useMemo(() => {
        const birds: { position: [number, number, number]; type: 'gull' | 'cormorant' }[] = []
        
        cranePositions.forEach(cranePos => {
            // 30% chance of birds per crane
            if (Math.random() > 0.3) {
                const birdCount = 1 + Math.floor(Math.random() * 3)
                for (let i = 0; i < birdCount; i++) {
                    birds.push({
                        position: [
                            cranePos[0] + (Math.random() - 0.5) * 8,
                            cranePos[1] + 28 + Math.random() * 2,  // On top of crane
                            cranePos[2] + (Math.random() - 0.5) * 4
                        ],
                        type: Math.random() > 0.5 ? 'gull' : 'cormorant'
                    })
                }
            }
        })
        
        return birds
    }, [cranePositions])
    
    // Formation positions
    const formations = useMemo(() => [
        { position: [0, 50, -50] as [number, number, number], count: 7 },
        { position: [-80, 40, 30] as [number, number, number], count: 5 }
    ], [])
    
    return (
        <group>
            {/* Flying birds (not at night) */}
            {!isNight && flyingBirds.map((bird, i) => (
                <Bird
                    key={`flying-${i}`}
                    position={bird.position}
                    type={bird.type}
                    behavior={bird.behavior}
                />
            ))}
            
            {/* Perched birds */}
            {perchedBirds.map((bird, i) => (
                <PerchedBird
                    key={`perched-${i}`}
                    position={bird.position}
                    type={bird.type}
                />
            ))}
            
            {/* V-formations */}
            {formations.map((formation, i) => (
                <BirdFormation
                    key={`formation-${i}`}
                    centerPosition={formation.position}
                    birdCount={formation.count}
                    isNight={isNight}
                />
            ))}
        </group>
    )
}

// Export individual components
export { Bird, PerchedBird, BirdFormation }
