// =============================================================================
// TUGBOAT TARGET SHIP — HarborGlow Tugboat Mode
// Dynamic physics ship with Rapier buoyancy that can be pushed into berths.
// =============================================================================

import { useRef, useEffect, useMemo, useState } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import * as Tone from 'tone'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useControls, button } from 'leva'
import { useGameStore, ShipType } from '../store/useGameStore'
import { ProceduralShip } from './ProceduralShip'
import { stormSystem } from '../systems/StormSystem'
import { waveSystem } from '../systems/WaveSystem'
import { tugboatWakeState } from '../systems/TugboatWakeSystem'
import {
  towLineState,
  towLineCableConfig,
  N_SEGMENTS,
  N_POINTS,
} from '../systems/TowLineSystem'

// =============================================================================
// CONSTANTS
// =============================================================================

// High-mass freighter dynamics — feels like a real 50 000-tonne vessel.
// Buoyancy/damping constants are scaled to match the new mass so the ship
// still floats correctly and doesn't spin out of control.
const SHIP_MASS            = 50000
const SHIP_LINEAR_DAMPING  = 0.8    // slow to accelerate AND slow to stop
const SHIP_ANGULAR_DAMPING = 1.2    // inhibits endless spin
const BUOYANCY_SCALE       = 30000  // scaled from 35 to keep ship afloat
const DAMPING_SCALE        = 1500   // vertical-velocity damping
const RESTORING_TORQUE     = 5000   // upright-restoring torque (scaled with I)
const MAX_SPEED            = 2      // m/s — heavy ships are slow

// Tow-line physics — runtime defaults are in towLineCableConfig (TowLineSystem.ts)
const BASE_MAX_TOW_LENGTH = 12    // metres of rope before tension builds (rest-length)

// Hydrodynamic crosscurrent & wind shear constants
// Hull is ~100 m long; bow/stern sample arms are ±50 m.
const HULL_LENGTH             = 100  // metres bow to stern
// Above-water projected lateral area (m²) — drives wind shear torque.
const FREIGHTER_LATERAL_AREA  = 600
// Scales the crosscurrent torque impulse applied to the hull.
const CROSSCURRENT_TORQUE_SCALE = 800
// Scales the crosscurrent translational impulse (separate from existing simple current).
const CROSSCURRENT_FORCE_SCALE  = 0.5

// 6 probe points for longer hulls
const PROBE_OFFSETS = [
  { x: 0, z: 4 },
  { x: 0, z: -4 },
  { x: -1.5, z: 2 },
  { x: 1.5, z: 2 },
  { x: -1.5, z: -2 },
  { x: 1.5, z: -2 },
]

// =============================================================================
// TYPES
// =============================================================================

interface TugboatTargetShipProps {
  id: string
  shipType: ShipType
  startPosition: [number, number, number]
  startRotation?: number
  berthCenter: [number, number, number]
  berthRadius: number
  onDocked: (id: string) => void
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function TugboatTargetShip({
  id,
  shipType,
  startPosition,
  startRotation = 0,
  berthCenter,
  berthRadius,
  onDocked,
}: TugboatTargetShipProps) {
  const rbRef = useRef<RapierRigidBody>(null)
  const groupRef = useRef<THREE.Group>(null)

  const [isDocked, setIsDocked] = useState(false)
  const dockTimerRef = useRef(0)
  const hasDockedRef = useRef(false)

  // Previous tow distance — needed for velocity-based damping term
  const _prevTowDist = useRef(0)

  const operationMode = useGameStore((s) => s.operationMode)
  const towingUnlocked = useGameStore((s) => s.towingUnlocked)

  const berthVec = useMemo(
    () => new THREE.Vector3(berthCenter[0], berthCenter[1], berthCenter[2]),
    [berthCenter]
  )

  // Reusable vectors — allocated once, mutated in useFrame
  const _toTug = useMemo(() => new THREE.Vector3(), [])

  // ---------------------------------------------------------------------------
  // LEVA — Tow Line tuning
  // ---------------------------------------------------------------------------
  useControls('Tow Line', {
    springK: {
      value: towLineCableConfig.springK,
      min: 50000, max: 500000, step: 10000,
      label: 'Spring k (N/m)',
      onChange: (v: number) => { towLineCableConfig.springK = v },
    },
    damping: {
      value: towLineCableConfig.damping,
      min: 0, max: 20000, step: 500,
      label: 'Damping',
      onChange: (v: number) => { towLineCableConfig.damping = v },
    },
    maxTension: {
      value: towLineCableConfig.maxTension,
      min: 500000, max: 3000000, step: 100000,
      label: 'Max Tension (N)',
      onChange: (v: number) => { towLineCableConfig.maxTension = v },
    },
    snapDelay: {
      value: towLineCableConfig.snapDelay,
      min: 0.1, max: 2.0, step: 0.05,
      label: 'Snap Delay (s)',
      onChange: (v: number) => { towLineCableConfig.snapDelay = v },
    },
    sagAmount: {
      value: towLineCableConfig.sagAmount,
      min: 0, max: 3.0, step: 0.1,
      label: 'Sag Amount',
      onChange: (v: number) => { towLineCableConfig.sagAmount = v },
    },
    resetConfig: button(() => {
      towLineCableConfig.springK    = 200000
      towLineCableConfig.damping    = 5000
      towLineCableConfig.maxTension = 1_400_000
      towLineCableConfig.snapDelay  = 0.4
      towLineCableConfig.sagAmount  = 1.0
    }),
  })

  useFrame((state, delta) => {
    if (!rbRef.current || !groupRef.current) return
    if (operationMode !== 'tugboat') return
    if (hasDockedRef.current) {
      // Freeze in place when docked
      rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    const rb = rbRef.current
    const time = waveSystem.getTime()

    // --- Wind force (uniform broadside push, same as before) ---
    const windForce = stormSystem.getWindForce()
    if (windForce.lengthSq() > 0) {
      rb.applyImpulse(
        { x: windForce.x * delta, y: 0, z: windForce.z * delta },
        true
      )
    }

    // --- Wind shear torque + lateral heel force for large vessel ---
    // The freighter's tall sides and large sail area make it highly vulnerable
    // to cross-wind shear — player must use differential thrust to counter yaw.
    const { yawTorque: shearYaw, heelForce } = stormSystem.getWindShearForFreighter(FREIGHTER_LATERAL_AREA)
    if (shearYaw !== 0) {
      rb.applyTorqueImpulse({ x: 0, y: shearYaw * delta, z: 0 }, true)
    }
    if (heelForce.lengthSq() > 0) {
      rb.applyImpulse(
        { x: heelForce.x * delta, y: 0, z: heelForce.z * delta },
        true
      )
    }

    // --- Multi-point hull current profile (crosscurrents + eddies) ---
    // Sample at bow, mid, and stern to produce net force + differential yaw torque.
    const rot = rb.rotation()
    const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)
    const euler = new THREE.Euler().setFromQuaternion(quat)
    const pos = rb.translation()

    const crosscurrentScale = stormSystem.crosscurrentStrength
    const { netForce: hullCurrent, yawTorque: currentYaw } = waveSystem.getHullCurrentProfile(
      pos.x,
      pos.z,
      euler.y,
      HULL_LENGTH,
      time
    )

    if (hullCurrent.lengthSq() > 0) {
      rb.applyImpulse(
        {
          x: hullCurrent.x * delta * CROSSCURRENT_FORCE_SCALE * crosscurrentScale,
          y: 0,
          z: hullCurrent.z * delta * CROSSCURRENT_FORCE_SCALE * crosscurrentScale,
        },
        true
      )
    }
    if (currentYaw !== 0) {
      rb.applyTorqueImpulse(
        { x: 0, y: currentYaw * CROSSCURRENT_TORQUE_SCALE * delta * crosscurrentScale, z: 0 },
        true
      )
    }

    // --- Simple surface current (keep existing shallow-draft contribution) ---
    const simpleCurrent = waveSystem.getSurfaceCurrent(pos.x, pos.z)
    if (simpleCurrent.lengthSq() > 0) {
      rb.applyImpulse(
        { x: simpleCurrent.x * delta * 0.15, y: 0, z: simpleCurrent.z * delta * 0.15 },
        true
      )
    }

    // --- Update environmental telemetry in store (throttled: only when active) ---
    const shearIntensity = stormSystem.isActive()
      ? Math.min(1, Math.abs(shearYaw) / (FREIGHTER_LATERAL_AREA * 0.1) + hullCurrent.length() * 0.1)
      : 0
    useGameStore.getState().updateTugboatState({
      windShear: shearIntensity,
      currentDrift: [hullCurrent.x + simpleCurrent.x, hullCurrent.z + simpleCurrent.z],
    })

    for (const offset of PROBE_OFFSETS) {
      const localOff = new THREE.Vector3(offset.x, 0, offset.z)
      localOff.applyQuaternion(quat)

      const probeX = pos.x + localOff.x
      const probeZ = pos.z + localOff.z
      const waterH = waveSystem.getWaterHeight(probeX, probeZ, time)
      const probeY = pos.y + localOff.y
      const submerged = waterH - 2.5 - probeY

      if (submerged > 0) {
        const force = submerged * BUOYANCY_SCALE * delta
        rb.applyImpulseAtPoint(
          { x: 0, y: force, z: 0 },
          { x: probeX, y: probeY, z: probeZ },
          true
        )
      }
    }

    // --- Storm buoyancy chaos ---
    const stormInt = stormSystem.getIntensity()
    if (stormInt > 0) {
      const chaosForce = (Math.random() - 0.5) * stormInt * 20 * delta
      rb.applyImpulse({ x: 0, y: chaosForce, z: 0 }, true)
    }

    // --- Vertical damping ---
    const vel = rb.linvel()
    if (vel.y !== 0) {
      rb.applyImpulse(
        { x: 0, y: -vel.y * DAMPING_SCALE * delta, z: 0 },
        true
      )
    }

    // --- Angular damping & restoring torque ---
    const angVel = rb.angvel()
    rb.applyTorqueImpulse(
      { x: -angVel.x * SHIP_ANGULAR_DAMPING * delta, y: 0, z: -angVel.z * SHIP_ANGULAR_DAMPING * delta },
      true
    )

    rb.applyTorqueImpulse(
      {
        x: -euler.x * RESTORING_TORQUE * delta,
        y: 0,
        z: -euler.z * RESTORING_TORQUE * delta,
      },
      true
    )

    // --- Clamp max speed ---
    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed
      rb.setLinvel({ x: vel.x * scale, y: vel.y, z: vel.z * scale }, true)
    }

    // --- Sync visual group ---
    groupRef.current.position.set(pos.x, pos.y, pos.z)
    groupRef.current.quaternion.set(rot.x, rot.y, rot.z, rot.w)

    // --- Tow-line spring constraint + tension model ---
    // Read store state directly (no subscription) to avoid 60 fps React renders.
    const storeState = useGameStore.getState()
    if (storeState.towLineAttached && storeState.activeTowedShipId === id) {
      const tugPos = storeState.tugboatState.position
      _toTug.set(tugPos[0] - pos.x, 0, tugPos[2] - pos.z)
      const towDist = _toTug.length()

      // Velocity-based damping: rate of change of cable length this frame
      const distRate = (towDist - _prevTowDist.current) / Math.max(delta, 0.001)
      _prevTowDist.current = towDist

      const hasHeavyWinch = storeState.tugboatUpgrades.heavy_tow_winch
      const hasDynamicAssist = storeState.tugboatUpgrades.dynamic_positioning_assist
      const maxTowLength = hasHeavyWinch
        ? BASE_MAX_TOW_LENGTH + (hasDynamicAssist ? 6 : 4)
        : BASE_MAX_TOW_LENGTH
      const excess = towDist - maxTowLength

      // Raw tension (N) = spring + damping;  damp only when stretching further
      const tensionRaw = excess > 0
        ? Math.max(0, excess * towLineCableConfig.springK + distRate * towLineCableConfig.damping * (hasDynamicAssist ? 0.75 : 1))
        : 0
      const tension = Math.min(1, tensionRaw / towLineCableConfig.maxTension)

      // Apply spring impulse only when taut
      if (excess > 0) {
        _toTug.normalize()
        const impulse = excess * towLineCableConfig.springK * delta
        rb.applyImpulse({ x: _toTug.x * impulse, y: 0, z: _toTug.z * impulse }, true)
      }

      // Overload timer — accumulate while above max tension, decay when below
      if (tension >= 1) {
        towLineState.overloadTimer += delta
      } else {
        towLineState.overloadTimer = Math.max(0, towLineState.overloadTimer - delta * 2)
      }

      // Snap condition: sustained overload OR instantaneous extreme spike (2.5× max)
      const sustainedSnap = towLineState.overloadTimer >= (hasDynamicAssist ? towLineCableConfig.snapDelay * 1.25 : towLineCableConfig.snapDelay)
      const spikeSnap     = tensionRaw > towLineCableConfig.maxTension * 2.5

      if (sustainedSnap || spikeSnap) {
        // Whip-back impulse on the ship: push it away from the tug
        const whipImpulse = towLineCableConfig.maxTension * 0.0002
        const away = _toTug.clone().negate().normalize()
        rb.applyImpulse({ x: away.x * whipImpulse, y: 0, z: away.z * whipImpulse }, true)

        // Signal snap: plays audio + camera shake in TowCableHUD
        towLineState.snapFlag = true
        setTimeout(() => { towLineState.snapFlag = false }, 1200)

        // Detach in store (mission logic handled upstream)
        storeState.signalTowLineSnap()

        // Play snap audio via Tone.js (fire and forget)
        playSnapAudio()

        towLineState.active        = false
        towLineState.tension       = 0
        towLineState.tensionRaw    = 0
        towLineState.overloadTimer = 0
      } else {
        // Update singleton state for visual cable
        towLineState.active     = true
        towLineState.tension    = tension
        towLineState.tensionRaw = tensionRaw
        towLineState.shipPosition.set(pos.x, pos.y + 1, pos.z)
        towLineState.tugPosition.set(tugPos[0], tugPos[1] + 0.5, tugPos[2])
      }
    } else {
      towLineState.active        = false
      towLineState.tension       = 0
      towLineState.tensionRaw    = 0
      towLineState.overloadTimer = 0
      _prevTowDist.current       = 0
    }

    // --- Docking detection ---
    const dist = Math.sqrt(
      (pos.x - berthCenter[0]) ** 2 +
      (pos.z - berthCenter[2]) ** 2
    )

    if (towingUnlocked && dist < berthRadius && speed < 1.0) {
      dockTimerRef.current += delta
      if (dockTimerRef.current > 3.0) {
        hasDockedRef.current = true
        setIsDocked(true)
        onDocked(id)
      }
    } else {
      dockTimerRef.current = Math.max(0, dockTimerRef.current - delta * 0.5)
    }
  })

  // Reset on mode switch
  useEffect(() => {
    if (operationMode === 'tugboat') {
      hasDockedRef.current = false
      setIsDocked(false)
      dockTimerRef.current = 0
    }
  }, [operationMode, id])

  if (operationMode !== 'tugboat') return null

  return (
    <>
      <RigidBody
        ref={rbRef}
        type="dynamic"
        mass={SHIP_MASS}
        linearDamping={SHIP_LINEAR_DAMPING}
        angularDamping={SHIP_ANGULAR_DAMPING}
        position={startPosition}
        rotation={[0, startRotation, 0]}
        enabledRotations={[true, true, true]}
        colliders="cuboid"
      >
        <group ref={groupRef}>
          <ProceduralShip blueprintId={shipType} version="1.0" />

          {isDocked && (
            <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[berthRadius - 0.5, berthRadius, 64]} />
              <meshBasicMaterial color="#00ff88" transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      </RigidBody>

      {/* Tow-line visual rope — rendered at scene level (world space) */}
      <TowLineVisual shipRbRef={rbRef} shipId={id} />
    </>
  )
}

// =============================================================================
// SNAP AUDIO
// Fire-and-forget Tone.js burst when the cable parts.  Noise → distortion →
// lowpass filter gives a convincing metallic "twang + recoil".
// =============================================================================

async function playSnapAudio(): Promise<void> {
  try {
    await Tone.start()
    const now = Tone.now() + 0.02
    const filter = new Tone.Filter(700, 'lowpass').toDestination()
    const dist   = new Tone.Distortion(0.65).connect(filter)
    const env    = new Tone.AmplitudeEnvelope({
      attack:  0.001,
      decay:   0.28,
      sustain: 0,
      release: 0.18,
    }).connect(dist)
    const noise = new Tone.Noise('pink').connect(env).start(now)
    env.triggerAttack(now)
    env.triggerRelease(now + 0.12)
    // Sub-bass thud for "whip recoil" feel
    const thud = new Tone.MembraneSynth({
      pitchDecay: 0.06,
      octaves:    4,
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
    }).toDestination()
    thud.triggerAttackRelease('C1', '8n', now)
    setTimeout(() => {
      noise.stop(); noise.dispose()
      env.dispose(); dist.dispose(); filter.dispose(); thud.dispose()
    }, 900)
  } catch {
    // Audio context may not be available in test/SSR environments — ignore
  }
}

// =============================================================================
// TOW LINE VISUAL
// Renders a catenary cable between the towed ship's bow bitt and the tugboat
// stern attachment.  Uses a pre-allocated Float32Array of N_POINTS×3 floats —
// no garbage per frame.  Material color is mutated in place to shift
// silver → orange → red-hot as tension rises.
// =============================================================================

// Reusable temporary vectors — module-scope to avoid per-render allocation
const _vS   = new THREE.Vector3()
const _vT   = new THREE.Vector3()
const _vMid = new THREE.Vector3()

export function TowLineVisual({
  shipRbRef,
  shipId,
}: {
  shipRbRef: RefObject<RapierRigidBody>
  shipId: string
}) {
  // Pre-allocated position buffer shared by main + glow line
  const posArray   = useMemo(() => new Float32Array(N_POINTS * 3), [])
  const attrRef    = useRef<THREE.BufferAttribute>(null)
  const glowAttr   = useRef<THREE.BufferAttribute>(null)
  const matRef     = useRef<THREE.LineBasicMaterial>(null)
  const glowMatRef = useRef<THREE.LineBasicMaterial>(null)

  // Per-frame camera shake state (no React state → no re-renders)
  const { camera } = useThree()
  const shakeRef = useRef({ active: false, intensity: 0, timeLeft: 0 })

  useFrame((_state, delta) => {
    const { towLineAttached, activeTowedShipId } = useGameStore.getState()

    // Snap camera shake (independent of towLineAttached — persists after snap)
    if (towLineState.snapFlag && !shakeRef.current.active) {
      shakeRef.current = { active: true, intensity: 0.9, timeLeft: 0.65 }
    }
    if (shakeRef.current.active) {
      shakeRef.current.intensity *= Math.pow(0.82, delta * 60)
      shakeRef.current.timeLeft  -= delta
      if (shakeRef.current.timeLeft <= 0 || shakeRef.current.intensity < 0.008) {
        shakeRef.current.active = false
      } else {
        const s = shakeRef.current.intensity * 0.25
        camera.position.x += (Math.random() - 0.5) * s
        camera.position.y += (Math.random() - 0.5) * s
      }
    }

    if (!attrRef.current || !shipRbRef.current) return
    if (!towLineAttached || activeTowedShipId !== shipId) return

    // --- Build catenary curve points ---
    const sPos = shipRbRef.current.translation()
    _vS.set(sPos.x, sPos.y + 1.0, sPos.z)
    _vT.set(
      towLineState.tugPosition.x,
      towLineState.tugPosition.y,
      towLineState.tugPosition.z,
    )
    // Fallback to wake state if tugPosition hasn't been written yet
    if (_vT.lengthSq() < 0.001) {
      _vT.set(
        tugboatWakeState.position.x,
        tugboatWakeState.position.y + 0.5,
        tugboatWakeState.position.z,
      )
    }

    _vMid.lerpVectors(_vS, _vT, 0.5)
    const dist    = _vS.distanceTo(_vT)
    const tension = towLineState.tension
    const slack   = Math.max(0, 1 - tension * 1.2) * towLineCableConfig.sagAmount
    _vMid.y -= dist * slack * 0.25

    // Quadratic Bézier: ship → midpoint → tug  (writes to pre-allocated points)
    for (let i = 0; i < N_POINTS; i++) {
      const t  = i / N_SEGMENTS
      const mt = 1 - t
      const p  = towLineState.segmentPoints[i]
      p.x = mt * mt * _vS.x + 2 * mt * t * _vMid.x + t * t * _vT.x
      p.y = mt * mt * _vS.y + 2 * mt * t * _vMid.y + t * t * _vT.y
      p.z = mt * mt * _vS.z + 2 * mt * t * _vMid.z + t * t * _vT.z
      posArray[i * 3]     = p.x
      posArray[i * 3 + 1] = p.y
      posArray[i * 3 + 2] = p.z
    }

    attrRef.current.needsUpdate = true
    if (glowAttr.current) glowAttr.current.needsUpdate = true

    // --- Tension-reactive colour (mutate in place — zero allocation) ---
    if (matRef.current) {
      if (tension < 0.35) {
        // Silver (slack)
        const f = tension / 0.35
        matRef.current.color.setRGB(0.75 + f * 0.05, 0.75 + f * 0.05, 0.80 + f * 0.05)
      } else if (tension < 0.65) {
        // Silver → orange
        const f = (tension - 0.35) / 0.30
        matRef.current.color.setRGB(0.80 + f * 0.20, 0.80 - f * 0.32, 0.85 - f * 0.55)
      } else if (tension < 0.88) {
        // Orange → red-hot
        const f = (tension - 0.65) / 0.23
        matRef.current.color.setRGB(1.0, 0.48 - f * 0.28, 0.30 - f * 0.25)
      } else {
        // Red-hot (max)
        matRef.current.color.setRGB(1.0, 0.20, 0.05)
      }
    }

    // --- Additive glow at high tension ---
    if (glowMatRef.current) {
      glowMatRef.current.opacity = tension > 0.70
        ? Math.min(0.55, (tension - 0.70) * 1.8)
        : 0
    }
  })

  return (
    <>
      {/* Main cable — N_POINTS-vertex polyline */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            ref={attrRef}
            attach="attributes-position"
            array={posArray}
            count={N_POINTS}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial ref={matRef} color="#c8c8d0" linewidth={2} />
      </line>

      {/* Additive glow line — same positions, renders with additive blending */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            ref={glowAttr}
            attach="attributes-position"
            array={posArray}
            count={N_POINTS}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          ref={glowMatRef}
          color="#ff6600"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </line>
    </>
  )
}
