import React, { useRef } from 'react'
import * as THREE from 'three'
import { Box, Plane, Cylinder, Sphere } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

// =============================================================================
// CONTROL BOOTH MODELS - Booth geometry and structure
// =============================================================================

interface BoothRoomProps {
  materials: Record<string, THREE.Material>
}

export function BoothRoom({ materials }: BoothRoomProps) {
  return (
    <>
      {/* Floor - Metal grating look */}
      <Box args={[8, 0.1, 8]} position={[0, 0.05, 0]} receiveShadow>
        <meshStandardMaterial 
          color={0x1a1a20} 
          metalness={0.6}
          roughness={0.7}
        />
      </Box>
      
      {/* Floor detail - metal strips */}
      {Array.from({ length: 7 }, (_, i) => (
        <Box 
          key={`floor-strip-${i}`}
          args={[8, 0.02, 0.05]} 
          position={[0, 0.11, -3.5 + i]}
        >
          <meshStandardMaterial color={0x333333} metalness={0.8} roughness={0.4} />
        </Box>
      ))}
      
      {/* Ceiling */}
      <Box args={[8, 0.2, 8]} position={[0, 4.1, 0]} castShadow>
        <meshStandardMaterial 
          color={0x2a2a35}
          metalness={0.7}
          roughness={0.6}
        />
      </Box>
      
      {/* Ceiling lights */}
      <group position={[0, 3.95, 0]}>
        {[[-2, -2], [2, -2], [-2, 2], [2, 2]].map(([x, z], i) => (
          <group key={`ceiling-light-${i}`} position={[x, 0, z]}>
            <Box args={[0.8, 0.05, 0.8]}>
              <meshStandardMaterial 
                color={0xffffee} 
                emissive={0xffffee}
                emissiveIntensity={0.3}
              />
            </Box>
            <pointLight 
              position={[0, -0.5, 0]} 
              intensity={0.8} 
              color="#ffffee" 
              distance={6}
              decay={2}
            />
          </group>
        ))}
      </group>
      
      {/* Left Wall */}
      <Box args={[0.3, 4, 8]} position={[-3.85, 2, 0]} castShadow receiveShadow>
        <primitive object={materials.wall} attach="material" />
      </Box>
      
      {/* Right Wall */}
      <Box args={[0.3, 4, 8]} position={[3.85, 2, 0]} castShadow receiveShadow>
        <primitive object={materials.wall} attach="material" />
      </Box>
      
      {/* Rear Wall */}
      <Box args={[8, 4, 0.3]} position={[0, 2, 3.85]} castShadow receiveShadow>
        <primitive object={materials.wall} attach="material" />
      </Box>
    </>
  )
}

interface WindowFrameProps {
  materials: Record<string, THREE.Material>
}

export function WindowFrame({ materials }: WindowFrameProps) {
  return (
    <>
      {/* Window Frame - Metal surround */}
      {/* Left frame */}
      <Box args={[1.5, 3.5, 0.2]} position={[-3.25, 2.25, -3.9]} castShadow>
        <primitive object={materials.metalFrame} attach="material" />
      </Box>
      {/* Right frame */}
      <Box args={[1.5, 3.5, 0.2]} position={[3.25, 2.25, -3.9]} castShadow>
        <primitive object={materials.metalFrame} attach="material" />
      </Box>
      {/* Top frame */}
      <Box args={[5, 0.75, 0.2]} position={[0, 4.125, -3.9]} castShadow>
        <primitive object={materials.metalFrame} attach="material" />
      </Box>
      {/* Bottom frame */}
      <Box args={[5, 0.25, 0.2]} position={[0, 0.875, -3.9]} castShadow>
        <primitive object={materials.metalFrame} attach="material" />
      </Box>
      
      {/* Window Glass - Slightly fogged for atmosphere */}
      <Plane args={[5, 3.5]} position={[0, 2.5, -3.85]}>
        <primitive object={materials.foggedGlass} attach="material" />
      </Plane>
      
      {/* Window detail - corner bolts */}
      {[[-2.9, 4], [2.9, 4], [-2.9, 1], [2.9, 1]].map(([x, y], i) => (
        <Cylinder 
          key={`bolt-${i}`}
          args={[0.04, 0.04, 0.1]} 
          position={[x, y, -3.8]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color={0x444444} metalness={0.9} roughness={0.2} />
        </Cylinder>
      ))}
    </>
  )
}

interface ControlDeskProps {
  materials: Record<string, THREE.Material>
  audioData: { bass: number; mid: number; treble: number }
}

export function ControlDesk({ materials, audioData }: ControlDeskProps) {
  return (
    <group position={[0, 0, 1.5]}>
      {/* Main desk surface */}
      <Box args={[3.5, 0.08, 1.2]} position={[0, 1.1, 0]} castShadow>
        <meshStandardMaterial color={0x2a2a35} metalness={0.7} roughness={0.5} />
      </Box>
      
      {/* Desk edge trim */}
      <Box args={[3.5, 0.02, 0.05]} position={[0, 1.16, -0.58]}>
        <primitive object={materials.accent} attach="material" />
      </Box>
      
      {/* Control panels - left side */}
      <Box args={[0.8, 0.05, 0.6]} position={[-1.2, 1.18, -0.2]}>
        <meshStandardMaterial color={0x1a1a1a} metalness={0.5} roughness={0.6} />
      </Box>
      
      {/* Control panels - right side */}
      <Box args={[0.8, 0.05, 0.6]} position={[1.2, 1.18, -0.2]}>
        <meshStandardMaterial color={0x1a1a1a} metalness={0.5} roughness={0.6} />
      </Box>
      
      {/* Glowing buttons - music reactive */}
      <MusicReactiveButtons audioData={audioData} />
      
      {/* Joysticks */}
      <Joystick position={[-0.8, 1.2, 0.1]} audioData={audioData} />
      <Joystick position={[0.8, 1.2, 0.1]} audioData={audioData} />
      
      {/* Central display panel */}
      <Box args={[1.2, 0.4, 0.05]} position={[0, 1.4, -0.55]}>
        <meshStandardMaterial 
          color={0x0a0a0a} 
          emissive={0x00d4aa}
          emissiveIntensity={0.1 + audioData.bass * 0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </Box>
      
      {/* Desk legs/supports */}
      <Box args={[0.15, 1.1, 1]} position={[-1.5, 0.55, 0]}>
        <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.5} />
      </Box>
      <Box args={[0.15, 1.1, 1]} position={[1.5, 0.55, 0]}>
        <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.5} />
      </Box>
    </group>
  )
}

function MusicReactiveButtons({ audioData }: { audioData: { bass: number; mid: number; treble: number } }) {
  return (
    <>
      {/* Left panel buttons */}
      {Array.from({ length: 4 }, (_, i) => {
        const row = Math.floor(i / 2)
        const col = i % 2
        const isActive = audioData.bass > 0.3 + i * 0.1
        
        return (
          <Cylinder
            key={`btn-left-${i}`}
            args={[0.04, 0.04, 0.02]}
            position={[-1.4 + col * 0.15, 1.22, -0.35 + row * 0.15]}
          >
            <meshStandardMaterial
              color={isActive ? 0x00ff00 : 0x333333}
              emissive={isActive ? 0x00ff00 : 0x000000}
              emissiveIntensity={isActive ? 0.8 : 0}
              metalness={0.5}
              roughness={0.4}
            />
          </Cylinder>
        )
      })}
      
      {/* Right panel buttons */}
      {Array.from({ length: 4 }, (_, i) => {
        const row = Math.floor(i / 2)
        const col = i % 2
        const isActive = audioData.treble > 0.2 + i * 0.15
        
        return (
          <Cylinder
            key={`btn-right-${i}`}
            args={[0.04, 0.04, 0.02]}
            position={[1.25 + col * 0.15, 1.22, -0.35 + row * 0.15]}
          >
            <meshStandardMaterial
              color={isActive ? 0xff6600 : 0x333333}
              emissive={isActive ? 0xff6600 : 0x000000}
              emissiveIntensity={isActive ? 0.8 : 0}
              metalness={0.5}
              roughness={0.4}
            />
          </Cylinder>
        )
      })}
    </>
  )
}

function Joystick({ position, audioData }: { position: [number, number, number]; audioData: any }) {
  const stickRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (stickRef.current) {
      const time = state.clock.elapsedTime
      stickRef.current.rotation.x = Math.sin(time * 0.5) * 0.05 + audioData.bass * 0.02
      stickRef.current.rotation.z = Math.cos(time * 0.3) * 0.05
    }
  })
  
  return (
    <group position={position}>
      {/* Base */}
      <Cylinder args={[0.12, 0.15, 0.08]} position={[0, -0.04, 0]}>
        <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.4} />
      </Cylinder>
      
      {/* Stick */}
      <group ref={stickRef}>
        <Cylinder args={[0.04, 0.04, 0.25]} position={[0, 0.125, 0]}>
          <meshStandardMaterial color={0x555555} metalness={0.6} roughness={0.5} />
        </Cylinder>
        
        {/* Handle */}
        <Sphere args={[0.08]} position={[0, 0.28, 0]}>
          <meshStandardMaterial 
            color={0x2a2a35}
            metalness={0.5}
            roughness={0.6}
          />
        </Sphere>
        
        {/* Grip texture */}
        <Cylinder args={[0.082, 0.082, 0.1]} position={[0, 0.28, 0]}>
          <meshStandardMaterial 
            color={0x1a1a1a}
            metalness={0.3}
            roughness={0.9}
          />
        </Cylinder>
      </group>
    </group>
  )
}

export function BoothLighting() {
  return (
    <>
      {/* Ambient booth light */}
      <pointLight
        position={[0, 3.5, 1]}
        intensity={0.4}
        color={0x88ccff}
        distance={8}
        decay={2}
      />
      
      {/* Monitor glow lights */}
      <pointLight
        position={[-3.3, 3, -0.5]}
        intensity={0.5}
        color={0x00d4aa}
        distance={4}
        decay={2}
      />
      <pointLight
        position={[-3.3, 1.3, -0.5]}
        intensity={0.5}
        color={0x00d4aa}
        distance={4}
        decay={2}
      />
      <pointLight
        position={[0, 2.5, 3.3]}
        intensity={0.4}
        color={0x00aaff}
        distance={5}
        decay={2}
      />
      
      {/* Window edge light (simulating outside) */}
      <rectAreaLight
        position={[0, 2.5, -3.5]}
        width={5}
        height={3.5}
        intensity={0.3}
        color={0xffffff}
      />
    </>
  )
}
