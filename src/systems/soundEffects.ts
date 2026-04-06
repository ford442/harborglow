// =============================================================================
// SOUND EFFECTS SYSTEM - HarborGlow Phase 9
// Audio feedback for attachment interactions using Tone.js
// =============================================================================

import * as Tone from 'tone'
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
let snapSynth: Tone.MembraneSynth | null = null
let installSynth: Tone.PolySynth | null = null
let tensionSynth: Tone.AMSynth | null = null
let twistlockSynth: Tone.MetalSynth | null = null
let celebrationSynth: Tone.PolySynth | null = null

// Initialize synths
function initSynths() {
  if (!globalConfig.enabled) return
  
  // Snap enter/exit - low thrum
  if (!snapSynth) {
    snapSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.1,
        release: 0.5,
      },
      volume: globalConfig.volume - 5,
    }).toDestination()
  }
  
  // Installation sounds - pleasant chime
  if (!installSynth) {
    installSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.2,
        release: 1,
      },
      volume: globalConfig.volume,
    }).toDestination()
  }
  
  // Tension warning - rising pitch
  if (!tensionSynth) {
    tensionSynth = new Tone.AMSynth({
      harmonicity: 3,
      detune: 0,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.1,
        decay: 0.1,
        sustain: 1,
        release: 0.5,
      },
      modulation: { type: 'square' },
      modulationEnvelope: {
        attack: 0.5,
        decay: 0,
        sustain: 1,
        release: 0.5,
      },
      volume: globalConfig.volume - 10,
    }).toDestination()
  }
  
  // Twistlock - mechanical click
  if (!twistlockSynth) {
    twistlockSynth = new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.1,
        release: 0.01,
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: globalConfig.volume - 8,
    }).toDestination()
  }
  
  // Celebration - fanfare
  if (!celebrationSynth) {
    celebrationSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fmsine' },
      envelope: {
        attack: 0.05,
        decay: 0.3,
        sustain: 0.4,
        release: 1.5,
      },
      volume: globalConfig.volume - 2,
    }).toDestination()
  }
}

// Play sound effect
export async function playSound(
  type: SoundEffectType,
  params?: { rigType?: RigType; tension?: number }
): Promise<void> {
  if (!globalConfig.enabled) return
  
  // Ensure audio context is started
  await Tone.start()
  initSynths()
  
  const now = Tone.now()
  
  switch (type) {
    case 'snapEnter':
      snapSynth?.triggerAttackRelease('C2', '8n', now)
      break
      
    case 'snapExit':
      snapSynth?.triggerAttackRelease('A1', '16n', now)
      break
      
    case 'installStart':
      // Mechanical click
      twistlockSynth?.triggerAttackRelease('32n', now)
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
      installSynth?.triggerAttackRelease(chord, '4n', now)
      
      // Add sparkle
      setTimeout(() => {
        celebrationSynth?.triggerAttackRelease(['C6', 'E6'], '8n')
      }, 100)
      break
    }
      
    case 'tensionWarning':
      // Rising pitch based on tension level
      const baseFreq = 100 + (params?.tension || 0.5) * 200
      tensionSynth?.triggerAttackRelease(baseFreq, '16n', now)
      break
      
    case 'twistlockEngage':
      twistlockSynth?.triggerAttackRelease('16n', now)
      installSynth?.triggerAttackRelease(['C4'], '32n', now + 0.05)
      break
      
    case 'twistlockDisengage':
      twistlockSynth?.triggerAttackRelease('32n', now)
      break
  }
}

// Play installation celebration sound
export async function playInstallationCelebration(rigType: RigType): Promise<void> {
  if (!globalConfig.enabled) return
  
  await Tone.start()
  initSynths()
  
  const now = Tone.now()
  
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
    celebrationSynth?.triggerAttackRelease(note, '8n', now + i * 0.1)
  })
  
  // Final chord
  celebrationSynth?.triggerAttackRelease(fanfare.notes, '2n', now + 0.5)
}

// Set global sound configuration
export function setSoundConfig(config: Partial<SoundConfig>): void {
  globalConfig = { ...globalConfig, ...config }
  
  // Update existing synths
  if (snapSynth) snapSynth.volume.value = globalConfig.volume - 5
  if (installSynth) installSynth.volume.value = globalConfig.volume
  if (tensionSynth) tensionSynth.volume.value = globalConfig.volume - 10
  if (twistlockSynth) twistlockSynth.volume.value = globalConfig.volume - 8
  if (celebrationSynth) celebrationSynth.volume.value = globalConfig.volume - 2
}

// Mute/unmute all sounds
export function setMuted(muted: boolean): void {
  globalConfig.enabled = !muted
  Tone.Destination.mute = muted
}

// Cleanup function
export function disposeSoundEffects(): void {
  snapSynth?.dispose()
  installSynth?.dispose()
  tensionSynth?.dispose()
  twistlockSynth?.dispose()
  celebrationSynth?.dispose()
  
  snapSynth = null
  installSynth = null
  tensionSynth = null
  twistlockSynth = null
  celebrationSynth = null
}
