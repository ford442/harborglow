import { Instrument, isAudioRunning, unlockAudio } from './audio/voices'

export const ACOUSTIC_NOTE_LAYOUT = [
  'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1',
  'G1', 'G#1', 'A1', 'A#1', 'B1', 'C2',
] as const

export type AcousticNote = (typeof ACOUSTIC_NOTE_LAYOUT)[number]

class CommsSystem {
  private hornSynth: Instrument | null = null

  private async ensureReady() {
    if (!isAudioRunning()) {
      await unlockAudio()
    }

    if (this.hornSynth) return

    this.hornSynth = new Instrument({
      waveform: 'square',
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.15, release: 0.7 },
      volumeDb: -8,
    })
  }

  async triggerHornBlast(note: AcousticNote) {
    await this.ensureReady()
    this.hornSynth?.play(note, '8n')
  }
}

export const commsSystem = new CommsSystem()
