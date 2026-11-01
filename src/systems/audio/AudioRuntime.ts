import {
  ANALYSIS_BYTES,
  ANALYSIS_CAPACITY,
  ANALYSIS_RING_PTR,
  AUDIO_MEMORY_PAGES,
  AudioAnalysisSnapshot,
  AudioCommand,
  AudioCommandType,
  COMMAND_BYTES,
  COMMAND_CAPACITY,
  COMMAND_RING_PTR,
  PROTOCOL_VERSION,
  RingLayout,
  SharedRingReader,
  SharedRingWriter,
  decodeAnalysis,
  encodeCommand,
} from './audioProtocol'

export type AudioRuntimeStatus =
  | 'idle'
  | 'loading'
  | 'shared-simd'
  | 'shared-scalar'
  | 'fallback'
  | 'failed'

export type AcousticSpace = 'dry' | 'crane-cab' | 'cargo-hold' | 'tanker-hold' | 'ship-hall'

export interface VoiceEnvelope {
  attack: number
  decay: number
  sustain: number
  release: number
}

export interface VoiceOptions {
  waveform?: number
  velocity?: number
  envelope?: Partial<VoiceEnvelope>
  /** Seconds until note-off; omitted = held until noteOff(). */
  duration?: number
  /**
   * AudioContext time (seconds) the note starts at — a transport callback's
   * `time`. Omitted or past = the next render quantum.
   */
  at?: number
}

export interface AudioDiagnostics {
  status: AudioRuntimeStatus
  protocolVersion: number | null
  /** Rate the context actually runs at (48 kHz requested). */
  sampleRate: number | null
  baseLatency: number | null
  outputLatency: number | null
  /** Commands the ring rejected because the worklet fell behind. */
  commandOverflows: number
}

export interface EffectsOptions {
  lowpassHz?: number
  distortion?: number
  bitDepth?: number
  delaySeconds?: number
  delayFeedback?: number
  chorusDepth?: number
  room?: AcousticSpace
  roomMix?: number
}

const DEFAULT_ENVELOPE: VoiceEnvelope = {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.7,
  release: 0.2,
}

const ROOM_PRESETS: Record<AcousticSpace, number> = {
  dry: 0,
  'crane-cab': 1,
  'cargo-hold': 2,
  'tanker-hold': 3,
  'ship-hall': 4,
}

const NOTE_OFFSETS: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4,
  F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9,
  'A#': 10, Bb: 10, B: 11,
}

function noteToFrequency(note: string | number): number {
  if (typeof note === 'number') return note
  const match = /^([A-G](?:#|b)?)(-?\d+)$/.exec(note)
  if (!match) {
    const parsed = Number(note)
    return Number.isFinite(parsed) ? parsed : 440
  }
  const midi = (Number(match[2]) + 1) * 12 + NOTE_OFFSETS[match[1]]
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function musicalDurationToSeconds(value: string | number, bpm = 120): number {
  if (typeof value === 'number') return Math.max(0, value)
  if (value.startsWith('+')) return Number(value.slice(1)) || 0
  const match = /^(\d+)(n|m)$/.exec(value)
  if (!match) return Number(value) || 0.25
  const amount = Number(match[1])
  const quarter = 60 / bpm
  return match[2] === 'm' ? amount * quarter * 4 : quarter * (4 / amount)
}

interface NativeFallbackVoice {
  oscillator: OscillatorNode
  gain: GainNode
}

const VOICE_COUNT = 64
/** Requested engine rate; the device may refuse it (see createContext). */
const PREFERRED_SAMPLE_RATE = 48000

function createContext(Constructor: typeof AudioContext): AudioContext {
  try {
    return new Constructor({ latencyHint: 'interactive', sampleRate: PREFERRED_SAMPLE_RATE })
  } catch {
    // Some devices reject a forced rate; run at the device rate instead. The
    // worklet passes the real `sampleRate` to dsp_audio_engine_init.
    return new Constructor({ latencyHint: 'interactive' })
  }
}

export interface AudioRuntimeOptions {
  /**
   * Render into this context instead of creating one. An OfflineAudioContext
   * runs the same worklet + engine faster than real time (e2e timing tests);
   * call init(), not resume(), before startRendering().
   */
  context?: AudioContext | OfflineAudioContext
}

export class AudioRuntime {
  private statusValue: AudioRuntimeStatus = 'idle'
  private hasWarnedFallbackReason = false
  private initPromise: Promise<void> | null = null
  private contextValue: AudioContext | null = null
  private workletNode: AudioWorkletNode | null = null
  private fallbackAnalyser: AnalyserNode | null = null
  private masterGain: GainNode | null = null
  private masterMuted = false
  private fallbackWaveform = new Float32Array(256)
  private fallbackSpectrum = new Uint8Array(128)
  private memory: WebAssembly.Memory | null = null
  private commandWriter: SharedRingWriter | null = null
  private commandLayout: RingLayout | null = null
  private analysisReader: SharedRingReader | null = null
  private protocolVersion: number | null = null
  private analysis: AudioAnalysisSnapshot = {
    rms: 0,
    peak: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    spectralCentroid: 0,
    frame: 0,
    waveform: new Float32Array(256),
  }
  // Voice pool, tracked in AudioContext frames so scheduled notes can be
  // allocated ahead of time: a voice is free once its release tail ends.
  private voiceStart = new Float64Array(VOICE_COUNT)
  private voiceFreeAt = new Float64Array(VOICE_COUNT)
  private voiceRelease = new Float64Array(VOICE_COUNT)
  private voiceNote = new Uint32Array(VOICE_COUNT)
  private voiceByNote = new Map<number, number>()
  private nextNoteId = 1
  private fallbackVoices = new Map<number, NativeFallbackVoice>()
  private effects: Required<EffectsOptions> = {
    lowpassHz: 20000,
    distortion: 0,
    bitDepth: 24,
    delaySeconds: 0,
    delayFeedback: 0,
    chorusDepth: 0,
    room: 'dry',
    roomMix: 0,
  }

  constructor(private readonly options: AudioRuntimeOptions = {}) {}

  get status(): AudioRuntimeStatus {
    return this.statusValue
  }

  get context(): AudioContext | null {
    return this.contextValue
  }

  get destination(): AudioNode | null {
    return this.workletNode ?? this.fallbackAnalyser ?? this.contextValue?.destination ?? null
  }

  get isSharedWasmActive(): boolean {
    return this.statusValue === 'shared-simd' || this.statusValue === 'shared-scalar'
  }

  get diagnostics(): AudioDiagnostics {
    const context = this.contextValue
    let commandOverflows = 0
    if (this.memory && this.commandLayout) {
      commandOverflows = Atomics.load(
        new Int32Array(this.memory.buffer),
        (COMMAND_RING_PTR + this.commandLayout.overflowOffset) >> 2,
      ) >>> 0
    }
    return {
      status: this.statusValue,
      protocolVersion: this.protocolVersion,
      sampleRate: context?.sampleRate ?? null,
      baseLatency: context?.baseLatency ?? null,
      outputLatency: context?.outputLatency ?? null,
      commandOverflows,
    }
  }

  /**
   * AudioContext time of the sample reaching the speakers right now
   * (currentTime minus output latency). Light sync uses this so pulses match
   * what is heard, not what the engine is rendering.
   */
  outputTime(): number | null {
    const context = this.contextValue
    if (!context) return null
    const stamp = context.getOutputTimestamp?.()
    if (stamp?.contextTime !== undefined && stamp.performanceTime !== undefined &&
        stamp.performanceTime > 0) {
      // eslint-disable-next-line no-restricted-syntax -- output timestamps are on the performance clock; audio only, see docs/systems/DETERMINISM.md
      return stamp.contextTime + (performance.now() - stamp.performanceTime) / 1000
    }
    return context.currentTime - (context.outputLatency || context.baseLatency || 0)
  }

  init(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.initialize()
    return this.initPromise
  }

  async resume(): Promise<void> {
    await this.init()
    if (this.contextValue?.state === 'suspended') {
      await this.contextValue.resume()
    }
  }

  private async initialize(): Promise<void> {
    this.statusValue = 'loading'
    const AudioContextConstructor = globalThis.AudioContext ??
      (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AudioContextConstructor && !this.options.context) {
      this.statusValue = 'failed'
      return
    }

    // An injected OfflineAudioContext lacks only the realtime members
    // (latency, getOutputTimestamp), which every reader treats as optional.
    this.contextValue = (this.options.context as AudioContext | undefined) ??
      createContext(AudioContextConstructor)
    this.masterGain = this.contextValue.createGain()
    this.masterGain.gain.value = this.masterMuted ? 0 : 1
    this.masterGain.connect(this.contextValue.destination)
    const supportsShared = typeof SharedArrayBuffer !== 'undefined' &&
      typeof Atomics !== 'undefined' &&
      globalThis.crossOriginIsolated === true &&
      !!this.contextValue.audioWorklet &&
      typeof AudioWorkletNode !== 'undefined'
    if (!supportsShared) {
      this.warnFallbackReason()
      this.initializeFallbackAnalyser()
      this.statusValue = 'fallback'
      return
    }

    try {
      const selected = await this.loadAudioModule()
      this.memory = new WebAssembly.Memory({
        initial: AUDIO_MEMORY_PAGES,
        maximum: AUDIO_MEMORY_PAGES,
        shared: true,
      })
      const workletUrl = new URL(
        './worklet/harborglowAudioProcessor.js',
        import.meta.url,
      )
      await this.contextValue.audioWorklet.addModule(workletUrl)
      const node = new AudioWorkletNode(
        this.contextValue,
        'harborglow-audio-processor',
        {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [2],
          processorOptions: {
            module: selected.module,
            memory: this.memory,
          },
        },
      )

      const layout = await new Promise<RingLayout>((resolve, reject) => {
        const timeout = globalThis.setTimeout(
          () => reject(new Error('AudioWorklet initialization timed out')),
          5000,
        )
        node.port.onmessage = (event) => {
          if (event.data?.type === 'ready') {
            globalThis.clearTimeout(timeout)
            const { protocolVersion, commandBytes } = event.data
            if (protocolVersion !== PROTOCOL_VERSION || commandBytes !== COMMAND_BYTES) {
              reject(new Error(
                `Audio engine protocol v${protocolVersion}/${commandBytes}B, ` +
                `expected v${PROTOCOL_VERSION}/${COMMAND_BYTES}B`))
              return
            }
            this.protocolVersion = protocolVersion
            resolve(event.data.layout as RingLayout)
          } else if (event.data?.type === 'error') {
            globalThis.clearTimeout(timeout)
            reject(new Error(event.data.message))
          }
        }
      })

      this.workletNode = node
      node.connect(this.masterGain ?? this.contextValue.destination)
      this.commandLayout = layout
      this.commandWriter = new SharedRingWriter(
        this.memory, COMMAND_RING_PTR, COMMAND_CAPACITY, COMMAND_BYTES, layout)
      this.analysisReader = new SharedRingReader(
        this.memory, ANALYSIS_RING_PTR, ANALYSIS_CAPACITY, ANALYSIS_BYTES, layout)
      this.statusValue = selected.simd ? 'shared-simd' : 'shared-scalar'
      this.setEffects(this.effects)
    } catch (error) {
      console.warn(`[AudioRuntime] Shared WASM unavailable; using native fallback (status: 'fallback'):`, error)
      this.workletNode?.disconnect()
      this.workletNode = null
      this.memory = null
      this.commandWriter = null
      this.commandLayout = null
      this.analysisReader = null
      this.protocolVersion = null
      this.initializeFallbackAnalyser()
      this.statusValue = 'fallback'
    }
  }

  /**
   * Names the specific capability that failed the `supportsShared` gate so a
   * misconfigured host (most commonly: missing COOP/COEP response headers)
   * doesn't silently produce a game with no WASM audio. Fires once per
   * runtime instance.
   */
  private warnFallbackReason(): void {
    if (this.hasWarnedFallbackReason) return
    this.hasWarnedFallbackReason = true

    const reasons: string[] = []
    if (typeof SharedArrayBuffer === 'undefined') reasons.push('SharedArrayBuffer is unavailable')
    if (typeof Atomics === 'undefined') reasons.push('Atomics is unavailable')
    if (globalThis.crossOriginIsolated !== true) {
      reasons.push('crossOriginIsolated is not true (host is missing COOP/COEP response headers)')
    }
    if (!this.contextValue?.audioWorklet) reasons.push('AudioContext.audioWorklet is unavailable')
    if (typeof AudioWorkletNode === 'undefined') reasons.push('AudioWorkletNode is unavailable')

    console.warn(
      `[AudioRuntime] Shared WASM audio unavailable — falling back to the native analyser ` +
      `(status: 'fallback'). Failed condition(s): ${reasons.join('; ') || 'unknown'}.`,
    )
  }

  private async loadAudioModule(): Promise<{ module: WebAssembly.Module; simd: boolean }> {
    const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? './'
    const candidates = [
      { url: `${base}wasm/harborglow_audio_shared_simd.wasm`, simd: true },
      { url: `${base}wasm/harborglow_audio_shared.wasm`, simd: false },
    ]
    let lastError: unknown
    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate.url)
        if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${candidate.url}`)
        return { module: await WebAssembly.compile(await response.arrayBuffer()), simd: candidate.simd }
      } catch (error) {
        lastError = error
      }
    }
    throw lastError instanceof Error ? lastError : new Error('No audio WASM variant available')
  }

  private send(command: AudioCommand): boolean {
    return this.commandWriter?.push((view) => encodeCommand(view, command)) ?? false
  }

  /** AudioContext time → absolute frame, the engine's scheduling unit. */
  private toFrame(seconds: number): number {
    return Math.round(seconds * (this.contextValue?.sampleRate ?? PREFERRED_SAMPLE_RATE))
  }

  private nowFrame(): number {
    return this.toFrame(this.contextValue?.currentTime ?? 0)
  }

  /**
   * Voice free at `frame`, preferring the one silent longest; when all 64
   * are busy, steal the one whose release ends first (else the oldest held).
   */
  private allocateVoice(frame: number): number {
    let best = 0
    for (let voice = 1; voice < VOICE_COUNT; voice++) {
      const freeAt = this.voiceFreeAt[voice]
      const bestFreeAt = this.voiceFreeAt[best]
      if (freeAt < bestFreeAt ||
          (freeAt === bestFreeAt && this.voiceStart[voice] < this.voiceStart[best])) {
        best = voice
      }
    }
    if (this.voiceFreeAt[best] > frame) this.voiceByNote.delete(this.voiceNote[best])
    return best
  }

  /**
   * Start a note; returns a handle for noteOff(). With `options.at` the note
   * is placed on that exact audio frame; with `duration` its note-off is
   * scheduled too, so no main-thread timer is involved.
   */
  noteOn(note: string | number, options: VoiceOptions = {}): number {
    const now = this.nowFrame()
    const start = Math.max(now, options.at !== undefined ? this.toFrame(options.at) : 0)
    const voiceId = this.allocateVoice(start)
    const noteId = this.nextNoteId
    this.nextNoteId = (this.nextNoteId % 0xffffffff) + 1
    const envelope = { ...DEFAULT_ENVELOPE, ...options.envelope }
    const frequency = noteToFrequency(note)
    this.voiceStart[voiceId] = start
    this.voiceFreeAt[voiceId] = Infinity
    this.voiceRelease[voiceId] = envelope.release
    this.voiceNote[voiceId] = noteId
    this.voiceByNote.set(noteId, voiceId)
    if (this.isSharedWasmActive) {
      this.send({
        type: AudioCommandType.NoteOn,
        voiceId,
        noteId,
        frame: options.at !== undefined ? start : 0,
        frequency,
        velocity: options.velocity ?? 0.8,
        waveform: options.waveform ?? 0,
        ...envelope,
      })
    } else {
      this.startFallbackVoice(voiceId, frequency, options, envelope, start)
    }
    if (options.duration !== undefined) {
      this.noteOff(noteId, (start + this.toFrame(Math.max(0, options.duration))) /
        (this.contextValue?.sampleRate ?? PREFERRED_SAMPLE_RATE))
    }
    return noteId
  }

  /**
   * Release a note from noteOn(), now or at AudioContext time `at`. A handle
   * whose voice was since stolen or released is ignored.
   */
  noteOff(noteId: number, at?: number): void {
    const voiceId = this.voiceByNote.get(noteId)
    if (voiceId === undefined) return
    this.voiceByNote.delete(noteId)
    // Never before the note starts, or a pre-scheduled note-on would outlive it.
    const frame = Math.max(this.voiceStart[voiceId], at !== undefined ? this.toFrame(at) : 0)
    const releaseFrame = Math.max(frame, this.nowFrame())
    this.voiceFreeAt[voiceId] = releaseFrame + this.toFrame(this.voiceRelease[voiceId])
    if (this.isSharedWasmActive) {
      this.send({ type: AudioCommandType.NoteOff, voiceId, noteId, frame })
    } else {
      this.stopFallbackVoice(voiceId, releaseFrame)
    }
  }

  trigger(
    notes: string | number | Array<string | number>,
    duration: string | number = 0.25,
    options: VoiceOptions = {},
    bpm = 120,
  ): number[] {
    const seconds = musicalDurationToSeconds(duration, bpm)
    return (Array.isArray(notes) ? notes : [notes])
      .map((note) => this.noteOn(note, { ...options, duration: seconds }))
  }

  /** Silence every voice now, including notes scheduled ahead. */
  stopAll(): void {
    this.send({ type: AudioCommandType.StopAll })
    for (const voiceId of this.fallbackVoices.keys()) this.stopFallbackVoice(voiceId, this.nowFrame())
    this.voiceByNote.clear()
    this.voiceFreeAt.fill(0)
    this.voiceStart.fill(0)
  }

  setEffects(options: EffectsOptions): void {
    this.effects = { ...this.effects, ...options }
    this.send({
      type: AudioCommandType.SetEffects,
      ...this.effects,
      roomPreset: ROOM_PRESETS[this.effects.room],
    })
  }

  setAcousticSpace(room: AcousticSpace, roomMix = 0.35): void {
    this.setEffects({ room, roomMix })
  }

  /** Silence (or restore) everything the engine and sample players output. */
  setMasterMuted(muted: boolean): void {
    this.masterMuted = muted
    if (this.masterGain && this.contextValue) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.contextValue.currentTime, 0.02)
    }
  }

  get isMasterMuted(): boolean {
    return this.masterMuted
  }

  getAnalysis(): AudioAnalysisSnapshot {
    while (this.analysisReader?.pop((view) => {
      this.analysis = decodeAnalysis(view)
    })) {
      // Drain to the newest coherent snapshot.
    }
    if (this.statusValue === 'fallback' && this.fallbackAnalyser) {
      this.fallbackAnalyser.getFloatTimeDomainData(
        this.fallbackWaveform as Float32Array<ArrayBuffer>)
      this.fallbackAnalyser.getByteFrequencyData(
        this.fallbackSpectrum as Uint8Array<ArrayBuffer>)
      let sum = 0
      let peak = 0
      for (const sample of this.fallbackWaveform) {
        sum += sample * sample
        peak = Math.max(peak, Math.abs(sample))
      }
      const mean = (start: number, end: number) => {
        let value = 0
        for (let index = start; index <= end; index++) {
          value += this.fallbackSpectrum[index] ?? 0
        }
        return value / Math.max(1, end - start + 1) / 255
      }
      this.analysis = {
        rms: Math.sqrt(sum / this.fallbackWaveform.length),
        peak,
        bass: mean(0, 4),
        mid: mean(5, 43),
        treble: mean(44, 127),
        spectralCentroid: 0.5,
        frame: this.contextValue?.currentTime ?? 0,
        waveform: this.fallbackWaveform,
      }
    }
    return this.analysis
  }

  connectInput(source: AudioNode): void {
    const destination = this.workletNode ?? this.fallbackAnalyser ?? this.contextValue?.destination
    if (destination) source.connect(destination)
  }

  private initializeFallbackAnalyser(): void {
    if (!this.contextValue || this.fallbackAnalyser) return
    this.fallbackAnalyser = this.contextValue.createAnalyser()
    this.fallbackAnalyser.fftSize = 256
    this.fallbackAnalyser.connect(this.masterGain ?? this.contextValue.destination)
  }

  private startFallbackVoice(
    voiceId: number,
    frequency: number,
    options: VoiceOptions,
    envelope: VoiceEnvelope,
    startFrame: number,
  ): void {
    if (!this.contextValue) return
    this.stopFallbackVoice(voiceId, this.nowFrame())
    const oscillator = this.contextValue.createOscillator()
    const gain = this.contextValue.createGain()
    const oscillatorTypes: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle']
    oscillator.type = oscillatorTypes[options.waveform ?? 0] ?? 'sine'
    oscillator.frequency.value = frequency
    const start = startFrame / this.contextValue.sampleRate
    const velocity = options.velocity ?? 0.8
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(velocity * 0.16, start + envelope.attack)
    gain.gain.linearRampToValueAtTime(
      velocity * envelope.sustain * 0.16,
      start + envelope.attack + envelope.decay,
    )
    oscillator.connect(gain)
    gain.connect(this.fallbackAnalyser ?? this.contextValue.destination)
    oscillator.start(start)
    this.fallbackVoices.set(voiceId, { oscillator, gain })
  }

  private stopFallbackVoice(voiceId: number, frame: number): void {
    const voice = this.fallbackVoices.get(voiceId)
    if (!voice || !this.contextValue) return
    const at = frame / this.contextValue.sampleRate
    voice.gain.gain.cancelScheduledValues(at)
    voice.gain.gain.setTargetAtTime(0, at, 0.03)
    voice.oscillator.stop(at + 0.2)
    this.fallbackVoices.delete(voiceId)
  }

  async dispose(): Promise<void> {
    this.stopAll()
    this.workletNode?.disconnect()
    this.workletNode?.port.close()
    this.workletNode = null
    this.commandWriter = null
    this.commandLayout = null
    this.analysisReader = null
    this.protocolVersion = null
    this.memory = null
    this.fallbackAnalyser?.disconnect()
    this.fallbackAnalyser = null
    this.masterGain?.disconnect()
    this.masterGain = null
    this.statusValue = 'idle'
    this.initPromise = null
  }
}

export const audioRuntime = new AudioRuntime()

if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).harborglowAudioRuntime = audioRuntime
}
