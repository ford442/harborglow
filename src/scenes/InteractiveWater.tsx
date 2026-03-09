import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// INTERACTIVE WATER SYSTEM - HarborGlow
// Buoyancy, wakes, splashes, and dynamic wave interference
// =============================================================================

interface BuoyancyPoint {
  position: THREE.Vector3
  displacement: number
  velocity: THREE.Vector3
}

interface WakeTrail {
  id: string
  points: THREE.Vector3[]
  ages: number[]
  intensity: number
}

interface Ripple {
  center: THREE.Vector2
  radius: number
  amplitude: number
  frequency: number
  phase: number
  decay: number
}

interface Splash {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
}

interface InteractiveWaterProps {
  isNight?: boolean
}

export default function InteractiveWater({ isNight = true }: InteractiveWaterProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { camera } = useThree()

  const ships = useGameStore(state => state.ships)
  const craneState = useGameStore(state => ({
    height: state.craneHeight ?? 15.5,
    rotation: state.craneRotation ?? 0.2,
    twistlockEngaged: state.twistlockEngaged ?? false
  }))
  const weather = useGameStore(state => state.weather)

  // Simulation state
  const buoyancyPoints = useRef<BuoyancyPoint[]>([])
  const wakeTrails = useRef<Map<string, WakeTrail>>(new Map())
  const ripples = useRef<Ripple[]>([])
  const splashes = useRef<Splash[]>([])
  const timeRef = useRef(0)

  // Maximum counts for performance
  const MAX_RIPPLES = 50
  const MAX_SPLASHES = 200

  // Get water height at position with all wave effects
  const getWaterHeight = useCallback((x: number, z: number, time: number): number => {
    let height = 0

    // Base wave simulation (simplified FFT approximation)
    height += Math.sin(x * 0.05 + time * 0.5) * Math.cos(z * 0.03 + time * 0.3) * 0.5
    height += Math.sin(x * 0.1 + time * 0.8) * Math.sin(z * 0.08 + time * 0.6) * 0.3
    height += Math.sin(x * 0.2 + time * 1.2) * 0.1

    // Add buoyancy displacement
    buoyancyPoints.current.forEach(point => {
      const dx = x - point.position.x
      const dz = z - point.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < 10) {
        const influence = Math.max(0, 1 - dist / 10)
        height -= point.displacement * influence * Math.cos(dist * 0.5 - time * 2)
      }
    })

    // Add wake trail influence
    wakeTrails.current.forEach(trail => {
      trail.points.forEach((point, i) => {
        const age = trail.ages[i]
        if (age > 5) return

        const dx = x - point.x
        const dz = z - point.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        const wakeWidth = 3 + age * 0.5

        if (dist < wakeWidth) {
          const influence = (1 - age / 5) * (1 - dist / wakeWidth)
          height += Math.sin(dist * 2 - time * 3) * influence * 0.3
        }
      })
    })

    // Add ripple interference
    ripples.current.forEach(ripple => {
      const dx = x - ripple.center.x
      const dz = z - ripple.center.y
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < ripple.radius) {
        const wave = Math.sin(dist * ripple.frequency - ripple.phase)
        const envelope = Math.exp(-ripple.decay * dist) * (1 - dist / ripple.radius)
        height += wave * envelope * ripple.amplitude
      }
    })

    // Add turbulence from crane
    const craneX = Math.sin(craneState.rotation) * 20
    const craneZ = 5
    const craneDist = Math.sqrt((x - craneX) ** 2 + (z - craneZ) ** 2)
    if (craneDist < 15) {
      const turbulence = Math.sin(time * 5 + craneDist) * (1 - craneDist / 15) * 0.2
      height += turbulence
    }

    return height * (weather === 'storm' ? 2 : 1)
  }, [craneState.rotation, weather])

  // Create splash effect
  const createSplash = useCallback((position: THREE.Vector3, intensity: number) => {
    if (splashes.current.length >= MAX_SPLASHES) return

    for (let i = 0; i < 10 * intensity; i++) {
      splashes.current.push({
        position: position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          Math.random() * 5 + 2,
          (Math.random() - 0.5) * 3
        ),
        life: 0,
        maxLife: 1 + Math.random(),
        size: 0.1 + Math.random() * 0.3
      })
    }

    // Create ripple from splash
    if (ripples.current.length < MAX_RIPPLES) {
      ripples.current.push({
        center: new THREE.Vector2(position.x, position.z),
        radius: 20,
        amplitude: 0.5 * intensity,
        frequency: 0.5,
        phase: 0,
        decay: 0.1
      })
    }
  }, [])

  // Update physics
  useFrame(() => {
    const delta = 0.016
    timeRef.current += delta

    // Update buoyancy points from ships
    buoyancyPoints.current = ships.flatMap(ship => {
      const points: BuoyancyPoint[] = []
      const shipLength = ship.length
      const shipWidth = shipLength * 0.15

      // Hull contact points
      for (let i = -2; i <= 2; i++) {
        for (let j = -1; j <= 1; j++) {
          const x = ship.position[0] + i * shipLength * 0.2
          const z = ship.position[2] + j * shipWidth * 0.3
          const waterH = getWaterHeight(x, z, timeRef.current - delta)

          // Ship hull is approx at -2.5 + draft
          const draft = 2
          const hullBottom = -2.5 - draft

          if (waterH > hullBottom) {
            points.push({
              position: new THREE.Vector3(x, waterH, z),
              displacement: Math.min(waterH - hullBottom, 1.5),
              velocity: new THREE.Vector3(0, 0, 0)
            })
          }
        }
      }
      return points
    })

    // Update wake trails
    ships.forEach(ship => {
      const trail = wakeTrails.current.get(ship.id) ?? {
        id: ship.id,
        points: [],
        ages: [],
        intensity: 1
      }

      // Add new point at stern
      trail.points.unshift(new THREE.Vector3(
        ship.position[0] - ship.length * 0.45,
        -2.5,
        ship.position[2]
      ))
      trail.ages.unshift(0)

      // Limit trail length
      if (trail.points.length > 50) {
        trail.points.pop()
        trail.ages.pop()
      }

      // Age all points
      trail.ages = trail.ages.map(age => age + delta)

      wakeTrails.current.set(ship.id, trail)
    })

    // Update ripples
    ripples.current = ripples.current
      .map(ripple => ({
        ...ripple,
        phase: ripple.phase + delta * 5,
        amplitude: ripple.amplitude * 0.995
      }))
      .filter(ripple => ripple.amplitude > 0.01)

    // Update splashes
    splashes.current = splashes.current
      .map(splash => {
        splash.velocity.y -= 9.8 * delta // Gravity
        splash.position.add(splash.velocity.clone().multiplyScalar(delta))
        splash.life += delta
        return splash
      })
      .filter(splash => splash.life < splash.maxLife && splash.position.y > -3)

    // Create splash from crane operations (simulated)
    if (craneState.height < 5 && Math.random() < 0.1) {
      const craneX = Math.sin(craneState.rotation) * 15
      const craneZ = 5 + (Math.random() - 0.5) * 5
      createSplash(new THREE.Vector3(craneX, -2.5, craneZ), 0.5)
    }
  })

  // Splash particles geometry
  const splashGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(MAX_SPLASHES * 3)
    const sizes = new Float32Array(MAX_SPLASHES)
    const opacities = new Float32Array(MAX_SPLASHES)

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1))

    return geometry
  }, [])

  // Update splash particles
  useFrame(() => {
    const positions = splashGeometry.attributes.position.array as Float32Array
    const sizes = splashGeometry.attributes.size.array as Float32Array
    const opacities = splashGeometry.attributes.opacity.array as Float32Array

    splashes.current.forEach((splash, i) => {
      positions[i * 3] = splash.position.x
      positions[i * 3 + 1] = splash.position.y
      positions[i * 3 + 2] = splash.position.z
      sizes[i] = splash.size * (1 - splash.life / splash.maxLife)
      opacities[i] = 1 - splash.life / splash.maxLife
    })

    // Hide unused particles
    for (let i = splashes.current.length; i < MAX_SPLASHES; i++) {
      positions[i * 3 + 1] = -1000
      sizes[i] = 0
      opacities[i] = 0
    }

    splashGeometry.attributes.position.needsUpdate = true
    splashGeometry.attributes.size.needsUpdate = true
    splashGeometry.attributes.opacity.needsUpdate = true
  })

  // Vertex shader with all interactive effects
  const vertexShader = `
    uniform float uTime;
    uniform float uWaveHeight;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vDisplacement;

    // Simplex noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vUv = uv;

      vec2 worldPos = (modelMatrix * vec4(position, 1.0)).xz;

      // Base waves
      float height = snoise(worldPos * 0.02 + uTime * 0.1) * 2.0;
      height += snoise(worldPos * 0.05 + uTime * 0.2) * 1.0;
      height += snoise(worldPos * 0.1 + uTime * 0.3) * 0.5;
      height *= uWaveHeight;

      // Calculate normal
      float delta = 0.5;
      float hL = snoise((worldPos + vec2(-delta, 0.0)) * 0.02 + uTime * 0.1) * 2.0;
      float hR = snoise((worldPos + vec2(delta, 0.0)) * 0.02 + uTime * 0.1) * 2.0;
      float hD = snoise((worldPos + vec2(0.0, -delta)) * 0.02 + uTime * 0.1) * 2.0;
      float hU = snoise((worldPos + vec2(0.0, delta)) * 0.02 + uTime * 0.1) * 2.0;

      vNormal = normalize(vec3(hL - hR, 2.0 * delta, hD - hU));
      vDisplacement = height;

      vec3 newPos = position + vec3(0.0, height, 0.0);
      vWorldPos = (modelMatrix * vec4(newPos, 1.0)).xyz;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
  `

  // Fragment shader
  const fragmentShader = `
    uniform vec3 uCameraPos;
    uniform vec3 uSunDir;
    uniform vec3 uSunColor;
    uniform vec3 uWaterColor;
    uniform vec3 uDeepColor;
    uniform float uFoamStrength;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vDisplacement;

    void main() {
      vec3 viewDir = normalize(uCameraPos - vWorldPos);

      // Fresnel
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);

      // Specular
      vec3 halfDir = normalize(uSunDir + viewDir);
      float specular = pow(max(0.0, dot(vNormal, halfDir)), 128.0);

      // Foam at crests
      float foam = smoothstep(0.8, 1.2, vDisplacement / 2.0) * uFoamStrength;

      // Color mixing
      vec3 color = mix(uDeepColor, uWaterColor, fresnel);
      color += uSunColor * specular * 0.5;
      color = mix(color, vec3(1.0), foam * 0.8);

      gl_FragColor = vec4(color, 0.9 + foam * 0.1);
    }
  `

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCameraPos: { value: new THREE.Vector3() },
    uSunDir: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
    uSunColor: { value: new THREE.Color(isNight ? '#4488ff' : '#ffffee') },
    uWaterColor: { value: new THREE.Color(isNight ? '#001a33' : '#006994') },
    uDeepColor: { value: new THREE.Color(isNight ? '#000814' : '#003d5c') },
    uWaveHeight: { value: weather === 'storm' ? 2.0 : 1.0 },
    uFoamStrength: { value: weather === 'storm' ? 1.0 : 0.3 }
  }), [isNight, weather])

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = timeRef.current
      materialRef.current.uniforms.uCameraPos.value.copy(camera.position)
    }
  })

  return (
    <group>
      {/* Main water mesh */}
      <mesh
        ref={meshRef}
        position={[0, -2.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[1000, 1000, 256, 256]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Splash particles */}
      <points geometry={splashGeometry}>
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`
            attribute float size;
            attribute float opacity;
            varying float vOpacity;
            void main() {
              vOpacity = opacity;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying float vOpacity;
            void main() {
              vec2 coord = gl_PointCoord - vec2(0.5);
              float dist = length(coord);
              if (dist > 0.5) discard;
              float alpha = (1.0 - dist * 2.0) * vOpacity;
              gl_FragColor = vec4(0.8, 0.9, 1.0, alpha);
            }
          `}
        />
      </points>

      {/* Wake trail lines */}
      <WakeTrailsRenderer trails={wakeTrails} />
    </group>
  )
}

// Wake trail renderer component
function WakeTrailsRenderer({ trails }: { trails: React.MutableRefObject<Map<string, WakeTrail>> }) {
  const groupRef = useRef<THREE.Group>(null)
  const lineGeometries = useRef<Map<string, THREE.BufferGeometry>>(new Map())

  useFrame(() => {
    trails.current.forEach((trail, id) => {
      let geometry = lineGeometries.current.get(id)
      if (!geometry) {
        geometry = new THREE.BufferGeometry()
        lineGeometries.current.set(id, geometry)
      }

      const positions = new Float32Array(trail.points.length * 3)
      trail.points.forEach((point, i) => {
        positions[i * 3] = point.x
        positions[i * 3 + 1] = point.y + 0.1
        positions[i * 3 + 2] = point.z
      })

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    })
  })

  // Filter out entries without geometry before rendering
  const trailEntries = Array.from(trails.current.entries()).filter(([id]) => 
    lineGeometries.current.has(id)
  )

  if (trailEntries.length === 0) return null

  return (
    <group ref={groupRef}>
      {trailEntries.map(([id]) => {
        const geometry = lineGeometries.current.get(id)
        if (!geometry) return null
        return (
          <line key={id}>
            <primitive object={geometry} attach="geometry" />
            <lineBasicMaterial attach="material" color="#ffffff" transparent opacity={0.3} />
          </line>
        )
      })}
    </group>
  )
}

// Hook for creating splash effects from other components
export function useSplashEffect() {
  const createSplash = useCallback((position: THREE.Vector3, intensity: number) => {
    console.log(`Splash at ${position.x}, ${position.z} with intensity ${intensity}`)
  }, [])

  return { createSplash }
}
