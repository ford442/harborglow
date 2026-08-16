import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AudioRuntime,
  musicalDurationToSeconds,
} from '../audio/AudioRuntime'

function createFallbackContext() {
  return class FakeAudioContext {
    state: AudioContextState = 'suspended'
    currentTime = 0
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
    createOscillator() {
      return {
        type: 'sine',
        frequency: { value: 0 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      } as unknown as OscillatorNode
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          cancelScheduledValues: vi.fn(),
          setTargetAtTime: vi.fn(),
        },
        connect: vi.fn(),
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

describe('audio scheduler duration conversion', () => {
  it('converts note lengths and measures at the active BPM', () => {
    expect(musicalDurationToSeconds('4n', 120)).toBeCloseTo(0.5)
    expect(musicalDurationToSeconds('8n', 120)).toBeCloseTo(0.25)
    expect(musicalDurationToSeconds('2m', 120)).toBeCloseTo(4)
    expect(musicalDurationToSeconds('+1.5', 120)).toBeCloseTo(1.5)
  })
})
