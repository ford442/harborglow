// =============================================================================
// TUGBOAT COMPONENT — HarborGlow Tugboat Mode
// First-person helm view with Rapier buoyancy, smooth throttle, mouse look.
// =============================================================================

import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useControls, button } from 'leva'
import { RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useGameStore } from '../store/useGameStore'
import { stormSystem } from '../systems/StormSystem'
import { waveSystem } from '../systems/WaveSystem'
import { tugboatWakeState, resetTugboatWakeState } from '../systems/TugboatWakeSystem'
import { cavitationSystem, cavitationState, CAVITATION_CONFIG, getCavitationDebugBindings } from '../systems/CavitationSystem'
import { tugboatSoundSystem } from '../systems/tugboatSoundSystem'
import { getNearestAssistShip } from '../systems/harborAssistSystem'

// =============================================================================
// CONFIG (tunable via Leva)
// =============================================================================

const RPM_MAX = 100  // normalisation constant for console RPM values

const PHYSICS = {
  mass: 15,
  linearDamping: 2.2,
  angularDamping: 2.5,
  buoyancyScale: 18.0,
  dampingScale: 2.5,
  restoringTorque: 4.0,
}

const PROBE_OFFSETS = [
  { x: 0, z: 2.5 },   // bow
  { x: 0, z: -2.5 },  // stern
  { x: -1.2, z: 0 },  // port
  { x: 1.2, z: 0 },   // starboard
]

// =============================================================================
// RADAR SWEEP LINE
// =============================================================================

function RadarSweepLine({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 2
    }
  })
  return (
    <mesh ref={meshRef} position={position} rotation={[-0.3, 0, 0]}>
      <planeGeometry args={[0.3, 0.01]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
    </mesh>
  )
}

// =============================================================================
// GLOWING DASHBOARD SCREEN
// =============================================================================

function DashboardScreen({
  position,
  rotation,
  size,
  color = '#00ff88',
  glowIntensity = 1.5,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  size: [number, number]
  color?: string
  glowIntensity?: number
}) {
  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      {/* Screen bezel */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[size[0] + 0.04, size[1] + 0.04]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.5} />
      </mesh>
      {/* Screen surface */}
      <mesh>
        <planeGeometry args={size} />
        <meshStandardMaterial
          color="#001122"
          emissive={color}
          emissiveIntensity={glowIntensity * 0.4}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
      {/* Glow light */}
      <pointLight color={color} intensity={glowIntensity} distance={2} decay={2} />
    </group>
  )
}

// =============================================================================
// TUGBOAT COMPONENT
// =============================================================================

export default function Tugboat() {
  const rbRef = useRef<RapierRigidBody>(null)

  // ---------------------------------------------------------------------------
  // LEVA TUNING
  // ---------------------------------------------------------------------------

  const tuning = useControls('Tugboat Physics', {
    maxSpeed: { value: 12, min: 5, max: 25, step: 1, label: 'Max Speed' },
    acceleration: { value: 3.0, min: 0.5, max: 10, step: 0.5, label: 'Acceleration' },
    turnSpeed: { value: 8, min: 2, max: 20, step: 1, label: 'Turn Speed' },
    brakeForce: { value: 60, min: 10, max: 150, step: 5, label: 'Brake Force' },
    boostMult: { value: 2.0, min: 1.2, max: 4.0, step: 0.2, label: 'Boost Multiplier' },
  })

  // Leva debug panel for cavitation tuning
  useControls('Cavitation Debug', {
    slipThreshold: {
      value: CAVITATION_CONFIG.slipThreshold,
      min: 0.3,
      max: 0.95,
      step: 0.01,
      label: 'Slip Threshold',
      onChange: (v: number) => { CAVITATION_CONFIG.slipThreshold = v },
    },
    slipHysteresis: {
      value: CAVITATION_CONFIG.slipHysteresis,
      min: 0.02,
      max: 0.3,
      step: 0.01,
      label: 'Hysteresis',
      onChange: (v: number) => { CAVITATION_CONFIG.slipHysteresis = v },
    },
    minDurationForAlarm: {
      value: CAVITATION_CONFIG.minDurationForAlarm,
      min: 0.1,
      max: 2.0,
      step: 0.05,
      label: 'Alarm Latch (s)',
      onChange: (v: number) => { CAVITATION_CONFIG.minDurationForAlarm = v },
    },
    thrustMultiplier: {
      value: CAVITATION_CONFIG.thrustMultiplier,
      min: 0.05,
      max: 0.8,
      step: 0.01,
      label: 'Thrust Penalty',
      onChange: (v: number) => { CAVITATION_CONFIG.thrustMultiplier = v },
    },
    maxPropSpeed: {
      value: CAVITATION_CONFIG.maxPropSpeed,
      min: 5.0,
      max: 30.0,
      step: 0.5,
      label: 'Max Prop Speed',
      onChange: (v: number) => { CAVITATION_CONFIG.maxPropSpeed = v },
    },
    masterVolume: {
      value: CAVITATION_CONFIG.masterVolume,
      min: -40,
      max: 0,
      step: 1,
      label: 'Audio Volume (dB)',
      onChange: (v: number) => { CAVITATION_CONFIG.masterVolume = v },
    },
    resetCavitation: button(() => cavitationSystem.resetCavitation()),
  })

  // Leva camera preset selector for tugboat multiview
  useControls('Tugboat Camera', {
    activePreset: {
      value: 'tug-helm',
      options: ['tug-helm', 'tug-deck', 'tug-chase', 'tug-prop', 'tug-towline'],
      label: 'Active Preset',
    },
    multiviewEnabled: { value: false, label: 'Multiview Overlay' },
  })

  // ---------------------------------------------------------------------------
  // INPUT STATE
  // ---------------------------------------------------------------------------

  const keysRef = useRef<Set<string>>(new Set())
  const boostRef = useRef({ active: false, cooldown: 0 })

  // Smooth throttle / steering
  const throttleRef = useRef(0)
  const steeringRef = useRef(0)

  // Mouse look
  const isMouseLookRef = useRef(false)
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const targetYawRef = useRef(0)
  const targetPitchRef = useRef(0)

  const operationMode = useGameStore((s) => s.operationMode)
  const towingUnlocked = useGameStore((s) => s.towingUnlocked)
  const updateTugboatState = useGameStore((s) => s.updateTugboatState)
  const attachTowLine = useGameStore((s) => s.attachTowLine)
  const detachTowLine = useGameStore((s) => s.detachTowLine)

  // Twin-prop RPM refs — synced from the store without creating per-frame subscriptions
  const portRpmRef = useRef(0)
  const starboardRpmRef = useRef(0)

  useEffect(() => {
    // Initialise from current store value
    const { tugboatState } = useGameStore.getState()
    portRpmRef.current = tugboatState.portEngineRpm ?? 0
    starboardRpmRef.current = tugboatState.starboardEngineRpm ?? 0

    return useGameStore.subscribe((s) => {
      portRpmRef.current = s.tugboatState.portEngineRpm ?? 0
      starboardRpmRef.current = s.tugboatState.starboardEngineRpm ?? 0
    })
  }, [])

  // Start tug radio layer when entering tugboat mode
  useEffect(() => {
    void tugboatSoundSystem.start()
  }, [])

  // Fire handshake-complete stinger the first time towing is unlocked
  const prevTowingUnlockedRef = useRef(false)
  useEffect(() => {
    if (towingUnlocked && !prevTowingUnlockedRef.current) {
      void tugboatSoundSystem.triggerHandshakeComplete()
    }
    prevTowingUnlockedRef.current = towingUnlocked
  }, [towingUnlocked])

  // Collision push state (updated in useFrame, read in onCollisionEnter)
  const speedRef = useRef(0)
  const headingRef = useRef(0)

  // ---------------------------------------------------------------------------
  // INPUT HANDLERS
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
      if (e.key === 'Shift') {
        if (boostRef.current.cooldown <= 0) {
          boostRef.current.active = true
          boostRef.current.cooldown = 5 // seconds
        }
      }
      // 'Q' — return to crane mode
      if (e.key === 'q' || e.key === 'Q') {
        useGameStore.getState().setOperationMode('crane')
        return
      }
      // 'T' — toggle tow-line attach/detach (requires handshake completion)
      if (e.key === 't' || e.key === 'T') {
        const state = useGameStore.getState()
        if (!state.towingUnlocked) return
        if (state.towLineAttached) {
          detachTowLine()
          void tugboatSoundSystem.triggerTowLineDetach()
        } else {
          // 1. Prefer mission objective ships (existing behaviour)
          const target = state.tugboatObjectives.find(o => !o.completed)
          if (target) {
            attachTowLine(target.id)
            void tugboatSoundSystem.triggerTowLineAttach()
          } else {
            // 2. Fall back to nearest fleet ship in the harbor assist registry
            const tugPos = state.tugboatState.position
            const nearest = getNearestAssistShip(tugPos[0], tugPos[2])
            if (nearest) {
              attachTowLine(nearest.id)
              void tugboatSoundSystem.triggerTowLineAttach()
            }
          }
        }
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
      if (e.key === 'Shift') {
        boostRef.current.active = false
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        isMouseLookRef.current = true
        e.preventDefault()
      }
    }
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isMouseLookRef.current = false
      }
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseLookRef.current) return
      const sensitivity = 0.003
      targetYawRef.current -= e.movementX * sensitivity
      targetPitchRef.current -= e.movementY * sensitivity
      // Clamp pitch
      targetPitchRef.current = Math.max(-0.6, Math.min(0.6, targetPitchRef.current))
    }
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('contextmenu', onContextMenu)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('contextmenu', onContextMenu)
    }
  }, [attachTowLine, detachTowLine])

  // Reset wake + cavitation state when the tugboat unmounts
  useEffect(() => () => {
    resetTugboatWakeState()
    cavitationSystem.resetCavitation()
    tugboatSoundSystem.stop()
  }, [])

  // ---------------------------------------------------------------------------
  // PHYSICS LOOP
  // ---------------------------------------------------------------------------

  useFrame((state, delta) => {
    if (!rbRef.current) return
    const rb = rbRef.current
    const keys = keysRef.current

    // --- Smooth throttle ---
    let targetThrottle = 0
    if (keys.has('w') || keys.has('arrowup')) targetThrottle += 1
    if (keys.has('s') || keys.has('arrowdown')) targetThrottle -= 1

    const accel = tuning.acceleration * delta
    if (throttleRef.current < targetThrottle) {
      throttleRef.current = Math.min(targetThrottle, throttleRef.current + accel)
    } else if (throttleRef.current > targetThrottle) {
      throttleRef.current = Math.max(targetThrottle, throttleRef.current - accel)
    }

    // --- Smooth steering ---
    let targetSteering = 0
    if (keys.has('a') || keys.has('arrowleft')) targetSteering += 1
    if (keys.has('d') || keys.has('arrowright')) targetSteering -= 1

    const steerAccel = tuning.acceleration * 1.5 * delta
    if (steeringRef.current < targetSteering) {
      steeringRef.current = Math.min(targetSteering, steeringRef.current + steerAccel)
    } else if (steeringRef.current > targetSteering) {
      steeringRef.current = Math.max(targetSteering, steeringRef.current - steerAccel)
    }

    // --- Boost ---
    if (boostRef.current.cooldown > 0) {
      boostRef.current.cooldown -= delta
    }
    const boostMult = boostRef.current.active ? tuning.boostMult : 1.0

    // --- Heading ---
    const rot = rb.rotation()
    const sy = 2.0 * (rot.w * rot.y + rot.z * rot.x)
    const heading = Math.abs(sy) >= 1.0
      ? Math.sign(sy) * (Math.PI / 2)
      : Math.asin(sy)

    // --- Keyboard → Twin-prop RPM (unified input) ---
    // When any drive key is held, keyboard derives portEngineRpm / starboardEngineRpm
    // with differential steering and writes them to the store so the console
    // visualises live keyboard RPMs (bidirectional sync).
    // Console retains ownership when no drive key is pressed.
    const currentThrottle = throttleRef.current
    const currentSteering = steeringRef.current
    const keyboardDriving =
      keys.has('w') || keys.has('s') || keys.has('a') || keys.has('d') ||
      keys.has('arrowup') || keys.has('arrowdown') || keys.has('arrowleft') || keys.has('arrowright')

    if (keyboardDriving) {
      const steerFrac = currentSteering * 0.6
      const portTarget  = Math.max(-RPM_MAX, Math.min(RPM_MAX, (currentThrottle + steerFrac) * RPM_MAX))
      const stbdTarget  = Math.max(-RPM_MAX, Math.min(RPM_MAX, (currentThrottle - steerFrac) * RPM_MAX))
      const rpmRate     = tuning.acceleration * RPM_MAX * delta
      portRpmRef.current = portRpmRef.current < portTarget
        ? Math.min(portTarget, portRpmRef.current + rpmRate)
        : Math.max(portTarget, portRpmRef.current - rpmRate)
      starboardRpmRef.current = starboardRpmRef.current < stbdTarget
        ? Math.min(stbdTarget, starboardRpmRef.current + rpmRate)
        : Math.max(stbdTarget, starboardRpmRef.current - rpmRate)
      updateTugboatState({
        portEngineRpm: portRpmRef.current,
        starboardEngineRpm: starboardRpmRef.current,
      })
    }

    // --- Cavitation dynamics (Direction A) ---
    // Must run before twin-prop force application so we can read live thrust multipliers.
    // Uses commanded RPM + actual hull speed (from previous frame's vel for stability).
    const prevVel = rb.linvel()
    const prevSpeed = Math.sqrt(prevVel.x * prevVel.x + prevVel.z * prevVel.z)
    cavitationSystem.update(
      portRpmRef.current,
      starboardRpmRef.current,
      prevSpeed,
      delta
    )

    // --- Tug radio / ambient audio layer ---
    tugboatSoundSystem.update(
      portRpmRef.current,
      starboardRpmRef.current,
      cavitationState.intensity,
      delta
    )

    // --- Twin-prop forces ---
    // Port and starboard engines apply independent thrust at their lateral offsets.
    // RPMs are driven by keyboard input (above) or directly by the console sliders.
    // Differential creates tank-style rotation; cavitation applies thrust penalty at high slip.
    const portNorm = portRpmRef.current / RPM_MAX          // -1..1
    const starboardNorm = starboardRpmRef.current / RPM_MAX // -1..1

    if (Math.abs(portNorm) > 0.01 || Math.abs(starboardNorm) > 0.01) {
      // Lateral offset of each prop from hull centre (world space, perpendicular to heading)
      const perpX = Math.cos(heading + Math.PI / 2)
      const perpZ = Math.sin(heading + Math.PI / 2)
      const propOffset = 1.2   // metres from centreline
      const propForceScale = tuning.maxSpeed * 2.5 * boostMult * delta

      // Port prop world position (left of heading)
      const portX = rb.translation().x - perpX * propOffset
      const portZ = rb.translation().z - perpZ * propOffset
      const portCavMult = cavitationSystem.getThrustMultiplier('port')
      const portForce = portNorm * propForceScale * portCavMult
      rb.applyImpulseAtPoint(
        { x: Math.cos(heading) * portForce, y: 0, z: Math.sin(heading) * portForce },
        { x: portX, y: rb.translation().y, z: portZ },
        true
      )

      // Starboard prop world position (right of heading)
      const starboardX = rb.translation().x + perpX * propOffset
      const starboardZ = rb.translation().z + perpZ * propOffset
      const starboardCavMult = cavitationSystem.getThrustMultiplier('starboard')
      const starboardForce = starboardNorm * propForceScale * starboardCavMult
      rb.applyImpulseAtPoint(
        { x: Math.cos(heading) * starboardForce, y: 0, z: Math.sin(heading) * starboardForce },
        { x: starboardX, y: rb.translation().y, z: starboardZ },
        true
      )
    }

    // --- Brake (Space) — emergency stop: counter-impulse + drives RPMs to zero ---
    if (keys.has(' ')) {
      const vel = rb.linvel()
      const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
      if (speed > 0.1) {
        const brakeDir = new THREE.Vector3(-vel.x, 0, -vel.z).normalize()
        const brakeForce = tuning.brakeForce * delta * Math.min(speed / 2, 1)
        rb.applyImpulse(
          { x: brakeDir.x * brakeForce, y: 0, z: brakeDir.z * brakeForce },
          true
        )
      }
      // Drive both props to zero so the console reflects the emergency stop
      const brakeRpmRate = tuning.acceleration * RPM_MAX * delta * 4
      portRpmRef.current = portRpmRef.current > 0
        ? Math.max(0, portRpmRef.current - brakeRpmRate)
        : Math.min(0, portRpmRef.current + brakeRpmRate)
      starboardRpmRef.current = starboardRpmRef.current > 0
        ? Math.max(0, starboardRpmRef.current - brakeRpmRate)
        : Math.min(0, starboardRpmRef.current + brakeRpmRate)
      updateTugboatState({
        portEngineRpm: portRpmRef.current,
        starboardEngineRpm: starboardRpmRef.current,
      })
    }

    // --- Wind ---
    const windForce = stormSystem.getWindForce()
    if (windForce.lengthSq() > 0) {
      rb.applyImpulse(
        { x: windForce.x * delta, y: 0, z: windForce.z * delta },
        true
      )
    }

    // --- Surface current ---
    const pos = rb.translation()
    const current = waveSystem.getSurfaceCurrent(pos.x, pos.z)
    if (current.lengthSq() > 0) {
      rb.applyImpulse(
        { x: current.x * delta * 0.5, y: 0, z: current.z * delta * 0.5 },
        true
      )
    }

    // -----------------------------------------------------------------
    // BUOYANCY
    // -----------------------------------------------------------------
    const time = waveSystem.getTime()
    const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)

    for (const offset of PROBE_OFFSETS) {
      const localOff = new THREE.Vector3(offset.x, 0, offset.z)
      localOff.applyQuaternion(quat)

      const probeX = pos.x + localOff.x
      const probeZ = pos.z + localOff.z
      const waterH = waveSystem.getWaterHeight(probeX, probeZ, time)
      const probeY = pos.y + localOff.y
      const submerged = waterH - 2.5 - probeY

      if (submerged > 0) {
        const force = submerged * PHYSICS.buoyancyScale * delta
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
      const chaosForce = (Math.random() - 0.5) * stormInt * 15 * delta
      rb.applyImpulse({ x: 0, y: chaosForce, z: 0 }, true)
    }

    // --- Vertical damping ---
    const vel = rb.linvel()
    if (vel.y !== 0) {
      rb.applyImpulse(
        { x: 0, y: -vel.y * PHYSICS.dampingScale * delta, z: 0 },
        true
      )
    }

    // --- Angular damping & restoring torque ---
    const angVel = rb.angvel()
    rb.applyTorqueImpulse(
      { x: -angVel.x * PHYSICS.angularDamping * delta, y: 0, z: -angVel.z * PHYSICS.angularDamping * delta },
      true
    )

    const euler = new THREE.Euler().setFromQuaternion(quat)
    rb.applyTorqueImpulse(
      {
        x: -euler.x * PHYSICS.restoringTorque * delta,
        y: 0,
        z: -euler.z * PHYSICS.restoringTorque * delta,
      },
      true
    )

    // --- Max speed clamp ---
    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
    if (speed > tuning.maxSpeed * boostMult) {
      const scale = (tuning.maxSpeed * boostMult) / speed
      rb.setLinvel({ x: vel.x * scale, y: vel.y, z: vel.z * scale }, true)
    }

    // --- Update refs for collision handler ---
    speedRef.current = speed
    headingRef.current = heading

    // --- Update wake system (consumed by Water.tsx each frame, zero React cost) ---
    tugboatWakeState.active = true
    tugboatWakeState.position.set(pos.x, pos.y, pos.z)
    tugboatWakeState.direction.set(Math.cos(heading), 0, Math.sin(heading))
    tugboatWakeState.speed = speed
    // propWashPower: blend throttle + speed fraction + average absolute engine RPM
    const avgRpmFrac = (Math.abs(portRpmRef.current) + Math.abs(starboardRpmRef.current)) / (2 * RPM_MAX)
    tugboatWakeState.propWashPower = Math.min(
      1,
      Math.abs(currentThrottle) * 0.5 + (speed / (tuning.maxSpeed * boostMult)) * 0.35 + avgRpmFrac * 0.15
    )
    tugboatWakeState.washAsymmetry = (portRpmRef.current - starboardRpmRef.current) / RPM_MAX

    // --- Update store ---
    updateTugboatState({
      position: [pos.x, pos.y, pos.z],
      velocity: [vel.x, vel.y, vel.z],
      throttle: currentThrottle,
      steering: currentSteering,
      heading,
    })

    // --- Mouse look return-to-center ---
    if (!isMouseLookRef.current) {
      targetYawRef.current = THREE.MathUtils.lerp(targetYawRef.current, 0, delta * 4)
      targetPitchRef.current = THREE.MathUtils.lerp(targetPitchRef.current, 0, delta * 4)
    }
    yawRef.current = THREE.MathUtils.lerp(yawRef.current, targetYawRef.current, delta * 15)
    pitchRef.current = THREE.MathUtils.lerp(pitchRef.current, targetPitchRef.current, delta * 15)
  })

  // ---------------------------------------------------------------------------
  // MOUSE LOOK CAMERA REF
  // ---------------------------------------------------------------------------

  const camGroupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (camGroupRef.current) {
      camGroupRef.current.rotation.y = yawRef.current
      camGroupRef.current.rotation.x = pitchRef.current
    }
  })

  // ---------------------------------------------------------------------------
  // GEOMETRY
  // ---------------------------------------------------------------------------

  const hullColor = '#cc3300'
  const cabinColor = '#ffffff'
  const deckColor = '#8b4513'

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <>
      <RigidBody
        ref={rbRef}
        type="dynamic"
        mass={PHYSICS.mass}
        linearDamping={PHYSICS.linearDamping}
        angularDamping={PHYSICS.angularDamping}
        position={[20, 0.5, 10]}
        enabledRotations={[true, true, true]}
        colliders="cuboid"
        onCollisionEnter={(e) => {
          if (!towingUnlocked) return
          const other = e.other.rigidBody
          if (!other || other === rbRef.current) return
          const otherMass = other.mass()
          if (otherMass < 20) return // only amplify pushes against heavy ships

          const pushSpeed = speedRef.current
          if (pushSpeed < 0.5) return

          const h = headingRef.current
          const pushForce = pushSpeed * 20 * Math.min(otherMass / 30, 2)

          other.applyImpulse(
            { x: Math.cos(h) * pushForce, y: 0, z: Math.sin(h) * pushForce },
            true
          )
        }}
      >
        {/* === HULL === */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[3, 1.2, 6]} />
          <meshStandardMaterial color={hullColor} roughness={0.7} metalness={0.3} />
        </mesh>

        {/* Hull bow slope */}
        <mesh position={[0, 0.6, 3.2]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[2.8, 0.8, 1.2]} />
          <meshStandardMaterial color={hullColor} roughness={0.7} metalness={0.3} />
        </mesh>

        {/* Hull stern */}
        <mesh position={[0, 0.4, -3.2]} castShadow>
          <boxGeometry args={[2.8, 0.8, 0.8]} />
          <meshStandardMaterial color={hullColor} roughness={0.7} metalness={0.3} />
        </mesh>

        {/* === DECK === */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[2.6, 0.1, 5.6]} />
          <meshStandardMaterial color={deckColor} roughness={0.9} />
        </mesh>

        {/* === WHEELHOUSE === */}
        <mesh position={[0, 1.8, -0.5]} castShadow>
          <boxGeometry args={[2, 1.4, 2]} />
          <meshStandardMaterial color={cabinColor} roughness={0.5} metalness={0.1} />
        </mesh>

        {/* Wheelhouse windows */}
        <mesh position={[0, 2.0, 0.51]}>
          <boxGeometry args={[1.6, 0.6, 0.05]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.7} />
        </mesh>
        <mesh position={[1.01, 2.0, -0.5]}>
          <boxGeometry args={[0.05, 0.6, 1.4]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.7} />
        </mesh>
        <mesh position={[-1.01, 2.0, -0.5]}>
          <boxGeometry args={[0.05, 0.6, 1.4]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.7} />
        </mesh>

        {/* === FUNNEL === */}
        <mesh position={[0, 2.6, -1.2]} castShadow>
          <cylinderGeometry args={[0.25, 0.35, 0.8, 16]} />
          <meshStandardMaterial color="#333333" roughness={0.8} />
        </mesh>
        <mesh position={[0, 3.05, -1.2]}>
          <torusGeometry args={[0.3, 0.05, 8, 16]} />
          <meshStandardMaterial color="#555555" roughness={0.6} metalness={0.5} />
        </mesh>

        {/* === DECK RAILS === */}
        {[
          [-1.2, 1.2, 2.5], [1.2, 1.2, 2.5],
          [-1.2, 1.2, -2.5], [1.2, 1.2, -2.5],
        ].map((pos, i) => (
          <mesh key={`rail-${i}`} position={pos as [number, number, number]}>
            <boxGeometry args={[0.05, 0.5, 0.05]} />
            <meshStandardMaterial color="#cccccc" metalness={0.6} />
          </mesh>
        ))}

        {/* === SEARCHLIGHT === */}
        <mesh position={[0.8, 2.3, 0.6]}>
          <cylinderGeometry args={[0.15, 0.2, 0.3, 12]} />
          <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.7} />
        </mesh>
        <spotLight
          position={[0.8, 2.3, 0.8]}
          angle={0.4}
          penumbra={0.5}
          intensity={3}
          distance={40}
          castShadow
          color="#fff8e0"
          target-position={[0.8, 1.0, 5]}
        />

        {/* === HELM WHEEL === */}
        <mesh position={[0, 1.6, 0.6]} rotation={[0.5, 0, 0]}>
          <torusGeometry args={[0.25, 0.03, 8, 24]} />
          <meshStandardMaterial color="#8b4513" roughness={0.6} />
        </mesh>

        {/* === DASHBOARD SCREENS (glowing) === */}
        <DashboardScreen
          position={[0, 2.05, 0.45]}
          rotation={[-0.3, 0, 0]}
          size={[0.6, 0.4]}
          color="#00ff88"
          glowIntensity={1.2}
        />
        <mesh position={[0, 2.05, 0.46]} rotation={[-0.3, 0, 0]}>
          <ringGeometry args={[0.15, 0.16, 32]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.8} />
        </mesh>
        <RadarSweepLine position={[0, 2.05, 0.465]} />

        <DashboardScreen
          position={[-0.5, 2.05, 0.4]}
          rotation={[-0.3, 0, 0]}
          size={[0.25, 0.2]}
          color="#00aaff"
          glowIntensity={0.8}
        />
        <DashboardScreen
          position={[0.5, 2.05, 0.4]}
          rotation={[-0.3, 0, 0]}
          size={[0.25, 0.2]}
          color="#ff6600"
          glowIntensity={0.8}
        />

        {/* === FIRST-PERSON HELM CAMERA === */}
        <group position={[0, 2.15, 0.25]}>
          <group ref={camGroupRef}>
            <PerspectiveCamera
              makeDefault
              fov={75}
              near={0.1}
              far={1000}
            />
          </group>
        </group>
      </RigidBody>
    </>
  )
}
