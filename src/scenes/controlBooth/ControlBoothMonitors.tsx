import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RenderTexture, PerspectiveCamera as DreiPerspectiveCamera, Box, Plane, Sphere } from '@react-three/drei'

// =============================================================================
// CONTROL BOOTH MONITORS - Display and HUD logic
// =============================================================================

interface MonitorProps {
  position: [number, number, number]
  rotation: [number, number, number]
  size: [number, number]
  curveRadius?: number
  label: string
  materials: Record<string, THREE.Material>
  quality: 'low' | 'medium' | 'high'
  children: React.ReactNode
}

export function Monitor({ 
  position, 
  rotation, 
  size, 
  curveRadius = 5,
  label,
  materials,
  quality,
  children 
}: MonitorProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [width, height] = size
  
  const segments = quality === 'high' ? 32 : quality === 'medium' ? 16 : 8
  const textureSize = quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512
  
  const curvedGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(width, height, segments, 1)
    const positions = geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const angle = x / curveRadius
      positions[i] = Math.sin(angle) * curveRadius
      positions[i + 2] = Math.cos(angle) * curveRadius - curveRadius
    }
    
    geometry.computeVertexNormals()
    return geometry
  }, [width, height, curveRadius, segments])
  
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Monitor housing/bezel */}
      <mesh geometry={curvedGeometry} position={[0, 0, -0.05]}>
        <Box args={[width + 0.15, height + 0.15, 0.1]}>
          <meshStandardMaterial 
            color={0x1a1a1a}
            metalness={0.8}
            roughness={0.3}
          />
        </Box>
      </mesh>
      
      {/* Screen with RenderTexture */}
      <mesh geometry={curvedGeometry} castShadow>
        <meshPhysicalMaterial
          metalness={0.2}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
        >
          <RenderTexture
            attach="map"
            width={textureSize}
            height={textureSize * (height / width)}
            frames={1}
            stencilBuffer={false}
            depthBuffer={true}
          >
            {children}
          </RenderTexture>
        </meshPhysicalMaterial>
      </mesh>
      
      {/* Glass cover with reflections */}
      <mesh geometry={curvedGeometry} position={[0, 0, 0.005]}>
        <meshPhysicalMaterial
          color={0xffffff}
          metalness={0}
          roughness={0.05}
          transmission={0.9}
          thickness={0.01}
          transparent
          opacity={0.05}
          envMapIntensity={2}
        />
      </mesh>
      
      {/* Label plate */}
      <group position={[0, -height/2 - 0.12, 0]}>
        <Box args={[width * 0.5, 0.08, 0.02]}>
          <meshStandardMaterial color={0x2a2a2a} metalness={0.6} roughness={0.5} />
        </Box>
        {/* Label text as glowing strip */}
        <Plane args={[width * 0.4, 0.03]} position={[0, 0, 0.015]}>
          <meshBasicMaterial 
            color={0x00d4aa}
            transparent
            opacity={0.8}
          />
        </Plane>
      </group>
      
      {/* Status LED */}
      <Sphere args={[0.03]} position={[width/2 - 0.1, height/2 - 0.1, 0.05]}>
        <meshStandardMaterial 
          color={0x00ff00}
          emissive={0x00ff00}
          emissiveIntensity={0.8}
        />
      </Sphere>
    </group>
  )
}

interface MonitorHUDProps {
  label: string
  type: 'hook' | 'drone' | 'underwater'
}

export function MonitorHUD({ label, type }: MonitorHUDProps) {
  const color = type === 'underwater' ? '#00aaff' : type === 'drone' ? '#ff9500' : '#00d4aa'
  
  return (
    <>
      {/* Corner brackets */}
      <group position={[-3.5, 2.5, -10]}>
        <mesh>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI/2]}>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
      
      <group position={[3.5, 2.5, -10]}>
        <mesh>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI/2]}>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
      
      <group position={[-3.5, -2.5, -10]}>
        <mesh>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.15, 0]} rotation={[0, 0, Math.PI/2]}>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
      
      <group position={[3.5, -2.5, -10]}>
        <mesh>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.15, 0]} rotation={[0, 0, Math.PI/2]}>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
      
      {/* Recording dot */}
      <mesh position={[3.2, 2.8, -10]}>
        <circleGeometry args={[0.08]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      {/* Crosshair */}
      <group position={[0, 0, -10]}>
        <mesh>
          <planeGeometry args={[0.4, 0.02]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <planeGeometry args={[0.4, 0.02]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.15, 0.17, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      </group>
    </>
  )
}

export function MonitorConfigFactory() {
  return [
    {
      position: [-3.6, 3.0, -0.5],
      rotation: [0, Math.PI / 2 + 0.2, 0],
      size: [1.8, 1.1],
      curveRadius: 4,
      label: "HOOK CAM",
      type: 'hook' as const
    },
    {
      position: [-3.6, 1.3, -0.5],
      rotation: [0, Math.PI / 2 + 0.2, 0],
      size: [1.8, 1.1],
      curveRadius: 4,
      label: "DRONE",
      type: 'drone' as const
    },
    {
      position: [0, 2.5, 3.6],
      rotation: [0, Math.PI, 0],
      size: [2.4, 1.5],
      curveRadius: 6,
      label: "UNDERWATER",
      type: 'underwater' as const
    }
  ]
}
