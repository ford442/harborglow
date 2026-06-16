export type LightCuePattern = 'breathe' | 'sweep' | 'strobe' | 'snap' | 'blackout'

export type LightPattern = LightCuePattern

export interface LightCue {
  beat: number
  pattern: LightCuePattern
  color: string
  intensity: number
}
