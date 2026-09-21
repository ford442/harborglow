import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AudioRuntime,
  musicalDurationToSeconds,
} from '../audio/AudioRuntime'
import { AudioCommand, AudioCommandType } from '../audio/audioProtocol'

function createFallbackContext(created: Array<AudioContextOptions | undefined> = []) {
  return class FakeAudioContext {
    state: AudioContextState = 'suspended'
    currentTime = 0
    sampleRate = 48000
    baseLatency = 0.005
    outputLatency = 0.02
    constructor(options?: AudioContextOptions) {
      created.push(options)
    }
    destination = { connect: vi.fn() } as unknown as AudioDestinationNode
    audioWorklet = undefined as unknown as AudioWorklet
    async resume() { this.state = 'running' }
    createAnalyser() {
      return {
        fftSize: 256,
        connect: vi.fn(),
        disconnect: vi.fn(),
        getFloatTimeDomainData: (buffer: Float32Array) => buffer.fill(0),
        getByteFrequencyData: (buffer: Uint8Array) => buffer.fill(0),
      } as unknown as AnalyserNode
    }
    oscillators: Array<{ start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }> = []
    createOscillator() {
      const oscillator = {
        type: 'sine',
        frequency: { value: 0 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }
      this.oscillators.push(oscillator)
      return oscillator as unknown as OscillatorNode
    }
    createGain() {
      return {
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          cancelScheduledValues: vi.fn(),
          setTargetAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      } as unknown as GainNode
    }
  }
}

describe('AudioRuntime capability fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fails closed when Web Audio is unavailable', async () => {
    vi.stubGlobal('AudioContext', undefined)
    const runtime = new AudioRuntime()
    await runtime.init()
    expect(runtime.status).toBe('failed')
  })

  it('uses the native fallback without cross-origin isolation', async () => {
    vi.stubGlobal('AudioContext', createFallbackContext())
    vi.stubGlobal('crossOriginIsolated', false)
    const runtime = new AudioRuntime()
    await runtime.resume()
    expect(runtime.status).toBe('fallback')
    const voice = runtime.noteOn('A4', { duration: 0 })
    expect(voice).toBeGreaterThanOrEqual(0)
    runtime.stopAll()
    await runtime.dispose()
  })

  it('mutes and restores the master bus', async () => {
    vi.stubGlobal('AudioContext', createFallbackContext())
    vi.stubGlobal('crossOriginIsolated', false)
    const runtime = new AudioRuntime()
    runtime.setMasterMuted(true)
    await runtime.resume()
    expect(runtime.isMasterMuted).toBe(true)
    runtime.setMasterMuted(false)
    expect(runtime.isMasterMuted).toBe(false)
    await runtime.dispose()
  })

  it('initializes idempotently', async () => {
    vi.stubGlobal('AudioContext', createFallbackContext())
    vi.stubGlobal('crossOriginIsolated', false)
    const runtime = new AudioRuntime()
    const first = runtime.init()
    const second = runtime.init()
    expect(first).toBe(second)
    await first
  })
})

type FakeContext = InstanceType<ReturnType<typeof createFallbackContext>>

/** Fallback runtime flipped to the shared path, recording commands instead of writing the ring. */
async function sharedRuntime() {
  const { runtime, context } = await fallbackRuntime()
  const sent: AudioCommand[] = []
  const internals = runtime as unknown as {
    statusValue: string
    send: (command: AudioCommand) => boolean
  }
  internals.statusValue = 'shared-scalar'
  internals.send = (command) => { sent.push(command); return true }
  return { runtime: Object.assign(runtime, { sent }), context }
}

async function fallbackRuntime() {
  const created: Array<AudioContextOptions | undefined> = []
  vi.stubGlobal('AudioContext', createFallbackContext(created))
  vi.stubGlobal('crossOriginIsolated', false)
  const runtime = new AudioRuntime()
  await runtime.resume()
  return { runtime, context: runtime.context as unknown as FakeContext, created }
}

describe('AudioRuntime context and scheduling', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('asks for an interactive 48 kHz context and reports its latency', async () => {
    const { runtime, created } = await fallbackRuntime()
    expect(created[0]).toEqual({ latencyHint: 'interactive', sampleRate: 48000 })
    expect(runtime.diagnostics).toMatchObject({
      status: 'fallback',
      sampleRate: 48000,
      baseLatency: 0.005,
      outputLatency: 0.02,
    })
    await runtime.dispose()
  })

  it('falls back to the device rate when 48 kHz is refused', async () => {
    const Base = createFallbackContext()
    const created: Array<AudioContextOptions | undefined> = []
    vi.stubGlobal('AudioContext', class extends Base {
      constructor(options?: AudioContextOptions) {
        if (options?.sampleRate) throw new DOMException('rate', 'NotSupportedError')
        super(options)
        created.push(options)
      }
    })
    vi.stubGlobal('crossOriginIsolated', false)
    const runtime = new AudioRuntime()
    await runtime.init()
    expect(created).toEqual([{ latencyHint: 'interactive' }])
    expect(runtime.status).toBe('fallback')
    await runtime.dispose()
  })

  it('starts and stops fallback voices at their scheduled audio time', async () => {
    const { runtime, context } = await fallbackRuntime()
    context.currentTime = 1
    runtime.noteOn('A4', { at: 1.25, duration: 0.5 })
    const [oscillator] = context.oscillators
    expect(oscillator.start).toHaveBeenCalledWith(1.25)
    expect(oscillator.stop.mock.calls[0][0]).toBeCloseTo(1.75 + 0.2, 9)
    await runtime.dispose()
  })

  it('never releases a note before its scheduled start', async () => {
    const { runtime, context } = await fallbackRuntime()
    const note = runtime.noteOn('A4', { at: 2 })
    runtime.noteOff(note)
    expect(context.oscillators[0].stop.mock.calls[0][0]).toBeCloseTo(2.2, 9)
    await runtime.dispose()
  })

  it('returns note handles; a stale handle cannot release a newer note', async () => {
    const { runtime, context } = await fallbackRuntime()
    const first = runtime.noteOn('A4')
    runtime.noteOff(first)
    runtime.noteOff(first)
    expect(context.oscillators[0].stop).toHaveBeenCalledTimes(1)
    const second = runtime.noteOn('B4')
    expect(second).not.toBe(first)
    runtime.noteOff(first)
    expect(context.oscillators[1].stop).not.toHaveBeenCalled()
    await runtime.dispose()
  })

  it('sends scheduled NoteOn/NoteOff frames on the shared path', async () => {
    const { runtime, context } = await sharedRuntime()
    context.currentTime = 1
    runtime.noteOn('A4', { at: 1.25, duration: 0.5 })
    expect(runtime.sent.map(({ type, frame }) => ({ type, frame }))).toEqual([
      { type: AudioCommandType.NoteOn, frame: 60000 },
      { type: AudioCommandType.NoteOff, frame: 84000 },
    ])
    expect(runtime.sent[0].noteId).toBe(runtime.sent[1].noteId)
    await runtime.dispose()
  })

  it('reuses a voice only once its release tail has ended', async () => {
    const { runtime, context } = await sharedRuntime()
    // 64 notes released now; voice 10's tail is short, every other one is 1 s+.
    for (let i = 0; i < 64; i++) {
      runtime.noteOn(220 + i, { duration: 0, envelope: { release: i === 10 ? 0.1 : 1 + i * 0.01 } })
    }
    runtime.sent.length = 0
    context.currentTime = 0.5
    runtime.noteOn('A4')
    expect(runtime.sent[0].voiceId).toBe(10)
    // All busy again: steal the voice whose tail ends first (voice 0, 1 s).
    runtime.noteOn('B4')
    expect(runtime.sent[1].voiceId).toBe(0)
    await runtime.dispose()
  })
})

describe('audio scheduler duration conversion', () => {
  it('converts note lengths and measures at the active BPM', () => {
    expect(musicalDurationToSeconds('4n', 120)).toBeCloseTo(0.5)
    expect(musicalDurationToSeconds('8n', 120)).toBeCloseTo(0.25)
    expect(musicalDurationToSeconds('2m', 120)).toBeCloseTo(4)
    expect(musicalDurationToSeconds('+1.5', 120)).toBeCloseTo(1.5)
  })
})
