/* eslint-disable no-restricted-syntax -- wall-clock / audio / network; see docs/systems/DETERMINISM.md */
// =============================================================================
// CRANE SOUND SYSTEM - HarborGlow
// Realistic crane operation sounds on the WASM AudioRuntime
// Hydraulics, trolley, winch, rope tension creaks, impact sounds
// =============================================================================

import { audioRuntime } from './audio/AudioRuntime'
import { Drone, Instrument, unlockAudio } from './audio/voices'

// =============================================================================
// SOUND STATE & CONFIG
// =============================================================================

interface CraneSoundConfig {
  masterVolume: number
  enabled: boolean
  hydraulicVolume: number
  trolleyVolume: number
  winchVolume: number
  ropeVolume: number
  impactVolume: number
}

const config: CraneSoundConfig = {
  masterVolume: -8,
  enabled: true,
  hydraulicVolume: 0.8,
  trolleyVolume: 0.6,
  winchVolume: 0.7,
  ropeVolume: 0.5,
  impactVolume: 0.9
}

// Crane movement state
interface CraneState {
  isMovingHorizontal: boolean
  isMovingVertical: boolean
  isRotating: boolean
  speed: number
  loadWeight: number
  tension: number
}

const craneState: CraneState = {
  isMovingHorizontal: false,
  isMovingVertical: false,
  isRotating: false,
  speed: 0,
  loadWeight: 0,
  tension: 0
}

// =============================================================================
// VOICE INSTANCES
// =============================================================================

// Hydraulic pump - low noise rumble that swells with movement
let hydraulicDrone: Drone | null = null

// Trolley motor - whirring mechanical sound
let trolleyDrone: Drone | null = null

// Winch motor - higher pitched winding sound
let winchDrone: Drone | null = null

// Rope creak - noise burst that responds to tension
let ropeSynth: Instrument | null = null

// Impact sounds - metallic hits
let impactSynth: Instrument | null = null
let lockSynth: Instrument | null = null

// Brake squeal
let brakeSynth: Instrument | null = null

const IMPACT_ENVELOPE = { attack: 0.001, decay: 0.3, release: 0.2 }

// =============================================================================
// INITIALIZATION
// =============================================================================

function initSynths() {
  if (!config.enabled) return
  audioRuntime.setAcousticSpace('crane-cab', 0.32)

  // Hydraulic system - noise bed
  if (!hydraulicDrone) {
    hydraulicDrone = new Drone({
      waveform: 'noise',
      frequency: 100,
      volumeDb: config.masterVolume - 10,
      attack: 0.5,
      release: 1,
    })
  }

  // Trolley - sawtooth motor whine
  if (!trolleyDrone) {
    trolleyDrone = new Drone({
      waveform: 'sawtooth',
      frequency: 80,
      volumeDb: config.masterVolume - 15,
      attack: 0.3,
      release: 0.5,
    })
  }

  // Winch - square wave winding
  if (!winchDrone) {
    winchDrone = new Drone({
      waveform: 'square',
      frequency: 120,
      volumeDb: config.masterVolume - 18,
      attack: 0.3,
      release: 0.5,
    })
  }

  // Rope creak - noise burst
  if (!ropeSynth) {
    ropeSynth = new Instrument({
      waveform: 'noise',
      envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1 },
      volumeDb: config.masterVolume - 12,
    })
  }

  // Impact sounds
  if (!impactSynth) {
    impactSynth = new Instrument({
      waveform: 'metal',
      envelope: { ...IMPACT_ENVELOPE },
      volumeDb: config.masterVolume - 5,
    })
  }

  // Lock sound - mechanical click
  if (!lockSynth) {
    lockSynth = new Instrument({
      waveform: 'membrane',
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
      volumeDb: config.masterVolume - 3,
    })
  }

  // Brake squeal
  if (!brakeSynth) {
    brakeSynth = new Instrument({
      waveform: 'noise',
      envelope: { attack: 0.1, decay: 0.5, sustain: 0, release: 0.3 },
      volumeDb: config.masterVolume - 8,
    })
  }
}

// =============================================================================
// CRANE MOVEMENT SOUNDS
// =============================================================================

export async function startHydraulicMovement(intensity: number = 0.5) {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()
  
  craneState.isMovingHorizontal = true
  craneState.speed = intensity
  
  // Fade in hydraulic sound
  hydraulicDrone?.setVolumeDb(config.masterVolume - 10 + (intensity * 5))
  hydraulicDrone?.start()
  
  // Start trolley sound with pitch based on speed
  if (trolleyDrone) {
    trolleyDrone.setFrequency(60 + intensity * 60)
    trolleyDrone.setVolumeDb(config.masterVolume - 15 + intensity * 5)
    trolleyDrone.start()
  }
}

export async function stopHydraulicMovement() {
  if (!config.enabled) return
  
  craneState.isMovingHorizontal = false
  
  // Fade out on the drone release envelopes
  hydraulicDrone?.stop()
  
  // Stop trolley
  trolleyDrone?.stop()
}

export async function startWinchMovement(direction: 'up' | 'down', intensity: number = 0.5) {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()
  
  craneState.isMovingVertical = true
  craneState.speed = intensity
  
  if (winchDrone) {
    const baseFreq = direction === 'up' ? 150 : 100
    winchDrone.setFrequency(baseFreq + intensity * 50)
    winchDrone.setVolumeDb(config.masterVolume - 18 + intensity * 6)
    winchDrone.start()
  }
  
  // Hydraulic assist for heavy loads
  if (intensity > 0.7) {
    hydraulicDrone?.setVolumeDb(config.masterVolume - 8)
    hydraulicDrone?.start()
  }
}

export async function stopWinchMovement() {
  if (!config.enabled) return
  
  craneState.isMovingVertical = false
  
  winchDrone?.stop()
  
  if (!craneState.isMovingHorizontal) {
    hydraulicDrone?.stop()
  }
}

// =============================================================================
// ROPE TENSION SOUNDS
// =============================================================================

export async function updateRopeTension(tension: number, loadWeight: number) {
  if (!config.enabled) return
  
  craneState.tension = tension
  craneState.loadWeight = loadWeight
  
  // Play creaking sounds when tension is high
  if (tension > 0.6 && Math.random() < tension * 0.1) {
    await unlockAudio()
    initSynths()
    
    if (ropeSynth) {
      // Randomize volume based on load weight
      ropeSynth.volumeDb = config.masterVolume - 12 + (loadWeight * 0.2)
      ropeSynth.play(200 + tension * 800, '16n')
    }
  }
}

export async function playRopeStrain(intensity: number = 0.5) {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()
  
  if (ropeSynth) {
    ropeSynth.volumeDb = config.masterVolume - 8
    ropeSynth.play(600 + intensity * 1000, '8n')
  }
}

// =============================================================================
// IMPACT & LOCK SOUNDS
// =============================================================================

export async function playContainerImpact(size: 'small' | 'medium' | 'large' = 'medium') {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()
  
  // Main impact
  const decay = size === 'small' ? 0.2 : size === 'large' ? 0.5 : 0.3
  if (impactSynth) impactSynth.envelope = { ...IMPACT_ENVELOPE, decay }
  impactSynth?.play(240, '8n')
  
  // Secondary impact (echo)
  lockSynth?.play('C2', '16n', { delay: 0.1 })
}

export async function playTwistlockEngage() {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()
  
  // Mechanical click
  lockSynth?.play('C3', '32n')
  
  // Metal scrape
  impactSynth?.play(240, '32n', { delay: 0.05 })
}

export async function playTwistlockDisengage() {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()
  
  // Unlock sound - higher pitch
  lockSynth?.play('E3', '32n')
}

/** Heavier mechanical lock clunk on rig bind — distinct from twistlock engage. */
export async function playInstallationLock() {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()

  // Low thud
  lockSynth?.play('G1', '16n')

  // Metal clank layered below the lighter twistlock cue
  if (impactSynth) {
    impactSynth.envelope = { attack: 0.001, decay: 0.45, release: 0.25 }
    impactSynth.play(200, '8n', { delay: 0.03 })
  }
}

export async function playSpreaderCollision() {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()
  
  // Heavy metal hit
  impactSynth?.play(240, '16n')
  
  // Brake squeal
  brakeSynth?.play(160, '8n', { delay: 0.05 })
}

// =============================================================================
// BRAKE SOUNDS
// =============================================================================

export async function playBrakeEngage(intensity: number = 0.5) {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()
  
  if (intensity > 0.7) {
    if (brakeSynth) brakeSynth.volumeDb = config.masterVolume - 8
    brakeSynth?.play(160, '16n')
  } else {
    lockSynth?.play('G2', '32n')
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function setCraneSoundVolume(volumeDb: number) {
  config.masterVolume = volumeDb
  
  hydraulicDrone?.setVolumeDb(volumeDb - 10)
  trolleyDrone?.setVolumeDb(volumeDb - 15)
  winchDrone?.setVolumeDb(volumeDb - 18)
  if (ropeSynth) ropeSynth.volumeDb = volumeDb - 12
  if (impactSynth) impactSynth.volumeDb = volumeDb - 5
  if (lockSynth) lockSynth.volumeDb = volumeDb - 3
  if (brakeSynth) brakeSynth.volumeDb = volumeDb - 8
}

export function setCraneSoundsEnabled(enabled: boolean) {
  config.enabled = enabled
  
  if (!enabled) {
    stopAllSounds()
  }
}

export function stopAllSounds() {
  hydraulicDrone?.stop()
  trolleyDrone?.stop()
  winchDrone?.stop()
  
  ropeSynth?.dispose()
  ropeSynth = null
}

export function disposeCraneSounds() {
  stopAllSounds()
  impactSynth?.dispose()
  lockSynth?.dispose()
  brakeSynth?.dispose()
  
  hydraulicDrone = null
  trolleyDrone = null
  winchDrone = null
  impactSynth = null
  lockSynth = null
  brakeSynth = null
}

// =============================================================================
// REACT HOOK
// =============================================================================

import { useEffect } from 'react'

export function useCraneSounds() {
  
  useEffect(() => {
    return () => {
      stopAllSounds()
    }
  }, [])
  
  return {
    startHydraulicMovement,
    stopHydraulicMovement,
    startWinchMovement,
    stopWinchMovement,
    updateRopeTension,
    playContainerImpact,
    playTwistlockEngage,
    playTwistlockDisengage,
    playSpreaderCollision,
    playBrakeEngage,
    setVolume: setCraneSoundVolume,
    setEnabled: setCraneSoundsEnabled
  }
}
