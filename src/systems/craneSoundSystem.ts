// =============================================================================
// CRANE SOUND SYSTEM - HarborGlow
// Realistic crane operation sounds using Tone.js
// Hydraulics, trolley, winch, rope tension creaks, impact sounds
// =============================================================================

import * as Tone from 'tone'

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

let craneState: CraneState = {
  isMovingHorizontal: false,
  isMovingVertical: false,
  isRotating: false,
  speed: 0,
  loadWeight: 0,
  tension: 0
}

// =============================================================================
// SYNTH INSTANCES
// =============================================================================

// Hydraulic pump - low rumble that modulates with movement
let hydraulicSynth: Tone.NoiseSynth | null = null
let hydraulicFilter: Tone.AutoFilter | null = null

// Trolley motor - whirring mechanical sound
let trolleySynth: Tone.Oscillator | null = null
let trolleyLFO: Tone.LFO | null = null

// Winch motor - higher pitched winding sound
let winchSynth: Tone.Oscillator | null = null
let winchLFO: Tone.LFO | null = null

// Rope creak - filtered noise that responds to tension
let ropeSynth: Tone.NoiseSynth | null = null
let ropeFilter: Tone.Filter | null = null

// Impact sounds - metallic hits
let impactSynth: Tone.MetalSynth | null = null
let lockSynth: Tone.MembraneSynth | null = null

// Brake squeal
let brakeSynth: Tone.NoiseSynth | null = null

// =============================================================================
// INITIALIZATION
// =============================================================================

function initSynths() {
  if (!config.enabled) return

  // Hydraulic system - brown noise with lowpass filter
  if (!hydraulicSynth) {
    hydraulicFilter = new Tone.AutoFilter({
      frequency: 0.5,
      baseFrequency: 100,
      octaves: 2,
      depth: 0.5,
      type: 'sine'
    }).toDestination()
    
    hydraulicSynth = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: {
        attack: 0.5,
        decay: 0.1,
        sustain: 1,
        release: 1
      }
    }).connect(hydraulicFilter)
    
    hydraulicSynth.volume.value = config.masterVolume - 10
  }

  // Trolley - sawtooth with vibrato
  if (!trolleySynth) {
    trolleySynth = new Tone.Oscillator({
      type: 'sawtooth',
      frequency: 80
    }).toDestination()
    
    trolleyLFO = new Tone.LFO(5, 75, 85).connect(trolleySynth.frequency)
    trolleyLFO.start()
    
    trolleySynth.volume.value = config.masterVolume - 15
    trolleySynth.volume.value = -Infinity // Start silent
  }

  // Winch - square wave with FM
  if (!winchSynth) {
    winchSynth = new Tone.Oscillator({
      type: 'square',
      frequency: 120
    }).toDestination()
    
    winchLFO = new Tone.LFO(10, 115, 125).connect(winchSynth.frequency)
    winchLFO.start()
    
    winchSynth.volume.value = config.masterVolume - 18
    winchSynth.volume.value = -Infinity // Start silent
  }

  // Rope creak - pink noise with resonant filter
  if (!ropeSynth) {
    ropeFilter = new Tone.Filter(400, 'lowpass').toDestination()
    
    ropeSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: {
        attack: 0.1,
        decay: 0.5,
        sustain: 0.3,
        release: 1
      }
    }).connect(ropeFilter)
    
    ropeSynth.volume.value = config.masterVolume - 12
  }

  // Impact sounds
  if (!impactSynth) {
    impactSynth = new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.3,
        release: 0.2
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination()
    
    impactSynth.volume.value = config.masterVolume - 5
  }

  // Lock sound - mechanical click
  if (!lockSynth) {
    lockSynth = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 1,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      }
    }).toDestination()
    
    lockSynth.volume.value = config.masterVolume - 3
  }

  // Brake squeal
  if (!brakeSynth) {
    brakeSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.1,
        decay: 0.5,
        sustain: 0,
        release: 0.3
      }
    }).toDestination()
    
    brakeSynth.volume.value = config.masterVolume - 8
  }
}

// =============================================================================
// CRANE MOVEMENT SOUNDS
// =============================================================================

export async function startHydraulicMovement(intensity: number = 0.5) {
  if (!config.enabled) return
  await Tone.start()
  initSynths()
  
  craneState.isMovingHorizontal = true
  craneState.speed = intensity
  
  // Fade in hydraulic sound
  const targetVol = config.masterVolume - 10 + (intensity * 5)
  hydraulicSynth?.volume.rampTo(targetVol, 0.5)
  hydraulicSynth?.triggerAttack()
  
  // Start trolley sound with pitch based on speed
  if (trolleySynth) {
    const baseFreq = 60 + intensity * 60
    trolleySynth.frequency.rampTo(baseFreq, 0.2)
    trolleySynth.volume.rampTo(config.masterVolume - 15 + intensity * 5, 0.3)
    trolleySynth.start()
  }
}

export async function stopHydraulicMovement() {
  if (!config.enabled) return
  
  craneState.isMovingHorizontal = false
  
  // Fade out
  hydraulicSynth?.volume.rampTo(-Infinity, 1)
  setTimeout(() => hydraulicSynth?.triggerRelease(), 1000)
  
  // Stop trolley
  trolleySynth?.volume.rampTo(-Infinity, 0.5)
  setTimeout(() => trolleySynth?.stop(), 500)
}

export async function startWinchMovement(direction: 'up' | 'down', intensity: number = 0.5) {
  if (!config.enabled) return
  await Tone.start()
  initSynths()
  
  craneState.isMovingVertical = true
  craneState.speed = intensity
  
  if (winchSynth) {
    const baseFreq = direction === 'up' ? 150 : 100
    winchSynth.frequency.rampTo(baseFreq + intensity * 50, 0.2)
    winchSynth.volume.rampTo(config.masterVolume - 18 + intensity * 6, 0.3)
    winchSynth.start()
  }
  
  // Hydraulic assist for heavy loads
  if (intensity > 0.7) {
    hydraulicSynth?.volume.rampTo(config.masterVolume - 8, 0.3)
    hydraulicSynth?.triggerAttack()
  }
}

export async function stopWinchMovement() {
  if (!config.enabled) return
  
  craneState.isMovingVertical = false
  
  winchSynth?.volume.rampTo(-Infinity, 0.5)
  setTimeout(() => winchSynth?.stop(), 500)
  
  if (!craneState.isMovingHorizontal) {
    hydraulicSynth?.volume.rampTo(-Infinity, 0.5)
    setTimeout(() => hydraulicSynth?.triggerRelease(), 500)
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
    await Tone.start()
    initSynths()
    
    if (ropeSynth && ropeFilter) {
      // Higher tension = higher filter frequency = tighter sound
      const filterFreq = 200 + tension * 800
      ropeFilter.frequency.rampTo(filterFreq, 0.1)
      
      // Randomize volume based on load weight
      const creakVol = config.masterVolume - 12 + (loadWeight * 0.2)
      ropeSynth.volume.value = creakVol
      
      ropeSynth.triggerAttackRelease('16n')
    }
  }
}

export async function playRopeStrain(intensity: number = 0.5) {
  if (!config.enabled) return
  await Tone.start()
  initSynths()
  
  if (ropeSynth && ropeFilter) {
    ropeFilter.frequency.value = 600 + intensity * 1000
    ropeSynth.volume.value = config.masterVolume - 8
    ropeSynth.triggerAttackRelease('8n')
  }
}

// =============================================================================
// IMPACT & LOCK SOUNDS
// =============================================================================

export async function playContainerImpact(size: 'small' | 'medium' | 'large' = 'medium') {
  if (!config.enabled) return
  await Tone.start()
  initSynths()
  
  const now = Tone.now()
  
  // Main impact
  const decay = size === 'small' ? 0.2 : size === 'large' ? 0.5 : 0.3
  impactSynth?.set({ envelope: { decay } })
  impactSynth?.triggerAttackRelease('8n', now)
  
  // Secondary impact (echo)
  setTimeout(() => {
    lockSynth?.triggerAttackRelease('C2', '16n')
  }, 100)
}

export async function playTwistlockEngage() {
  if (!config.enabled) return
  await Tone.start()
  initSynths()
  
  const now = Tone.now()
  
  // Mechanical click
  lockSynth?.triggerAttackRelease('C3', '32n', now)
  
  // Metal scrape
  impactSynth?.triggerAttackRelease('32n', now + 0.05)
}

export async function playTwistlockDisengage() {
  if (!config.enabled) return
  await Tone.start()
  initSynths()
  
  // Unlock sound - higher pitch
  lockSynth?.triggerAttackRelease('E3', '32n')
}

export async function playSpreaderCollision() {
  if (!config.enabled) return
  await Tone.start()
  initSynths()
  
  const now = Tone.now()
  
  // Heavy metal hit
  impactSynth?.triggerAttackRelease('16n', now)
  
  // Brake squeal
  brakeSynth?.triggerAttackRelease('8n', now + 0.05)
}

// =============================================================================
// BRAKE SOUNDS
// =============================================================================

export async function playBrakeEngage(intensity: number = 0.5) {
  if (!config.enabled) return
  await Tone.start()
  initSynths()
  
  if (intensity > 0.7) {
    if (brakeSynth) brakeSynth.volume.value = config.masterVolume - 8
    brakeSynth?.triggerAttackRelease('16n')
  } else {
    lockSynth?.triggerAttackRelease('G2', '32n')
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function setCraneSoundVolume(volumeDb: number) {
  config.masterVolume = volumeDb
  
  if (hydraulicSynth) hydraulicSynth.volume.value = volumeDb - 10
  if (trolleySynth) trolleySynth.volume.value = volumeDb - 15
  if (winchSynth) winchSynth.volume.value = volumeDb - 18
  if (ropeSynth) ropeSynth.volume.value = volumeDb - 12
  if (impactSynth) impactSynth.volume.value = volumeDb - 5
  if (lockSynth) lockSynth.volume.value = volumeDb - 3
  if (brakeSynth) brakeSynth.volume.value = volumeDb - 8
}

export function setCraneSoundsEnabled(enabled: boolean) {
  config.enabled = enabled
  
  if (!enabled) {
    stopAllSounds()
  }
}

export function stopAllSounds() {
  hydraulicSynth?.triggerRelease()
  hydraulicSynth?.volume.rampTo(-Infinity, 0.1)
  
  trolleySynth?.stop()
  winchSynth?.stop()
  
  ropeSynth?.dispose()
  ropeSynth = null
}

export function disposeCraneSounds() {
  hydraulicSynth?.dispose()
  hydraulicFilter?.dispose()
  trolleySynth?.dispose()
  trolleyLFO?.dispose()
  winchSynth?.dispose()
  winchLFO?.dispose()
  ropeSynth?.dispose()
  ropeFilter?.dispose()
  impactSynth?.dispose()
  lockSynth?.dispose()
  brakeSynth?.dispose()
  
  hydraulicSynth = null
  hydraulicFilter = null
  trolleySynth = null
  trolleyLFO = null
  winchSynth = null
  winchLFO = null
  ropeSynth = null
  ropeFilter = null
  impactSynth = null
  lockSynth = null
  brakeSynth = null
}

// =============================================================================
// REACT HOOK
// =============================================================================

import { useEffect, useRef } from 'react'

export function useCraneSounds() {
  const lastTensionRef = useRef(0)
  
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
