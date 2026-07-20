import { LightCue } from './types'

export const fireboatLightShow: LightCue[] = [
  // Emergency Pulse — urgent red/blue siren strobes with water-cannon sweeps
  { beat: 0, pattern: 'strobe', color: '#ff2222', intensity: 0.85 },
  { beat: 1, pattern: 'strobe', color: '#2244ff', intensity: 0.8 },
  { beat: 2, pattern: 'strobe', color: '#ff2222', intensity: 0.9 },
  { beat: 3, pattern: 'strobe', color: '#2244ff', intensity: 0.85 },
  { beat: 4, pattern: 'sweep', color: '#4488ff', intensity: 0.7 },
  { beat: 6, pattern: 'strobe', color: '#ff3333', intensity: 0.95 },
  { beat: 7, pattern: 'strobe', color: '#3366ff', intensity: 0.9 },
  { beat: 8, pattern: 'snap', color: '#ffffff', intensity: 0.75 },
  { beat: 10, pattern: 'sweep', color: '#5599ff', intensity: 0.8 },
  { beat: 12, pattern: 'strobe', color: '#ff1111', intensity: 1.0 },
  { beat: 13, pattern: 'strobe', color: '#1133ff', intensity: 0.95 },
  { beat: 14, pattern: 'strobe', color: '#ff1111', intensity: 1.0 },
  { beat: 16, pattern: 'breathe', color: '#ff4444', intensity: 0.6 },
  { beat: 18, pattern: 'sweep', color: '#66aaff', intensity: 0.85 },
  { beat: 20, pattern: 'strobe', color: '#ff0000', intensity: 1.0 },
  { beat: 21, pattern: 'strobe', color: '#0000ff', intensity: 0.95 },
  { beat: 22, pattern: 'snap', color: '#ffffff', intensity: 0.8 },
  { beat: 24, pattern: 'sweep', color: '#4488ff', intensity: 0.9 },
  { beat: 26, pattern: 'strobe', color: '#ff2222', intensity: 0.9 },
  { beat: 28, pattern: 'strobe', color: '#2244ff', intensity: 0.85 },
  { beat: 30, pattern: 'blackout', color: '#000000', intensity: 0.1 },
]
