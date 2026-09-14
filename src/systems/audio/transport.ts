/* eslint-disable no-restricted-syntax -- the 'audio' clock reads wall/audio time; see docs/systems/DETERMINISM.md */
import { getSim } from '../sim/SimContext'
import { audioRuntime } from './AudioRuntime'

// =============================================================================
// BEAT TRANSPORT
// Musical clock for HarborGlow. Position is measured in quarter-note beats and
// derived from a clock source, never accumulated from timer callbacks:
//
//   'sim'   — getSim().simTime. Ship music: every peer that shares the seed
//             lands on the same beat (docs/systems/DETERMINISM.md #183).
//   'audio' — AudioContext.currentTime. Menu / intro music, which plays while
//             the fixed-step sim is not running.
//
// The transport only *reads* sim time; it never ticks the sim, touches the
// RNG, or writes the store, so it cannot affect hashSimSnapshot.
// =============================================================================

export type TransportClock = 'sim' | 'audio'
export type TransportState = 'started' | 'stopped'
export type BeatCallback = (beat: number) => void

/** 4/4 is the only time signature used in HarborGlow. */
export const BEATS_PER_BAR = 4

const CLOCKS: Record<TransportClock, () => number> = {
  sim: () => getSim().simTime,
  audio: () => audioRuntime.context?.currentTime ?? performance.now() / 1000,
}

const EPSILON = 1e-6
const PUMP_INTERVAL_MS = 12

/** `'bars:beats[:sixteenths]'` → quarter-note beats. Numbers pass through as beats. */
export function positionToBeats(position: string | number): number {
  if (typeof position === 'number') return position
  const [bars = 0, beats = 0, sixteenths = 0] = position.split(':').map(Number)
  return bars * BEATS_PER_BAR + beats + sixteenths / 4
}

/** Quarter-note beats → `'bars:beats:sixteenths'` (floored). */
export function beatsToPosition(beats: number): string {
  const whole = Math.max(0, beats)
  const bars = Math.floor(whole / BEATS_PER_BAR)
  const beat = Math.floor(whole % BEATS_PER_BAR)
  const sixteenths = Math.floor((whole % 1) * 4)
  return `${bars}:${beat}:${sixteenths}`
}

/** Tone-style note values (`'4n'`, `'8n'`, `'1m'`) → quarter-note beats. */
export function noteValueToBeats(value: string | number): number {
  if (typeof value === 'number') return value
  const match = /^(\d+)(n|m)$/.exec(value)
  if (!match) return positionToBeats(value)
  const amount = Number(match[1])
  return match[2] === 'm' ? amount * BEATS_PER_BAR : 4 / amount
}

interface TransportEvent {
  id: number
  callback: BeatCallback
  /** Next beat at which the event is due. */
  beat: number
  /** Repeat interval in beats; one-shot when undefined. */
  interval?: number
}

export interface BeatTransportOptions {
  /** Override clock sources (tests). */
  clocks?: Partial<Record<TransportClock, () => number>>
  /** Run a timer that calls update() while started. Default true. */
  autoPump?: boolean
}

export class BeatTransport {
  private stateValue: TransportState = 'stopped'
  private bpmValue = 120
  private clockName: TransportClock = 'audio'
  private anchorBeat = 0
  private anchorTime = 0
  private nextId = 1
  private events = new Map<number, TransportEvent>()
  private updateListeners = new Set<(beat: number) => void>()
  private pump: ReturnType<typeof setInterval> | null = null
  private readonly clocks: Record<TransportClock, () => number>
  private readonly autoPump: boolean

  constructor(options: BeatTransportOptions = {}) {
    this.clocks = { ...CLOCKS, ...options.clocks }
    this.autoPump = options.autoPump ?? true
  }

  get state(): TransportState {
    return this.stateValue
  }

  get clock(): TransportClock {
    return this.clockName
  }

  get bpm(): number {
    return this.bpmValue
  }

  /** Change tempo without jumping the beat position. */
  set bpm(value: number) {
    if (!Number.isFinite(value) || value <= 0) return
    this.rebase()
    this.bpmValue = value
  }

  /** Current position in quarter-note beats. */
  get beats(): number {
    if (this.stateValue !== 'started') return this.anchorBeat
    const elapsed = Math.max(0, this.now() - this.anchorTime)
    return this.anchorBeat + elapsed * (this.bpmValue / 60)
  }

  /** Current position as `'bars:beats:sixteenths'`. */
  get position(): string {
    return beatsToPosition(this.beats)
  }

  secondsPerBeat(): number {
    return 60 / this.bpmValue
  }

  /** Phase within the current beat, 0 = downbeat. */
  beatPhase(): number {
    const beats = this.beats
    return beats - Math.floor(beats)
  }

  /**
   * Start (or re-clock) the transport. Repeating events realign to the first
   * occurrence at or after `atBeat` rather than replaying every missed step.
   */
  start(options: { clock?: TransportClock; atBeat?: number } = {}): this {
    const atBeat = options.atBeat ?? this.beats
    this.clockName = options.clock ?? this.clockName
    this.anchorBeat = atBeat
    this.anchorTime = this.now()
    this.stateValue = 'started'
    this.realignEvents(atBeat)
    if (this.autoPump && this.pump === null) {
      this.pump = globalThis.setInterval(() => this.update(), PUMP_INTERVAL_MS)
    }
    return this
  }

  stop(): this {
    this.rebase()
    this.stateValue = 'stopped'
    if (this.pump !== null) globalThis.clearInterval(this.pump)
    this.pump = null
    return this
  }

  /** Jump to a beat. Keeps running if started. */
  seek(beat: number): this {
    this.anchorBeat = Math.max(0, beat)
    this.anchorTime = this.now()
    this.realignEvents(this.anchorBeat)
    return this
  }

  /** Fire `callback` every `interval` beats starting at beat `startBeat`. */
  scheduleRepeat(callback: BeatCallback, interval: number, startBeat = 0): number {
    const id = this.nextId++
    const event: TransportEvent = { id, callback, beat: startBeat, interval: Math.max(interval, EPSILON) }
    if (this.stateValue === 'started') this.realignEvent(event, this.beats)
    this.events.set(id, event)
    return id
  }

  /** Fire `callback` once when the transport reaches `beat`. */
  scheduleOnce(callback: BeatCallback, beat: number): number {
    const id = this.nextId++
    this.events.set(id, { id, callback, beat })
    return id
  }

  /** Fire `callback` once, `beats` from the current position. */
  scheduleIn(callback: BeatCallback, beats: number): number {
    return this.scheduleOnce(callback, this.beats + beats)
  }

  clear(id: number): this {
    this.events.delete(id)
    return this
  }

  /** Remove every scheduled event. */
  cancel(): this {
    this.events.clear()
    return this
  }

  /** Called after every update() while started, with the current beat. */
  onUpdate(listener: (beat: number) => void): () => void {
    this.updateListeners.add(listener)
    return () => this.updateListeners.delete(listener)
  }

  /** Fire due events. Driven by the pump; tests may call it directly. */
  update(): void {
    if (this.stateValue !== 'started') return
    const current = this.beats
    const due = [...this.events.values()]
      .filter((event) => event.beat <= current + EPSILON)
      .sort((a, b) => a.beat - b.beat)
    for (const event of due) {
      if (!this.events.has(event.id)) continue
      const beat = event.beat
      if (event.interval === undefined) {
        this.events.delete(event.id)
      } else {
        this.realignEvent(event, current, true)
      }
      try {
        event.callback(beat)
      } catch (error) {
        console.error('[BeatTransport] event callback failed', error)
      }
    }
    for (const listener of this.updateListeners) listener(current)
  }

  dispose(): void {
    this.stop()
    this.cancel()
    this.updateListeners.clear()
  }

  private now(): number {
    return this.clocks[this.clockName]()
  }

  private rebase(): void {
    this.anchorBeat = this.beats
    this.anchorTime = this.now()
  }

  private realignEvents(beat: number): void {
    for (const event of this.events.values()) {
      if (event.interval !== undefined) this.realignEvent(event, beat)
    }
  }

  /** Move a repeating event to its first occurrence ≥ beat (> beat when `strictlyAfter`). */
  private realignEvent(event: TransportEvent, beat: number, strictlyAfter = false): void {
    const interval = event.interval!
    if (event.beat > beat + (strictlyAfter ? EPSILON : -EPSILON)) return
    const steps = Math.floor((beat - event.beat) / interval + EPSILON) + (strictlyAfter ? 1 : 0)
    const next = event.beat + Math.max(0, steps) * interval
    event.beat = next < beat - EPSILON ? next + interval : next
  }
}

/**
 * Step pattern locked to the beat grid: `values[i]` plays at
 * `startBeat + i * step`, looping. The step index is derived from the beat, so
 * a late start or seek lands mid-pattern instead of restarting it.
 */
export function scheduleSequence<T>(
  transport: BeatTransport,
  values: ReadonlyArray<T | null>,
  step: number,
  callback: (beat: number, value: T) => void,
  startBeat = 0,
): number {
  return transport.scheduleRepeat((beat) => {
    const index = Math.round((beat - startBeat) / step)
    const value = values[((index % values.length) + values.length) % values.length]
    if (value !== null && value !== undefined) callback(beat, value)
  }, step, startBeat)
}

/** Looping timeline: each event fires at `event.beat` every `lengthBeats`. */
export function scheduleLoop<T extends { beat: number }>(
  transport: BeatTransport,
  events: ReadonlyArray<T>,
  lengthBeats: number,
  callback: (beat: number, event: T) => void,
  startBeat = 0,
): number[] {
  return events.map((event) =>
    transport.scheduleRepeat((beat) => callback(beat, event), lengthBeats, startBeat + event.beat))
}

/** The one transport shared by music, sequencer cues, and light shows. */
export const transport = new BeatTransport()
