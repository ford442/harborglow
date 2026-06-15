export type LightCuePattern = 'breathe' | 'sweep' | 'strobe' | 'snap' | 'blackout'

export interface LightCue {
  beat: number
  pattern: LightCuePattern
  color: string
  intensity: number
}
