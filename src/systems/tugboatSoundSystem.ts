// =============================================================================
// TUGBOAT SOUND SYSTEM — HarborGlow
// Dedicated audio identity for tugboat mode:
//   • Low engine thrum modulated by twin-prop RPMs
//   • Sparse VHF harbor-radio static / crackle
//   • "Night watch" pentatonic motif that swells on successful manoeuvres
//   • Intelligent ducking during cavitation events
//   • Musical stingers for tow-line attach/detach and acoustic handshake
//
// Follows the singleton + direct-mutation + Tone pattern used throughout the
// codebase (CavitationSystem, craneSoundSystem, commsSystem).
// =============================================================================

import * as Tone from 'tone'
import { useGameStore } from '../store/useGameStore'

// -------------------------------------------------------------------------
// TUNING CONSTANTS
// -------------------------------------------------------------------------

export const TUG_AUDIO_CONFIG = {
  /** Master volume offset (dB) for the entire tug audio layer. */
  masterVolume: -18,
  /** Engine thrum base frequency (Hz) at zero RPM — diesel idle character. */
  thrumBaseFreq: 55,
  /** Engine thrum frequency ceiling (Hz) at 100 RPM. */
  thrumMaxFreq: 88,
  /** VHF radio crackle layer base volume (dB). */
  radioVolume: -42,
  /** Night-watch motif volume (dB). Kept very quiet so it never dominates. */
  motifVolume: -28,
  /** Minimum seconds between radio crackle bursts. */
  radioIntervalMin: 8,
  /** Maximum seconds between radio crackle bursts. */
  radioIntervalMax: 28,
  /** Minimum seconds between night-watch motif phrases. */
  motifIntervalMin: 35,
  /** Maximum seconds between night-watch motif phrases. */
  motifIntervalMax: 80,
  /** Cavitation intensity above which the bed ducks. */
  cavitationDuckThreshold: 0.38,
  /** How many dB to duck the bed when cavitation is loud. */
  cavitationDuckAmount: 10,
  /** Ramp time (s) for all volume transitions. */
  rampTime: 0.35,
}

// Night-watch pentatonic motif — [note, timeOffset_s]
const NIGHT_WATCH_MOTIF: Array<[string, number]> = [
  ['D3',  0.00],
  ['A3',  0.55],
  ['F#3', 1.05],
  ['E4',  1.70],
  ['D4',  2.30],
  ['A3',  3.10],
]

// -------------------------------------------------------------------------
// SYSTEM
// -------------------------------------------------------------------------

class TugboatSoundSystem {
  // Engine thrum chain
  private thrumOsc: Tone.Oscillator | null = null
  private thrumLFO: Tone.LFO | null = null
  private thrumFilter: Tone.Filter | null = null
  private thrumGain: Tone.Volume | null = null

  // VHF radio static chain
  private radioNoise: Tone.NoiseSynth | null = null
  private radioBandpass: Tone.Filter | null = null
  private radioGain: Tone.Volume | null = null
  private radioTimer = 0
  private radioNextInterval = 0

  // Night-watch motif
  private motifSynth: Tone.Synth | null = null
  private motifGain: Tone.Volume | null = null
  private motifTimer = 0
  private motifNextInterval = 0

  // State
  private running = false
  private initialized = false
  private enabled = true
  private ducked = false
  private masterVolumeOffset = 0  // additional offset from setMasterVolume()

  // -------------------------------------------------------------------------
  // LAZY AUDIO INIT
  // -------------------------------------------------------------------------

  private async ensureReady(): Promise<void> {
    if (this.initialized) return
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }

    // ---- Engine Thrum ----
    this.thrumGain = new Tone.Volume(TUG_AUDIO_CONFIG.masterVolume)
    this.thrumFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 220,
      rolloff: -24,
    })
    this.thrumOsc = new Tone.Oscillator({
      type: 'triangle',
      frequency: TUG_AUDIO_CONFIG.thrumBaseFreq,
    })
    // Gentle LFO on the oscillator frequency for "breathing" quality
    this.thrumLFO = new Tone.LFO({
      frequency: 0.28,
      min: TUG_AUDIO_CONFIG.thrumBaseFreq - 3,
      max: TUG_AUDIO_CONFIG.thrumBaseFreq + 3,
      type: 'sine',
    })

    this.thrumGain.toDestination()
    this.thrumFilter.connect(this.thrumGain)
    this.thrumOsc.connect(this.thrumFilter)
    this.thrumLFO.connect(this.thrumOsc.frequency)

    this.thrumLFO.start()
    // Oscillator starts silent — start() called in start()

    // ---- VHF Radio Static ----
    this.radioGain = new Tone.Volume(TUG_AUDIO_CONFIG.masterVolume + TUG_AUDIO_CONFIG.radioVolume)
    this.radioBandpass = new Tone.Filter({
      type: 'bandpass',
      frequency: 1900,
      Q: 3.5,
    })
    this.radioNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.01,
        decay: 0.12,
        sustain: 0,
        release: 0.08,
      },
    })

    this.radioGain.toDestination()
    this.radioBandpass.connect(this.radioGain)
    this.radioNoise.connect(this.radioBandpass)

    // ---- Night-Watch Motif ----
    this.motifGain = new Tone.Volume(TUG_AUDIO_CONFIG.masterVolume + TUG_AUDIO_CONFIG.motifVolume)
    this.motifSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.28,
        decay: 0.4,
        sustain: 0.3,
        release: 1.4,
      },
    })

    this.motifGain.toDestination()
    this.motifSynth.connect(this.motifGain)

    // Randomise first intervals so multiple sessions feel different
    this.radioNextInterval = this._randomInterval(
      TUG_AUDIO_CONFIG.radioIntervalMin,
      TUG_AUDIO_CONFIG.radioIntervalMax,
    )
    this.motifNextInterval = this._randomInterval(
      TUG_AUDIO_CONFIG.motifIntervalMin,
      TUG_AUDIO_CONFIG.motifIntervalMax,
    )

    this.initialized = true
  }

  // -------------------------------------------------------------------------
  // LIFECYCLE
  // -------------------------------------------------------------------------

  async start(): Promise<void> {
    if (!this.enabled) return
    await this.ensureReady()
    if (this.running) return

    this.running = true
    this.radioTimer = 0
    this.motifTimer = 0

    // Fade engine thrum in
    if (this.thrumOsc && this.thrumGain) {
      this.thrumOsc.start()
      this.thrumGain.volume.rampTo(TUG_AUDIO_CONFIG.masterVolume + this.masterVolumeOffset, TUG_AUDIO_CONFIG.rampTime)
    }
  }

  stop(): void {
    if (!this.running) return
    this.running = false

    if (this.thrumOsc && this.thrumGain) {
      this.thrumGain.volume.rampTo(-Infinity, TUG_AUDIO_CONFIG.rampTime * 2)
      setTimeout(() => {
        try { this.thrumOsc?.stop() } catch { /* ignore */ }
      }, (TUG_AUDIO_CONFIG.rampTime * 2 + 0.1) * 1000)
    }
  }

  // -------------------------------------------------------------------------
  // FRAME UPDATE (called from Tugboat.tsx useFrame)
  // -------------------------------------------------------------------------

  /**
   * Called every frame.
   * @param portRpm        Port engine RPM (−100..100)
   * @param starboardRpm   Starboard engine RPM (−100..100)
   * @param cavIntensity   Cavitation intensity 0..1 from cavitationState
   * @param delta          Frame delta (seconds)
   */
  update(portRpm: number, starboardRpm: number, cavIntensity: number, delta: number): void {
    if (!this.running || !this.enabled || !this.initialized) return

    const { musicEnabled } = useGameStore.getState()
    if (!musicEnabled) return

    const avgAbsRpm = (Math.abs(portRpm) + Math.abs(starboardRpm)) / 2
    const rpmFrac = Math.min(1, avgAbsRpm / 100)

    // ---- Engine thrum modulation ----
    if (this.thrumOsc && this.thrumGain && this.thrumLFO) {
      const targetFreq =
        TUG_AUDIO_CONFIG.thrumBaseFreq +
        rpmFrac * (TUG_AUDIO_CONFIG.thrumMaxFreq - TUG_AUDIO_CONFIG.thrumBaseFreq)
      // LFO pivots around the target frequency
      this.thrumLFO.min = targetFreq - 3
      this.thrumLFO.max = targetFreq + 3

      // Volume scales slightly with RPM (idle is quieter than running)
      const targetVol =
        TUG_AUDIO_CONFIG.masterVolume +
        this.masterVolumeOffset +
        rpmFrac * 5
      this.thrumGain.volume.rampTo(targetVol, 0.18)
    }

    // ---- Cavitation ducking ----
    const shouldDuck = cavIntensity > TUG_AUDIO_CONFIG.cavitationDuckThreshold
    if (shouldDuck !== this.ducked) {
      this.ducked = shouldDuck
      const duckOffset = shouldDuck ? -TUG_AUDIO_CONFIG.cavitationDuckAmount : 0
      this.thrumGain?.volume.rampTo(
        TUG_AUDIO_CONFIG.masterVolume + this.masterVolumeOffset + rpmFrac * 5 + duckOffset,
        TUG_AUDIO_CONFIG.rampTime,
      )
      this.motifGain?.volume.rampTo(
        TUG_AUDIO_CONFIG.masterVolume + TUG_AUDIO_CONFIG.motifVolume + this.masterVolumeOffset + duckOffset,
        TUG_AUDIO_CONFIG.rampTime,
      )
    }

    // ---- VHF radio crackle ----
    this.radioTimer += delta
    if (this.radioTimer >= this.radioNextInterval) {
      this.radioTimer = 0
      this.radioNextInterval = this._randomInterval(
        TUG_AUDIO_CONFIG.radioIntervalMin,
        TUG_AUDIO_CONFIG.radioIntervalMax,
      )
      void this._triggerRadioCrackle()
    }

    // ---- Night-watch motif ----
    this.motifTimer += delta
    if (this.motifTimer >= this.motifNextInterval) {
      this.motifTimer = 0
      this.motifNextInterval = this._randomInterval(
        TUG_AUDIO_CONFIG.motifIntervalMin,
        TUG_AUDIO_CONFIG.motifIntervalMax,
      )
      void this._playNightWatchMotif()
    }
  }

  // -------------------------------------------------------------------------
  // EVENT STINGERS
  // -------------------------------------------------------------------------

  /** Short ascending stinger when the tow-line is attached. */
  async triggerTowLineAttach(): Promise<void> {
    if (!this.enabled) return
    const { musicEnabled } = useGameStore.getState()
    if (!musicEnabled) return
    await this.ensureReady()
    void this._playStinger([
      ['C4', 0.00, '8n'],
      ['G4', 0.18, '8n'],
      ['E5', 0.36, '4n'],
    ], -22)
  }

  /** Short descending stinger when the tow-line is released. */
  async triggerTowLineDetach(): Promise<void> {
    if (!this.enabled) return
    const { musicEnabled } = useGameStore.getState()
    if (!musicEnabled) return
    await this.ensureReady()
    void this._playStinger([
      ['E4', 0.00, '8n'],
      ['C4', 0.16, '8n'],
      ['G3', 0.32, '4n'],
    ], -24)
  }

  /** Celebratory chord when the acoustic handshake completes. */
  async triggerHandshakeComplete(): Promise<void> {
    if (!this.enabled) return
    const { musicEnabled } = useGameStore.getState()
    if (!musicEnabled) return
    await this.ensureReady()
    void this._playStinger([
      ['C4', 0.00, '4n'],
      ['E4', 0.06, '4n'],
      ['G4', 0.12, '4n'],
      ['C5', 0.22, '2n'],
    ], -20)
  }

  /** Two-note gentle affirmation on a successful docking manoeuvre. */
  async triggerSuccessfulManeuver(): Promise<void> {
    if (!this.enabled) return
    const { musicEnabled } = useGameStore.getState()
    if (!musicEnabled) return
    await this.ensureReady()
    void this._playStinger([
      ['G4', 0.00, '4n'],
      ['C5', 0.28, '2n'],
    ], -22)
  }

  // -------------------------------------------------------------------------
  // CONFIGURATION
  // -------------------------------------------------------------------------

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) this.stop()
  }

  setMasterVolume(offsetDb: number): void {
    this.masterVolumeOffset = offsetDb
    if (!this.initialized || !this.running) return
    const rampTime = TUG_AUDIO_CONFIG.rampTime
    const base = TUG_AUDIO_CONFIG.masterVolume + offsetDb
    const duckOffset = this.ducked ? -TUG_AUDIO_CONFIG.cavitationDuckAmount : 0
    this.thrumGain?.volume.rampTo(base + duckOffset, rampTime)
    this.motifGain?.volume.rampTo(base + TUG_AUDIO_CONFIG.motifVolume + duckOffset, rampTime)
    this.radioGain?.volume.rampTo(base + TUG_AUDIO_CONFIG.radioVolume, rampTime)
  }

  isRunning(): boolean { return this.running }
  isEnabled(): boolean { return this.enabled }

  // -------------------------------------------------------------------------
  // PRIVATE HELPERS
  // -------------------------------------------------------------------------

  private async _triggerRadioCrackle(): Promise<void> {
    if (!this.radioNoise || !this.radioGain) return
    if (Tone.context.state !== 'running') return

    // Brief burst of VHF static — multiple short hits simulate signal fragments
    const burstCount = 1 + Math.floor(Math.random() * 3)
    const baseVol = TUG_AUDIO_CONFIG.masterVolume + TUG_AUDIO_CONFIG.radioVolume + this.masterVolumeOffset
    this.radioGain.volume.value = baseVol + (Math.random() - 0.5) * 4

    for (let i = 0; i < burstCount; i++) {
      const delay = i * (0.06 + Math.random() * 0.08)
      const dur = 0.04 + Math.random() * 0.09
      try {
        this.radioNoise.triggerAttackRelease(dur, Tone.now() + delay)
      } catch { /* ignore audio context edge cases */ }
    }
  }

  private async _playNightWatchMotif(): Promise<void> {
    if (!this.motifSynth) return
    if (Tone.context.state !== 'running') return

    const now = Tone.now()
    // Randomly play a 2-5 note subset of the full motif for variety
    const startIdx = Math.floor(Math.random() * (NIGHT_WATCH_MOTIF.length - 2))
    const endIdx = startIdx + 2 + Math.floor(Math.random() * 3)
    const phrase = NIGHT_WATCH_MOTIF.slice(startIdx, Math.min(endIdx, NIGHT_WATCH_MOTIF.length))

    for (const [note, offset] of phrase) {
      const dur = 0.8 + Math.random() * 0.5
      try {
        this.motifSynth.triggerAttackRelease(note, dur, now + offset)
      } catch { /* ignore */ }
    }
  }

  /**
   * Fire-and-forget polyphonic stinger using ephemeral PolySynth voices.
   * Each entry is [note, timeOffset_s, duration_toneTime].
   */
  private async _playStinger(
    notes: Array<[string, number, string]>,
    volumeDb: number,
  ): Promise<void> {
    if (Tone.context.state !== 'running') return

    try {
      const gain = new Tone.Volume(volumeDb)
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.04, decay: 0.3, sustain: 0.2, release: 1.2 },
      })
      synth.connect(gain)
      gain.toDestination()

      const now = Tone.now()
      for (const [note, offset, dur] of notes) {
        synth.triggerAttackRelease(note, dur, now + offset)
      }

      // Dispose after the stinger is done (generous buffer)
      const maxOffset = Math.max(...notes.map(([, off]) => off))
      setTimeout(() => {
        try { synth.dispose(); gain.dispose() } catch { /* ignore */ }
      }, (maxOffset + 2.5) * 1000)
    } catch { /* audio context edge case */ }
  }

  private _randomInterval(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }
}

// -------------------------------------------------------------------------
// SINGLETON EXPORT
// -------------------------------------------------------------------------

export const tugboatSoundSystem = new TugboatSoundSystem()

/** Leva debug helper — mirrors the pattern used in getCavitationDebugBindings(). */
export function getTugAudioDebugBindings() {
  return {
    ...TUG_AUDIO_CONFIG,
    start: () => void tugboatSoundSystem.start(),
    stop: () => tugboatSoundSystem.stop(),
    towAttach: () => void tugboatSoundSystem.triggerTowLineAttach(),
    towDetach: () => void tugboatSoundSystem.triggerTowLineDetach(),
    handshake: () => void tugboatSoundSystem.triggerHandshakeComplete(),
    maneuver: () => void tugboatSoundSystem.triggerSuccessfulManeuver(),
  }
}
