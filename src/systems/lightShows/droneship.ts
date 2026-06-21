import { LightCue } from './types'

export const droneshipLightShow: LightCue[] = [
  { beat: 0, pattern: 'breathe', color: '#d8e6ff', intensity: 0.25 },
  { beat: 8, pattern: 'breathe', color: '#b8aaff', intensity: 0.2 },
  { beat: 16, pattern: 'strobe', color: '#ffffff', intensity: 0.55 },
  { beat: 24, pattern: 'breathe', color: '#7a66ff', intensity: 0.3 },
  { beat: 28, pattern: 'blackout', color: '#000000', intensity: 0.0 },
]
