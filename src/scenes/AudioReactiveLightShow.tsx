import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { buildRGBMatrixMaterial, buildGodRayMaterial } from '../shaders/lightShowNodes'
import { useGameStore, type ShipType } from '../store/useGameStore'
import { useAudioVisualSync } from '../systems/audioVisualSync'
import { AudioSpectrumTelemetry } from '../components/dashboard/TelemetryGraph'
import {
  computeRigMusicDrive,
  rigVariationSeed,
  type RigMusicState,
} from './lightRigs/rigPolish'
import { RigFlareAnchor, RigHousingShell, RigMicroGlint } from './lightRigs/RigPolishComponents'

// =============================================================================
// PHASE 8: AUDIO-REACTIVE LIGHT SHOW SYSTEM
// Light rigs that respond to FFT analysis - bass, mid, treble frequencies
// =============================================================================

interface AudioReactiveLightProps {
  position: [number, number, number]
  type: 'led-strip' | 'spotlight' | 'laser' | 'strobe' | 'neon'
  color?: string
  shipType: ShipType
  shipId: string
  rigKey: string
}

const HOUSING_BY_TYPE: Record<
  AudioReactiveLightProps['type'],
  { w: number; h: number; d: number }
> = {
  'led-strip': { w: 4, h: 0.28, d: 0.38 },
  spotlight: { w: 0.85, h: 0.85, d: 0.85 },
  laser: { w: 0.35, h: 0.35, d: 0.55 },
  strobe: { w: 0.55, h: 0.55, d: 0.55 },
  neon: { w: 4.2, h: 0.22, d: 0.28 },
}

function AudioReactiveLight({ position, type, color = '#ffffff', shipType, shipId, rigKey }: AudioReactiveLightProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const powerRef = useRef(0.5)
  const musicStateRef = useRef<RigMusicState>({ afterglow: 0, prevBeat: false })
  const { audioData } = useAudioVisualSync()
  const seed = rigVariationSeed(shipId, rigKey, type)
  const housing = HOUSING_BY_TYPE[type]
  const flareId = `show-${shipId}-${rigKey}`
  const material = useMemo(() => buildRGBMatrixMaterial(color), [color])

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
  
  const getShipColor = useCallback((baseHue: number, out: THREE.Color) => {
    const palettes: Record<ShipType, { h: number; s: number; l: number }> = {
      cruise: { h: 340, s: 0.8, l: 0.6 }, // Pink
      container: { h: 160, s: 0.9, l: 0.5 }, // Cyan/Green
      tanker: { h: 25, s: 1, l: 0.5 }, // Orange
      bulk: { h: 30, s: 0.6, l: 0.4 }, // Brown
      lng: { h: 195, s: 0.9, l: 0.6 }, // Light Blue
      roro: { h: 280, s: 0.7, l: 0.5 }, // Purple
      research: { h: 145, s: 0.8, l: 0.5 }, // Green
      droneship: { h: 0, s: 0, l: 0.8 }, // White/Gray
      ferry: { h: 155, s: 0.8, l: 0.5 }, // Teal/Green
      trawler: { h: 35, s: 0.7, l: 0.5 }, // Amber
      horizon: { h: 210, s: 0.8, l: 0.5 },  // Ocean Blue
      fireboat: { h: 0, s: 1, l: 0.5 },      // Emergency Red
      icebreaker: { h: 0, s: 0.85, l: 0.42 } // Yamal Red / ice cyan mix
    }
    
    const palette = palettes[shipType]
    const hue = (palette.h / 360 + baseHue) % 1
    return out.setHSL(hue, palette.s, palette.l)
  }, [shipType])
  
  useFrame((_, delta) => {
    if (!meshRef.current || !lightRef.current) return

    const response = getFrequencyResponse()
    const drive = computeRigMusicDrive(response.intensity, musicStateRef.current, delta)
    musicStateRef.current = drive.state
    powerRef.current = drive.emissive

    const mat = material as any
    if (mat.userData.uBass) mat.userData.uBass.value = audioData.bass
    if (mat.userData.uBeat) mat.userData.uBeat.value = audioData.beat ? 1 : 0
    if (mat.userData.uMid) mat.userData.uMid.value = audioData.mid
    if (mat.userData.uTreble) mat.userData.uTreble.value = audioData.treble
    
    // We still update intensity on the material itself if needed, but TSL handles emissive now
    mat.emissiveIntensity = drive.emissive * (0.75 + seed * 0.2)

    lightRef.current.intensity = drive.light * 2

    const scale = 1 + audioData.bass * 0.08 * drive.emissive
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
      <RigHousingShell
        width={housing.w * (0.96 + seed * 0.06)}
        height={housing.h}
        depth={housing.d}
        rimColor={color}
        powerRef={powerRef}
        bodyColor={`hsl(${210 + seed * 30}, 7%, ${12 + seed * 10}%)`}
      />

      <mesh ref={meshRef} geometry={geometry} position={[0, housing.h * 0.35, housing.d * 0.35]} material={material} />

      <pointLight
        ref={lightRef}
        intensity={1}
        distance={type === 'laser' ? 50 : 20}
        color={color}
        position={[0, housing.h * 0.5, 0]}
      />

      <RigMicroGlint color="#ffffff" powerRef={powerRef} seed={seed} />
      <RigFlareAnchor id={flareId} color={color} powerRef={powerRef} priority={60} />
    </group>
  )
}

// 8.2: Audio-Reactive God Rays with shader uniforms
function AudioReactiveGodRay({ position, color }: { position: [number, number, number], color: string }) {
  const { audioData } = useAudioVisualSync()
  const material = useMemo(() => buildGodRayMaterial(color), [color])
  
  useFrame((state) => {
    if (!material) return
    const mat = material as any
    if (mat.userData.uAudioBass) mat.userData.uAudioBass.value = audioData.bass
    if (mat.userData.uAudioMid) mat.userData.uAudioMid.value = audioData.mid
    if (mat.userData.uAudioEnvelope) mat.userData.uAudioEnvelope.value = audioData.envelope
    if (mat.userData.uAudioBeat) mat.userData.uAudioBeat.value = audioData.beat ? audioData.beatIntensity : 0
  })
  
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <coneGeometry args={[2, 20, 32, 1, true]} />
    </mesh>
  )
}

// 8.3: Main Light Show Component with Audio Reactivity
interface AudioReactiveLightShowProps {
  enabled?: boolean
}

const AUDIO_DEBUG =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('audioDebug') === '1'

export default function AudioReactiveLightShow({ enabled = true }: AudioReactiveLightShowProps) {
  const ships = useGameStore(state => state.ships)
  const { audioData } = useAudioVisualSync()

  const upgradedShips = ships.filter(s => s.version === '2.0')
  const debugAnchor = upgradedShips[0]?.position

  if (!enabled || upgradedShips.length === 0) return null

  return (
    <group>
      {AUDIO_DEBUG && debugAnchor && (
        <Html
          position={[debugAnchor[0] + 35, debugAnchor[1] + 25, debugAnchor[2]]}
          transform
          distanceFactor={12}
          style={{ pointerEvents: 'none' }}
        >
          <AudioSpectrumTelemetry />
        </Html>
      )}
      {upgradedShips.map((ship) => {
        const basePos = ship.position
        
        return (
          <group key={ship.id}>
            {/* LED Strips - respond to bass */}
            <AudioReactiveLight
              position={[basePos[0] - 10, basePos[1] + 8, basePos[2] + 5]}
              type="led-strip"
              shipType={ship.type}
              shipId={ship.id}
              rigKey="led-a"
            />
            <AudioReactiveLight
              position={[basePos[0] + 10, basePos[1] + 8, basePos[2] - 5]}
              type="led-strip"
              shipType={ship.type}
              shipId={ship.id}
              rigKey="led-b"
            />

            {/* Spotlights - respond to mids */}
            <AudioReactiveLight
              position={[basePos[0] - 12, basePos[1] + 12, basePos[2] + 8]}
              type="spotlight"
              shipType={ship.type}
              shipId={ship.id}
              rigKey="spot-a"
            />
            <AudioReactiveLight
              position={[basePos[0] + 12, basePos[1] + 12, basePos[2] - 8]}
              type="spotlight"
              shipType={ship.type}
              shipId={ship.id}
              rigKey="spot-b"
            />

            {/* Lasers - respond to treble */}
            <AudioReactiveLight
              position={[basePos[0], basePos[1] + 15, basePos[2]]}
              type="laser"
              shipType={ship.type}
              shipId={ship.id}
              rigKey="laser"
            />

            {/* Strobes - flash on beat */}
            <AudioReactiveLight
              position={[basePos[0] + 5, basePos[1] + 10, basePos[2]]}
              type="strobe"
              shipType={ship.type}
              shipId={ship.id}
              rigKey="strobe"
            />

            {/* Neon tubes - pulse with envelope */}
            <AudioReactiveLight
              position={[basePos[0] - 5, basePos[1] + 6, basePos[2] + 3]}
              type="neon"
              shipType={ship.type}
              shipId={ship.id}
              rigKey="neon"
            />
            
            {/* Audio-reactive god rays */}
            <AudioReactiveGodRay
              position={[basePos[0], basePos[1] + 20, basePos[2]]}
              color={ship.type === 'cruise' ? '#ff6b9d' : ship.type === 'container' ? '#00d4aa' : '#ff9500'}
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
  const colorRef = useRef(new THREE.Color())

  useFrame(() => {
    if (!lightRef.current) return

    const baseIntensity = 0.5
    const audioBoost = audioData.energy * 2
    const beatFlash = audioData.beat ? audioData.beatIntensity : 0

    lightRef.current.intensity = baseIntensity + audioBoost + beatFlash

    const warmth = audioData.spectralCentroid
    colorRef.current.setHSL(0.1 + warmth * 0.1, 0.8, 0.5)
    lightRef.current.color.copy(colorRef.current)
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
