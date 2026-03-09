import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

// Custom hook for safe time access
function useShaderTime() {
  const timeRef = useRef(0)
  useFrame((state) => {
    timeRef.current = state.clock.elapsedTime
  })
  return timeRef
}

// =============================================================================
// SPECTACULAR LIGHT RIG SYSTEM - HarborGlow
// LED strips, moving heads, lasers, strobes, neon tubes with installation animation
// =============================================================================

interface LightRigProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  shipId: string
  installed?: boolean
  onInstallComplete?: () => void
}

interface LightShowProps {
  enabled?: boolean
}

// ============================================================================
// LIGHT RIG TYPES
// ============================================================================

// LED Strip Array with individual addressable LEDs
function LEDStripArray({ position, rotation = [0, 0, 0], installed = false, onInstallComplete }: LightRigProps) {
  const groupRef = useRef<THREE.Group>(null)
  const ledsRef = useRef<THREE.InstancedMesh>(null)
  const [installProgress, setInstallProgress] = useState(installed ? 1 : 0)
  const [powerOnProgress, setPowerOnProgress] = useState(installed ? 1 : 0)
  const [sparks, setSparks] = useState<Array<{id: number, pos: THREE.Vector3, time: number}>>([])

  const bpm = useGameStore(state => state.bpm)
  const time = useThree().clock.elapsedTime

  const LED_COUNT = 24
  const STRIP_LENGTH = 12

  // Installation animation
  useEffect(() => {
    if (!installed && installProgress < 1) {
      const interval = setInterval(() => {
        setInstallProgress(prev => {
          const next = prev + 0.02
          if (next >= 1) {
            // Installation complete - trigger sparks and power on
            const newSparks = Array.from({ length: 8 }, (_, i) => ({
              id: Date.now() + i,
              pos: new THREE.Vector3(
                position[0] + (Math.random() - 0.5) * STRIP_LENGTH,
                position[1],
                position[2] + (Math.random() - 0.5) * 2
              ),
              time: 0
            }))
            setSparks(newSparks)

            // Start power on sequence
            setTimeout(() => {
              setPowerOnProgress(0.1)
            }, 500)

            onInstallComplete?.()
            return 1
          }
          return next
        })
      }, 16)
      return () => clearInterval(interval)
    }
  }, [installed])

  // Power on sequence
  useEffect(() => {
    if (powerOnProgress > 0 && powerOnProgress < 1) {
      const interval = setInterval(() => {
        setPowerOnProgress(prev => Math.min(1, prev + 0.05))
      }, 50)
      return () => clearInterval(interval)
    }
  }, [powerOnProgress])

  // Update LED colors based on music
  useFrame((state) => {
    if (!ledsRef.current || powerOnProgress < 1) return

    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatPhase = (time % beatDuration) / beatDuration
    const hueBase = (time * 0.1) % 1

    const dummy = new THREE.Object3D()
    const color = new THREE.Color()

    for (let i = 0; i < LED_COUNT; i++) {
      // Position LED along strip
      dummy.position.set(
        (i / (LED_COUNT - 1) - 0.5) * STRIP_LENGTH,
        0,
        0
      )
      dummy.updateMatrix()
      ledsRef.current.setMatrixAt(i, dummy.matrix)

      // Color based on position and beat - chasing pattern
      const ledPhase = (i / LED_COUNT + beatPhase) % 1
      const hue = (hueBase + ledPhase * 0.3) % 1
      const intensity = 0.5 + Math.sin(ledPhase * Math.PI * 2) * 0.5 * beatPhase

      color.setHSL(hue, 1, 0.5 * intensity)
      ledsRef.current.setColorAt(i, color)
    }

    ledsRef.current.instanceMatrix.needsUpdate = true
    if (ledsRef.current.instanceColor) {
      ledsRef.current.instanceColor.needsUpdate = true
    }
  })

  // Cable animation during installation
  const cablePoints = useMemo(() => {
    const points: THREE.Vector3[] = []
    const startY = position[1] + 20 // Crane height
    const segments = 20

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const currentY = startY - (startY - position[1]) * installProgress * t
      const sway = Math.sin(time * 2 + t * 3) * 0.5 * (1 - installProgress)
      points.push(new THREE.Vector3(
        position[0] + sway,
        currentY,
        position[2]
      ))
    }
    return points
  }, [installProgress, time])

  const cableCurve = useMemo(() => new THREE.CatmullRomCurve3(cablePoints), [cablePoints])

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Cable during installation */}
      {installProgress < 1 && (
        <mesh>
          <tubeGeometry args={[cableCurve, 20, 0.05, 8, false]} />
          <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
        </mesh>
      )}

      {/* LED Strip Housing */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[STRIP_LENGTH, 0.3, 0.5]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Individual LEDs */}
      <instancedMesh
        ref={ledsRef}
        args={[undefined, undefined, LED_COUNT]}
        position={[0, 0.2, 0]}
      >
        <boxGeometry args={[0.3, 0.15, 0.3]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Connection sparks */}
      {sparks.map(spark => (
        <SparkEffect
          key={spark.id}
          position={[spark.pos.x, spark.pos.y, spark.pos.z]}
          onComplete={() => setSparks(prev => prev.filter(s => s.id !== spark.id))}
        />
      ))}

      {/* Power on glow effect */}
      {powerOnProgress > 0 && powerOnProgress < 1 && (
        <pointLight
          intensity={powerOnProgress * 5}
          distance={10}
          color="#00ffff"
        />
      )}
    </group>
  )
}

// Moving Head Spotlight with Beam Effect
function MovingHeadSpotlight({ position, rotation = [0, 0, 0], installed = false, onInstallComplete }: LightRigProps) {
  const headRef = useRef<THREE.Group>(null)
  const beamRef = useRef<THREE.Mesh>(null)
  const [installProgress, setInstallProgress] = useState(installed ? 1 : 0)
  const [powerOnProgress, setPowerOnProgress] = useState(installed ? 1 : 0)
  const [sparks, setSparks] = useState<Array<{id: number, pos: THREE.Vector3}>>([])

  const bpm = useGameStore(state => state.bpm)

  // Installation
  useEffect(() => {
    if (!installed && installProgress < 1) {
      const interval = setInterval(() => {
        setInstallProgress(prev => {
          const next = prev + 0.015
          if (next >= 1) {
            setSparks([{
              id: Date.now(),
              pos: new THREE.Vector3(position[0], position[1] + 2, position[2])
            }])
            setTimeout(() => setPowerOnProgress(0.1), 600)
            onInstallComplete?.()
            return 1
          }
          return next
        })
      }, 16)
      return () => clearInterval(interval)
    }
  }, [installed])

  useEffect(() => {
    if (powerOnProgress > 0 && powerOnProgress < 1) {
      const interval = setInterval(() => {
        setPowerOnProgress(prev => Math.min(1, prev + 0.04))
      }, 60)
      return () => clearInterval(interval)
    }
  }, [powerOnProgress])

  // Moving head animation
  useFrame((state) => {
    if (!headRef.current || powerOnProgress < 1) return

    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatPhase = (time % beatDuration) / beatDuration

    // Pan and tilt based on beat patterns
    const panSpeed = 0.5 + beatPhase * 2
    const tiltSpeed = 0.3

    headRef.current.rotation.y = Math.sin(time * panSpeed) * 0.8
    headRef.current.rotation.x = Math.sin(time * tiltSpeed) * 0.4 - 0.2
  })

  // Beam geometry
  const beamGeometry = useMemo(() => {
    const geometry = new THREE.ConeGeometry(0.8, 40, 32, 1, true)
    geometry.translate(0, -20, 0)
    return geometry
  }, [])

  const timeRef = useShaderTime()
  const [beamColor, setBeamColor] = useState(() => new THREE.Color().setHSL(0, 1, 0.6))
  
  useFrame(() => {
    const hue = (timeRef.current * 0.1) % 1
    setBeamColor(prev => prev.setHSL(hue, 1, 0.6))
  })

  // Memoize uniforms to prevent recreation on every render
  const beamUniforms = useMemo(() => ({
    uColor: { value: beamColor },
    uIntensity: { value: 1.5 },
    uTime: { value: 0 }
  }), [beamColor])

  // Update time uniform each frame
  useFrame(() => {
    if (beamRef.current) {
      const material = beamRef.current.material as THREE.ShaderMaterial
      if (material.uniforms?.uTime) {
        material.uniforms.uTime.value = timeRef.current
      }
    }
  })

  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.8, 1, 32]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Moving Head */}
      <group ref={headRef} position={[0, 1.5, 0]}>
        {/* Yoke */}
        <mesh position={[-1.2, 0, 0]}>
          <boxGeometry args={[0.3, 2, 0.5]} />
          <meshStandardMaterial color="#444" metalness={0.7} />
        </mesh>
        <mesh position={[1.2, 0, 0]}>
          <boxGeometry args={[0.3, 2, 0.5]} />
          <meshStandardMaterial color="#444" metalness={0.7} />
        </mesh>

        {/* Lamp housing */}
        <mesh>
          <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Light source */}
        <mesh position={[0, -0.5, 0]}>
          <circleGeometry args={[0.7, 32]} />
          <meshBasicMaterial color={beamColor} toneMapped={false} />
        </mesh>

        {/* Volumetric Beam */}
        {powerOnProgress === 1 && (
          <mesh ref={beamRef} geometry={beamGeometry} rotation={[Math.PI, 0, 0]}>
            <shaderMaterial
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              vertexShader={`
                varying vec2 vUv;
                varying vec3 vWorldPos;
                void main() {
                  vUv = uv;
                  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                uniform vec3 uColor;
                uniform float uIntensity;
                uniform float uTime;
                varying vec2 vUv;
                varying vec3 vWorldPos;

                void main() {
                  // Fade out at edges and distance
                  float edgeFade = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
                  edgeFade *= smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);

                  // Volumetric dust scattering
                  float dust = sin(vWorldPos.x * 50.0 + uTime) * sin(vWorldPos.z * 50.0 + uTime * 0.7);
                  dust = 0.5 + dust * 0.5;

                  // Distance fade
                  float distFade = 1.0 - vUv.y * 0.8;

                  float alpha = edgeFade * distFade * dust * uIntensity * 0.3;
                  gl_FragColor = vec4(uColor, alpha);
                }
              `}
              uniforms={beamUniforms}
            />
          </mesh>
        )}

        {/* Actual light */}
        {powerOnProgress === 1 && (
          <spotLight
            intensity={10}
            distance={80}
            angle={0.3}
            penumbra={0.3}
            color={beamColor}
            target-position={[0, -20, 0]}
          />
        )}
      </group>

      {/* Sparks */}
      {sparks.map(spark => (
        <SparkEffect
          key={spark.id}
          position={[spark.pos.x, spark.pos.y, spark.pos.z]}
          onComplete={() => setSparks([])}
        />
      ))}
    </group>
  )
}

// Laser Projector with Visible Beams
function LaserProjector({ position, rotation = [0, 0, 0], installed = false, onInstallComplete }: LightRigProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [installProgress, setInstallProgress] = useState(installed ? 1 : 0)
  const [powerOnProgress, setPowerOnProgress] = useState(installed ? 1 : 0)
  const [patternPhase, setPatternPhase] = useState(0)

  const bpm = useGameStore(state => state.bpm)

  useEffect(() => {
    if (!installed && installProgress < 1) {
      const interval = setInterval(() => {
        setInstallProgress(prev => {
          if (prev + 0.02 >= 1) {
            setTimeout(() => setPowerOnProgress(0.1), 400)
            onInstallComplete?.()
            return 1
          }
          return prev + 0.02
        })
      }, 16)
      return () => clearInterval(interval)
    }
  }, [installed])

  useEffect(() => {
    if (powerOnProgress > 0 && powerOnProgress < 1) {
      const interval = setInterval(() => {
        setPowerOnProgress(prev => Math.min(1, prev + 0.06))
      }, 40)
      return () => clearInterval(interval)
    }
  }, [powerOnProgress])

  // Laser patterns
  useFrame((state) => {
    if (powerOnProgress < 1) return

    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatNum = Math.floor(time / beatDuration)

    // Change pattern every 8 beats
    setPatternPhase(Math.floor(beatNum / 8) % 4)
  })

  const laserCount = 6
  const lasers = useMemo(() => {
    return Array.from({ length: laserCount }, (_, i) => {
      const angle = (i / laserCount) * Math.PI * 2
      return {
        id: i,
        angle,
        color: new THREE.Color().setHSL((i / laserCount) * 0.8, 1, 0.6),
        offset: i * 0.5
      }
    })
  }, [])

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Projector housing */}
      <mesh>
        <boxGeometry args={[3, 2, 2]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Laser emitters */}
      {lasers.map((laser) => (
        <group key={laser.id} position={[Math.cos(laser.angle) * 1, 0, Math.sin(laser.angle) * 0.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.5]} />
            <meshBasicMaterial color={laser.color} />
          </mesh>

          {/* Laser beam */}
          {powerOnProgress === 1 && (
            <LaserBeam
              color={laser.color}
              patternPhase={patternPhase}
              offset={laser.offset}
              angle={laser.angle}
            />
          )}
        </group>
      ))}

      {/* Power indicator */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshBasicMaterial
          color={powerOnProgress === 1 ? '#00ff00' : '#ff0000'}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

// Individual laser beam with pattern animation
function LaserBeam({ color, patternPhase, offset, angle }: {
  color: THREE.Color
  patternPhase: number
  offset: number
  angle: number
}) {
  const beamRef = useRef<THREE.Mesh>(null)
  const timeRef = useShaderTime()

  // Memoize uniforms
  const uniforms = useMemo(() => ({
    uColor: { value: color },
    uTime: { value: 0 }
  }), [color])

  useFrame((state) => {
    if (!beamRef.current) return

    const time = state.clock.elapsedTime

    // Different patterns based on phase
    let rotX = 0, rotZ = 0

    switch (patternPhase) {
      case 0: // Circular sweep
        rotX = Math.sin(time * 0.5 + offset) * 0.5
        rotZ = Math.cos(time * 0.5 + offset) * 0.5
        break
      case 1: // Wave pattern
        rotX = Math.sin(time * 2 + offset * 2) * 0.3
        rotZ = Math.sin(time * 1.5 + offset) * 0.3
        break
      case 2: // Figure 8
        rotX = Math.sin(time + offset) * 0.4
        rotZ = Math.sin(time * 2 + offset) * 0.2
        break
      case 3: // Beat sync flash
        rotX = Math.sin(time + angle) * 0.2
        rotZ = Math.cos(time + angle) * 0.2
        break
    }

    beamRef.current.rotation.x = rotX
    beamRef.current.rotation.z = rotZ

    // Update time uniform
    const material = beamRef.current.material as THREE.ShaderMaterial
    if (material.uniforms?.uTime) {
      material.uniforms.uTime.value = timeRef.current
    }
  })

  return (
    <mesh ref={beamRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 100, 8]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          varying vec3 vWorldPos;
          void main() {
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform float uTime;
          varying vec3 vWorldPos;

          void main() {
            // Core beam
            float core = 1.0;

            // Atmospheric scattering (Mie scattering)
            float dist = length(vWorldPos);
            float scattering = exp(-dist * 0.01) * 0.5;

            // Pulse effect
            float pulse = 0.8 + sin(uTime * 10.0) * 0.2;

            vec3 finalColor = uColor * (core + scattering) * pulse;
            float alpha = (0.3 + scattering * 0.5) * pulse;

            gl_FragColor = vec4(finalColor, alpha);
          }
        `}
        uniforms={uniforms}
      />
    </mesh>
  )
}

// Strobe Bank
function StrobeBank({ position, rotation = [0, 0, 0], installed = false, onInstallComplete }: LightRigProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [installProgress, setInstallProgress] = useState(installed ? 1 : 0)
  const [powerOnProgress, setPowerOnProgress] = useState(installed ? 1 : 0)
  const [flashState, setFlashState] = useState(Array(8).fill(false))

  const bpm = useGameStore(state => state.bpm)

  useEffect(() => {
    if (!installed && installProgress < 1) {
      const interval = setInterval(() => {
        setInstallProgress(prev => {
          if (prev + 0.025 >= 1) {
            setTimeout(() => setPowerOnProgress(0.1), 300)
            onInstallComplete?.()
            return 1
          }
          return prev + 0.025
        })
      }, 16)
      return () => clearInterval(interval)
    }
  }, [installed])

  useEffect(() => {
    if (powerOnProgress > 0 && powerOnProgress < 1) {
      const interval = setInterval(() => {
        setPowerOnProgress(prev => Math.min(1, prev + 0.08))
      }, 40)
      return () => clearInterval(interval)
    }
  }, [powerOnProgress])

  // Strobe flashing
  useFrame((state) => {
    if (powerOnProgress < 1) return

    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatNum = Math.floor(time / beatDuration)
    const beatPhase = (time % beatDuration) / beatDuration

    // Different patterns
    const pattern = beatNum % 4

    setFlashState(prev => {
      const newState = [...prev]

      for (let i = 0; i < 8; i++) {
        switch (pattern) {
          case 0: // All on beat
            newState[i] = beatPhase < 0.1
            break
          case 1: // Alternating
            newState[i] = beatPhase < 0.1 && i % 2 === beatNum % 2
            break
          case 2: // Chase
            newState[i] = beatPhase < 0.1 && i === beatNum % 8
            break
          case 3: // Random
            newState[i] = beatPhase < 0.1 && Math.random() > 0.3
            break
        }
      }
      return newState
    })
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Housing */}
      <mesh>
        <boxGeometry args={[8, 1.5, 2]} />
        <meshStandardMaterial color="#222" metalness={0.8} />
      </mesh>

      {/* Strobe lights */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[(i - 3.5) * 1, 0.3, 0]}>
          <circleGeometry args={[0.35, 32]} />
          <meshBasicMaterial
            color={flashState[i] ? '#ffffff' : '#444444'}
            toneMapped={false}
          />
          {flashState[i] && powerOnProgress === 1 && (
            <pointLight
              intensity={20}
              distance={30}
              color="#ffffff"
            />
          )}
        </mesh>
      ))}
    </group>
  )
}

// Neon/LED Tube Arrangement
function NeonTubeArrangement({ position, rotation = [0, 0, 0], installed = false, onInstallComplete }: LightRigProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [installProgress, setInstallProgress] = useState(installed ? 1 : 0)
  const [powerOnProgress, setPowerOnProgress] = useState(installed ? 1 : 0)
  const [flicker, setFlicker] = useState(1)

  const bpm = useGameStore(state => state.bpm)

  useEffect(() => {
    if (!installed && installProgress < 1) {
      const interval = setInterval(() => {
        setInstallProgress(prev => {
          if (prev + 0.02 >= 1) {
            setTimeout(() => setPowerOnProgress(0.1), 500)
            onInstallComplete?.()
            return 1
          }
          return prev + 0.02
        })
      }, 16)
      return () => clearInterval(interval)
    }
  }, [installed])

  useEffect(() => {
    if (powerOnProgress > 0 && powerOnProgress < 1) {
      const interval = setInterval(() => {
        setPowerOnProgress(prev => Math.min(1, prev + 0.03))
      }, 60)
      return () => clearInterval(interval)
    }
  }, [powerOnProgress])

  // Neon flicker effect
  useFrame((state) => {
    if (powerOnProgress < 1) return

    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatPhase = (time % beatDuration) / beatDuration

    // Occasional flicker on beat
    if (beatPhase < 0.05 && Math.random() > 0.7) {
      setFlicker(0.5 + Math.random() * 0.5)
    } else {
      setFlicker(1)
    }
  })

  const tubes = [
    { pos: [-3, 0, 0] as [number, number, number], len: 6, color: '#ff00ff' },
    { pos: [-1, 0.5, 0] as [number, number, number], len: 7, color: '#00ffff' },
    { pos: [1, -0.3, 0] as [number, number, number], len: 5, color: '#ffff00' },
    { pos: [3, 0.2, 0] as [number, number, number], len: 6, color: '#ff6600' },
  ]

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Mounting rail */}
      <mesh>
        <boxGeometry args={[10, 0.3, 0.3]} />
        <meshStandardMaterial color="#333" metalness={0.8} />
      </mesh>

      {/* Neon tubes */}
      {tubes.map((tube, i) => (
        <group key={i} position={tube.pos}>
          {/* Tube housing */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.15, 0.15, tube.len]} />
            <meshStandardMaterial
              color={tube.color}
              emissive={tube.color}
              emissiveIntensity={powerOnProgress * flicker}
              toneMapped={false}
            />
          </mesh>

          {/* Glow effect */}
          {powerOnProgress === 1 && (
            <mesh rotation={[0, 0, Math.PI / 2]} scale={[1.5, 1, 1.5]}>
              <cylinderGeometry args={[0.15, 0.15, tube.len]} />
              <meshBasicMaterial
                color={tube.color}
                transparent
                opacity={0.3 * flicker}
                toneMapped={false}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

// Spark Effect for electrical connections
function SparkEffect({ position, onComplete }: { position: [number, number, number], onComplete: () => void }) {
  const particlesRef = useRef<THREE.Points>(null)
  const [life, setLife] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setLife(prev => {
        if (prev <= 0) {
          onComplete()
          return 0
        }
        return prev - 0.05
      })
    }, 16)
    return () => clearInterval(interval)
  }, [])

  const particles = useMemo(() => {
    const count = 20
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0

      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 0.1 + Math.random() * 0.2

      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      velocities[i * 3 + 1] = Math.cos(phi) * speed
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed
    }

    return { positions, velocities }
  }, [])

  useFrame(() => {
    if (!particlesRef.current) return

    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < 20; i++) {
      posArray[i * 3] += particles.velocities[i * 3]
      posArray[i * 3 + 1] += particles.velocities[i * 3 + 1]
      posArray[i * 3 + 2] += particles.velocities[i * 3 + 2]

      // Gravity
      particles.velocities[i * 3 + 1] -= 0.005
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={20}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#ffff00"
        transparent
        opacity={life}
        toneMapped={false}
      />
    </points>
  )
}

// ============================================================================
// MAIN LIGHT SHOW COMPONENT
// ============================================================================

export default function LightShow({ enabled = true }: LightShowProps) {
  const [installedRigs, setInstalledRigs] = useState<Set<string>>(new Set())
  const ships = useGameStore(state => state.ships)
  const isNight = useGameStore(state => state.isNight)
  const timeOfDay = useGameStore(state => state.timeOfDay)

  // Install rigs on upgraded ships
  useEffect(() => {
    const upgradedShips = ships.filter(s => s.version === '2.0')

    upgradedShips.forEach((ship, index) => {
      if (!installedRigs.has(ship.id)) {
        // Stagger installation
        setTimeout(() => {
          setInstalledRigs(prev => new Set([...prev, ship.id]))
        }, index * 2000)
      }
    })
  }, [ships])

  // Only show at night
  if (!enabled || (!isNight && timeOfDay > 8 && timeOfDay < 18)) return null

  const upgradedShips = ships.filter(s => s.version === '2.0')

  return (
    <group>
      {upgradedShips.map((ship) => {
        const isInstalled = installedRigs.has(ship.id)
        const basePos = ship.position

        return (
          <group key={ship.id}>
            {/* LED Strips along deck edges */}
            <LEDStripArray
              position={[basePos[0] - 10, basePos[1] + 8, basePos[2] + 5]}
              rotation={[0, 0, 0]}
              shipId={ship.id}
              installed={isInstalled}
            />
            <LEDStripArray
              position={[basePos[0] + 10, basePos[1] + 8, basePos[2] - 5]}
              rotation={[0, Math.PI, 0]}
              shipId={ship.id}
              installed={isInstalled}
            />

            {/* Moving head spotlights on corners */}
            <MovingHeadSpotlight
              position={[basePos[0] - 12, basePos[1] + 12, basePos[2] + 8]}
              shipId={ship.id}
              installed={isInstalled}
            />
            <MovingHeadSpotlight
              position={[basePos[0] + 12, basePos[1] + 12, basePos[2] - 8]}
              shipId={ship.id}
              installed={isInstalled}
            />

            {/* Laser projector on mast */}
            <LaserProjector
              position={[basePos[0], basePos[1] + 15, basePos[2]]}
              shipId={ship.id}
              installed={isInstalled}
            />

            {/* Strobe bank on bridge */}
            <StrobeBank
              position={[basePos[0] + 5, basePos[1] + 10, basePos[2]]}
              rotation={[0, Math.PI / 4, 0]}
              shipId={ship.id}
              installed={isInstalled}
            />

            {/* Neon tubes on superstructure */}
            <NeonTubeArrangement
              position={[basePos[0] - 5, basePos[1] + 6, basePos[2] + 3]}
              shipId={ship.id}
              installed={isInstalled}
            />
          </group>
        )
      })}

      {/* Fog for laser visibility */}
      <FogEffect />
    </group>
  )
}

// Volumetric fog for laser beams
function FogEffect() {
  const fogRef = useRef<THREE.Mesh>(null)
  const timeRef = useShaderTime()

  // Memoize uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), [])

  // Update time uniform
  useFrame(() => {
    if (fogRef.current) {
      const material = fogRef.current.material as THREE.ShaderMaterial
      if (material.uniforms?.uTime) {
        material.uniforms.uTime.value = timeRef.current
      }
    }
  })

  return (
    <mesh ref={fogRef} position={[0, 10, 0]}>
      <boxGeometry args={[200, 50, 200]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexShader={`
          varying vec3 vWorldPos;
          void main() {
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          varying vec3 vWorldPos;

          ${weatheringShader.functions}

          void main() {
            float noise = fbm(vWorldPos.xz * 0.05 + uTime * 0.1);
            float density = 0.02 + noise * 0.03;
            gl_FragColor = vec4(0.9, 0.95, 1.0, density);
          }
        `}
        uniforms={uniforms}
      />
    </mesh>
  )
}

// Re-export weathering shader for fog
const weatheringShader = {
  functions: `
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
      m = m*m ;
      m = m*m ;
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

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
  `
}

// Hook for light show state
export function useLightShow() {
  const isNight = useGameStore(state => state.isNight)
  const ships = useGameStore(state => state.ships)
  const upgradedCount = ships.filter(s => s.version === '2.0').length

  return {
    isActive: isNight && upgradedCount > 0,
    upgradedCount,
    totalLights: upgradedCount * 6 // Approx lights per ship
  }
}
