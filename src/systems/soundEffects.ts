// =============================================================================
// SOUND EFFECTS SYSTEM - HarborGlow Phase 9
// Audio feedback for attachment interactions
// =============================================================================

import { Instrument, setMasterMuted, unlockAudio } from './audio/voices'
import { RigType } from './attachmentSystem'

// Sound effect types
export type SoundEffectType = 
  | 'snapEnter'
  | 'snapExit'
  | 'installStart'
  | 'installComplete'
  | 'tensionWarning'
  | 'twistlockEngage'
  | 'twistlockDisengage'

// Sound configuration
interface SoundConfig {
  volume: number
  enabled: boolean
}

let globalConfig: SoundConfig = {
  volume: -10,
  enabled: true,
}

// Synth instances (lazy initialized)
let snapSynth: Instrument | null = null
let installSynth: Instrument | null = null
let tensionSynth: Instrument | null = null
let twistlockSynth: Instrument | null = null
let celebrationSynth: Instrument | null = null
let queueHumSynth: Instrument | null = null

// Initialize synths
function initSynths() {
  if (!globalConfig.enabled) return
  
  // Snap enter/exit - low thrum
  snapSynth ??= new Instrument({
    waveform: 'membrane',
    envelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.1,
      release: 0.5,
    },
    volumeDb: globalConfig.volume - 5,
  })
  
  // Installation sounds - pleasant chime
  installSynth ??= new Instrument({
    waveform: 'triangle',
    envelope: {
      attack: 0.02,
      decay: 0.3,
      sustain: 0.2,
      release: 1,
    },
    volumeDb: globalConfig.volume,
  })
  
  // Tension warning - rising pitch
  tensionSynth ??= new Instrument({
    waveform: 'fm',
    envelope: {
      attack: 0.1,
      decay: 0.1,
      sustain: 1,
      release: 0.5,
    },
    volumeDb: globalConfig.volume - 10,
  })
  
  // Twistlock - mechanical click
  twistlockSynth ??= new Instrument({
    waveform: 'metal',
    envelope: {
      attack: 0.001,
      decay: 0.1,
      release: 0.01,
    },
    volumeDb: globalConfig.volume - 8,
  })
  
  // Celebration - fanfare
  celebrationSynth ??= new Instrument({
    waveform: 'fm',
    envelope: {
      attack: 0.05,
      decay: 0.3,
      sustain: 0.4,
      release: 1.5,
    },
    volumeDb: globalConfig.volume - 2,
  })

  // Queue travel hum - held noise bed
  queueHumSynth ??= new Instrument({
    waveform: 'noise',
    envelope: {
      attack: 0.01,
      decay: 0.08,
      sustain: 0.6,
      release: 0.2,
    },
    volumeDb: globalConfig.volume - 18,
  })
}

// Play sound effect
export async function playSound(
  type: SoundEffectType,
  params?: { rigType?: RigType; tension?: number }
): Promise<void> {
  if (!globalConfig.enabled) return
  
  // Ensure audio context is started
  await unlockAudio()
  initSynths()
  
  switch (type) {
    case 'snapEnter':
      snapSynth?.play('C2', '8n')
      break
      
    case 'snapExit':
      snapSynth?.play('A1', '16n')
      break
      
    case 'installStart':
      // Mechanical click
      twistlockSynth?.play(240, '32n')
      break
      
    case 'installComplete': {
      // Celebration chord based on rig type
      const chords: Record<RigType, string[]> = {
        rgb_matrix: ['C5', 'E5', 'G5', 'B5'],
        projector: ['D5', 'F#5', 'A5', 'C#6'],
        emergency_strobe: ['G4', 'B4', 'D5', 'F5'],
        led_strip: ['F5', 'A5', 'C6', 'E6'],
        searchlight: ['A4', 'C#5', 'E5', 'G#5'],
      }
      
      const chord = chords[params?.rigType || 'rgb_matrix']
      installSynth?.play(chord, '4n')
      
      // Add sparkle
      celebrationSynth?.play(['C6', 'E6'], '8n', { delay: 0.1 })
      break
    }
      
    case 'tensionWarning': {
      // Rising pitch based on tension level
      const baseFreq = 100 + (params?.tension || 0.5) * 200
      tensionSynth?.play(baseFreq, '16n')
      break
    }
      
    case 'twistlockEngage':
      twistlockSynth?.play(240, '16n')
      installSynth?.play(['C4'], '32n', { delay: 0.05 })
      break
      
    case 'twistlockDisengage':
      twistlockSynth?.play(240, '32n')
      break
  }
}

// Play installation celebration sound
export async function playInstallationCelebration(rigType: RigType): Promise<void> {
  if (!globalConfig.enabled) return
  
  await unlockAudio()
  initSynths()
  
  // Fanfare based on rig type
  const fanfares: Record<RigType, { notes: string[]; duration: string }> = {
    rgb_matrix: { notes: ['C5', 'E5', 'G5', 'C6'], duration: '4n' },
    projector: { notes: ['D5', 'F#5', 'A5', 'D6'], duration: '4n' },
    emergency_strobe: { notes: ['G4', 'B4', 'D5', 'G5'], duration: '4n' },
    led_strip: { notes: ['F5', 'A5', 'C6', 'F6'], duration: '4n' },
    searchlight: { notes: ['A4', 'C#5', 'E5', 'A5'], duration: '4n' },
  }
  
  const fanfare = fanfares[rigType]
  
  // Play arpeggio
  fanfare.notes.forEach((note, i) => {
    celebrationSynth?.play(note, '8n', { delay: i * 0.1 })
  })
  
  // Final chord
  celebrationSynth?.play(fanfare.notes, '2n', { delay: 0.5 })
}

export async function startQueueTravelHum(intensity = 1): Promise<void> {
  if (!globalConfig.enabled) return
  await unlockAudio()
  initSynths()
  if (!queueHumSynth) return
  queueHumSynth.volumeDb = globalConfig.volume - (22 - Math.min(10, intensity * 6))
  queueHumSynth.release()
  queueHumSynth.hold(160)
}

export function stopQueueTravelHum(): void {
  queueHumSynth?.release()
}

// Set global sound configuration
export function setSoundConfig(config: Partial<SoundConfig>): void {
  globalConfig = { ...globalConfig, ...config }
  
  // Update existing synths
  if (snapSynth) snapSynth.volumeDb = globalConfig.volume - 5
  if (installSynth) installSynth.volumeDb = globalConfig.volume
  if (tensionSynth) tensionSynth.volumeDb = globalConfig.volume - 10
  if (twistlockSynth) twistlockSynth.volumeDb = globalConfig.volume - 8
  if (celebrationSynth) celebrationSynth.volumeDb = globalConfig.volume - 2
  if (queueHumSynth) queueHumSynth.volumeDb = globalConfig.volume - 18
}

// Mute/unmute all sounds
export function setMuted(muted: boolean): void {
  globalConfig.enabled = !muted
  setMasterMuted(muted)
}

// Cleanup function
export function disposeSoundEffects(): void {
  snapSynth?.dispose()
  installSynth?.dispose()
  tensionSynth?.dispose()
  twistlockSynth?.dispose()
  celebrationSynth?.dispose()
  queueHumSynth?.dispose()
  
  snapSynth = null
  installSynth = null
  tensionSynth = null
  twistlockSynth = null
  celebrationSynth = null
  queueHumSynth = null
}
