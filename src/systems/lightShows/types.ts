export type LightCuePattern = 'breathe' | 'sweep' | 'strobe' | 'snap' | 'blackout'

export type LightPattern = LightCuePattern

export interface LightCue {
  beat: number
  pattern: LightCuePattern
  color: string
  intensity: number
}

/** The original authored cue shape. Kept as the factory-preset source format. */
export type LightCueV1 = LightCue

export type RigGroupId = 'funnel' | 'bridge' | 'hullStrip' | 'gantry' | 'mast' | 'deck' | 'accent'
export type LightCueEasing = 'step' | 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

export interface LightCueV2 {
  /** Deterministic, e.g. `${showId}:${index}`; never random. */
  id: string
  beat: number
  /** > 0. The cue is active while the playhead is in [beat, beat + lengthBeats). */
  lengthBeats: number
  /** Rig row this cue belongs to. Particles honor it; the rig color follows the active cue. */
  target: RigGroupId | 'all'
  pattern: LightCuePattern
  /** '#rrggbb', same as V1 */
  color: string
  /** 0..1, same as V1 */
  intensity: number
  /** Shapes intensity across lengthBeats. `step` stays flat. */
  easing: LightCueEasing
}

export interface LightShowV2 {
  v: 2
  /** ShipType for factory presets */
  id: string
  loopBeats: number
  /** Reserved for #235; no pattern reads it yet. */
  seed?: number
  /** Sorted by beat */
  cues: LightCueV2[]
}
