import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { 
  Box, 
  Plane, 
  MeshReflectorMaterial,
  Environment,
  useTexture,
  shaderMaterial
} from '@react-three/drei'
import { extend } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { getHarborTheme, type HarborType } from '../store/harborThemes'
import MonitorSystem from './MonitorSystem'
import { useAudioVisualSync } from '../systems/audioVisualSync'

// =============================================================================
// SHADERS FOR HARBOR-SPECIFIC EFFECTS
// =============================================================================

// Rain droplets on window shader
const RainDropletsMaterial = shaderMaterial(
  {
    uTime: 0,
    uDropletCount: 50,
    uIntensity: 1.0,
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform int uDropletCount;
    uniform float uIntensity;
    varying vec2 vUv;
    
    // Pseudo-random function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    // Circle SDF
    float circle(vec2 uv, vec2 pos, float radius) {
      return smoothstep(radius, radius - 0.01, distance(uv, pos));
    }
    
    void main() {
      vec2 uv = vUv;
      float droplets = 0.0;
      
      for (int i = 0; i < 50; i++) {
        float fi = float(i);
        vec2 pos = vec2(
          random(vec2(fi, 0.0)),
          mod(random(vec2(0.0, fi)) + uTime * 0.05 * random(vec2(fi, fi)), 1.0)
        );
        float size = 0.005 + random(vec2(fi, fi)) * 0.015;
        droplets += circle(uv, pos, size) * uIntensity;
      }
      
      gl_FragColor = vec4(vec3(0.9), droplets * 0.3);
    }
  `
)
extend({ RainDropletsMaterial })

// Condensation/fog on glass
const CondensationMaterial = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 0.5,
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;
    
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      vec2 uv = vUv * 3.0;
      float n = noise(uv + uTime * 0.01);
      n += noise(uv * 2.0 - uTime * 0.02) * 0.5;
      n += noise(uv * 4.0 + uTime * 0.03) * 0.25;
      n /= 1.75;
      
      float fog = smoothstep(0.4, 0.6, n) * uIntensity;
      gl_FragColor = vec4(1.0, 1.0, 1.0, fog * 0.2);
    }
  `
)
extend({ CondensationMaterial })

// =============================================================================
// SWAPPABLE CONTROL BOOTH
// =============================================================================

interface ControlBoothSwappableProps {
  children: React.ReactNode
  quality?: 'low' | 'medium' | 'high' | 'ultra'
  debug?: boolean
}

export default function ControlBoothSwappable({
  children,
  quality = 'high',
  debug = false
}: ControlBoothSwappableProps) {
  const { camera, scene } = useThree()
  const boothRef = useRef<THREE.Group>(null)
  const rainRef = useRef<THREE.ShaderMaterial>(null)
  const condensationRef = useRef<THREE.ShaderMaterial>(null)
  
  // Get current harbor from store
  const currentHarbor = useGameStore(state => state.currentHarbor)
  const setCurrentHarbor = useGameStore(state => state.setCurrentHarbor)
  const { audioData } = useAudioVisualSync()
  
  // Get theme for current harbor
  const theme = useMemo(() => getHarborTheme(currentHarbor), [currentHarbor])
  
  // ================================================================
  // PLAYER CAMERA SETUP
  // ================================================================
  useEffect(() => {
    camera.position.set(0, 2.2, 3.2)
    camera.lookAt(0, 2.5, -20)
    camera.fov = 65
    camera.updateProjectionMatrix()
    
    return () => {
      camera.position.set(10, 10, 10)
      camera.lookAt(0, 0, 0)
      camera.fov = 50
      camera.updateProjectionMatrix()
    }
  }, [camera])
  
  // ================================================================
  // UPDATE SCENE FOG WHEN HARBOR CHANGES
  // ================================================================
  useEffect(() => {
    scene.fog = new THREE.FogExp2(theme.fogColor, theme.fogDensity)
  }, [scene, theme.fogColor, theme.fogDensity])
  
  // ================================================================
  // ANIMATE SHADERS
  // ================================================================
  useFrame((state) => {
    if (rainRef.current && theme.hasRainDroplets) {
      rainRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
    if (condensationRef.current && theme.hasCondensation) {
      condensationRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  // ================================================================
  // MATERIALS - Generated from theme
  // ================================================================
  const materials = useMemo(() => {
    return {
      wall: new THREE.MeshStandardMaterial({
        color: theme.wallColor,
        metalness: theme.metalness,
        roughness: theme.roughness,
        side: THREE.DoubleSide
      }),
      floor: new THREE.MeshStandardMaterial({
        color: theme.floorColor,
        metalness: theme.metalness * 0.8,
        roughness: Math.min(theme.roughness + 0.1, 1),
        side: THREE.DoubleSide
      }),
      metal: new THREE.MeshStandardMaterial({
        color: 0x3a3a45,
        metalness: 0.9,
        roughness: 0.3
      }),
      accent: new THREE.MeshStandardMaterial({
        color: theme.accentColor,
        emissive: theme.accentColor,
        emissiveIntensity: 0.3,
        metalness: 0.7,
        roughness: 0.4
      }),
      panel: new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        emissive: theme.panelEmissive,
        emissiveIntensity: theme.panelIntensity,
        metalness: 0.8,
        roughness: 0.2
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: theme.windowTint,
        metalness: 0.1,
        roughness: theme.windowRoughness,
        transmission: 1 - theme.windowOpacity,
        thickness: 0.1,
        transparent: true,
        opacity: theme.windowOpacity,
        envMapIntensity: 1
      })
    }
  }, [theme])
  
  // ================================================================
  // ENVIRONMENT MAP BASED ON THEME
  // ================================================================
  const envPreset = useMemo(() => {
    switch (theme.envMap) {
      case 'night': return 'night'
      case 'sunset': return 'sunset'
      case 'city': return 'city'
      case 'warehouse': return 'warehouse'
      default: return 'sunset'
    }
  }, [theme.envMap])
  
  return (
    <group ref={boothRef}>
      {/* Environment */}
      <Environment preset={envPreset} />
      
      {/* ============================================================ */}
      {/* ROOM STRUCTURE */}
      {/* ============================================================ */}
      
      {/* Floor */}
      <Box args={[8, 0.1, 8]} position={[0, 0.05, 0]} receiveShadow>
        <primitive object={materials.floor} attach="material" />
      </Box>
      
      {/* Floor strips */}
      {Array.from({ length: 7 }, (_, i) => (
        <Box 
          key={`strip-${i}`}
          args={[8, 0.02, 0.05]} 
          position={[0, 0.11, -3.5 + i]}
        >
          <meshStandardMaterial 
            color={0x333333} 
            metalness={0.8} 
            roughness={0.4} 
          />
        </Box>
      ))}
      
      {/* Ceiling */}
      <Box args={[8, 0.2, 8]} position={[0, 4.1, 0]} castShadow>
        <primitive object={materials.wall} attach="material" />
      </Box>
      
      {/* Ceiling lights - Theme colored */}
      <CeilingLights theme={theme} />
      
      {/* Walls */}
      <Box args={[0.3, 4, 8]} position={[-3.85, 2, 0]} castShadow receiveShadow>
        <primitive object={materials.wall} attach="material" />
      </Box>
      
      <Box args={[0.3, 4, 8]} position={[3.85, 2, 0]} castShadow receiveShadow>
        <primitive object={materials.wall} attach="material" />
      </Box>
      
      <Box args={[8, 4, 0.3]} position={[0, 2, 3.85]} castShadow receiveShadow>
        <primitive object={materials.wall} attach="material" />
      </Box>
      
      {/* ============================================================ */}
      {/* FRONT WINDOW WITH HARBOR-SPECIFIC EFFECTS */}
      {/* ============================================================ */}
      
      <WindowFrame materials={materials} />
      
      {/* Base glass with theme tint */}
      <Plane args={[5, 3.5]} position={[0, 2.5, -3.85]}>
        <primitive object={materials.glass} attach="material" />
      </Plane>
      
      {/* Rain droplets (conditional) */}
      {theme.hasRainDroplets && (
        <Plane args={[5, 3.5]} position={[0, 2.5, -3.84]}>
          <rainDropletsMaterial
            ref={rainRef}
            uIntensity={1.0}
            transparent
            depthWrite={false}
          />
        </Plane>
      )}
      
      {/* Condensation (conditional) */}
      {theme.hasCondensation && (
        <Plane args={[5, 3.5]} position={[0, 2.5, -3.83]}>
          <condensationMaterial
            ref={condensationRef}
            uIntensity={currentHarbor === 'singapore' ? 0.6 : 0.4}
            transparent
            depthWrite={false}
          />
        </Plane>
      )}
      
      {/* ============================================================ */}
      {/* CONTROL DESK - Theme colored */}
      {/* ============================================================ */}
      
      <ControlDesk theme={theme} audioData={audioData} />
      
      {/* ============================================================ */}
      {/* MONITOR SYSTEM */}
      {/* ============================================================ */}
      
      <MonitorSystem 
        quality={quality}
        interactive
        theme={theme} // Pass theme for monitor colors
      >
        {children}
      </MonitorSystem>
      
      {/* ============================================================ */}
      {/* MAIN SCENE CONTENT */}
      {/* ============================================================ */}
      <group position={[0, 0, -15]}>
        {children}
      </group>
      
      {/* ============================================================ */}
      {/* BOOTH LIGHTING - Theme specific */}
      {/* ============================================================ */}
      
      {/* Ambient */}
      <ambientLight 
        color={theme.ambientLight.color} 
        intensity={theme.ambientLight.intensity} 
      />
      
      {/* Directional (simulating outside light through window) */}
      <directionalLight
        position={[0, 5, -10]}
        color={theme.directionalLight.color}
        intensity={theme.directionalLight.intensity}
        castShadow
      />
      
      {/* Theme-specific point lights */}
      {theme.boothLights.map((light, i) => (
        <pointLight
          key={`booth-light-${i}`}
          position={light.position}
          color={light.color}
          intensity={light.intensity}
          distance={light.distance}
          decay={2}
        />
      ))}
      
      {/* Debug */}
      {debug && (
        <>
          <axesHelper args={[2]} position={[0, 2, 0]} />
          <gridHelper args={[10, 10]} position={[0, 0.01, 0]} />
        </>
      )}
      
      {/* Harbor indicator (subtle) */}
      <HarborIndicator harbor={currentHarbor} />
    </group>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function CeilingLights({ theme }: { theme: any }) {
  const positions = [[-2, -2], [2, -2], [-2, 2], [2, 2]]
  
  return (
    <group position={[0, 3.95, 0]}>
      {positions.map(([x, z], i) => (
        <group key={`light-${i}`} position={[x, 0, z]}>
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
  )
}

function WindowFrame({ materials }: { materials: any }) {
  return (
    <>
      <Box args={[1.5, 3.5, 0.2]} position={[-3.25, 2.25, -3.9]} castShadow>
        <primitive object={materials.metal} attach="material" />
      </Box>
      <Box args={[1.5, 3.5, 0.2]} position={[3.25, 2.25, -3.9]} castShadow>
        <primitive object={materials.metal} attach="material" />
      </Box>
      <Box args={[5, 0.75, 0.2]} position={[0, 4.125, -3.9]} castShadow>
        <primitive object={materials.metal} attach="material" />
      </Box>
      <Box args={[5, 0.25, 0.2]} position={[0, 0.875, -3.9]} castShadow>
        <primitive object={materials.metal} attach="material" />
      </Box>
    </>
  )
}

function ControlDesk({ theme, audioData }: { theme: any; audioData: any }) {
  return (
    <group position={[0, 0, 1.5]}>
      {/* Main surface */}
      <Box args={[3.5, 0.08, 1.2]} position={[0, 1.1, 0]} castShadow>
        <meshStandardMaterial 
          color={theme.wallColor} 
          metalness={0.7} 
          roughness={0.5} 
        />
      </Box>
      
      {/* Accent trim - Theme color */}
      <Box args={[3.5, 0.02, 0.05]} position={[0, 1.16, -0.58]}>
        <meshStandardMaterial 
          color={theme.accentColor}
          emissive={theme.accentColor}
          emissiveIntensity={0.2 + audioData.bass * 0.3}
        />
      </Box>
      
      {/* Control panels */}
      <Box args={[0.8, 0.05, 0.6]} position={[-1.2, 1.18, -0.2]}>
        <meshStandardMaterial color={0x1a1a1a} metalness={0.5} roughness={0.6} />
      </Box>
      
      <Box args={[0.8, 0.05, 0.6]} position={[1.2, 1.18, -0.2]}>
        <meshStandardMaterial color={0x1a1a1a} metalness={0.5} roughness={0.6} />
      </Box>
      
      {/* Theme-colored buttons */}
      {Array.from({ length: 4 }, (_, i) => {
        const isActive = audioData.bass > 0.3 + i * 0.1
        const row = Math.floor(i / 2)
        const col = i % 2
        
        return (
          <group key={`btn-${i}`} position={[-1.4 + col * 0.15, 1.22, -0.35 + row * 0.15]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.04, 0.02]} />
              <meshStandardMaterial
                color={isActive ? theme.buttonColors.active : theme.buttonColors.inactive}
                emissive={isActive ? theme.buttonColors.active : 0x000000}
                emissiveIntensity={isActive ? 0.8 : 0}
                metalness={0.5}
                roughness={0.4}
              />
            </mesh>
          </group>
        )
      })}
      
      {/* Central display - Theme emissive */}
      <Box args={[1.2, 0.4, 0.05]} position={[0, 1.4, -0.55]}>
        <meshStandardMaterial 
          color={0x0a0a0a}
          emissive={theme.panelEmissive}
          emissiveIntensity={theme.panelIntensity + audioData.bass * 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </Box>
      
      {/* Legs */}
      <Box args={[0.15, 1.1, 1]} position={[-1.5, 0.55, 0]}>
        <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.5} />
      </Box>
      <Box args={[0.15, 1.1, 1]} position={[1.5, 0.55, 0]}>
        <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.5} />
      </Box>
    </group>
  )
}

function HarborIndicator({ harbor }: { harbor: HarborType }) {
  return (
    <group position={[-3.5, 3.8, 3.5]}>
      {/* Small label showing current harbor */}
      <Plane args={[1.5, 0.3]}>
        <meshBasicMaterial color={0x000000} transparent opacity={0.7} />
      </Plane>
      {/* Could add Text component here if using drei Text */}
    </group>
  )
}

// =============================================================================
// LEVA INTEGRATION EXAMPLE
// =============================================================================

/*
// In your Leva controls setup:
import { harborList } from '../store/harborThemes'

useControls({
  'Current Harbor': {
    value: currentHarbor,
    options: harborList.reduce((acc, h) => ({ ...acc, [h.name]: h.id }), {}),
    onChange: (value: HarborType) => {
      setCurrentHarbor(value)
    }
  }
})
*/
