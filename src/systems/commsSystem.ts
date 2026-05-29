import * as Tone from 'tone'

export const ACOUSTIC_NOTE_LAYOUT = [
  'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1',
  'G1', 'G#1', 'A1', 'A#1', 'B1', 'C2',
] as const

export type AcousticNote = (typeof ACOUSTIC_NOTE_LAYOUT)[number]

class CommsSystem {
  private hornSynth: Tone.MonoSynth | null = null
  private distortion: Tone.Distortion | null = null
  private lowpass: Tone.Filter | null = null
  private compressor: Tone.Compressor | null = null

  private async ensureReady() {
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }

    if (this.hornSynth) return

    this.hornSynth = new Tone.MonoSynth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.15, release: 0.7 },
      filterEnvelope: {
        attack: 0.02,
        decay: 0.25,
        sustain: 0.2,
        release: 0.9,
        baseFrequency: 50,
        octaves: 1.8,
      },
    })
    this.hornSynth.volume.value = -8

    this.distortion = new Tone.Distortion(0.7)
    this.lowpass = new Tone.Filter(180, 'lowpass')
    this.compressor = new Tone.Compressor(-16, 4)

    this.hornSynth.connect(this.distortion)
    this.distortion.connect(this.lowpass)
    this.lowpass.connect(this.compressor)
    this.compressor.toDestination()
  }

  async triggerHornBlast(note: AcousticNote) {
    await this.ensureReady()
    this.hornSynth?.triggerAttackRelease(note, '8n')
  }
}

export const commsSystem = new CommsSystem()
