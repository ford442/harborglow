/* eslint-disable no-restricted-syntax -- wall-clock / audio / network; see docs/systems/DETERMINISM.md */
// =============================================================================
// AMBIENT SOUND SYSTEM - HarborGlow
// Dynamic environmental audio that changes with time of day
// Harbor ambience, seagulls, distant ships, waves, foghorns
// =============================================================================

import { Drone, Instrument, unlockAudio } from './audio/voices'
import { timeSystem } from './timeSystem'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// CONFIGURATION
// =============================================================================

interface AmbientConfig {
  masterVolume: number
  enabled: boolean
  dayVolume: number
  nightVolume: number
  weatherVolume: number
}

const config: AmbientConfig = {
  masterVolume: -12,
  enabled: true,
  dayVolume: 0.8,
  nightVolume: 0.4,
  weatherVolume: 0.7
}

// Time of day phases
const TIME_PHASES = {
  night: { start: 22, end: 5 },
  dawn: { start: 5, end: 7 },
  day: { start: 7, end: 17 },
  golden: { start: 17, end: 19 },
  dusk: { start: 19, end: 22 }
}

// =============================================================================
// SYNTH INSTANCES
// =============================================================================

// Ocean waves - noise bed
let waveDrone: Drone | null = null

// Harbor ambience - distant industrial sounds
let harborDrone: Drone | null = null

// Seagulls - triangle bird calls
let birdSynth: Instrument | null = null

// Distant foghorn - low sine blasts
let foghornSynth: Instrument | null = null

// Distant ship engines - low rumble
let shipEngineDrone: Drone | null = null

// Ship horn - low sawtooth blast
let shipHornSynth: Instrument | null = null

// Wind - noise bed
let windDrone: Drone | null = null

// Night ambience - subtle drone
let nightDrone: Drone | null = null

// =============================================================================
// INITIALIZATION
// =============================================================================

function initSynths() {
  if (!config.enabled) return

  // Ocean waves - noise with slow swell
  if (!waveDrone) {
    waveDrone = new Drone({
      waveform: 'noise',
      frequency: 400,
      volumeDb: config.masterVolume - 5,
      attack: 2,
      release: 3,
    })
  }

  // Harbor ambience - low noise
  if (!harborDrone) {
    harborDrone = new Drone({
      waveform: 'noise',
      frequency: 800,
      volumeDb: config.masterVolume - 10,
      attack: 3,
      release: 5,
    })
  }

  // Seagulls - triangle wave
  if (!birdSynth) {
    birdSynth = new Instrument({
      waveform: 'triangle',
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.2, release: 0.5 },
      volumeDb: config.masterVolume - 8,
    })
  }

  // Foghorn - sine wave, very low
  if (!foghornSynth) {
    foghornSynth = new Instrument({
      waveform: 'sine',
      envelope: { attack: 0.5, decay: 0, sustain: 1, release: 1 },
      volumeDb: config.masterVolume - 10,
    })
  }

  // Ship engines - sawtooth rumble, silent until weather sets a level
  if (!shipEngineDrone) {
    shipEngineDrone = new Drone({
      waveform: 'sawtooth',
      frequency: 45,
      volumeDb: -Infinity,
      attack: 1,
      release: 2,
    })
  }

  if (!shipHornSynth) {
    shipHornSynth = new Instrument({
      waveform: 'sawtooth',
      envelope: { attack: 0.3, decay: 0, sustain: 1, release: 2 },
    })
  }

  // Wind - noise, silent until weather sets a level
  if (!windDrone) {
    windDrone = new Drone({
      waveform: 'noise',
      frequency: 300,
      volumeDb: -Infinity,
      attack: 3,
      release: 4,
    })
  }

  // Night drone - subtle low sine
  if (!nightDrone) {
    nightDrone = new Drone({
      waveform: 'sine',
      frequency: 55,
      volumeDb: -Infinity,
      attack: 3,
      release: 3,
    })
  }
}

/** Fade a drone to `db`, starting it when audible and stopping it at -Infinity. */
function fadeDrone(drone: Drone | null, db: number) {
  if (!drone) return
  if (!Number.isFinite(db)) {
    drone.stop()
    return
  }
  drone.setVolumeDb(db)
  drone.start()
}

// =============================================================================
// TIME-BASED AMBIENCE
// =============================================================================

function getTimePhase(hour: number): keyof typeof TIME_PHASES {
  for (const [phase, times] of Object.entries(TIME_PHASES)) {
    if (times.start <= times.end) {
      if (hour >= times.start && hour < times.end) return phase as keyof typeof TIME_PHASES
    } else {
      // Handles wrap-around (night: 22-5)
      if (hour >= times.start || hour < times.end) return phase as keyof typeof TIME_PHASES
    }
  }
  return 'day'
}

export async function updateAmbientForTime(hour: number, weather: string) {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()

  const phase = getTimePhase(hour)
  
  // Base volume adjustment
  let baseVolume = config.masterVolume
  
  switch (phase) {
    case 'night':
      baseVolume = config.masterVolume + config.nightVolume * 10
      updateNightAmbience(1)
      updateBirdActivity(0)
      break
      
    case 'dawn':
      baseVolume = config.masterVolume + config.dayVolume * 5
      updateNightAmbience(0.3)
      updateBirdActivity(0.6)
      break
      
    case 'day':
      baseVolume = config.masterVolume + config.dayVolume * 10
      updateNightAmbience(0)
      updateBirdActivity(1)
      break
      
    case 'golden':
      baseVolume = config.masterVolume + config.dayVolume * 8
      updateNightAmbience(0.2)
      updateBirdActivity(0.7)
      break
      
    case 'dusk':
      baseVolume = config.masterVolume + config.nightVolume * 5
      updateNightAmbience(0.6)
      updateBirdActivity(0.3)
      break
  }

  // Weather adjustments
  updateWeatherAmbience(weather, phase)

  // Apply master volume (one write per update — each level change re-voices the drone)
  waveDrone?.setVolumeDb(baseVolume - 5)
  harborDrone?.setVolumeDb(baseVolume - 10)
}

function updateNightAmbience(intensity: number) {
  if (!nightDrone) return
  
  fadeDrone(nightDrone, intensity > 0 ? config.masterVolume - 20 + (intensity * 10) : -Infinity)
}

// =============================================================================
// WEATHER AMBIENCE
// =============================================================================

function updateWeatherAmbience(weather: string, phase: string) {
  if (!windDrone || !shipEngineDrone) return
  
  switch (weather) {
    case 'storm':
      // Strong wind, distant ships seek harbor
      fadeDrone(windDrone, config.masterVolume - 5)
      fadeDrone(shipEngineDrone, config.masterVolume - 15)
      break
      
    case 'rain':
      // Moderate wind
      fadeDrone(windDrone, config.masterVolume - 10)
      fadeDrone(shipEngineDrone, config.masterVolume - 20)
      break
      
    case 'fog':
      // Foghorns become more prominent
      if (phase === 'night' || phase === 'dawn' || phase === 'dusk') {
        playFoghorn()
      }
      fadeDrone(windDrone, config.masterVolume - 15)
      fadeDrone(shipEngineDrone, config.masterVolume - 18)
      break
      
    default: // clear
      fadeDrone(windDrone, -Infinity)
      fadeDrone(shipEngineDrone, config.masterVolume - 25)
  }
}

// =============================================================================
// RANDOM AMBIENT EVENTS
// =============================================================================

let birdInterval: ReturnType<typeof setInterval> | null = null
const foghornInterval: ReturnType<typeof setInterval> | null = null

function updateBirdActivity(intensity: number) {
  if (birdInterval) {
    clearInterval(birdInterval)
    birdInterval = null
  }
  
  if (intensity <= 0) return
  
  // Schedule random bird calls
  const scheduleBird = () => {
    const delay = (10 + Math.random() * 30) / intensity * 1000
    
    birdInterval = setTimeout(() => {
      playBirdCall()
      scheduleBird()
    }, delay)
  }
  
  scheduleBird()
}

interface BirdCallSpatialContext {
  sourcePosition: [number, number, number]
  listenerPosition: [number, number, number]
}

export async function playBirdCall(
  type: 'seagull' | 'distant' = 'seagull',
  spatial?: BirdCallSpatialContext
) {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()

  if (birdSynth && !spatial) {
    birdSynth.volumeDb = config.masterVolume - 8
  }

  // Optional simple distance attenuation.
  if (spatial && birdSynth) {
    const [sx, , sz] = spatial.sourcePosition
    const [lx, , lz] = spatial.listenerPosition
    const dx = sx - lx
    const dz = sz - lz
    const distance = Math.sqrt(dx * dx + dz * dz)
    const attenuation = Math.max(0.2, Math.min(1, 1 - distance / 140))

    birdSynth.volumeDb = config.masterVolume - 16 + attenuation * 10
  }
  
  if (type === 'seagull') {
    // Classic seagull cry - C5 up to G5 and back
    birdSynth?.play('C5', 0.1)
    birdSynth?.play('G5', 0.1, { delay: 0.1 })
    birdSynth?.play('C5', 0.15, { delay: 0.2 })
  } else {
    // Distant bird
    if (birdSynth && !spatial) birdSynth.volumeDb = config.masterVolume - 15
    birdSynth?.play('E5', '4n')
  }
}

export async function playFoghorn() {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()
  
  if (!foghornSynth) return
  
  // Two-tone foghorn: two blasts with a gap
  foghornSynth.volumeDb = config.masterVolume - 10
  foghornSynth.play(65, 2)
  foghornSynth.play(65, 2, { delay: 3 })
}

export async function playShipHorn(distance: 'near' | 'far' = 'far') {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()
  
  if (!shipHornSynth) return
  
  // Low ship horn
  shipHornSynth.volumeDb = distance === 'near' ? config.masterVolume - 10 : config.masterVolume - 20
  shipHornSynth.play(85, 3)
}

// =============================================================================
// RADIO CHATTER SYSTEM
// =============================================================================

interface RadioChatter {
  id: string
  text: string
  priority: 'low' | 'normal' | 'high' | 'emergency'
  type: 'traffic' | 'weather' | 'emergency' | 'coordination' | 'training'
}

const RADIO_CHATTERS: RadioChatter[] = [
  // Traffic
  { id: 't1', text: 'Harbor control to crane 4, container ship approaching berth 7', priority: 'normal', type: 'traffic' },
  { id: 't2', text: 'Tug 2 standing by for tanker assist', priority: 'normal', type: 'traffic' },
  { id: 't3', text: 'Clear channel - priority vessel incoming', priority: 'high', type: 'traffic' },
  { id: 't4', text: 'All stations, cruise liner departing pier 27 in 15 minutes', priority: 'normal', type: 'traffic' },
  
  // Weather
  { id: 'w1', text: 'Marine weather update: winds increasing to 25 knots', priority: 'normal', type: 'weather' },
  { id: 'w2', text: 'Small craft advisory in effect until 1800', priority: 'normal', type: 'weather' },
  { id: 'w3', text: 'Storm warning - all cranes secure loads immediately', priority: 'emergency', type: 'weather' },
  { id: 'w4', text: 'Visibility reducing due to fog - use caution', priority: 'high', type: 'weather' },
  
  // Emergency
  { id: 'e1', text: 'Emergency - fire onboard container vessel, all fireboats respond', priority: 'emergency', type: 'emergency' },
  { id: 'e2', text: 'Man overboard - vessel at marker 7', priority: 'emergency', type: 'emergency' },
  { id: 'e3', text: 'Medical emergency pier 35, ambulance en route', priority: 'high', type: 'emergency' },
  
  // Coordination
  { id: 'c1', text: 'Crane 2 coordinate with crane 3 for tandem lift', priority: 'normal', type: 'coordination' },
  { id: 'c2', text: 'Rail crew ready for container transfer', priority: 'normal', type: 'coordination' },
  { id: 'c3', text: 'Pilot boat departing for incoming LNG carrier', priority: 'high', type: 'coordination' },
  
  // Training
  { id: 'tr1', text: 'Training mode active - all traffic hold positions', priority: 'normal', type: 'training' },
  { id: 'tr2', text: 'Simulator running - emergency drill in progress', priority: 'normal', type: 'training' },
  { id: 'tr3', text: 'Good work trainee - installation complete', priority: 'low', type: 'training' },
  { id: 'tr4', text: 'Instructor override - resetting scenario', priority: 'normal', type: 'training' }
]

let radioSynth: Instrument | null = null

function initRadioSynth() {
  if (radioSynth) return
  
  radioSynth = new Instrument({
    waveform: 'sawtooth',
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 },
    volumeDb: config.masterVolume - 5,
  })
}

export async function playRadioChatter(chatterType?: RadioChatter['type']) {
  if (!config.enabled) return
  await unlockAudio()
  initRadioSynth()
  
  // Filter by type if specified
  let pool = RADIO_CHATTERS
  if (chatterType) {
    pool = RADIO_CHATTERS.filter(c => c.type === chatterType)
  }
  
  const chatter = pool[Math.floor(Math.random() * pool.length)]
  if (!chatter) return
  
  // Radio squelch sound
  radioSynth?.play('A4', '32n')
  
  // In a real implementation, this would play actual voice audio
  // For now we simulate with tones of different lengths based on text
  const duration = Math.min(2, chatter.text.length / 30)
  
  radioSynth?.play('C4', duration, { delay: 0.1 })
  
  console.log(`📻 [${chatter.priority.toUpperCase()}] ${chatter.text}`)
  
  return chatter
}

export function startRadioChatterLoop(intervalSeconds: number = 45) {
  const loop = setInterval(() => {
    if (Math.random() < 0.7) { // 70% chance each interval
      playRadioChatter()
    }
  }, intervalSeconds * 1000)
  
  return () => clearInterval(loop)
}

// =============================================================================
// SYSTEM CONTROL
// =============================================================================

export async function startAmbientSystem() {
  if (!config.enabled) return
  await unlockAudio()
  initSynths()
  
  // Start base ambience
  waveDrone?.start()
  harborDrone?.start()
  
  // Start time-based updates
  timeSystem.subscribe((state) => {
    const hour = Math.floor(state.gameTime / 60) % 24
    // Get weather from game store
    const weather = useGameStore.getState().weather
    updateAmbientForTime(hour, weather)
  })
  
  console.log('🌊 Ambient sound system started')
}

export function stopAmbientSystem() {
  waveDrone?.stop()
  harborDrone?.stop()
  windDrone?.stop()
  nightDrone?.stop()
  shipEngineDrone?.stop()
  
  if (birdInterval) clearTimeout(birdInterval)
  if (foghornInterval) clearInterval(foghornInterval)
}

export function setAmbientVolume(volumeDb: number) {
  config.masterVolume = volumeDb
}

export function setAmbientEnabled(enabled: boolean) {
  config.enabled = enabled
  
  if (enabled) {
    startAmbientSystem()
  } else {
    stopAmbientSystem()
  }
}

export function disposeAmbientSounds() {
  stopAmbientSystem()
  
  birdSynth?.dispose()
  foghornSynth?.dispose()
  shipHornSynth?.dispose()
  radioSynth?.dispose()
  
  waveDrone = null
  harborDrone = null
  birdSynth = null
  foghornSynth = null
  shipEngineDrone = null
  shipHornSynth = null
  windDrone = null
  nightDrone = null
  radioSynth = null
}

// =============================================================================
// REACT HOOK
// =============================================================================

import { useEffect, useState } from 'react'

export function useAmbientSounds() {
  const [currentPhase, setCurrentPhase] = useState('day')
  
  useEffect(() => {
    startAmbientSystem()
    
    return () => {
      stopAmbientSystem()
    }
  }, [])
  
  return {
    currentPhase,
    playBirdCall,
    playFoghorn,
    playShipHorn,
    playRadioChatter,
    startRadioChatterLoop,
    setVolume: setAmbientVolume,
    setEnabled: setAmbientEnabled
  }
}
