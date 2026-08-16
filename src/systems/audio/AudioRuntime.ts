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
  duration?: number
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

export class AudioRuntime {
  private statusValue: AudioRuntimeStatus = 'idle'
  private initPromise: Promise<void> | null = null
  private contextValue: AudioContext | null = null
  private workletNode: AudioWorkletNode | null = null
  private fallbackAnalyser: AnalyserNode | null = null
  private fallbackWaveform = new Float32Array(256)
  private fallbackSpectrum = new Uint8Array(128)
  private memory: WebAssembly.Memory | null = null
  private commandWriter: SharedRingWriter | null = null
  private analysisReader: SharedRingReader | null = null
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
  private freeVoices = Array.from({ length: 64 }, (_, index) => 63 - index)
  private activeVoices = new Set<number>()
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
    if (!AudioContextConstructor) {
      this.statusValue = 'failed'
      return
    }

    this.contextValue = new AudioContextConstructor()
    const supportsShared = typeof SharedArrayBuffer !== 'undefined' &&
      typeof Atomics !== 'undefined' &&
      globalThis.crossOriginIsolated === true &&
      !!this.contextValue.audioWorklet &&
      typeof AudioWorkletNode !== 'undefined'
    if (!supportsShared) {
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
            resolve(event.data.layout as RingLayout)
          } else if (event.data?.type === 'error') {
            globalThis.clearTimeout(timeout)
            reject(new Error(event.data.message))
          }
        }
      })

      this.workletNode = node
      node.connect(this.contextValue.destination)
      this.commandWriter = new SharedRingWriter(
        this.memory, COMMAND_RING_PTR, COMMAND_CAPACITY, COMMAND_BYTES, layout)
      this.analysisReader = new SharedRingReader(
        this.memory, ANALYSIS_RING_PTR, ANALYSIS_CAPACITY, ANALYSIS_BYTES, layout)
      this.statusValue = selected.simd ? 'shared-simd' : 'shared-scalar'
      this.setEffects(this.effects)
    } catch (error) {
      console.warn('[AudioRuntime] Shared WASM unavailable; using native fallback:', error)
      this.workletNode?.disconnect()
      this.workletNode = null
      this.memory = null
      this.commandWriter = null
      this.analysisReader = null
      this.initializeFallbackAnalyser()
      this.statusValue = 'fallback'
    }
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

  noteOn(note: string | number, options: VoiceOptions = {}): number {
    const voiceId = this.freeVoices.pop() ?? Math.min(...this.activeVoices)
    this.activeVoices.add(voiceId)
    const envelope = { ...DEFAULT_ENVELOPE, ...options.envelope }
    const frequency = noteToFrequency(note)
    if (this.isSharedWasmActive) {
      this.send({
        type: AudioCommandType.NoteOn,
        voiceId,
        frequency,
        velocity: options.velocity ?? 0.8,
        waveform: options.waveform ?? 0,
        ...envelope,
      })
    } else {
      this.startFallbackVoice(voiceId, frequency, options, envelope)
    }
    if (options.duration !== undefined) {
      globalThis.setTimeout(
        () => this.noteOff(voiceId),
        Math.max(0, options.duration + envelope.release) * 1000,
      )
    }
    return voiceId
  }

  noteOff(voiceId: number): void {
    if (!this.activeVoices.delete(voiceId)) return
    this.freeVoices.push(voiceId)
    if (this.isSharedWasmActive) {
      this.send({ type: AudioCommandType.NoteOff, voiceId })
    } else {
      const voice = this.fallbackVoices.get(voiceId)
      if (voice && this.contextValue) {
        const now = this.contextValue.currentTime
        voice.gain.gain.cancelScheduledValues(now)
        voice.gain.gain.setTargetAtTime(0, now, 0.03)
        voice.oscillator.stop(now + 0.2)
        this.fallbackVoices.delete(voiceId)
      }
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

  stopAll(): void {
    this.send({ type: AudioCommandType.StopAll })
    for (const voiceId of [...this.activeVoices]) this.noteOff(voiceId)
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
    this.fallbackAnalyser.connect(this.contextValue.destination)
  }

  private startFallbackVoice(
    voiceId: number,
    frequency: number,
    options: VoiceOptions,
    envelope: VoiceEnvelope,
  ): void {
    if (!this.contextValue) return
    const oscillator = this.contextValue.createOscillator()
    const gain = this.contextValue.createGain()
    const oscillatorTypes: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle']
    oscillator.type = oscillatorTypes[options.waveform ?? 0] ?? 'sine'
    oscillator.frequency.value = frequency
    const now = this.contextValue.currentTime
    const velocity = options.velocity ?? 0.8
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(velocity * 0.16, now + envelope.attack)
    gain.gain.linearRampToValueAtTime(
      velocity * envelope.sustain * 0.16,
      now + envelope.attack + envelope.decay,
    )
    oscillator.connect(gain)
    gain.connect(this.fallbackAnalyser ?? this.contextValue.destination)
    oscillator.start()
    this.fallbackVoices.set(voiceId, { oscillator, gain })
  }

  async dispose(): Promise<void> {
    this.stopAll()
    this.workletNode?.disconnect()
    this.workletNode?.port.close()
    this.workletNode = null
    this.commandWriter = null
    this.analysisReader = null
    this.memory = null
    this.fallbackAnalyser?.disconnect()
    this.fallbackAnalyser = null
    this.statusValue = 'idle'
    this.initPromise = null
  }
}

export const audioRuntime = new AudioRuntime()

if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).harborglowAudioRuntime = audioRuntime
}
