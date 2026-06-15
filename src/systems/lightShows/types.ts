// =============================================================================
// LIGHT SHOW TYPES
// Per-band light-cue schedules consumed by lightingSystem.ts
// =============================================================================

/**
 * Named light behaviors. Each pattern maps to a distinct intensity/timing
 * curve in lightingSystem's cue dispatcher.
 */
export type LightPattern = 'breathe' | 'sweep' | 'strobe' | 'snap' | 'blackout'

/**
 * A single cue in a band's light show. `beat` is a quarter-note beat offset
 * within the show's loop (4/4 time) — the active cue is the last one whose
 * `beat` has been reached, looping back to the start once the schedule ends.
 */
export interface LightCue {
  beat: number
  pattern: LightPattern
  color: string
  intensity: number
}
