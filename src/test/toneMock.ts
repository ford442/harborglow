import { vi } from 'vitest'

/**
 * Shared Tone.js stub for Vitest. Real tone@14.x ESM uses extensionless
 * re-exports that Vitest cannot resolve; any suite that transitively imports
 * the store (or other audio systems) needs this mock before module load.
 */
export function createToneMock() {
  class FakeNode {
    connect = vi.fn().mockReturnThis()
    toDestination = vi.fn().mockReturnThis()
    dispose = vi.fn()
    volume = { value: 0, rampTo: vi.fn() }
    frequency = { value: 0 }
    min = 0
    max = 0
    wet = { value: 0 }
    start = vi.fn().mockReturnThis()
    stop = vi.fn()
    triggerAttackRelease = vi.fn()
    triggerAttack = vi.fn()
    triggerRelease = vi.fn()
    set = vi.fn()
    cancel = vi.fn()
    startTransport = vi.fn()
  }

  class FakePolySynth extends FakeNode {
    constructor(_VoiceType?: unknown, _options?: unknown) {
      super()
    }
  }

  class FakePart extends FakeNode {
    constructor(_callback?: unknown, _events?: unknown) {
      super()
    }
  }

  class FakeSequence extends FakeNode {
    constructor(_callback?: unknown, _events?: unknown, _subdivision?: unknown) {
      super()
    }
  }

  class FakeTime {
    constructor(private readonly value: string | number) {}

    toSeconds(): number {
      if (typeof this.value === 'number') return this.value
      const match = /^(\d+(?:\.\d+)?)([mn]?)$/.exec(this.value)
      if (!match) return 0
      const amount = Number(match[1])
      const unit = match[2]
      if (unit === 'n') return (60 / 120) * amount
      if (unit === 'm') return (60 / 120) * 4 * amount
      return amount
    }
  }

  class FakeNoise extends FakeNode {
    constructor(_type?: string) {
      super()
    }
  }

  let transportSeconds = 0
  let transportBpm = 120
  let transportState: 'started' | 'stopped' = 'stopped'

  const transport = {
    get seconds() {
      return transportSeconds
    },
    set seconds(value: number) {
      transportSeconds = value
    },
    get bpm() {
      return { value: transportBpm }
    },
    get state() {
      return transportState
    },
    position: '0:0:0',
    scheduleRepeat: vi.fn(),
    stop: vi.fn(() => {
      transportState = 'stopped'
    }),
    start: vi.fn(() => {
      transportState = 'started'
    }),
    cancel: vi.fn(),
    _setSeconds(value: number) {
      transportSeconds = value
    },
    _setBpm(value: number) {
      transportBpm = value
    },
  }

  const destination = {
    mute: false,
    connect: vi.fn(),
  }

  return {
    context: { state: 'running' as const },
    start: vi.fn(),
    now: vi.fn(() => 0),
    gainToDb: vi.fn((gain: number) => 20 * Math.log10(Math.max(gain, 0.00001))),
    getTransport: () => transport,
    Transport: transport,
    Destination: destination,
    Time: FakeTime,
    Oscillator: FakeNode,
    LFO: FakeNode,
    Filter: FakeNode,
    Volume: FakeNode,
    NoiseSynth: FakeNode,
    Synth: FakeNode,
    PolySynth: FakePolySynth,
    MetalSynth: FakeNode,
    MembraneSynth: FakeNode,
    AMSynth: FakeNode,
    Distortion: FakeNode,
    Compressor: FakeNode,
    AutoFilter: FakeNode,
    Reverb: FakeNode,
    Chorus: FakeNode,
    Limiter: FakeNode,
    PingPongDelay: FakeNode,
    FMSynth: FakeNode,
    MonoSynth: FakeNode,
    BitCrusher: FakeNode,
    FeedbackDelay: FakeNode,
    Part: FakePart,
    Sequence: FakeSequence,
    Player: FakeNode,
    Noise: FakeNoise,
    AmplitudeEnvelope: FakeNode,
    FFT: FakeNode,
    Waveform: FakeNode,
    Meter: FakeNode,
    Panner: FakeNode,
  }
}
