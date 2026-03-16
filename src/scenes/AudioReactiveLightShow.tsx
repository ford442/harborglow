import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore, ShipType } from '../store/useGameStore'
import { useAudioVisualSync } from '../systems/audioVisualSync'

// =============================================================================
// PHASE 8: AUDIO-REACTIVE LIGHT SHOW SYSTEM
// Light rigs that respond to FFT analysis - bass, mid, treble frequencies
// =============================================================================

interface AudioReactiveLightProps {
  position: [number, number, number]
  type: 'led-strip' | 'spotlight' | 'laser' | 'strobe' | 'neon'
  color?: string
  shipType: ShipType
}

// 8.1: Light Rigs driven by frequency bands
function AudioReactiveLight({ position, type, color = '#ffffff', shipType }: AudioReactiveLightProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const { audioData } = useAudioVisualSync()
  
  // Get frequency response based on light type
  const getFrequencyResponse = useCallback(() => {
    switch (type) {
      case 'led-strip':
        // LED strips respond to bass (beat)
        return { 
          intensity: audioData.bass * 2 + 0.2,
          saturation: 1,
          hueShift: audioData.beat ? 0.1 : 0
        }
      case 'spotlight':
        // Spotlights respond to mids (melody)
        return { 
          intensity: audioData.mid * 2.5 + 0.1,
          saturation: 0.8,
          hueShift: audioData.spectralCentroid * 0.2
        }
      case 'laser':
        // Lasers respond to treble (high energy)
        return { 
          intensity: audioData.treble * 3,
          saturation: 1,
          hueShift: 0
        }
      case 'strobe':
        // Strobes flash on beat
        return { 
          intensity: audioData.beat ? audioData.beatIntensity * 5 : 0,
          saturation: 1,
          hueShift: 0
        }
      case 'neon':
        // Neon tubes pulse with envelope
        return { 
          intensity: audioData.envelope * 1.5 + 0.5,
          saturation: 0.9,
          hueShift: audioData.beatPhase * 0.1
        }
    }
  }, [audioData, type])
  
  // Ship-specific color palettes
  const getShipColor = useCallback((baseHue: number) => {
    const palettes: Record<ShipType, { h: number; s: number; l: number }> = {
      cruise: { h: 340, s: 0.8, l: 0.6 }, // Pink
      container: { h: 160, s: 0.9, l: 0.5 }, // Cyan/Green
      tanker: { h: 25, s: 1, l: 0.5 }, // Orange
      bulk: { h: 45, s: 0.7, l: 0.5 }, // Brown/Gold
      lng: { h: 200, s: 0.9, l: 0.6 }, // Ice Blue
      roro: { h: 280, s: 0.8, l: 0.6 }, // Purple
      research: { h: 120, s: 0.7, l: 0.5 }, // Green
      droneship: { h: 0, s: 0, l: 0.7 } // White/Gray
    }
    
    const palette = palettes[shipType]
    const hue = (palette.h / 360 + baseHue) % 1
    return new THREE.Color().setHSL(hue, palette.s, palette.l)
  }, [shipType])
  
  useFrame(() => {
    if (!meshRef.current || !lightRef.current) return
    
    const response = getFrequencyResponse()
    const baseColor = getShipColor(response.hueShift)
    
    // Update material emissive intensity based on audio
    const material = meshRef.current.material as THREE.MeshStandardMaterial
    material.emissiveIntensity = response.intensity
    material.emissive.copy(baseColor)
    
    // Update light intensity
    lightRef.current.intensity = response.intensity * 2
    lightRef.current.color.copy(baseColor)
    
    // Scale mesh slightly with bass for physical feedback
    const scale = 1 + audioData.bass * 0.1
    meshRef.current.scale.setScalar(scale)
  })
  
  // Geometry based on light type
  const geometry = useMemo(() => {
    switch (type) {
      case 'led-strip':
        return new THREE.BoxGeometry(4, 0.2, 0.2)
      case 'spotlight':
        return new THREE.ConeGeometry(0.5, 1, 16)
      case 'laser':
        return new THREE.CylinderGeometry(0.05, 0.05, 10)
      case 'strobe':
        return new THREE.SphereGeometry(0.3)
      case 'neon':
        return new THREE.TubeGeometry(
          new THREE.LineCurve3(new THREE.Vector3(-2, 0, 0), new THREE.Vector3(2, 0, 0)),
          20, 0.1, 8, false
        )
    }
  }, [type])
  
  return (
    <group position={position}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          color={0x111111}
          emissive={color}
          emissiveIntensity={0.5}
          toneMapped={false}
        />
      </mesh>
      
      <pointLight
        ref={lightRef}
        intensity={1}
        distance={type === 'laser' ? 50 : 20}
        color={color}
      />
    </group>
  )
}

// 8.2: Audio-Reactive God Rays with shader uniforms
function AudioReactiveGodRay({ position, color }: { position: [number, number, number], color: string }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { audioData } = useAudioVisualSync()
  
  // Validate color before creating uniform
  const safeColor = useMemo(() => {
    try {
      return new THREE.Color(color)
    } catch {
      return new THREE.Color('#ffffff')
    }
  }, [color])
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: safeColor },
    uBaseIntensity: { value: 0.5 },
    uAudioBass: { value: 0 },
    uAudioMid: { value: 0 },
    uAudioEnvelope: { value: 0 },
    uAudioBeat: { value: 0 }
  }), [safeColor])
  
  useFrame((state) => {
    if (!materialRef.current) return
    
    const mat = materialRef.current
    if (!mat.uniforms) return
    
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uAudioBass.value = audioData?.bass ?? 0
    mat.uniforms.uAudioMid.value = audioData?.mid ?? 0
    mat.uniforms.uAudioEnvelope.value = audioData?.envelope ?? 0
    mat.uniforms.uAudioBeat.value = audioData?.beat ? audioData.beatIntensity : 0
  })
  
  // Ensure position is valid
  const safePosition: [number, number, number] = Array.isArray(position) && position.length === 3 
    ? position 
    : [0, 0, 0]

  return (
    <mesh position={safePosition} rotation={[-Math.PI / 2, 0, 0]}>
      <coneGeometry args={[2, 20, 32, 1, true]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          varying float vHeight;
          void main() {
            vUv = uv;
            vHeight = position.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uBaseIntensity;
          uniform float uAudioBass;
          uniform float uAudioMid;
          uniform float uAudioEnvelope;
          uniform float uAudioBeat;
          
          varying vec2 vUv;
          varying float vHeight;
          
          void main() {
            // Base fade from bottom to top
            float alpha = (1.0 - vUv.y) * uBaseIntensity;
            
            // Audio-reactive intensity
            float audioBoost = uAudioBass * 0.5 + uAudioMid * 0.3;
            alpha *= (1.0 + audioBoost);
            
            // Beat flash
            if (uAudioBeat > 0.5) {
              alpha *= 1.5;
            }
            
            // Animated shimmer synced to envelope
            float shimmer = 0.8 + 0.2 * sin(uTime * 3.0 + vUv.y * 8.0 + uAudioEnvelope * 5.0);
            alpha *= shimmer;
            
            // Color temperature shift based on mid frequencies
            vec3 finalColor = uColor;
            if (uAudioMid > 0.5) {
              finalColor = mix(finalColor, vec3(1.0, 0.9, 0.7), uAudioMid * 0.3);
            }
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// 8.3: Main Light Show Component with Audio Reactivity
interface AudioReactiveLightShowProps {
  enabled?: boolean
}

export default function AudioReactiveLightShow({ enabled = true }: AudioReactiveLightShowProps) {
  const ships = useGameStore(state => state.ships)
  const { audioData } = useAudioVisualSync()
  
  // Only show for v2.0 ships with valid positions
  const upgradedShips = ships.filter(s => s.version === '2.0' && Array.isArray(s.position) && s.position.length === 3)
  
  if (!enabled || upgradedShips.length === 0) return null
  
  return (
    <group>
      {upgradedShips.map((ship) => {
        const basePos = ship.position
        
        return (
          <group key={ship.id}>
            {/* LED Strips - respond to bass */}
            <AudioReactiveLight
              position={[basePos[0] - 10, basePos[1] + 8, basePos[2] + 5]}
              type="led-strip"
              shipType={ship.type}
            />
            <AudioReactiveLight
              position={[basePos[0] + 10, basePos[1] + 8, basePos[2] - 5]}
              type="led-strip"
              shipType={ship.type}
            />
            
            {/* Spotlights - respond to mids */}
            <AudioReactiveLight
              position={[basePos[0] - 12, basePos[1] + 12, basePos[2] + 8]}
              type="spotlight"
              shipType={ship.type}
            />
            <AudioReactiveLight
              position={[basePos[0] + 12, basePos[1] + 12, basePos[2] - 8]}
              type="spotlight"
              shipType={ship.type}
            />
            
            {/* Lasers - respond to treble */}
            <AudioReactiveLight
              position={[basePos[0], basePos[1] + 15, basePos[2]]}
              type="laser"
              shipType={ship.type}
            />
            
            {/* Strobes - flash on beat */}
            <AudioReactiveLight
              position={[basePos[0] + 5, basePos[1] + 10, basePos[2]]}
              type="strobe"
              shipType={ship.type}
            />
            
            {/* Neon tubes - pulse with envelope */}
            <AudioReactiveLight
              position={[basePos[0] - 5, basePos[1] + 6, basePos[2] + 3]}
              type="neon"
              shipType={ship.type}
            />
            
            {/* Audio-reactive god rays */}
            <AudioReactiveGodRay
              position={[basePos[0], basePos[1] + 20, basePos[2]]}
              color={{
                cruise: '#ff6b9d',
                container: '#00d4aa',
                tanker: '#ff9500',
                bulk: '#d4a574',
                lng: '#88ccff',
                roro: '#cc88ff',
                research: '#88ff88',
                droneship: '#cccccc'
              }[ship.type]}
            />
            
            {/* Ambient glow that follows audio envelope */}
            <AudioReactiveAmbientLight shipPosition={basePos} audioData={audioData} />
          </group>
        )
      })}
    </group>
  )
}

// Ambient light that pulses with the overall audio energy
function AudioReactiveAmbientLight({ 
  shipPosition, 
  audioData 
}: { 
  shipPosition: [number, number, number]
  audioData: ReturnType<typeof useAudioVisualSync>['audioData']
}) {
  const lightRef = useRef<THREE.PointLight>(null)
  
  useFrame(() => {
    if (!lightRef.current) return
    
    // Ambient intensity follows overall energy
    const baseIntensity = 0.5
    const audioBoost = audioData.energy * 2
    const beatFlash = audioData.beat ? audioData.beatIntensity : 0
    
    lightRef.current.intensity = baseIntensity + audioBoost + beatFlash
    
    // Color temperature shifts with spectral centroid
    const warmth = audioData.spectralCentroid
    const color = new THREE.Color()
    color.setHSL(0.1 + warmth * 0.1, 0.8, 0.5)
    lightRef.current.color.copy(color)
  })
  
  return (
    <pointLight
      ref={lightRef}
      position={[shipPosition[0], shipPosition[1] + 10, shipPosition[2]]}
      intensity={0.5}
      distance={60}
      decay={2}
    />
  )
}

// Hook for individual light rigs to use audio data
export function useAudioReactiveLight(frequencyBand: 'bass' | 'mid' | 'treble' | 'envelope' = 'bass') {
  const { audioData } = useAudioVisualSync()
  
  return useMemo(() => {
    switch (frequencyBand) {
      case 'bass':
        return { intensity: audioData.bass, beat: audioData.beat }
      case 'mid':
        return { intensity: audioData.mid, phase: audioData.beatPhase }
      case 'treble':
        return { intensity: audioData.treble, energy: audioData.energy }
      case 'envelope':
        return { intensity: audioData.envelope, rms: audioData.rms }
    }
  }, [audioData, frequencyBand])
}
