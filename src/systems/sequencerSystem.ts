import { BeatTransport, transport as sharedTransport } from './audio/transport'

// =============================================================================
// SEQUENCER SYSTEM
// Owns all cinematic/visual trigger scheduling, locked to the beat transport.
// Cues are keyed by quarter-note beat, and the transport derives beats from
// sim time during gameplay, so cues land on the same beat for every peer.
// =============================================================================

/** A single scheduled cinematic cue. */
interface CinematicCue {
  id: number
  /** Target transport beat at which this cue should fire. */
  beat: number
  fn: () => void
}

let _nextId = 0

export class SequencerSystem {
  private cues: CinematicCue[] = []

  constructor(private readonly transport: BeatTransport = sharedTransport) {
    // Flush on every transport update (only runs while the transport is started).
    this.transport.onUpdate((beat) => this._flushDueCues(beat))
  }

  /** Fire and remove all cues whose target beat has been reached. */
  private _flushDueCues(nowBeat: number): void {
    const due: CinematicCue[] = []
    const remaining: CinematicCue[] = []
    for (const cue of this.cues) {
      if (cue.beat <= nowBeat) {
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
   * current transport position. The callback fires on the main JS thread, so
   * it is safe to update React/Three.js state.
   *
   * @param beatOffset - Beats ahead of now. Example: 4 = one bar in 4/4 time.
   * @param fn         - Callback to invoke when the beat is reached.
   * @returns A numeric cue ID that can be passed to `cancel()`.
   */
  schedule(beatOffset: number, fn: () => void): number {
    return this._enqueue(this.transport.beats + beatOffset, fn)
  }

  /**
   * Schedule a one-shot callback at an absolute transport beat.
   *
   * @param beat - Absolute `transport.beats` target.
   * @param fn   - Callback to invoke when that beat is reached.
   * @returns A numeric cue ID that can be passed to `cancel()`.
   */
  scheduleAt(beat: number, fn: () => void): number {
    return this._enqueue(beat, fn)
  }

  private _enqueue(beat: number, fn: () => void): number {
    const id = _nextId++
    // Cinematic-cue counts are tiny (<10 at any time), so a full sort is
    // negligibly cheap and simpler than a binary-search insertion.
    this.cues.push({ id, beat, fn })
    this.cues.sort((a, b) => a.beat - b.beat)
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
   * Seek the transport to a specific beat for debug testing.
   * Enables cinematic triggers to be tested without replaying the full game.
   *
   * Available from the browser console:
   *   `window.sequencerSystem.seekTo(8)` — jump to beat 8 (bar 3 in 4/4)
   *
   * @param beat - Beat number to seek to (0-based quarter-note beats).
   */
  seekTo(beat: number): void {
    this.transport.seek(beat)
    console.log(`🎵 SequencerSystem.seekTo(${beat}) → position=${this.transport.position}`)
  }
}

/** Singleton sequencer — use this to schedule all cinematic/visual cues. */
export const sequencerSystem = new SequencerSystem()

// Expose on window so Noah can call seekTo() / schedule() from the browser console.
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).sequencerSystem = sequencerSystem
}
