/* eslint-disable no-restricted-syntax -- wall-clock / audio / network; see docs/systems/DETERMINISM.md */
// =============================================================================
// TUGBOAT SOUND SYSTEM — HarborGlow
// Dedicated audio identity for tugboat mode:
//   • Low engine thrum modulated by twin-prop RPMs
//   • Sparse VHF harbor-radio static / crackle
//   • "Night watch" pentatonic motif that swells on successful manoeuvres
//   • Intelligent ducking during cavitation events
//   • Musical stingers for tow-line attach/detach and acoustic handshake
//
// Follows the singleton + direct-mutation pattern used throughout the
// codebase (CavitationSystem, craneSoundSystem, commsSystem), on the WASM
// AudioRuntime voices.
// =============================================================================

import { Drone, Instrument, isAudioRunning, unlockAudio } from './audio/voices'
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
  // Engine thrum — a drone whose pitch follows RPM and level follows RPM + ducking
  private thrum: Drone | null = null
  /** Phase (rad) of the slow "breathing" wobble applied to the thrum pitch. */
  private thrumBreathPhase = 0

  // VHF radio static — short bandpassed-noise hits (pitched noise voice)
  private radioNoise: Instrument | null = null
  private radioTimer = 0
  private radioNextInterval = 0

  // Night-watch motif
  private motifSynth: Instrument | null = null
  private motifTimer = 0
  private motifNextInterval = 0

  // State
  private running = false
  private initialized = false
  private enabled = true
  private ducked = false
  private rpmFrac = 0
  private masterVolumeOffset = 0  // additional offset from setMasterVolume()

  // -------------------------------------------------------------------------
  // LAZY AUDIO INIT
  // -------------------------------------------------------------------------

  private async ensureReady(): Promise<void> {
    if (this.initialized) return
    if (!isAudioRunning()) {
      await unlockAudio()
    }

    // ---- Engine Thrum ----
    this.thrum = new Drone({
      waveform: 'triangle',
      frequency: TUG_AUDIO_CONFIG.thrumBaseFreq,
      volumeDb: TUG_AUDIO_CONFIG.masterVolume,
      attack: TUG_AUDIO_CONFIG.rampTime,
      release: TUG_AUDIO_CONFIG.rampTime * 2,
    })

    // ---- VHF Radio Static ----
    this.radioNoise = new Instrument({
      waveform: 'noise',
      envelope: { attack: 0.01, decay: 0.12, sustain: 0, release: 0.08 },
      volumeDb: TUG_AUDIO_CONFIG.masterVolume + TUG_AUDIO_CONFIG.radioVolume,
    })

    // ---- Night-Watch Motif ----
    this.motifSynth = new Instrument({
      waveform: 'triangle',
      envelope: { attack: 0.28, decay: 0.4, sustain: 0.3, release: 1.4 },
      volumeDb: TUG_AUDIO_CONFIG.masterVolume + TUG_AUDIO_CONFIG.motifVolume,
    })

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
    this.rpmFrac = 0

    // Engine thrum fades in over the drone's attack
    this.thrum?.setVolumeDb(this._thrumVolume())
    this.thrum?.start()
  }

  stop(): void {
    if (!this.running) return
    this.running = false

    // Drone release gives the fade-out
    this.thrum?.stop()
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
    this.rpmFrac = Math.min(1, avgAbsRpm / 100)

    // ---- Cavitation ducking ----
    this.ducked = cavIntensity > TUG_AUDIO_CONFIG.cavitationDuckThreshold

    // ---- Engine thrum modulation ----
    if (this.thrum) {
      const targetFreq =
        TUG_AUDIO_CONFIG.thrumBaseFreq +
        this.rpmFrac * (TUG_AUDIO_CONFIG.thrumMaxFreq - TUG_AUDIO_CONFIG.thrumBaseFreq)
      // Slow ±3 Hz "breathing" around the target frequency
      this.thrumBreathPhase = (this.thrumBreathPhase + delta * 0.28 * Math.PI * 2) % (Math.PI * 2)
      this.thrum.setFrequency(targetFreq + Math.sin(this.thrumBreathPhase) * 3)

      // Volume scales slightly with RPM (idle is quieter than running)
      this.thrum.setVolumeDb(this._thrumVolume())
    }

    // ---- VHF radio crackle ----
    this.radioTimer += delta
    if (this.radioTimer >= this.radioNextInterval) {
      this.radioTimer = 0
      this.radioNextInterval = this._randomInterval(
        TUG_AUDIO_CONFIG.radioIntervalMin,
        TUG_AUDIO_CONFIG.radioIntervalMax,
      )
      this._triggerRadioCrackle()
    }

    // ---- Night-watch motif ----
    this.motifTimer += delta
    if (this.motifTimer >= this.motifNextInterval) {
      this.motifTimer = 0
      this.motifNextInterval = this._randomInterval(
        TUG_AUDIO_CONFIG.motifIntervalMin,
        TUG_AUDIO_CONFIG.motifIntervalMax,
      )
      this._playNightWatchMotif()
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
    this._playStinger([
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
    this._playStinger([
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
    this._playStinger([
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
    this._playStinger([
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
    this.thrum?.setVolumeDb(this._thrumVolume())
  }

  isRunning(): boolean { return this.running }
  isEnabled(): boolean { return this.enabled }

  // -------------------------------------------------------------------------
  // PRIVATE HELPERS
  // -------------------------------------------------------------------------

  private _duckOffset(): number {
    return this.ducked ? -TUG_AUDIO_CONFIG.cavitationDuckAmount : 0
  }

  private _thrumVolume(): number {
    return TUG_AUDIO_CONFIG.masterVolume + this.masterVolumeOffset + this.rpmFrac * 5 + this._duckOffset()
  }

  private _triggerRadioCrackle(): void {
    if (!this.radioNoise) return

    // Brief burst of VHF static — multiple short hits simulate signal fragments
    const burstCount = 1 + Math.floor(Math.random() * 3)
    const baseVol = TUG_AUDIO_CONFIG.masterVolume + TUG_AUDIO_CONFIG.radioVolume + this.masterVolumeOffset
    this.radioNoise.volumeDb = baseVol + (Math.random() - 0.5) * 4

    for (let i = 0; i < burstCount; i++) {
      const delay = i * (0.06 + Math.random() * 0.08)
      const dur = 0.04 + Math.random() * 0.09
      // ~1.9 kHz: the old bandpass centre
      this.radioNoise.play(1900, dur, { delay })
    }
  }

  private _playNightWatchMotif(): void {
    if (!this.motifSynth) return

    this.motifSynth.volumeDb =
      TUG_AUDIO_CONFIG.masterVolume + TUG_AUDIO_CONFIG.motifVolume + this.masterVolumeOffset + this._duckOffset()

    // Randomly play a 2-5 note subset of the full motif for variety
    const startIdx = Math.floor(Math.random() * (NIGHT_WATCH_MOTIF.length - 2))
    const endIdx = startIdx + 2 + Math.floor(Math.random() * 3)
    const phrase = NIGHT_WATCH_MOTIF.slice(startIdx, Math.min(endIdx, NIGHT_WATCH_MOTIF.length))

    for (const [note, offset] of phrase) {
      const dur = 0.8 + Math.random() * 0.5
      this.motifSynth.play(note, dur, { delay: offset })
    }
  }

  /**
   * Fire-and-forget polyphonic stinger. Each call gets its own instrument so
   * overlapping stingers keep their own level.
   * Each entry is [note, timeOffset_s, duration_noteValue].
   */
  private _playStinger(
    notes: Array<[string, number, string]>,
    volumeDb: number,
  ): void {
    const synth = new Instrument({
      waveform: 'triangle',
      envelope: { attack: 0.04, decay: 0.3, sustain: 0.2, release: 1.2 },
      volumeDb,
    })
    for (const [note, offset, dur] of notes) {
      synth.play(note, dur, { delay: offset })
    }
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
