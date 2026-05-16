import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../../store/useGameStore'
import { useShaderTime } from './LightRigAnimations'
import { SparkEffect } from './SparkEffect'

interface LightRigProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  shipId: string
  installed?: boolean
  onInstallComplete?: () => void
}

// =============================================================================
// LED STRIP ARRAY WITH INDIVIDUAL ADDRESSABLE LEDS
// =============================================================================

export function LEDStripArray({
  position,
  rotation = [0, 0, 0],
  installed = false,
  onInstallComplete
}: LightRigProps) {
  const groupRef = useRef<THREE.Group>(null)
  const ledsRef = useRef<THREE.InstancedMesh>(null)
  const [installProgress, setInstallProgress] = useState(installed ? 1 : 0)
  const [powerOnProgress, setPowerOnProgress] = useState(installed ? 1 : 0)
  const [sparks, setSparks] = useState<Array<{ id: number; pos: THREE.Vector3; time: number }>>([])

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
  }, [installed, installProgress, onInstallComplete, position])

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
  useFrame(state => {
    if (!ledsRef.current || powerOnProgress < 1) return

    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatPhase = (time % beatDuration) / beatDuration

    const dummy = new THREE.Object3D()
    const color = new THREE.Color()

    for (let i = 0; i < LED_COUNT; i++) {
      // Position LED along strip
      dummy.position.set((i / (LED_COUNT - 1) - 0.5) * STRIP_LENGTH, 0, 0)
      dummy.updateMatrix()
      ledsRef.current.setMatrixAt(i, dummy.matrix)

      // Color based on position and beat - chasing pattern
      const ledPhase = (i / LED_COUNT + beatPhase) % 1
      const hueBase = (time * 0.1) % 1
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
      points.push(
        new THREE.Vector3(position[0] + sway, currentY, position[2])
      )
    }
    return points
  }, [installProgress, time, position])

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

// =============================================================================
// MOVING HEAD SPOTLIGHT WITH BEAM EFFECT
// =============================================================================

export function MovingHeadSpotlight({
  position,
  rotation = [0, 0, 0],
  installed = false,
  onInstallComplete
}: LightRigProps) {
  const headRef = useRef<THREE.Group>(null)
  const beamRef = useRef<THREE.Mesh>(null)
  const [installProgress, setInstallProgress] = useState(installed ? 1 : 0)
  const [powerOnProgress, setPowerOnProgress] = useState(installed ? 1 : 0)
  const [sparks, setSparks] = useState<Array<{ id: number; pos: THREE.Vector3 }>>([])

  const bpm = useGameStore(state => state.bpm)

  // Installation
  useEffect(() => {
    if (!installed && installProgress < 1) {
      const interval = setInterval(() => {
        setInstallProgress(prev => {
          const next = prev + 0.015
          if (next >= 1) {
            setSparks([
              {
                id: Date.now(),
                pos: new THREE.Vector3(position[0], position[1] + 2, position[2])
              }
            ])
            setTimeout(() => setPowerOnProgress(0.1), 600)
            onInstallComplete?.()
            return 1
          }
          return next
        })
      }, 16)
      return () => clearInterval(interval)
    }
  }, [installed, installProgress, onInstallComplete, position])

  useEffect(() => {
    if (powerOnProgress > 0 && powerOnProgress < 1) {
      const interval = setInterval(() => {
        setPowerOnProgress(prev => Math.min(1, prev + 0.04))
      }, 60)
      return () => clearInterval(interval)
    }
  }, [powerOnProgress])

  // Moving head animation
  useFrame(state => {
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
  const beamUniforms = useMemo(
    () => ({
      uColor: { value: beamColor },
      uIntensity: { value: 1.5 },
      uTime: { value: 0 }
    }),
    [beamColor]
  )

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

// =============================================================================
// LASER PROJECTOR WITH VISIBLE BEAMS
// =============================================================================

export function LaserProjector({
  position,
  rotation = [0, 0, 0],
  installed = false,
  onInstallComplete
}: LightRigProps) {
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
  }, [installed, installProgress, onInstallComplete])

  useEffect(() => {
    if (powerOnProgress > 0 && powerOnProgress < 1) {
      const interval = setInterval(() => {
        setPowerOnProgress(prev => Math.min(1, prev + 0.06))
      }, 40)
      return () => clearInterval(interval)
    }
  }, [powerOnProgress])

  // Laser patterns
  useFrame(state => {
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
      {lasers.map(laser => (
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
function LaserBeam({
  color,
  patternPhase,
  offset,
  angle
}: {
  color: THREE.Color
  patternPhase: number
  offset: number
  angle: number
}) {
  const beamRef = useRef<THREE.Mesh>(null)
  const timeRef = useShaderTime()

  // Memoize uniforms
  const uniforms = useMemo(
    () => ({
      uColor: { value: color },
      uTime: { value: 0 }
    }),
    [color]
  )

  useFrame(state => {
    if (!beamRef.current) return

    const time = state.clock.elapsedTime

    // Different patterns based on phase
    let rotX = 0,
      rotZ = 0

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

// =============================================================================
// STROBE BANK
// =============================================================================

export function StrobeBank({
  position,
  rotation = [0, 0, 0],
  installed = false,
  onInstallComplete
}: LightRigProps) {
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
  }, [installed, installProgress, onInstallComplete])

  useEffect(() => {
    if (powerOnProgress > 0 && powerOnProgress < 1) {
      const interval = setInterval(() => {
        setPowerOnProgress(prev => Math.min(1, prev + 0.08))
      }, 40)
      return () => clearInterval(interval)
    }
  }, [powerOnProgress])

  // Strobe flashing
  useFrame(state => {
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
            <pointLight intensity={20} distance={30} color="#ffffff" />
          )}
        </mesh>
      ))}
    </group>
  )
}

// =============================================================================
// NEON/LED TUBE ARRANGEMENT
// =============================================================================

export function NeonTubeArrangement({
  position,
  rotation = [0, 0, 0],
  installed = false,
  onInstallComplete
}: LightRigProps) {
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
  }, [installed, installProgress, onInstallComplete])

  useEffect(() => {
    if (powerOnProgress > 0 && powerOnProgress < 1) {
      const interval = setInterval(() => {
        setPowerOnProgress(prev => Math.min(1, prev + 0.03))
      }, 60)
      return () => clearInterval(interval)
    }
  }, [powerOnProgress])

  // Neon flicker effect
  useFrame(state => {
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
    { pos: [3, 0.2, 0] as [number, number, number], len: 6, color: '#ff6600' }
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
