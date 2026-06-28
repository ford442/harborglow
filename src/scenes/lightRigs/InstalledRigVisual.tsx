// =============================================================================
// INSTALLED RIG VISUAL — physical housing for attachment-point light rigs
// =============================================================================

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { RigType } from '../../systems/attachmentSystem'
import {
  computeRigMusicDrive,
  rigVariationSeed,
  type RigMusicState,
} from './rigPolish'
import { RigFlareAnchor, RigHousingShell, RigMicroGlint } from './RigPolishComponents'

interface InstalledRigVisualProps {
  rigType: RigType
  shipColor: string
  shipId: string
  partName: string
  baseIntensity: number
}

const HOUSING: Record<RigType, { w: number; h: number; d: number }> = {
  led_strip: { w: 1.4, h: 0.28, d: 0.42 },
  projector: { w: 0.7, h: 0.55, d: 0.7 },
  rgb_matrix: { w: 0.9, h: 0.35, d: 0.35 },
  emergency_strobe: { w: 0.55, h: 0.45, d: 0.55 },
  searchlight: { w: 0.5, h: 0.65, d: 0.5 },
}

export function InstalledRigVisual({
  rigType,
  shipColor,
  shipId,
  partName,
  baseIntensity,
}: InstalledRigVisualProps) {
  const powerRef = useRef(1)
  const lensRef = useRef<THREE.MeshStandardMaterial>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const musicStateRef = useRef<RigMusicState>({ afterglow: 0, prevBeat: false })
  const seed = rigVariationSeed(shipId, partName, rigType)
  const housing = HOUSING[rigType]
  const flareId = `rig-${shipId}-${partName}`

  useFrame((_, delta) => {
    const drive = computeRigMusicDrive(baseIntensity / 3, musicStateRef.current, delta)
    musicStateRef.current = drive.state
    powerRef.current = drive.emissive

    const c = new THREE.Color(shipColor)
    c.offsetHSL(drive.hueShift + (seed - 0.5) * 0.04, 0, 0)

    if (lensRef.current) {
      lensRef.current.emissive.copy(c)
      lensRef.current.emissiveIntensity = drive.emissive * (0.85 + seed * 0.25)
    }
    if (lightRef.current) {
      lightRef.current.color.copy(c)
      lightRef.current.intensity = baseIntensity * drive.light
    }
  })

  return (
    <group position={[0, 0.12, 0]}>
      <RigHousingShell
        width={housing.w}
        height={housing.h}
        depth={housing.d}
        rimColor={shipColor}
        powerRef={powerRef}
        bodyColor={`hsl(${220 + seed * 20}, 8%, ${12 + seed * 8}%)`}
      />

      {/* Lens / emitter face */}
      <mesh position={[0, housing.h * 0.15, housing.d * 0.42]}>
        {rigType === 'searchlight' ? (
          <circleGeometry args={[0.22 + seed * 0.04, 16]} />
        ) : (
          <planeGeometry args={[housing.w * 0.72, housing.h * 0.55]} />
        )}
        <meshStandardMaterial
          ref={lensRef}
          color={shipColor}
          emissive={shipColor}
          emissiveIntensity={0.5}
          toneMapped={false}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>

      {/* RGB matrix grid hint */}
      {rigType === 'rgb_matrix' && (
        <group position={[0, housing.h * 0.12, housing.d * 0.44]}>
          {Array.from({ length: 9 }, (_, i) => (
            <mesh
              key={i}
              position={[((i % 3) - 1) * 0.18, (Math.floor(i / 3) - 1) * 0.12, 0]}
            >
              <circleGeometry args={[0.04, 8]} />
              <meshBasicMaterial color={shipColor} toneMapped={false} />
            </mesh>
          ))}
        </group>
      )}

      <pointLight ref={lightRef} color={shipColor} intensity={baseIntensity} distance={14} decay={2} position={[0, 0.2, 0.15]} />

      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.32 + seed * 0.08, 12, 12]} />
        <meshBasicMaterial color={shipColor} transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <RigMicroGlint color="#ffffff" powerRef={powerRef} seed={seed} />
      <RigFlareAnchor id={flareId} color={shipColor} powerRef={powerRef} priority={62} />
    </group>
  )
}
