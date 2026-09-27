/* eslint-disable no-restricted-syntax -- audio scheduling uses wall/audio time; see docs/systems/DETERMINISM.md */
import { AudioRuntime, VoiceEnvelope, audioRuntime } from './AudioRuntime'
import { noteValueToBeats, transport } from './transport'

// =============================================================================
// VOICES
// The whole synthesis surface the game needs, over AudioRuntime:
//
//   Instrument — polyphonic note player (one-shots, chords, held notes)
//   Drone      — sustained tone whose pitch / level follows game state
//   SamplePlayer — decoded audio file (intro anthem MP3s) with a real gain fade
//
// There is no node graph: the WASM engine renders every voice into one bus
// with global effects (AudioRuntime.setEffects / setAcousticSpace). Per-voice
// timbre is the waveform + envelope + level.
// =============================================================================

/** Oscillator shapes rendered by `cpp/harborglow_audio_engine.cpp` (ABI ids). */
export const WAVEFORMS = {
  sine: 0,
  square: 1,
  sawtooth: 2,
  triangle: 3,
  pulse: 4,
  noise: 5,
  fm: 6,
  membrane: 7,
  metal: 8,
  supersaw: 9,
} as const

export type Waveform = keyof typeof WAVEFORMS
export type Note = string | number
/** Seconds, or a note value (`'8n'`, `'1m'`) resolved at the transport's BPM. */
export type Duration = number | string

export function dbToGain(db: number): number {
  if (!Number.isFinite(db)) return 0
  return Math.pow(10, db / 20)
}

export function gainToDb(gain: number): number {
  return 20 * Math.log10(Math.max(gain, 0.00001))
}

export function durationToSeconds(duration: Duration): number {
  if (typeof duration === 'number') return Math.max(0, duration)
  return noteValueToBeats(duration) * transport.secondsPerBeat()
}

/** Resume the AudioContext (call from a user gesture). */
export function unlockAudio(): Promise<void> {
  return audioRuntime.resume()
}

export function isAudioRunning(): boolean {
  return audioRuntime.context?.state === 'running'
}

/** Audio-thread time in seconds (for UI timing only — never sim state). */
export function audioNow(): number {
  return audioRuntime.context?.currentTime ?? performance.now() / 1000
}

export function setMasterMuted(muted: boolean): void {
  audioRuntime.setMasterMuted(muted)
}

export interface InstrumentOptions {
  waveform?: Waveform
  envelope?: Partial<VoiceEnvelope>
  volumeDb?: number
}

export interface PlayOptions {
  /** 0..1, multiplied with the instrument level. */
  velocity?: number
  /** Seconds from now. */
  delay?: number
  /**
   * AudioContext time to start at — pass the `time` a transport callback
   * receives so the note lands on its beat's exact frame. Wins over `delay`.
   */
  at?: number
}

function startTime(options: PlayOptions): number | undefined {
  if (options.at !== undefined) return options.at
  return options.delay !== undefined && options.delay > 0 ? audioNow() + options.delay : undefined
}

export class Instrument {
  waveform: Waveform
  envelope: Partial<VoiceEnvelope>
  volumeDb: number
  private held: number[] = []

  constructor(options: InstrumentOptions = {}, private readonly runtime: AudioRuntime = audioRuntime) {
    this.waveform = options.waveform ?? 'sine'
    this.envelope = options.envelope ?? {}
    this.volumeDb = options.volumeDb ?? 0
  }

  /** Play one note or a chord for `duration`. */
  play(notes: Note | Note[], duration: Duration = '8n', options: PlayOptions = {}): void {
    const seconds = durationToSeconds(duration)
    const at = startTime(options)
    for (const note of Array.isArray(notes) ? notes : [notes]) {
      this.runtime.noteOn(note, { ...this.voiceOptions(options.velocity), duration: seconds, at })
    }
  }

  /** Start a note that sustains until release(). */
  hold(note: Note, options: PlayOptions = {}): void {
    const at = startTime(options)
    this.held.push(this.runtime.noteOn(note, { ...this.voiceOptions(options.velocity), at }))
  }

  /** Release every held note. */
  release(): void {
    for (const id of this.held) this.runtime.noteOff(id)
    this.held = []
  }

  dispose(): void {
    this.release()
  }

  private voiceOptions(velocity = 1) {
    return {
      waveform: WAVEFORMS[this.waveform],
      velocity: velocity * dbToGain(this.volumeDb),
      envelope: this.envelope,
    }
  }
}

export interface DroneOptions {
  waveform?: Waveform
  frequency?: number
  volumeDb?: number
  attack?: number
  release?: number
}

/**
 * Sustained tone. The engine ABI has no pitch/level update command, so a
 * change re-voices the drone — throttled to audible steps (¼ semitone, 1 dB)
 * so per-frame updates do not churn the 64-voice pool.
 */
export class Drone {
  private voiceId: number | null = null
  private frequencyValue: number
  private volumeValue: number
  private readonly waveform: Waveform
  private readonly attack: number
  private readonly releaseSeconds: number

  constructor(options: DroneOptions = {}, private readonly runtime: AudioRuntime = audioRuntime) {
    this.waveform = options.waveform ?? 'sine'
    this.frequencyValue = options.frequency ?? 440
    this.volumeValue = options.volumeDb ?? 0
    this.attack = options.attack ?? 0.03
    this.releaseSeconds = options.release ?? 0.1
  }

  get running(): boolean {
    return this.voiceId !== null
  }

  get frequency(): number {
    return this.frequencyValue
  }

  get volumeDb(): number {
    return this.volumeValue
  }

  start(): void {
    if (this.voiceId === null) this.voice()
  }

  stop(): void {
    if (this.voiceId !== null) this.runtime.noteOff(this.voiceId)
    this.voiceId = null
  }

  setFrequency(hz: number): void {
    if (!Number.isFinite(hz) || hz <= 0) return
    const semitones = Math.abs(12 * Math.log2(hz / this.frequencyValue))
    if (this.voiceId !== null && semitones < 0.25) return
    this.frequencyValue = hz
    this.revoice()
  }

  setVolumeDb(db: number): void {
    const bothSilent = !Number.isFinite(db) && !Number.isFinite(this.volumeValue)
    if (bothSilent || (this.voiceId !== null && Math.abs(db - this.volumeValue) < 1)) return
    this.volumeValue = db
    this.revoice()
  }

  dispose(): void {
    this.stop()
  }

  private revoice(): void {
    if (this.voiceId === null) return
    this.runtime.noteOff(this.voiceId)
    this.voice()
  }

  private voice(): void {
    this.voiceId = this.runtime.noteOn(this.frequencyValue, {
      waveform: WAVEFORMS[this.waveform],
      velocity: dbToGain(this.volumeValue) * 0.5,
      envelope: { attack: this.attack, decay: 0, sustain: 1, release: this.releaseSeconds },
    })
  }
}

/** Decoded audio file routed through the engine bus, with a real gain stage. */
export class SamplePlayer {
  loop: boolean
  private buffer: AudioBuffer | null = null
  private source: AudioBufferSourceNode | null = null
  private gain: GainNode | null = null

  constructor(readonly url: string, options: { loop?: boolean } = {}) {
    this.loop = options.loop ?? false
  }

  get loaded(): boolean {
    return this.buffer !== null
  }

  async load(): Promise<void> {
    await audioRuntime.resume()
    const context = audioRuntime.context
    if (!context) return
    const response = await fetch(this.url)
    if (!response.ok) throw new Error(`Unable to load ${this.url}: HTTP ${response.status}`)
    this.buffer = await context.decodeAudioData(await response.arrayBuffer())
    this.gain = context.createGain()
    audioRuntime.connectInput(this.gain)
  }

  start(): void {
    const context = audioRuntime.context
    if (!context || !this.buffer || !this.gain) return
    this.stop()
    this.source = context.createBufferSource()
    this.source.buffer = this.buffer
    this.source.loop = this.loop
    this.source.connect(this.gain)
    this.source.start()
  }

  stop(): void {
    this.source?.stop()
    this.source?.disconnect()
    this.source = null
  }

  /** Ramp to `db` over `seconds` (-Infinity = silent). */
  fadeTo(db: number, seconds: number): void {
    const context = audioRuntime.context
    if (!context || !this.gain) return
    const now = context.currentTime
    const param = this.gain.gain
    param.cancelScheduledValues(now)
    param.setValueAtTime(param.value, now)
    param.linearRampToValueAtTime(dbToGain(db), now + Math.max(0, seconds))
  }

  dispose(): void {
    this.stop()
    this.gain?.disconnect()
    this.gain = null
    this.buffer = null
  }
}
