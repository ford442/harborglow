import { vi } from 'vitest'
import type {
  AcousticSpace,
  AudioRuntime,
  AudioRuntimeStatus,
  EffectsOptions,
  VoiceOptions,
} from '../systems/audio/AudioRuntime'
import type { AudioAnalysisSnapshot } from '../systems/audio/audioProtocol'

export interface RecordedNote {
  id: number
  note: string | number
  options: VoiceOptions
}

/**
 * Recording stand-in for the `audioRuntime` singleton. Installed globally by
 * src/test/setup.ts, so no suite reaches a real AudioContext / AudioWorklet.
 * The `AudioRuntime` class itself stays real (see AudioRuntime.test.ts).
 *
 * Inspect `notes` / `active` / `effects` to assert what a system played.
 */
export class FakeAudioRuntime {
  /** Marker checked by src/test/audioSetup.test.ts. */
  readonly isFakeAudioRuntime = true
  status: AudioRuntimeStatus = 'idle'
  context: AudioContext | null = null
  destination: AudioNode | null = null
  isSharedWasmActive = false
  isMasterMuted = false
  notes: RecordedNote[] = []
  active = new Set<number>()
  effects: EffectsOptions = {}
  analysis: AudioAnalysisSnapshot = {
    rms: 0, peak: 0, bass: 0, mid: 0, treble: 0, spectralCentroid: 0, frame: 0,
    waveform: new Float32Array(256),
  }
  private nextId = 0

  init = vi.fn(async () => { this.status = 'fallback' })
  resume = vi.fn(async () => { await this.init() })
  noteOn = vi.fn((note: string | number, options: VoiceOptions = {}) => {
    const id = this.nextId++
    this.notes.push({ id, note, options })
    if (options.duration === undefined) this.active.add(id)
    return id
  })
  noteOff = vi.fn((id: number) => { this.active.delete(id) })
  trigger = vi.fn((notes: string | number | Array<string | number>, _duration?: string | number, options: VoiceOptions = {}) =>
    (Array.isArray(notes) ? notes : [notes]).map((note) => this.noteOn(note, { ...options, duration: 0 })))
  stopAll = vi.fn(() => { this.active.clear() })
  setEffects = vi.fn((options: EffectsOptions) => { this.effects = { ...this.effects, ...options } })
  setAcousticSpace = vi.fn((room: AcousticSpace, roomMix = 0.35) => this.setEffects({ room, roomMix }))
  setMasterMuted = vi.fn((muted: boolean) => { this.isMasterMuted = muted })
  getAnalysis = vi.fn(() => this.analysis)
  /** No AudioContext: the transport falls back to its schedule position. */
  outputTime = vi.fn((): number | null => null)
  get diagnostics() {
    return {
      status: this.status, protocolVersion: null, sampleRate: null,
      baseLatency: null, outputLatency: null, commandOverflows: 0,
    }
  }
  connectInput = vi.fn()
  dispose = vi.fn(async () => { this.reset() })

  /** Forget recorded notes/effects and clear call history. */
  reset(): void {
    this.notes = []
    this.active.clear()
    this.effects = {}
    this.isMasterMuted = false
    for (const value of Object.values(this)) {
      if (vi.isMockFunction(value)) value.mockClear()
    }
  }
}

export function createAudioRuntimeMock(): FakeAudioRuntime & AudioRuntime {
  return new FakeAudioRuntime() as unknown as FakeAudioRuntime & AudioRuntime
}

/** The globally installed fake, typed for assertions. */
export async function getFakeAudioRuntime(): Promise<FakeAudioRuntime> {
  const { audioRuntime } = await import('../systems/audio/AudioRuntime')
  return audioRuntime as unknown as FakeAudioRuntime
}
