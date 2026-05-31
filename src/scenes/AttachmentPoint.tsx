// =============================================================================
// ATTACHMENT POINT - HarborGlow Phase 9
// Visual indicators for installation locations with proximity-based visibility
// =============================================================================

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { 
  AttachmentState, 
  RigType, 
  RIG_TYPE_COLORS, 
  SHIP_TYPE_LIGHT_COLORS
} from '../systems/attachmentSystem'
import type { ShipType } from '../store/useGameStore'

interface AttachmentPointVisualProps {
  position: [number, number, number]
  rotation: [number, number, number]
  partName: string
  shipType: ShipType
  state: AttachmentState
  rigType: RigType
  distance?: number        // Distance from camera (for visibility)
  snapStrength?: number    // 0-1 based on crane proximity
  visibilityRange?: number // Configurable visibility range
  showDistance?: boolean   // Show floating distance indicator
  isCurrentShip?: boolean  // Whether this point belongs to the currently selected ship
  isSelectedUpgrade?: boolean // Whether this point is highlighted in the upgrade menu
}

// Pulsing ring component
function PulsingRing({ 
  color, 
  radius, 
  intensity,
  speed = 3,
  pulseAmount = 0.1,
}: { 
  color: string
  radius: number
  intensity: number 
  speed?: number
  pulseAmount?: number
}) {
  const ringRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!ringRef.current) return
    const scale = 1 + Math.sin(state.clock.elapsedTime * speed) * pulseAmount * intensity
    ringRef.current.scale.setScalar(scale)
    ringRef.current.rotation.z += 0.01 * intensity
  })
  
  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.8, radius, 32]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.5 * intensity}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Rotating targeting reticle
function TargetingReticle({
  color,
  radius,
}: {
  color: string
  radius: number
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.z = state.clock.elapsedTime * 0.8
  })

  return (
    <group ref={groupRef} position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Outer crosshair ring */}
      <mesh>
        <ringGeometry args={[radius * 0.9, radius, 32, 1, 0, Math.PI * 1.8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Crosshair ticks */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * radius * 1.15, Math.sin(angle) * radius * 1.15, 0]}
          rotation={[0, 0, angle]}
        >
          <boxGeometry args={[radius * 0.25, 0.03, 0.01]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  )
}

// Vertical beacon beam
function BeaconBeam({ color, height = 5 }: { color: string; height?: number }) {
  return (
    <mesh position={[0, height / 2, 0]}>
      <cylinderGeometry args={[0.04, 0.12, height, 8, 1, true]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Magnetic snap indicator
function SnapIndicator({ 
  strength, 
  color 
}: { 
  strength: number
  color: string 
}) {
  const indicatorRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!indicatorRef.current || strength <= 0) return
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.2 * strength
    indicatorRef.current.scale.setScalar(pulse)
  })
  
  if (strength <= 0) return null
  
  return (
    <group ref={indicatorRef}>
      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.4, 32]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={strength * 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Directional arrows */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh 
          key={i}
          position={[Math.cos(angle) * 1.6, 0.2, Math.sin(angle) * 1.6]}
          rotation={[0, -angle, 0]}
        >
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

// Installation progress indicator
function InstallProgress({ progress }: { progress: number }) {
  return (
    <group>
      {/* Progress ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 32, 1, 0, progress * Math.PI * 2]} />
        <meshBasicMaterial color="#00ff00" side={THREE.DoubleSide} />
      </mesh>
      
      {/* Center spinner */}
      <mesh rotation={[0, 0, progress * Math.PI * 4]}>
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
    </group>
  )
}

// Distance indicator
function DistanceIndicator({ 
  distance, 
  color,
  isSnapZone 
}: { 
  distance: number
  color: string
  isSnapZone: boolean 
}) {
  const textRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!textRef.current) return
    // Billboard effect - always face camera
    textRef.current.lookAt(state.camera.position)
  })
  
  const displayDistance = Math.max(0, distance).toFixed(1)
  
  return (
    <group ref={textRef} position={[0, 1.2, 0]}>
      {/* Background panel */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.4, 0.5]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.7} 
        />
      </mesh>
      
      {/* Distance text */}
      <Text
        fontSize={0.25}
        color={isSnapZone ? '#00ff00' : color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        {displayDistance}m
      </Text>
      
      {/* Snap zone indicator */}
      {isSnapZone && (
        <Text
          position={[0, -0.35, 0]}
          fontSize={0.15}
          color="#00ff00"
          anchorX="center"
          anchorY="middle"
        >
          SNAP ZONE
        </Text>
      )}
    </group>
  )
}

// LOCKED flash effect
function LockedFlash({ active }: { active: boolean }) {
  const flashRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!flashRef.current || !active) return
    const intensity = Math.sin(state.clock.elapsedTime * 20) * 0.5 + 0.5
    ;(flashRef.current.material as THREE.MeshBasicMaterial).opacity = intensity * 0.8
  })
  
  if (!active) return null
  
  return (
    <group>
      {/* Flash sphere */}
      <mesh ref={flashRef}>
        <sphereGeometry args={[0.8]} />
        <meshBasicMaterial 
          color="#00ff00" 
          transparent 
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* LOCKED text */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.3}
        color="#00ff00"
        anchorX="center"
        anchorY="bottom"
        font="/fonts/inter-bold.woff"
      >
        LOCKED
      </Text>
    </group>
  )
}

export default function AttachmentPointVisual({
  position,
  rotation,
  partName,
  shipType,
  state,
  rigType,
  distance = 0,
  snapStrength = 0,
  visibilityRange = 15,
  showDistance = true,
  isCurrentShip = false,
  isSelectedUpgrade = false,
}: AttachmentPointVisualProps) {
  const groupRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  
  // Get colors
  const colors = useMemo(() => RIG_TYPE_COLORS[rigType], [rigType])
  const shipColor = SHIP_TYPE_LIGHT_COLORS[shipType]
  
  // Prominent cyan styling when this ship is selected and point is available/hovered
  const isProminent = isCurrentShip && (state === 'available' || state === 'hovered')
  
  // Selected upgrade gets the MOST prominent treatment
  const isBeacon = isSelectedUpgrade && state !== 'installed'
  const primaryColor = isBeacon ? '#00ffff' : isProminent ? '#00ffff' : colors.primary
  
  // Calculate visibility opacity based on distance
  const visibilityOpacity = useMemo(() => {
    if (state === 'installed') return 1
    const rangeMultiplier = isBeacon ? 3.0 : isProminent ? 2.0 : 1.0
    const fadeStart = visibilityRange * 1.5 * rangeMultiplier
    const fadeEnd = visibilityRange * 0.5 * rangeMultiplier
    
    if (distance > fadeStart) return 0
    if (distance < fadeEnd) return 1
    
    return 1 - (distance - fadeEnd) / (fadeStart - fadeEnd)
  }, [distance, visibilityRange, state, isProminent, isBeacon])
  
  // Animation for available state
  useFrame((frameState) => {
    if (!groupRef.current) return
    
    // Gentle floating animation
    if (state === 'available' || state === 'hovered') {
      const floatAmount = isBeacon ? 0.25 : isProminent ? 0.15 : 0.1
      const floatSpeed = isBeacon ? 5 : isProminent ? 3 : 2
      groupRef.current.position.y = position[1] + Math.sin(frameState.clock.elapsedTime * floatSpeed) * floatAmount
    }
    
    // Pulse light intensity
    if (lightRef.current && state === 'installed') {
      lightRef.current.intensity = colors.intensity + Math.sin(frameState.clock.elapsedTime * 3) * 0.5
    }
  })
  
  // Don't render if not visible
  if (visibilityOpacity <= 0.01 && state !== 'installed') return null
  
  const isSnapZone = state === 'snapping' || state === 'installing'
  
  return (
    <group 
      ref={groupRef}
      position={position} 
      rotation={rotation}
    >
      {/* Vertical beacon beam for selected upgrade */}
      {isBeacon && (
        <BeaconBeam color="#00ffff" height={5} />
      )}

      {state === 'available' && (
        <>
          {/* Glowing orb */}
          <mesh>
            <sphereGeometry args={[isBeacon ? 0.25 : isProminent ? 0.2 : 0.15]} />
            <meshBasicMaterial 
              color={primaryColor} 
              transparent 
              opacity={(isBeacon ? 0.95 : isProminent ? 0.85 : 0.6) * visibilityOpacity}
            />
          </mesh>
          
          {/* Outer glow */}
          <mesh>
            <sphereGeometry args={[isBeacon ? 0.45 : isProminent ? 0.35 : 0.25]} />
            <meshBasicMaterial 
              color={primaryColor}
              transparent
              opacity={(isBeacon ? 0.55 : isProminent ? 0.45 : 0.2) * visibilityOpacity}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Extra bright outer glow for prominent / beacon */}
          {(isProminent || isBeacon) && (
            <mesh>
              <sphereGeometry args={[isBeacon ? 0.7 : 0.5]} />
              <meshBasicMaterial 
                color={primaryColor}
                transparent
                opacity={(isBeacon ? 0.3 : 0.2) * visibilityOpacity}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          )}
          
          {/* Ultra glow for beacon */}
          {isBeacon && (
            <mesh>
              <sphereGeometry args={[0.95]} />
              <meshBasicMaterial 
                color="#00ffff"
                transparent
                opacity={0.12 * visibilityOpacity}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          )}
          
          {/* Pulsing ring */}
          <PulsingRing 
            color={primaryColor} 
            radius={isBeacon ? 0.75 : isProminent ? 0.55 : 0.5}
            intensity={isBeacon ? 2.0 : isProminent ? 1.5 : visibilityOpacity}
            speed={isBeacon ? 8 : isProminent ? 6 : 3}
            pulseAmount={isBeacon ? 0.2 : isProminent ? 0.15 : 0.1}
          />
          
          {/* Second inner pulsing ring for prominent / beacon */}
          {(isProminent || isBeacon) && (
            <PulsingRing 
              color="#00d4aa"
              radius={isBeacon ? 0.4 : 0.3}
              intensity={isBeacon ? 1.8 : 1.3}
              speed={isBeacon ? 10 : 8}
              pulseAmount={isBeacon ? 0.18 : 0.12}
            />
          )}
          
          {/* Targeting reticle for beacon */}
          {isBeacon && (
            <TargetingReticle color="#00ffff" radius={0.85} />
          )}
          
          {/* Distance indicator */}
          {showDistance && (
            <DistanceIndicator 
              distance={distance} 
              color={primaryColor}
              isSnapZone={false}
            />
          )}
        </>
      )}
      
      {state === 'hovered' && (
        <>
          {/* Brighter orb */}
          <mesh>
            <sphereGeometry args={[isBeacon ? 0.28 : isProminent ? 0.22 : 0.18]} />
            <meshStandardMaterial 
              color={primaryColor}
              emissive={primaryColor}
              emissiveIntensity={isBeacon ? 1.2 : isProminent ? 0.8 : 0.5}
            />
          </mesh>
          
          {/* Expanded glow */}
          <mesh>
            <sphereGeometry args={[isBeacon ? 0.55 : isProminent ? 0.45 : 0.35]} />
            <meshBasicMaterial 
              color={primaryColor}
              transparent
              opacity={isBeacon ? 0.55 : isProminent ? 0.45 : 0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Extra prominent glow */}
          {(isProminent || isBeacon) && (
            <mesh>
              <sphereGeometry args={[isBeacon ? 0.75 : 0.6]} />
              <meshBasicMaterial 
                color={isBeacon ? '#00ffff' : '#00d4aa'}
                transparent
                opacity={isBeacon ? 0.28 : 0.22}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          )}
          
          {/* Faster pulsing ring */}
          <PulsingRing 
            color={primaryColor} 
            radius={isBeacon ? 0.9 : isProminent ? 0.7 : 0.6}
            intensity={isBeacon ? 2.0 : isProminent ? 1.6 : 1.2}
            speed={isBeacon ? 8 : isProminent ? 6 : 3}
            pulseAmount={isBeacon ? 0.2 : isProminent ? 0.15 : 0.1}
          />
          
          {/* Second inner pulsing ring for prominent / beacon */}
          {(isProminent || isBeacon) && (
            <PulsingRing 
              color="#00d4aa"
              radius={isBeacon ? 0.45 : 0.35}
              intensity={isBeacon ? 1.8 : 1.4}
              speed={isBeacon ? 10 : 8}
              pulseAmount={isBeacon ? 0.16 : 0.12}
            />
          )}
          
          {/* Targeting reticle for beacon */}
          {isBeacon && (
            <TargetingReticle color="#00ffff" radius={1.0} />
          )}
          
          {/* Distance indicator */}
          {showDistance && (
            <DistanceIndicator 
              distance={distance} 
              color={primaryColor}
              isSnapZone={false}
            />
          )}
        </>
      )}
      
      {state === 'snapping' && (
        <>
          {/* Snap state - bright and attention-grabbing */}
          <mesh>
            <sphereGeometry args={[0.2]} />
            <meshStandardMaterial 
              color="#ffffff"
              emissive={colors.primary}
              emissiveIntensity={0.8}
            />
          </mesh>
          
          {/* Snap zone indicator */}
          <SnapIndicator strength={snapStrength} color={colors.primary} />
          
          {/* Connection line to ground */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([0, -position[1], 0, 0, 0, 0])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={colors.primary} transparent opacity={0.3} />
          </line>
          
          {/* Distance indicator with snap zone warning */}
          {showDistance && (
            <DistanceIndicator 
              distance={distance} 
              color="#00ff00"
              isSnapZone={true}
            />
          )}
        </>
      )}
      
      {state === 'installing' && (
        <>
          {/* Installation in progress */}
          <mesh>
            <sphereGeometry args={[0.22]} />
            <meshStandardMaterial 
              color="#00ff00"
              emissive="#00ff00"
              emissiveIntensity={0.5}
            />
          </mesh>
          
          {/* Progress indicator */}
          <InstallProgress progress={0.5} />
          
          {/* Sparks */}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh 
              key={i}
              position={[
                Math.cos((i / 8) * Math.PI * 2) * 0.4,
                Math.sin((i / 8) * Math.PI * 2) * 0.4,
                0
              ]}
            >
              <sphereGeometry args={[0.05]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
          ))}
          
          {/* LOCKED flash */}
          <LockedFlash active={true} />
        </>
      )}
      
      {state === 'installed' && (
        <>
          {/* Installed rig light */}
          <mesh>
            <sphereGeometry args={[0.12]} />
            <meshStandardMaterial 
              color={shipColor}
              emissive={shipColor}
              emissiveIntensity={0.5}
            />
          </mesh>
          
          {/* Point light */}
          <pointLight
            ref={lightRef}
            color={shipColor}
            intensity={colors.intensity}
            distance={15}
            decay={2}
            position={[0, 0.3, 0]}
          />
          
          {/* Subtle glow */}
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.4]} />
            <meshBasicMaterial 
              color={shipColor}
              transparent
              opacity={0.15}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </>
      )}
    </group>
  )
}
