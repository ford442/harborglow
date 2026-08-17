import { LightCue } from './types'

// 108 BPM Polar Convoy — slow ice-cyan breathes, nuclear-red strobes, escort-orange sweeps
export const icebreakerLightShow: LightCue[] = [
  { beat: 0, pattern: 'breathe', color: '#7ec8e3', intensity: 0.55 },
  { beat: 2, pattern: 'sweep', color: '#e65c00', intensity: 0.65 },
  { beat: 4, pattern: 'strobe', color: '#c41e3a', intensity: 0.8 },
  { beat: 6, pattern: 'breathe', color: '#a8d8ea', intensity: 0.5 },
  { beat: 8, pattern: 'snap', color: '#e8f4ff', intensity: 0.75 },
  { beat: 10, pattern: 'sweep', color: '#c41e3a', intensity: 0.7 },
  { beat: 12, pattern: 'strobe', color: '#7ec8e3', intensity: 0.85 },
  { beat: 14, pattern: 'breathe', color: '#e65c00', intensity: 0.55 },
  { beat: 16, pattern: 'snap', color: '#ffffff', intensity: 0.7 },
  { beat: 18, pattern: 'sweep', color: '#7ec8e3', intensity: 0.8 },
  { beat: 20, pattern: 'strobe', color: '#c41e3a', intensity: 0.9 },
  { beat: 22, pattern: 'breathe', color: '#a8d8ea', intensity: 0.6 },
  { beat: 24, pattern: 'sweep', color: '#e65c00', intensity: 0.75 },
  { beat: 26, pattern: 'strobe', color: '#7ec8e3', intensity: 0.85 },
  { beat: 28, pattern: 'snap', color: '#e8f4ff', intensity: 0.8 },
  { beat: 30, pattern: 'blackout', color: '#000000', intensity: 0.1 },
]
