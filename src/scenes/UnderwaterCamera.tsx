import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { useAudioVisualSync } from '../systems/audioVisualSync'

// =============================================================================
// UNDERWATER CAMERA SYSTEM
// Submerged view showing hull reflections, bioluminescence, and marine life
// =============================================================================

interface UnderwaterCameraProps {
  intensity?: number // 0-1 multiplier for effects
}

// Marine life types for spawning
interface MarineLife {
  id: string
  type: 'plankton' | 'whale' | 'shark' | 'jellyfish' | 'bubbles'
  position: THREE.Vector3
  velocity: THREE.Vector3
  size: number
  life: number
  maxLife: number
  color: THREE.Color
}

export default function UnderwaterCamera({ intensity = 1 }: UnderwaterCameraProps) {
  const ships = useGameStore(state => state.ships)
  const currentShipId = useGameStore(state => state.currentShipId)
  const lightIntensity = useGameStore(state => state.lightIntensity)
  const installedUpgrades = useGameStore(state => state.installedUpgrades)
  
  const { audioData } = useAudioVisualSync()
  
  const currentShip = ships.find(s => s.id === currentShipId)
  
  // Marine life state
  const marineLifeRef = useRef<MarineLife[]>([])
  const godRayRef = useRef<{ intensity: number; angle: number }>({ intensity: 0, angle: 0 })
  
  // Get ship upgrade status for light effects
  const shipUpgradeProgress = useMemo(() => {
    if (!currentShip) return 0
    const upgrades = installedUpgrades.filter(u => u.shipId === currentShip.id).length
    const maxUpgrades = currentShip.type === 'cruise' ? 10 : currentShip.type === 'container' ? 10 : 8
    return upgrades / maxUpgrades
  }, [currentShip, installedUpgrades])
  
  // Spawn marine life
  const spawnMarineLife = useCallback(() => {
    const spawnTypes: MarineLife['type'][] = ['plankton', 'jellyfish', 'bubbles']
    
    // Rare spawns
    if (Math.random() < 0.001 * intensity) spawnTypes.push('whale')
    if (Math.random() < 0.002 * intensity) spawnTypes.push('shark')
    
    const type = spawnTypes[Math.floor(Math.random() * spawnTypes.length)]
    
    // Spawn position - random area around dock
    const angle = Math.random() * Math.PI * 2
    const radius = 10 + Math.random() * 40
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    
    const life: MarineLife = {
      id: `marine_${Date.now()}_${Math.random()}`,
      type,
      position: new THREE.Vector3(x, -8 - Math.random() * 10, z),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        type === 'bubbles' ? 0.5 + Math.random() * 0.5 : (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.5
      ),
      size: type === 'whale' ? 8 : type === 'shark' ? 3 : type === 'jellyfish' ? 1.5 : 0.1 + Math.random() * 0.2,
      life: 0,
      maxLife: type === 'whale' || type === 'shark' ? 20 : 10 + Math.random() * 10,
      color: new THREE.Color().setHSL(
        type === 'jellyfish' ? 0.8 + Math.random() * 0.2 : 0.5 + Math.random() * 0.3,
        0.8,
        type === 'plankton' ? 0.8 : 0.5
      )
    }
    
    marineLifeRef.current.push(life)
  }, [intensity])
  
  // Update marine life and effects
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    
    // Spawn new marine life
    if (marineLifeRef.current.length < 150 * intensity) {
      for (let i = 0; i < 3; i++) {
        if (Math.random() < 0.3 * intensity) spawnMarineLife()
      }
    }
    
    // Update existing marine life
    marineLifeRef.current = marineLifeRef.current
      .map(creature => {
        // Movement
        creature.position.add(creature.velocity.clone().multiplyScalar(delta * 60))
        creature.life += delta
        
        // Jellyfish pulsing movement
        if (creature.type === 'jellyfish') {
          creature.position.y += Math.sin(time * 2 + creature.life) * 0.01
        }
        
        // Whale/Shark path following
        if (creature.type === 'whale' || creature.type === 'shark') {
          creature.velocity.x += Math.cos(time * 0.05) * 0.01
          creature.velocity.z += Math.sin(time * 0.05) * 0.01
          creature.velocity.normalize().multiplyScalar(creature.type === 'whale' ? 0.3 : 0.5)
        }
        
        return creature
      })
      .filter(creature => creature.life < creature.maxLife && creature.position.y < 0)
    
    // Update god rays based on ship lights
    const targetGodRayIntensity = shipUpgradeProgress * lightIntensity * 0.8 * intensity
    godRayRef.current.intensity = THREE.MathUtils.lerp(
      godRayRef.current.intensity,
      targetGodRayIntensity,
      0.05
    )
    godRayRef.current.angle += delta * 0.2
    
    // Audio-reactive bioluminescence pulse
    if (audioData?.beat && audioData.beatIntensity > 0.5) {
      marineLifeRef.current.forEach(creature => {
        if (creature.type === 'plankton' || creature.type === 'jellyfish') {
          creature.color.setHSL(
            creature.color.getHSL({ h: 0, s: 0, l: 0 }).h,
            1,
            0.8 + audioData.beatIntensity * 0.2
          )
        }
      })
    }
  })
  
  // Generate god ray positions based on ship position
  const godRays = useMemo(() => {
    if (!currentShip || godRayRef.current.intensity < 0.01) return []
    
    const shipPos = new THREE.Vector3(...currentShip.position)
    const rays: { position: THREE.Vector3; angle: number; intensity: number; color: THREE.Color }[] = []
    
    // Create rays from ship lights piercing through water
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + godRayRef.current.angle
      const offset = new THREE.Vector3(Math.cos(angle) * 5, 0, Math.sin(angle) * 5)
      
      // Ship type specific colors
      const colors: Record<string, string> = {
        cruise: '#ff6b9d',
        container: '#00d4aa',
        tanker: '#ff9500'
      }
      
      rays.push({
        position: shipPos.clone().add(offset),
        angle: angle + Math.PI,
        intensity: godRayRef.current.intensity * (0.5 + Math.random() * 0.5),
        color: new THREE.Color(colors[currentShip.type] || '#ffffff')
      })
    }
    
    return rays
  }, [currentShip, shipUpgradeProgress, lightIntensity, intensity])
  
  // Group marine life by type for efficient rendering
  const plankton = marineLifeRef.current.filter(m => m.type === 'plankton')
  const jellyfish = marineLifeRef.current.filter(m => m.type === 'jellyfish')
  const creatures = marineLifeRef.current.filter(m => m.type === 'whale' || m.type === 'shark')
  const bubbles = marineLifeRef.current.filter(m => m.type === 'bubbles')
  
  return (
    <group>
      {/* Underwater fog/god rays */}
      {godRays.map((ray, i) => (
        <GodRay
          key={`ray_${i}`}
          position={ray.position}
          angle={ray.angle}
          intensity={ray.intensity}
          color={ray.color}
        />
      ))}
      
      {/* Plankton particles (instanced) */}
      {plankton.length > 0 && (
        <PlanktonField plankton={plankton} />
      )}
      
      {/* Jellyfish */}
      {jellyfish.map(j => (
        <Jellyfish key={j.id} {...j} />
      ))}
      
      {/* Large creatures (whales/sharks) */}
      {creatures.map(c => (
        <LargeCreature key={c.id} {...c} />
      ))}
      
      {/* Bubbles */}
      {bubbles.length > 0 && (
        <BubbleField bubbles={bubbles} />
      )}
      
      {/* Underwater caustics plane */}
      <CausticsPlane intensity={intensity} />
    </group>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * God Ray - Light beam from ship piercing through water
 */
function GodRay({ 
  position, 
  angle, 
  intensity, 
  color 
}: { 
  position: THREE.Vector3
  angle: number
  intensity: number
  color: THREE.Color
}) {
  return (
    <mesh position={[position.x, -5, position.z]} rotation={[0, angle, 0]}>
      <cylinderGeometry args={[0.5, 3, 15, 8, 1, true]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uColor: { value: color },
          uIntensity: { value: intensity },
          uTime: { value: 0 }
        }}
        vertexShader={`
          varying vec2 vUv;
          varying float vDepth;
          uniform float uTime;
          
          void main() {
            vUv = uv;
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vDepth = 1.0 - (worldPos.y + 10.0) / 15.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform float uIntensity;
          varying vec2 vUv;
          varying float vDepth;
          
          void main() {
            float fade = smoothstep(0.0, 0.3, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
            fade *= vDepth;
            
            float noise = sin(vUv.x * 10.0 + vUv.y * 5.0) * 0.1 + 0.9;
            
            vec3 color = uColor * uIntensity * fade * noise;
            gl_FragColor = vec4(color, fade * uIntensity * 0.5);
          }
        `}
      />
    </mesh>
  )
}

/**
 * Plankton Field - Instanced particles for bioluminescent plankton
 */
function PlanktonField({ plankton }: { plankton: MarineLife[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  useFrame(() => {
    if (!meshRef.current) return
    
    plankton.forEach((p, i) => {
      dummy.position.copy(p.position)
      dummy.scale.setScalar(p.size * (0.8 + Math.sin(p.life * 3) * 0.2))
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
      meshRef.current!.setColorAt(i, p.color)
    })
    
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  })
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, plankton.length]}
    >
      <sphereGeometry args={[0.05, 4, 4]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

/**
 * Jellyfish - Animated translucent creature
 */
function Jellyfish(props: MarineLife) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!meshRef.current) return
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + props.life) * 0.2
    meshRef.current.scale.setScalar(props.size * pulse)
    meshRef.current.position.copy(props.position)
  })
  
  return (
    <group>
      {/* Bell */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
        <meshBasicMaterial
          color={props.color}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Tentacles */}
      {[...Array(6)].map((_, i) => (
        <Tentacle 
          key={i}
          index={i}
          parentPosition={props.position}
          color={props.color}
          size={props.size}
        />
      ))}
    </group>
  )
}

/**
 * Animated tentacle for jellyfish
 */
function Tentacle({ 
  index, 
  parentPosition, 
  color, 
  size 
}: { 
  index: number
  parentPosition: THREE.Vector3
  color: THREE.Color
  size: number
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const segmentCount = 12
  
  useFrame((state) => {
    if (!pointsRef.current) return
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime
    const angle = (index / 6) * Math.PI * 2
    
    for (let i = 0; i < segmentCount; i++) {
      const t = i / segmentCount
      const sway = Math.sin(time * 2 + t * 3 + index) * 0.3 * t
      
      positions[i * 3] = parentPosition.x + Math.cos(angle) * (0.3 + t * 0.2) + sway
      positions[i * 3 + 1] = parentPosition.y - t * size * 1.5
      positions[i * 3 + 2] = parentPosition.z + Math.sin(angle) * (0.3 + t * 0.2)
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(segmentCount * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])
  
  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={0.05 * size}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/**
 * Large Creature (Whale/Shark) - Simplified silhouette
 */
function LargeCreature(props: MarineLife) {
  const isWhale = props.type === 'whale'
  
  return (
    <group position={props.position}>
      <mesh rotation={[0, Math.atan2(props.velocity.x, props.velocity.z), 0]}>
        <capsuleGeometry 
          args={[isWhale ? props.size * 0.4 : props.size * 0.2, isWhale ? props.size : props.size * 2, 4, 8]} 
        />
        <meshBasicMaterial
          color={isWhale ? '#1a2332' : '#2a3332'}
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {/* Tail fin */}
      <mesh
        position={[-(isWhale ? props.size * 0.5 : props.size), 0, 0]}
        rotation={[0, Math.atan2(props.velocity.x, props.velocity.z), Math.PI / 4]}
      >
        <planeGeometry args={[props.size * (isWhale ? 0.8 : 0.5), props.size * (isWhale ? 0.4 : 0.3)]} />
        <meshBasicMaterial
          color={isWhale ? '#1a2332' : '#2a3332'}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Bioluminescent spots for whale */}
      {isWhale && [...Array(5)].map((_, i) => (
        <pointLight
          key={i}
          position={[
            (Math.random() - 0.5) * props.size,
            (Math.random() - 0.5) * props.size * 0.3,
            (Math.random() - 0.5) * props.size * 0.5
          ]}
          intensity={0.5}
          distance={10}
          color="#00aaff"
        />
      ))}
    </group>
  )
}

/**
 * Bubble Field - Rising bubbles
 */
function BubbleField({ bubbles }: { bubbles: MarineLife[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  useFrame(() => {
    if (!meshRef.current) return
    
    bubbles.forEach((b, i) => {
      dummy.position.copy(b.position)
      const wobble = Math.sin(b.life * 3 + i) * 0.1
      dummy.position.x += wobble
      dummy.scale.setScalar(b.size * (1 + b.life * 0.1))
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, bubbles.length]}
    >
      <sphereGeometry args={[0.1, 6, 6]} />
      <meshBasicMaterial
        color="#88ccff"
        transparent
        opacity={0.3}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

/**
 * Caustics Plane - Animated light patterns on seafloor
 */
function CausticsPlane({ intensity }: { intensity: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh position={[0, -15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[200, 200]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uIntensity: { value: intensity }
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uIntensity;
          varying vec2 vUv;
          
          float caustic(vec2 uv, float time) {
            float c = 0.0;
            vec2 p = uv * 8.0;
            
            for (int i = 0; i < 3; i++) {
              float fi = float(i);
              p.x += sin(p.y + time * (0.5 + fi * 0.1) + fi * 2.0) * 0.5;
              p.y += cos(p.x + time * (0.3 + fi * 0.15) + fi * 1.5) * 0.5;
            }
            
            c = sin(p.x) * sin(p.y);
            c = smoothstep(0.0, 1.0, c);
            
            return c;
          }
          
          void main() {
            float c = caustic(vUv, uTime);
            vec3 color = vec3(0.3, 0.5, 0.7) * c * uIntensity;
            gl_FragColor = vec4(color, c * 0.3 * uIntensity);
          }
        `}
      />
    </mesh>
  )
}
