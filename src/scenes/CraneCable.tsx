// =============================================================================
// CRANE CABLE - HarborGlow Phase 9
// Dynamic cable visualization with tension-based color and catenary physics
// =============================================================================

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAudioData } from '../systems/audioVisualSync'
import { getLookDevSettings } from '../utils/lookDevControls'
import { useCraneCableMaterial, updateCraneCableUniforms } from './CraneMaterials'

interface CraneCableProps {
  startPos: [number, number, number]  // Crane trolley/head position
  endPos: [number, number, number]    // Spreader/hook position
  tension: number                      // 0-1 based on loadTension
  showPhysics?: boolean                // Show debug visualization
  twistlockEngaged?: boolean           // When true, cable should appear taut/locked
  nearAttachment?: boolean             // Blue guidance glow near valid attachment points
  installBoost?: number                // 0-1 warm pulse during successful install
  lightIntensity?: number              // Shared global light intensity
  isNight?: boolean                    // Time-of-day factor for emissive visibility
  climaxPulse?: number                 // Harbor show beat pulse
}

// Calculate catenary curve between two points
function calculateCatenary(
  start: THREE.Vector3,
  end: THREE.Vector3,
  slack: number,
  segments: number
): THREE.Vector3[] {
  const points: THREE.Vector3[] = []
  const distance = start.distanceTo(end)
  
  // If almost straight line, return linear interpolation
  if (slack < 0.05 || distance < 0.1) {
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      points.push(new THREE.Vector3().lerpVectors(start, end, t))
    }
    return points
  }
  
  // Calculate catenary sag
  const sag = distance * slack * 0.3
  const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5)
  midPoint.y -= sag
  
  // Generate quadratic bezier curve
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const t2 = t * t
    const mt = 1 - t
    const mt2 = mt * mt
    
    const point = new THREE.Vector3()
    point.x = mt2 * start.x + 2 * mt * t * midPoint.x + t2 * end.x
    point.y = mt2 * start.y + 2 * mt * t * midPoint.y + t2 * end.y
    point.z = mt2 * start.z + 2 * mt * t * midPoint.z + t2 * end.z
    
    points.push(point)
  }
  
  return points
}

// Get tension color (white → yellow → red)
function getTensionColor(tension: number): string {
  if (tension < 0.3) return '#ffffff'      // White (slack)
  if (tension < 0.6) return '#ffcc00'      // Yellow (medium)
  if (tension < 0.8) return '#ff8800'      // Orange (high)
  return '#ff4444'                          // Red (critical)
}

// Get cable thickness based on tension
function getCableThickness(tension: number): number {
  const baseThickness = 0.08
  const tensionAdd = tension * 0.04
  return baseThickness + tensionAdd
}

export default function CraneCable({
  startPos,
  endPos,
  tension,
  showPhysics = false,
  twistlockEngaged = false,
  nearAttachment = false,
  installBoost = 0,
  lightIntensity = 1,
  isNight = false,
  climaxPulse = 0,
}: CraneCableProps) {
  const audioData = useAudioData()
  const cableRef = useRef<THREE.Mesh>(null)
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null)
  const cableMat = useCraneCableMaterial()
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const glowMeshRef = useRef<THREE.Mesh>(null)

  // Reusable colors to avoid per-frame allocations
  const tempColor1 = useMemo(() => new THREE.Color(), [])
  const tempColor2 = useMemo(() => new THREE.Color(), [])
  
  // Delta-corrected sway state
  const swayAmplitudeRef = useRef(0)
  const prevTensionRef = useRef(tension)
  
  // Create curve
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...startPos)
    const end = new THREE.Vector3(...endPos)
    
    // Calculate slack (inverse of tension) — twistlock pulls cable taut
    const slack = twistlockEngaged
      ? Math.max(0, 0.02 * (1 - tension))
      : Math.max(0, 1 - tension * 1.2)
    
    // Generate points along cable
    const points = calculateCatenary(start, end, slack, 16)
    
    curveRef.current = new THREE.CatmullRomCurve3(points)
    return curveRef.current
  }, [startPos, endPos, tension, twistlockEngaged])
  
  // Update cable geometry each frame for sway animation
  useFrame((state, delta) => {
    if (!cableRef.current) return
    
    const time = state.clock.elapsedTime
    const start = new THREE.Vector3(...startPos)
    const end = new THREE.Vector3(...endPos)
    
    const slack = twistlockEngaged
      ? Math.max(0, 0.02 * (1 - tension))
      : Math.max(0, 1 - tension * 1.2)
    
    // --- Framerate-independent sway decay ---
    // Inject energy when tension changes rapidly (player is moving)
    const tensionDelta = Math.abs(tension - prevTensionRef.current)
    prevTensionRef.current = tension
    swayAmplitudeRef.current += tensionDelta * 1.5
    swayAmplitudeRef.current = Math.min(swayAmplitudeRef.current, 0.12)
    
    // Decay sway over time (~15% per second)
    const decayPerSecond = 0.15
    swayAmplitudeRef.current *= Math.pow(decayPerSecond, delta)
    
    // When twistlock is engaged, kill sway immediately (visual lock)
    if (twistlockEngaged && tension > 0.3) {
      swayAmplitudeRef.current *= Math.pow(0.005, delta)
    }
    
    // Enhanced sway with audio envelope
    const musicSway = swayAmplitudeRef.current + audioData.envelope * 0.02
    const swayX = Math.sin(time * 0.5) * musicSway
    const swayZ = Math.cos(time * 0.3) * musicSway * 0.8
    
    // Generate points with sway
    const points: THREE.Vector3[] = []
    const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5)
    midPoint.y -= start.distanceTo(end) * slack * 0.3
    midPoint.x += swayX
    midPoint.z += swayZ
    
    for (let i = 0; i <= 16; i++) {
      const t = i / 16
      const t2 = t * t
      const mt = 1 - t
      const mt2 = mt * mt
      
      const point = new THREE.Vector3()
      point.x = mt2 * start.x + 2 * mt * t * midPoint.x + t2 * end.x
      point.y = mt2 * start.y + 2 * mt * t * midPoint.y + t2 * end.y
      point.z = mt2 * start.z + 2 * mt * t * midPoint.z + t2 * end.z
      
      points.push(point)
    }
    
    // Update curve
    curveRef.current = new THREE.CatmullRomCurve3(points)
    
    // Update geometry
    const tubeGeometry = cableRef.current.geometry as THREE.TubeGeometry
    tubeGeometry.dispose()
    
    const newGeometry = new THREE.TubeGeometry(
      curveRef.current,
      20,
      getCableThickness(tension) * (twistlockEngaged ? 0.92 : 1),
      8,
      false
    )
    
    cableRef.current.geometry = newGeometry

    // Update glow mesh geometry with beat-pulse thickness
    if (glowMeshRef.current) {
      const glowGeo = glowMeshRef.current.geometry as THREE.TubeGeometry
      glowGeo.dispose()
      const pulseThickness = getCableThickness(tension) * 1.5 * (1 + audioData.beatIntensity * 0.3)
      glowMeshRef.current.geometry = new THREE.TubeGeometry(
        curveRef.current,
        20,
        pulseThickness,
        8,
        false
      )
    }

    updateCraneCableUniforms(cableMat, {
      tension,
      twistlockEngaged,
      elapsed: time,
    })

    // Dynamic cable color with audio reactivity
    const baseTensionColor = getTensionColor(tension)
    tempColor1.set(baseTensionColor)

    // Spectral centroid shift: cool blue for high, warm amber for low
    const centroidAmount = Math.abs(audioData.spectralCentroid - 0.5) * 2 * 0.3
    tempColor2.set(audioData.spectralCentroid > 0.5 ? '#4488ff' : '#ffcc66')
    tempColor1.lerp(tempColor2, centroidAmount)

    // Bass boost toward warm orange/red when tension > 0.3
    if (tension > 0.3) {
      tempColor2.set('#ff4422')
      tempColor1.lerp(tempColor2, audioData.bass * 0.4)
    }

    const nightScale = (isNight ? 1 : 0.2) * lightIntensity
    const pulse = 1 + climaxPulse * 0.35
    const tensionGlow = tension > 0.6 ? 0.22 : 0
    const guidanceGlow = nearAttachment ? 0.2 : 0
    const warmInstallGlow = Math.max(0, installBoost) * 0.65
    const glow = (tensionGlow + guidanceGlow + warmInstallGlow) * nightScale * pulse * getLookDevSettings().cableTensionHighlight

    if (cableMat) {
      if (warmInstallGlow > 0.05) {
        cableMat.emissive.set('#ffb46a')
      } else if (nearAttachment) {
        cableMat.emissive.set('#66c8ff')
      } else if (tension > 0.6) {
        cableMat.emissive.copy(tempColor1)
      } else {
        cableMat.emissive.set('#000000')
      }
      cableMat.emissiveIntensity = glow
      cableMat.color.copy(tempColor1)
      cableMat.metalness = THREE.MathUtils.lerp(0.55, 0.88, tension + (twistlockEngaged ? 0.15 : 0))
      cableMat.roughness = THREE.MathUtils.lerp(0.38, 0.18, tension * 0.8)
    }
    if (glowMatRef.current) {
      if (warmInstallGlow > 0.05) {
        glowMatRef.current.color.set('#ffb46a')
      } else if (nearAttachment) {
        glowMatRef.current.color.set('#66c8ff')
      } else {
        glowMatRef.current.color.set(tempColor1)
      }
      glowMatRef.current.opacity = Math.min(0.38, glow * 0.28)
    }
  })
  
  const cableColor = getTensionColor(tension)
  const cableThickness = getCableThickness(tension)
  
  return (
    <group>
      {/* Main cable */}
      <mesh ref={cableRef}>
        <tubeGeometry
          args={[curve, 20, cableThickness, 8, false]}
        />
        <primitive object={cableMat} attach="material" />
      </mesh>
      
      {/* Tension glow effect for high tension */}
      {(tension > 0.7 || nearAttachment || installBoost > 0.05) && (
        <mesh ref={glowMeshRef}>
          <tubeGeometry
            args={[curve, 20, cableThickness * 1.5, 8, false]}
          />
          <meshBasicMaterial
            ref={glowMatRef}
            color={cableColor}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
      
      {/* Debug visualization */}
      {showPhysics && (
        <group>
          {/* Start point marker */}
          <mesh position={startPos}>
            <sphereGeometry args={[0.2]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          
          {/* End point marker */}
          <mesh position={endPos}>
            <sphereGeometry args={[0.2]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          
          {/* Tension indicator text */}
          <mesh position={[
            (startPos[0] + endPos[0]) / 2,
            (startPos[1] + endPos[1]) / 2,
            (startPos[2] + endPos[2]) / 2 + 1
          ]}>
            <sphereGeometry args={[0.1 + tension * 0.2]} />
            <meshBasicMaterial color={cableColor} />
          </mesh>
        </group>
      )}
    </group>
  )
}

// Simplified cable for distant LOD
export function CraneCableLOD({
  startPos,
  endPos,
  tension,
}: CraneCableProps) {
  const cableColor = getTensionColor(tension)
  
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array([...startPos, ...endPos])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={cableColor} linewidth={2} />
    </line>
  )
}
