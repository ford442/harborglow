// =============================================================================
// SEA EVENTS SCENE COMPONENT - HarborGlow
// Renders scientifically-accurate ocean phenomena
//
// Events:
// 1. Milky Seas - Vibrio harveyi bacterial bioluminescence via quorum sensing
// 2. Whale Migration - Seasonal Megaptera novaeangliae movements
// 3. Shark Patrol - Carcharodon carcharias coastal hunting patterns
// 4. Meteor Shower - Celestial debris trails
// 5. Bioluminescent Bloom - Dinoflagellate flashing displays
// =============================================================================

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { seaEventsSystem, EVENT_SPECS } from '../systems/seaEventsSystem'

// -------------------------------------------------------------------------
// MILKY SEAS - Vibrio harveyi bacterial bioluminescence
// Massive steady glow caused by quorum sensing at 10^8 cells/ml
// Can span 100,000+ km², visible from space
// -------------------------------------------------------------------------
function MilkySeasEffect() {
    const meshRef = useRef<THREE.Mesh>(null)
    const event = useGameStore((state) => state.activeSeaEvent)
    
    const material = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: '#aaffcc',
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        })
    }, [])
    
    useFrame((state) => {
        if (!meshRef.current || !event) return
        
        // Pulsing bacterial glow
        const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 + 0.9
        const opacity = event.intensity * 0.4 * pulse
        material.opacity = opacity
        
        // Slow drift
        meshRef.current.rotation.z = state.clock.elapsedTime * 0.02
    })
    
    if (!event || event.type !== 'milky_seas') return null
    
    return (
        <mesh ref={meshRef} position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[800, 800, 32, 32]} />
            <primitive object={material} attach="material" />
        </mesh>
    )
}

// -------------------------------------------------------------------------
// METEOR SHOWER - Celestial debris entering atmosphere
// Creates streaks of light across the night sky
// -------------------------------------------------------------------------
function MeteorShowerEffect() {
    const groupRef = useRef<THREE.Group>(null)
    const event = useGameStore((state) => state.activeSeaEvent)
    
    const meteors = useMemo(() => {
        return Array.from({ length: 15 }, (_, i) => ({
            id: i,
            startX: (Math.random() - 0.5) * 400,
            startY: 100 + Math.random() * 50,
            startZ: -200 - Math.random() * 200,
            speed: 50 + Math.random() * 100,
            angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
            delay: Math.random() * 5,
            duration: 0.5 + Math.random() * 0.5
        }))
    }, [])
    
    useFrame((state) => {
        if (!groupRef.current || !event) return
        
        const time = state.clock.elapsedTime
        
        groupRef.current.children.forEach((child, i) => {
            const meteor = meteors[i]
            const localTime = (time + meteor.delay) % 6
            
            if (localTime < meteor.duration) {
                const progress = localTime / meteor.duration
                child.position.x = meteor.startX - Math.cos(meteor.angle) * progress * meteor.speed
                child.position.y = meteor.startY - Math.sin(meteor.angle) * progress * meteor.speed
                child.position.z = meteor.startZ
                child.visible = true
                
                // Fade out trail
                const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
                material.opacity = (1 - progress) * event.intensity
            } else {
                child.visible = false
            }
        })
    })
    
    if (!event || event.type !== 'meteor_shower') return null
    
    return (
        <group ref={groupRef}>
            {meteors.map((meteor) => (
                <mesh key={meteor.id} visible={false} rotation={[0, 0, meteor.angle]}>
                    <cylinderGeometry args={[0.5, 0.1, 20, 8]} />
                    <meshBasicMaterial 
                        color="#ffffff" 
                        transparent 
                        opacity={1}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            ))}
        </group>
    )
}

// -------------------------------------------------------------------------
// BIOLUMINESCENT BLOOM - Dinoflagellate flashing display
// Mechanical stimulation causes scintillon-mediated flash
// Individual flashes vs steady bacterial glow of milky seas
// -------------------------------------------------------------------------
function BioluminescentBloomEffect() {
    const groupRef = useRef<THREE.Group>(null)
    const event = useGameStore((state) => state.activeSeaEvent)
    const ships = useGameStore((state) => state.ships)
    
    const sparkles = useMemo(() => {
        return Array.from({ length: 100 }, (_, i) => ({
            id: i,
            baseX: (Math.random() - 0.5) * 200,
            baseZ: (Math.random() - 0.5) * 200,
            phase: Math.random() * Math.PI * 2,
            flashDuration: 0.1 + Math.random() * 0.2
        }))
    }, [])
    
    useFrame((state) => {
        if (!groupRef.current || !event) return
        
        const time = state.clock.elapsedTime
        
        groupRef.current.children.forEach((child, i) => {
            const sparkle = sparkles[i]
            const mesh = child as THREE.Mesh
            
            // Check if any ship is nearby to trigger flash
            let triggerFlash = false
            for (const ship of ships) {
                const dist = Math.sqrt(
                    Math.pow(ship.position[0] - sparkle.baseX, 2) +
                    Math.pow(ship.position[2] - sparkle.baseZ, 2)
                )
                if (dist < 30) {
                    triggerFlash = true
                    break
                }
            }
            
            // Random flashing + disturbance response
            const flashTrigger = triggerFlash || Math.sin(time * 3 + sparkle.phase) > 0.98
            const material = mesh.material as THREE.MeshBasicMaterial
            
            if (flashTrigger) {
                material.opacity = event.intensity * (0.5 + Math.random() * 0.5)
                mesh.scale.setScalar(1.5)
            } else {
                material.opacity *= 0.95
                mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
            }
            
            // Gentle drift
            mesh.position.x = sparkle.baseX + Math.sin(time * 0.2 + sparkle.phase) * 5
            mesh.position.z = sparkle.baseZ + Math.cos(time * 0.15 + sparkle.phase) * 5
        })
    })
    
    if (!event || event.type !== 'bioluminescent_bloom') return null
    
    return (
        <group ref={groupRef}>
            {sparkles.map((sparkle) => (
                <mesh key={sparkle.id} position={[sparkle.baseX, -1, sparkle.baseZ]}>
                    <sphereGeometry args={[0.3, 6, 6]} />
                    <meshBasicMaterial 
                        color="#00ffff" 
                        transparent 
                        opacity={0}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            ))}
        </group>
    )
}

// -------------------------------------------------------------------------
// EVENT NOTIFICATION UI - Shows current sea event info
// -------------------------------------------------------------------------
function EventNotification() {
    const event = useGameStore((state) => state.activeSeaEvent)
    
    if (!event || event.type === 'none') return null
    
    const spec = EVENT_SPECS[event.type]
    const progress = seaEventsSystem.getEventProgress()
    const remaining = seaEventsSystem.getRemainingTime()
    
    return (
        <div style={{
            position: 'absolute',
            top: '100px',
            right: '20px',
            background: 'rgba(0,20,40,0.9)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid #00aaff',
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            zIndex: 100,
            maxWidth: '280px',
            backdropFilter: 'blur(10px)'
        }}>
            <div style={{ 
                fontSize: '12px', 
                textTransform: 'uppercase', 
                letterSpacing: '2px',
                color: '#00aaff',
                marginBottom: '8px'
            }}>
                🌊 Sea Event Active
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                {spec.name}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px' }}>
                {spec.description}
            </div>
            
            {/* Scientific cause */}
            <div style={{ 
                fontSize: '10px', 
                color: '#888',
                fontStyle: 'italic',
                marginBottom: '12px',
                padding: '8px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '4px'
            }}>
                🔬 {spec.scientificCause}
            </div>
            
            {/* Progress bar */}
            <div style={{ 
                height: '4px', 
                background: '#333', 
                borderRadius: '2px',
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: `${(1 - progress) * 100}%`,
                    background: 'linear-gradient(90deg, #00aaff, #00ffaa)',
                    transition: 'width 1s linear'
                }} />
            </div>
            
            <div style={{ 
                fontSize: '11px', 
                color: '#888', 
                marginTop: '4px',
                textAlign: 'right'
            }}>
                {Math.floor(remaining / 60)}m {Math.floor(remaining % 60)}s remaining
            </div>
        </div>
    )
}

// -------------------------------------------------------------------------
// MAIN SEA EVENTS COMPONENT
// -------------------------------------------------------------------------
export default function SeaEvents() {
    return (
        <>
            {/* Visual Effects */}
            <MilkySeasEffect />
            <MeteorShowerEffect />
            <BioluminescentBloomEffect />
            
            {/* UI Notification - DISABLED (renders HTML, use outside Canvas) */}
            {/* <EventNotification /> */}
        </>
    )
}

export { MilkySeasEffect, MeteorShowerEffect, BioluminescentBloomEffect, EventNotification }
