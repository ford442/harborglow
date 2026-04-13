// =============================================================================
// AMBIENT SOUND SYSTEM - HarborGlow
// Dynamic environmental audio that changes with time of day
// Harbor ambience, seagulls, distant ships, waves, foghorns
// =============================================================================

import * as Tone from 'tone'
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

// Ocean waves - filtered noise
let waveSynth: Tone.NoiseSynth | null = null
let waveFilter: Tone.Filter | null = null
let waveLFO: Tone.LFO | null = null

// Harbor ambience - distant industrial sounds
let harborSynth: Tone.NoiseSynth | null = null
let harborFilter: Tone.Filter | null = null

// Seagulls - FM synth for bird calls
let birdSynth: Tone.Synth | null = null
let birdFilter: Tone.Filter | null = null

// Distant foghorn - low oscillator
let foghornSynth: Tone.Oscillator | null = null

// Distant ship engines - low rumble
let shipEngineSynth: Tone.Oscillator | null = null
let shipEngineLFO: Tone.LFO | null = null

// Wind - filtered noise
let windSynth: Tone.NoiseSynth | null = null
let windFilter: Tone.Filter | null = null

// Night ambience - subtle drone
let nightDrone: Tone.Oscillator | null = null

// =============================================================================
// INITIALIZATION
// =============================================================================

function initSynths() {
  if (!config.enabled) return

  // Ocean waves - pink noise with slow LFO filter
  if (!waveSynth) {
    waveFilter = new Tone.Filter(400, 'lowpass').toDestination()
    
    waveSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: {
        attack: 2,
        decay: 1,
        sustain: 1,
        release: 3
      }
    }).connect(waveFilter)
    
    // Wave motion - filter sweeps
    waveLFO = new Tone.LFO(0.1, 200, 600).connect(waveFilter.frequency)
    waveLFO.start()
    
    waveSynth.volume.value = config.masterVolume - 5
  }

  // Harbor ambience - brown noise with lowpass
  if (!harborSynth) {
    harborFilter = new Tone.Filter(800, 'lowpass').toDestination()
    
    harborSynth = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: {
        attack: 3,
        decay: 2,
        sustain: 1,
        release: 5
      }
    }).connect(harborFilter)
    
    harborSynth.volume.value = config.masterVolume - 10
  }

  // Seagulls - triangle wave with filter
  if (!birdSynth) {
    birdFilter = new Tone.Filter(2000, 'bandpass').toDestination()
    
    birdSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.05,
        decay: 0.3,
        sustain: 0.2,
        release: 0.5
      }
    }).connect(birdFilter)
    
    birdSynth.volume.value = config.masterVolume - 8
  }

  // Foghorn - sine wave, very low
  if (!foghornSynth) {
    foghornSynth = new Tone.Oscillator({
      type: 'sine',
      frequency: 65
    }).toDestination()
    
    foghornSynth.volume.value = -Infinity // Start silent
  }

  // Ship engines - sawtooth with filter
  if (!shipEngineSynth) {
    shipEngineSynth = new Tone.Oscillator({
      type: 'sawtooth',
      frequency: 45
    }).toDestination()
    
    shipEngineLFO = new Tone.LFO(0.2, 40, 50).connect(shipEngineSynth.frequency)
    shipEngineLFO.start()
    
    shipEngineSynth.volume.value = -Infinity // Start silent
  }

  // Wind - white noise with variable filter
  if (!windSynth) {
    windFilter = new Tone.Filter(300, 'highpass').toDestination()
    
    windSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 3,
        decay: 2,
        sustain: 1,
        release: 4
      }
    }).connect(windFilter)
    
    windSynth.volume.value = -Infinity // Start silent
  }

  // Night drone - subtle low sine
  if (!nightDrone) {
    nightDrone = new Tone.Oscillator({
      type: 'sine',
      frequency: 55
    }).toDestination()
    
    nightDrone.volume.value = -Infinity // Start silent
  }
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
  await Tone.start()
  initSynths()

  const phase = getTimePhase(hour)
  
  // Base volume adjustment
  let baseVolume = config.masterVolume
  
  switch (phase) {
    case 'night':
      baseVolume = config.masterVolume + config.nightVolume * 10
      updateNightAmbience(1)
      updateDayAmbience(0)
      updateBirdActivity(0)
      break
      
    case 'dawn':
      baseVolume = config.masterVolume + config.dayVolume * 5
      updateNightAmbience(0.3)
      updateDayAmbience(0.5)
      updateBirdActivity(0.6)
      break
      
    case 'day':
      baseVolume = config.masterVolume + config.dayVolume * 10
      updateNightAmbience(0)
      updateDayAmbience(1)
      updateBirdActivity(1)
      break
      
    case 'golden':
      baseVolume = config.masterVolume + config.dayVolume * 8
      updateNightAmbience(0.2)
      updateDayAmbience(0.8)
      updateBirdActivity(0.7)
      break
      
    case 'dusk':
      baseVolume = config.masterVolume + config.nightVolume * 5
      updateNightAmbience(0.6)
      updateDayAmbience(0.5)
      updateBirdActivity(0.3)
      break
  }

  // Weather adjustments
  updateWeatherAmbience(weather, phase)

  // Apply master volume
  if (waveSynth) waveSynth.volume.rampTo(baseVolume - 5, 2)
  if (harborSynth) harborSynth.volume.rampTo(baseVolume - 10, 2)
}

function updateNightAmbience(intensity: number) {
  if (!nightDrone) return
  
  if (intensity > 0) {
    const targetVol = config.masterVolume - 20 + (intensity * 10)
    nightDrone.volume.rampTo(targetVol, 3)
    nightDrone.start()
  } else {
    nightDrone.volume.rampTo(-Infinity, 3)
    setTimeout(() => nightDrone?.stop(), 3000)
  }
}

function updateDayAmbience(intensity: number) {
  if (!waveSynth || !harborSynth) return
  
  // Waves are always present but vary in intensity
  const waveVol = config.masterVolume - 5 + (intensity * 5)
  waveSynth.volume.rampTo(waveVol, 2)
  
  // Harbor sounds during day
  const harborVol = config.masterVolume - 10 + (intensity * 8)
  harborSynth.volume.rampTo(harborVol, 2)
}

// =============================================================================
// WEATHER AMBIENCE
// =============================================================================

function updateWeatherAmbience(weather: string, phase: string) {
  if (!windSynth || !shipEngineSynth) return
  
  switch (weather) {
    case 'storm':
      // Strong wind, distant ships seek harbor
      windSynth?.volume.rampTo(config.masterVolume - 5, 2)
      windFilter?.frequency.rampTo(1000, 3)
      shipEngineSynth?.volume.rampTo(config.masterVolume - 15, 1)
      break
      
    case 'rain':
      // Moderate wind
      windSynth?.volume.rampTo(config.masterVolume - 10, 2)
      windFilter?.frequency.rampTo(600, 3)
      shipEngineSynth?.volume.rampTo(config.masterVolume - 20, 1)
      break
      
    case 'fog':
      // Foghorns become more prominent
      if (phase === 'night' || phase === 'dawn' || phase === 'dusk') {
        playFoghorn()
      }
      windSynth?.volume.rampTo(config.masterVolume - 15, 2)
      shipEngineSynth?.volume.rampTo(config.masterVolume - 18, 1)
      break
      
    default: // clear
      windSynth?.volume.rampTo(-Infinity, 3)
      shipEngineSynth?.volume.rampTo(config.masterVolume - 25, 2)
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

export async function playBirdCall(type: 'seagull' | 'distant' = 'seagull') {
  if (!config.enabled) return
  await Tone.start()
  initSynths()
  
  const now = Tone.now()
  
  if (type === 'seagull') {
    // Classic seagull cry
    birdSynth?.triggerAttackRelease('C5', '8n', now)
    birdSynth?.frequency.rampTo('G5', 0.1, now)
    birdSynth?.frequency.rampTo('C5', 0.2, now + 0.1)
  } else {
    // Distant bird
    if (birdSynth) birdSynth.volume.value = config.masterVolume - 15
    birdSynth?.triggerAttackRelease('E5', '4n', now)
  }
}

export async function playFoghorn() {
  if (!config.enabled) return
  await Tone.start()
  initSynths()
  
  if (!foghornSynth) return
  
  const now = Tone.now()
  
  // Two-tone foghorn
  foghornSynth.volume.rampTo(config.masterVolume - 10, 0.5, now)
  foghornSynth.frequency.setValueAtTime(65, now)
  
  // First blast
  foghornSynth.start(now)
  foghornSynth.stop(now + 2)
  
  // Second blast after gap
  foghornSynth.start(now + 3)
  foghornSynth.stop(now + 5)
  
  // Fade out
  foghornSynth.volume.rampTo(-Infinity, 1, now + 5)
}

export async function playShipHorn(distance: 'near' | 'far' = 'far') {
  if (!config.enabled) return
  await Tone.start()
  initSynths()
  
  if (!shipEngineSynth) return
  
  const vol = distance === 'near' ? config.masterVolume - 10 : config.masterVolume - 20
  const now = Tone.now()
  
  // Low ship horn
  shipEngineSynth.volume.rampTo(vol, 0.3, now)
  shipEngineSynth.frequency.setValueAtTime(85, now)
  shipEngineSynth.start(now)
  shipEngineSynth.stop(now + 3)
  shipEngineSynth.volume.rampTo(-Infinity, 2, now + 3)
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

let radioSynth: Tone.Synth | null = null
let radioEffect: Tone.Distortion | null = null

function initRadioSynth() {
  if (radioSynth) return
  
  // Radio distortion effect
  radioEffect = new Tone.Distortion({
    distortion: 0.3,
    wet: 0.4
  }).toDestination()
  
  radioSynth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.8,
      release: 0.3
    }
  }).connect(radioEffect)
  
  radioSynth.volume.value = config.masterVolume - 5
}

export async function playRadioChatter(chatterType?: RadioChatter['type']) {
  if (!config.enabled) return
  await Tone.start()
  initRadioSynth()
  
  // Filter by type if specified
  let pool = RADIO_CHATTERS
  if (chatterType) {
    pool = RADIO_CHATTERS.filter(c => c.type === chatterType)
  }
  
  const chatter = pool[Math.floor(Math.random() * pool.length)]
  if (!chatter) return
  
  const now = Tone.now()
  
  // Radio squelch sound
  radioSynth?.triggerAttackRelease('A4', '32n', now)
  
  // In a real implementation, this would play actual voice audio
  // For now we simulate with tones of different lengths based on text
  const duration = Math.min(2, chatter.text.length / 30)
  
  setTimeout(() => {
    radioSynth?.triggerAttackRelease('C4', duration, Tone.now())
  }, 100)
  
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
  await Tone.start()
  initSynths()
  
  // Start base ambience
  waveSynth?.triggerAttack()
  harborSynth?.triggerAttack()
  
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
  waveSynth?.triggerRelease()
  harborSynth?.triggerRelease()
  windSynth?.triggerRelease()
  
  nightDrone?.stop()
  foghornSynth?.stop()
  shipEngineSynth?.stop()
  
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
  
  waveSynth?.dispose()
  waveFilter?.dispose()
  waveLFO?.dispose()
  harborSynth?.dispose()
  harborFilter?.dispose()
  birdSynth?.dispose()
  birdFilter?.dispose()
  foghornSynth?.dispose()
  shipEngineSynth?.dispose()
  shipEngineLFO?.dispose()
  windSynth?.dispose()
  windFilter?.dispose()
  nightDrone?.dispose()
  radioSynth?.dispose()
  radioEffect?.dispose()
  
  waveSynth = null
  harborSynth = null
  birdSynth = null
  foghornSynth = null
  shipEngineSynth = null
  windSynth = null
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
