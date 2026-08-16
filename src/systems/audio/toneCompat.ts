import {
  AcousticSpace,
  EffectsOptions,
  VoiceEnvelope,
  audioRuntime,
  musicalDurationToSeconds,
} from './AudioRuntime'

type NodeOptions = Record<string, any>

class Signal {
  value: any
  constructor(value: any = 0, private readonly onChange?: (value: any) => void) {
    this.value = value
  }
  rampTo(value: any, _seconds = 0): this {
    this.value = value
    this.onChange?.(value)
    return this
  }
  setValueAtTime(value: any, _time = 0): this {
    this.value = value
    this.onChange?.(value)
    return this
  }
  linearRampToValueAtTime(value: any, _time = 0): this {
    return this.setValueAtTime(value)
  }
  exponentialRampToValueAtTime(value: any, _time = 0): this {
    return this.setValueAtTime(value)
  }
  cancelScheduledValues(): this { return this }
  setTargetAtTime(value: any): this { return this.setValueAtTime(value) }
}

function oscillatorWaveform(type: string | undefined): number {
  if (!type) return 0
  if (type.includes('fat')) return 9
  if (type.includes('fm')) return 6
  if (type.includes('square')) return 1
  if (type.includes('saw')) return 2
  if (type.includes('triangle')) return 3
  if (type.includes('pulse')) return 4
  return 0
}

function dbToGain(db: number): number {
  if (!Number.isFinite(db)) return 0
  return Math.pow(10, db / 20)
}

function envelopeFrom(options: NodeOptions): Partial<VoiceEnvelope> {
  const envelope = options.envelope ?? options
  return {
    attack: Number(envelope.attack ?? 0.01),
    decay: Number(envelope.decay ?? 0.1),
    sustain: Number(envelope.sustain ?? 0.7),
    release: Number(envelope.release ?? 0.2),
  }
}

export class ToneAudioNode {
  volume = new Signal(0)
  wet = new Signal(0)
  frequency = new Signal(440)
  gain = new Signal(1)
  pan = new Signal(0)
  min = 0
  max = 1
  protected options: NodeOptions
  protected activeVoiceIds: number[] = []

  constructor(options: NodeOptions | number | string = {}) {
    this.options = typeof options === 'object' ? options : { value: options }
  }

  connect(_destination?: unknown): this { return this }
  disconnect(_destination?: unknown): this { return this }
  toDestination(): this { return this }
  chain(..._nodes: unknown[]): this { return this }
  fan(..._nodes: unknown[]): this { return this }
  set(options: NodeOptions): this {
    this.options = { ...this.options, ...options }
    if (options.frequency !== undefined) this.frequency.value = options.frequency
    return this
  }
  start(_time?: number): this { return this }
  stop(_time?: number): this {
    this.releaseAll()
    return this
  }
  cancel(): this { return this }
  sync(): this { return this }
  unsync(): this { return this }
  dispose(): this {
    this.releaseAll()
    return this
  }
  releaseAll(): this {
    for (const id of this.activeVoiceIds) audioRuntime.noteOff(id)
    this.activeVoiceIds = []
    return this
  }
  triggerAttack(note: string | number = 440, time?: number, velocity = 1): this {
    this.schedule(time, () => {
      const id = audioRuntime.noteOn(note, {
        waveform: oscillatorWaveform(this.options.oscillator?.type),
        velocity: velocity * dbToGain(Number(this.volume.value)),
        envelope: envelopeFrom(this.options),
      })
      this.activeVoiceIds.push(id)
    })
    return this
  }
  triggerRelease(noteOrTime?: string | number, time?: number): this {
    const scheduledTime = typeof noteOrTime === 'number' && time === undefined
      ? noteOrTime
      : time
    this.schedule(scheduledTime, () => this.releaseAll())
    return this
  }
  triggerAttackRelease(
    note: string | number | Array<string | number> = 440,
    duration: string | number = '8n',
    time?: number,
    velocity = 1,
  ): this {
    this.schedule(time, () => {
      const ids = audioRuntime.trigger(note, duration, {
        waveform: oscillatorWaveform(this.options.oscillator?.type),
        velocity: velocity * dbToGain(Number(this.volume.value)),
        envelope: envelopeFrom(this.options),
      }, getTransport().bpm.value)
      this.activeVoiceIds.push(...ids)
    })
    return this
  }
  protected schedule(time: number | undefined, callback: () => void): void {
    const delay = typeof time === 'number' ? Math.max(0, time - now()) * 1000 : 0
    if (delay > 0) globalThis.setTimeout(callback, delay)
    else callback()
  }
}

export class Synth extends ToneAudioNode {}
export class MonoSynth extends Synth {}
export class AMSynth extends Synth {
  constructor(options: NodeOptions = {}) {
    super({ ...options, oscillator: { type: 'fmsine', ...options.oscillator } })
  }
}
export class FMSynth extends Synth {
  constructor(options: NodeOptions = {}) {
    super({ ...options, oscillator: { type: 'fmsine', ...options.oscillator } })
  }
}

export class PolySynth extends Synth {
  constructor(_voiceType?: unknown, options: NodeOptions = {}) {
    super(options)
  }
}

export class MembraneSynth extends Synth {
  triggerAttackRelease(
    note: string | number = 'C2',
    duration: string | number = '8n',
    time?: number,
    velocity = 1,
  ): this {
    this.options = { ...this.options, oscillator: { type: 'membrane' } }
    this.schedule(time, () => {
      this.activeVoiceIds.push(...audioRuntime.trigger(note, duration, {
        waveform: 7,
        velocity: velocity * dbToGain(Number(this.volume.value)),
        envelope: envelopeFrom(this.options),
      }, getTransport().bpm.value))
    })
    return this
  }
}

export class MetalSynth extends Synth {
  triggerAttackRelease(
    duration: string | number = '16n',
    time?: number,
    velocity = 1,
  ): this {
    this.schedule(time, () => {
      this.activeVoiceIds.push(...audioRuntime.trigger(240, duration, {
        waveform: 8,
        velocity: velocity * dbToGain(Number(this.volume.value)),
        envelope: envelopeFrom(this.options),
      }, getTransport().bpm.value))
    })
    return this
  }
}

export class NoiseSynth extends Synth {
  triggerAttack(_time?: number, velocity = 1): this {
    const id = audioRuntime.noteOn(160, {
      waveform: 5,
      velocity: velocity * dbToGain(Number(this.volume.value)),
      envelope: envelopeFrom(this.options),
    })
    this.activeVoiceIds.push(id)
    return this
  }
  triggerAttackRelease(
    duration: string | number = '8n',
    time?: number,
    velocity = 1,
  ): this {
    this.schedule(time, () => {
      this.activeVoiceIds.push(...audioRuntime.trigger(160, duration, {
        waveform: 5,
        velocity: velocity * dbToGain(Number(this.volume.value)),
        envelope: envelopeFrom(this.options),
      }, getTransport().bpm.value))
    })
    return this
  }
}

export class Oscillator extends ToneAudioNode {
  private voiceId: number | null = null
  constructor(options: NodeOptions | number = {}) {
    super(options)
    const frequency = typeof options === 'number' ? options : options.frequency
    this.frequency = new Signal(frequency ?? 440, (value) => {
      if (this.voiceId !== null) {
        audioRuntime.noteOff(this.voiceId)
        this.voiceId = this.createVoice(Number(value))
      }
    })
  }
  private createVoice(frequency: number): number {
    return audioRuntime.noteOn(frequency, {
      waveform: oscillatorWaveform(this.options.type),
      velocity: dbToGain(Number(this.volume.value)) * 0.5,
      envelope: { attack: 0.03, sustain: 1, release: 0.1 },
    })
  }
  start(time?: number): this {
    this.schedule(time, () => {
      if (this.voiceId === null) this.voiceId = this.createVoice(Number(this.frequency.value))
    })
    return this
  }
  stop(time?: number): this {
    this.schedule(time, () => {
      if (this.voiceId !== null) audioRuntime.noteOff(this.voiceId)
      this.voiceId = null
    })
    return this
  }
}

export class Noise extends Oscillator {
  constructor(type = 'white') {
    super({ type, frequency: 160 })
    this.options.type = 'noise'
  }
  protected override schedule(time: number | undefined, callback: () => void): void {
    super.schedule(time, callback)
  }
}

export class LFO extends ToneAudioNode {}

function applyEffects(options: EffectsOptions): void {
  audioRuntime.setEffects(options)
}

export class Filter extends ToneAudioNode {
  constructor(options: NodeOptions | number = {}, type?: string) {
    super(typeof options === 'number' ? { frequency: options, type } : options)
    const frequency = typeof options === 'number' ? options : options.frequency
    this.frequency = new Signal(frequency ?? 1000, (value) => {
      applyEffects({ lowpassHz: Number(value) })
    })
    if ((type ?? this.options.type) === 'lowpass') applyEffects({ lowpassHz: Number(this.frequency.value) })
  }
}
export class AutoFilter extends Filter {}
export class Distortion extends ToneAudioNode {
  constructor(options: NodeOptions | number = {}) {
    super(options)
    applyEffects({ distortion: Number(typeof options === 'number' ? options : options.distortion ?? 0) })
  }
}
export class BitCrusher extends ToneAudioNode {
  constructor(bits = 8) {
    super({ bits })
    applyEffects({ bitDepth: bits })
  }
}
export class FeedbackDelay extends ToneAudioNode {
  constructor(delay: NodeOptions | string = {}, feedback?: number) {
    super(typeof delay === 'object' ? delay : { delayTime: delay, feedback })
    applyEffects({
      delaySeconds: musicalDurationToSeconds(this.options.delayTime ?? '8n', getTransport().bpm.value),
      delayFeedback: Number(this.options.feedback ?? 0.25),
    })
  }
}
export class PingPongDelay extends FeedbackDelay {}
export class Chorus extends ToneAudioNode {
  constructor(options: NodeOptions = {}) {
    super(options)
    applyEffects({ chorusDepth: Number(options.depth ?? 0.4) })
  }
}
export class Reverb extends ToneAudioNode {
  constructor(options: NodeOptions = {}) {
    super(options)
    const decay = Number(options.decay ?? 2)
    const room: AcousticSpace = decay < 2 ? 'crane-cab' : decay < 5
      ? 'cargo-hold'
      : decay < 9 ? 'tanker-hold' : 'ship-hall'
    applyEffects({ room, roomMix: Number(options.wet ?? 0.35) })
  }
}
export class Limiter extends ToneAudioNode {}
export class Compressor extends ToneAudioNode {}
export class Volume extends ToneAudioNode {
  constructor(value: number | NodeOptions = 0) {
    super(value)
    this.volume = new Signal(typeof value === 'number' ? value : value.volume ?? 0)
  }
}
export class Panner extends ToneAudioNode {
  constructor(value = 0) {
    super({ pan: value })
    this.pan = new Signal(value)
  }
}
export class AmplitudeEnvelope extends ToneAudioNode {}

type ScheduledEvent = {
  id: number
  callback: (time: number) => void
  interval?: number
  at: number
}

class HarborTransport {
  state: 'started' | 'stopped' = 'stopped'
  bpm = new Signal(120)
  position = '0:0:0'
  private startedAt = 0
  private elapsed = 0
  private nextId = 1
  private events = new Map<number, ScheduledEvent>()
  private timer: ReturnType<typeof setInterval> | null = null

  get seconds(): number {
    return this.state === 'started'
      ? this.elapsed + Math.max(0, now() - this.startedAt)
      : this.elapsed
  }
  set seconds(value: number) {
    this.elapsed = value
    this.startedAt = now()
  }
  start(): this {
    if (this.state === 'started') return this
    this.startedAt = now()
    this.state = 'started'
    this.timer ??= globalThis.setInterval(() => this.tick(), 12)
    return this
  }
  stop(): this {
    if (this.state === 'started') this.elapsed = this.seconds
    this.state = 'stopped'
    if (this.timer !== null) globalThis.clearInterval(this.timer)
    this.timer = null
    return this
  }
  cancel(): this {
    this.events.clear()
    return this
  }
  dispose(): this {
    return this.stop().cancel()
  }
  scheduleRepeat(callback: (time: number) => void, interval: string | number, start = 0): number {
    const id = this.nextId++
    const intervalSeconds = musicalDurationToSeconds(interval, Number(this.bpm.value))
    this.events.set(id, { id, callback, interval: intervalSeconds, at: start })
    return id
  }
  scheduleOnce(callback: (time: number) => void, at: string | number): number {
    const id = this.nextId++
    const seconds = typeof at === 'string' && at.startsWith('+')
      ? this.seconds + musicalDurationToSeconds(at, Number(this.bpm.value))
      : musicalDurationToSeconds(at, Number(this.bpm.value))
    this.events.set(id, { id, callback, at: seconds })
    return id
  }
  clear(id: number): this {
    this.events.delete(id)
    return this
  }
  private tick(): void {
    if (this.state !== 'started') return
    const current = this.seconds
    for (const event of this.events.values()) {
      if (current < event.at) continue
      event.callback(now())
      if (event.interval) {
        event.at += event.interval
      } else {
        this.events.delete(event.id)
      }
    }
    const quarter = 60 / Number(this.bpm.value)
    const bars = Math.floor(current / (quarter * 4))
    const beats = Math.floor((current / quarter) % 4)
    this.position = `${bars}:${beats}:0`
  }
}

const transport = new HarborTransport()

export class Sequence<T = any> extends ToneAudioNode {
  loop = false
  loopEnd: string | number = '1m'
  private scheduleId: number | null = null
  constructor(
    private readonly callback: (time: number, value: T) => void,
    private readonly values: T[],
    private readonly subdivision: string | number = '4n',
  ) { super() }
  start(at: number | string = 0): this {
    let index = 0
    this.scheduleId = transport.scheduleRepeat((time) => {
      const value = this.values[index % this.values.length]
      if (value !== null && value !== undefined) this.callback(time, value)
      index++
      if (!this.loop && index >= this.values.length && this.scheduleId !== null) {
        transport.clear(this.scheduleId)
      }
    }, this.subdivision, musicalDurationToSeconds(at, Number(transport.bpm.value)))
    return this
  }
  dispose(): this {
    if (this.scheduleId !== null) transport.clear(this.scheduleId)
    return super.dispose()
  }
}

export class Part<T extends { time?: string | number } = any> extends ToneAudioNode {
  loop = false
  loopEnd: string | number = '1m'
  private scheduleIds: number[] = []
  constructor(
    private readonly callback: (time: number, value: T) => void,
    private readonly values: T[],
  ) { super() }
  start(at: number | string = 0): this {
    const offset = musicalDurationToSeconds(at, Number(transport.bpm.value))
    for (const value of this.values) {
      const eventTime = offset + musicalDurationToSeconds(value.time ?? 0, Number(transport.bpm.value))
      if (this.loop) {
        this.scheduleIds.push(transport.scheduleRepeat(
          (time) => this.callback(time, value),
          this.loopEnd,
          eventTime,
        ))
      } else {
        this.scheduleIds.push(transport.scheduleOnce((time) => this.callback(time, value), eventTime))
      }
    }
    return this
  }
  dispose(): this {
    this.scheduleIds.forEach((id) => transport.clear(id))
    return super.dispose()
  }
}

export class Waveform extends ToneAudioNode {
  constructor(private readonly size = 256) { super() }
  getValue(): Float32Array {
    return audioRuntime.getAnalysis().waveform.slice(0, this.size)
  }
}
export class Meter extends ToneAudioNode {
  getValue(): number { return audioRuntime.getAnalysis().rms }
}
export class FFT extends ToneAudioNode {
  getValue(): Float32Array {
    const analysis = audioRuntime.getAnalysis()
    return new Float32Array([analysis.bass, analysis.mid, analysis.treble])
  }
}

export class Player extends ToneAudioNode {
  loaded = false
  loop = false
  private buffer: AudioBuffer | null = null
  private source: AudioBufferSourceNode | null = null
  private url = ''
  constructor(options: NodeOptions | string = {}) {
    super(options)
    this.url = typeof options === 'string' ? options : options.url ?? ''
    this.loop = typeof options === 'object' && !!options.loop
    if (this.url) void this.load(this.url)
  }
  async load(url = this.url): Promise<this> {
    await audioRuntime.resume()
    const context = audioRuntime.context
    if (!context) return this
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Unable to load ${url}: HTTP ${response.status}`)
    this.buffer = await context.decodeAudioData(await response.arrayBuffer())
    this.loaded = true
    return this
  }
  start(time?: number): this {
    const context = audioRuntime.context
    if (!context || !this.buffer) return this
    this.source?.stop()
    this.source = context.createBufferSource()
    this.source.buffer = this.buffer
    this.source.loop = this.loop
    audioRuntime.connectInput(this.source)
    this.source.start(time ?? context.currentTime)
    return this
  }
  stop(time?: number): this {
    this.source?.stop(time)
    this.source = null
    return this
  }
}

export const Destination = {
  mute: false,
  connect(destination: AudioNode) {
    const source = audioRuntime.destination
    if (source && 'connect' in source) source.connect(destination)
    return destination
  },
  disconnect(destination?: AudioNode) {
    const source = audioRuntime.destination
    if (source && 'disconnect' in source) {
      if (destination) source.disconnect(destination)
      else source.disconnect()
    }
  },
}

export const context = {
  get state(): AudioContextState {
    return audioRuntime.context?.state ?? 'suspended'
  },
}

export async function start(): Promise<void> {
  await audioRuntime.resume()
}
export function now(): number {
  return audioRuntime.context?.currentTime ?? performance.now() / 1000
}
export function getTransport(): HarborTransport {
  return transport
}
export const Transport = transport
export const Draw = {
  schedule(callback: () => void, time = 0): number {
    const delay = Math.max(0, time - now()) * 1000
    return globalThis.setTimeout(callback, delay)
  },
  cancel(id: number): void {
    globalThis.clearTimeout(id)
  },
}
export function getContext(): { rawContext: AudioContext | null } {
  return { rawContext: audioRuntime.context }
}
export function gainToDb(gain: number): number {
  return 20 * Math.log10(Math.max(gain, 0.00001))
}
export function Time(value: string | number): { toSeconds(): number } {
  return {
    toSeconds: () => {
      if (typeof value === 'string' && value.includes(':')) {
        const [bars = 0, beats = 0, sixteenths = 0] = value.split(':').map(Number)
        const quarter = 60 / Number(transport.bpm.value)
        return bars * quarter * 4 + beats * quarter + sixteenths * quarter / 4
      }
      return musicalDurationToSeconds(value, Number(transport.bpm.value))
    },
  }
}
