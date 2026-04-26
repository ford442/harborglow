import * as Tone from 'tone'

// =============================================================================
// SEQUENCER SYSTEM
// Owns all cinematic/visual trigger scheduling, locked to Tone.js Transport.
// Replaces ad-hoc setTimeout calls with Transport-synchronised cues.
// =============================================================================

/** A single scheduled cinematic cue. */
interface CinematicCue {
  id: number
  /** Target Transport time in seconds when this cue should fire. */
  seconds: number
  fn: () => void
}

let _nextId = 0

/** Beats per bar — assumes standard 4/4 time used throughout HarborGlow. */
const BEATS_PER_BAR = 4

class SequencerSystem {
  private cues: CinematicCue[] = []
  /** Cached Transport reference — Tone.getTransport() always returns the same singleton. */
  private readonly transport = Tone.getTransport()

  constructor() {
    // Poll on every 16th-note boundary so cues are picked up within
    // one subdivision (~31 ms at 120 BPM).  The callback fires on the
    // main JS thread (Tone uses look-ahead via WebWorker + postMessage),
    // so it is safe to read Transport.seconds and update application state.
    this.transport.scheduleRepeat((_time) => {
      if (this.transport.state !== 'started') return
      const now = this.transport.seconds
      this._flushDueCues(now)
    }, '16n')
  }

  /** Fire and remove all cues whose target time has been reached. */
  private _flushDueCues(nowSeconds: number): void {
    const due: CinematicCue[] = []
    const remaining: CinematicCue[] = []
    for (const cue of this.cues) {
      if (cue.seconds <= nowSeconds) {
        due.push(cue)
      } else {
        remaining.push(cue)
      }
    }
    this.cues = remaining
    for (const cue of due) {
      try {
        cue.fn()
      } catch (e) {
        console.error('SequencerSystem: error in cue callback', e)
      }
    }
  }

  /**
   * Schedule a one-shot callback at `beatOffset` quarter-note beats from the
   * current Transport position.  The callback fires on the main JS thread,
   * locked to the Tone.js Transport clock, making it safe to update
   * React/Three.js state without drift from wall-clock setTimeout.
   *
   * @param beatOffset - Beats ahead of now (quarter-note beats).
   *                     Example: 4 = one bar in 4/4 time.
   * @param fn         - Callback to invoke when the beat is reached.
   *                     Runs on the main thread — safe for React/R3F updates.
   * @returns A numeric cue ID that can be passed to `cancel()`.
   */
  schedule(beatOffset: number, fn: () => void): number {
    const secondsPerBeat = 60 / this.transport.bpm.value
    const targetSeconds = this.transport.seconds + beatOffset * secondsPerBeat
    return this._enqueue(targetSeconds, fn)
  }

  /**
   * Schedule a one-shot callback at an absolute Transport time in seconds.
   *
   * @param seconds - Absolute `Transport.seconds` target.
   * @param fn      - Callback to invoke when that Transport position is reached.
   * @returns A numeric cue ID that can be passed to `cancel()`.
   */
  scheduleAt(seconds: number, fn: () => void): number {
    return this._enqueue(seconds, fn)
  }

  private _enqueue(seconds: number, fn: () => void): number {
    const id = _nextId++
    // Linear insert into the sorted cues array.
    // Cinematic-cue counts are tiny (<10 at any time), so a full sort is
    // negligibly cheap and simpler than a binary-search insertion.
    this.cues.push({ id, seconds, fn })
    this.cues.sort((a, b) => a.seconds - b.seconds)
    return id
  }

  /**
   * Cancel a pending cue by its ID.  No-op if the cue has already fired.
   *
   * @param id - The ID returned by `schedule()` or `scheduleAt()`.
   */
  cancel(id: number): void {
    this.cues = this.cues.filter(c => c.id !== id)
  }

  /**
   * Remove all pending cues without firing them.
   */
  clearAll(): void {
    this.cues = []
  }

  /**
   * Seek the Tone.js Transport to a specific beat for debug testing.
   * Enables cinematic triggers to be tested without replaying the full game.
   *
   * Available from the browser console:
   *   `window.sequencerSystem.seekTo(8)` — jump to beat 8 (bar 3 in 4/4)
   *
   * @param beat - Beat number to seek to (0-based quarter-note beats).
   *               Beat 0 = bar 0 beat 0, beat 4 = bar 1 beat 0, etc.
   */
  seekTo(beat: number): void {
    const wasStarted = this.transport.state === 'started'
    if (wasStarted) this.transport.stop()
    // BEATS_PER_BAR assumes 4/4 — the only time signature used in HarborGlow.
    const bars = Math.floor(beat / BEATS_PER_BAR)
    const beatInBar = beat % BEATS_PER_BAR
    this.transport.position = `${bars}:${beatInBar}:0`
    if (wasStarted) this.transport.start()
    console.log(`🎵 SequencerSystem.seekTo(${beat}) → position=${this.transport.position}`)
  }
}

/** Singleton sequencer — use this to schedule all cinematic/visual cues. */
export const sequencerSystem = new SequencerSystem()

// Expose on window so Noah can call seekTo() / schedule() from the browser console.
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).sequencerSystem = sequencerSystem
}
