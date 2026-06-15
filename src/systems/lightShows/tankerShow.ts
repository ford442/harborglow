import { LightCue } from './types'

// =============================================================================
// OIL TANKER — "Industrial Flames" (Dubstep / Industrial, 140 BPM)
// Hard amber/red snaps locked to the wobble, blackout between phrases.
// =============================================================================

export const tankerLightShow: LightCue[] = [
  { beat: 0, pattern: 'snap', color: '#ff8c1a', intensity: 1.0 },
  { beat: 1, pattern: 'snap', color: '#ff2a1a', intensity: 0.9 },
  { beat: 2, pattern: 'snap', color: '#ff8c1a', intensity: 1.0 },
  { beat: 3, pattern: 'snap', color: '#ff2a1a', intensity: 0.9 },
  { beat: 4, pattern: 'blackout', color: '#000000', intensity: 0 },
  { beat: 8, pattern: 'snap', color: '#ff8c1a', intensity: 1.0 },
  { beat: 9, pattern: 'snap', color: '#ff2a1a', intensity: 0.9 },
  { beat: 10, pattern: 'snap', color: '#ff8c1a', intensity: 1.0 },
  { beat: 11, pattern: 'snap', color: '#ff2a1a', intensity: 0.9 },
  { beat: 12, pattern: 'blackout', color: '#000000', intensity: 0 },
  { beat: 16, pattern: 'snap', color: '#ff8c1a', intensity: 1.0 },
  { beat: 17, pattern: 'snap', color: '#ff2a1a', intensity: 0.9 },
  { beat: 18, pattern: 'snap', color: '#ff8c1a', intensity: 1.0 },
  { beat: 19, pattern: 'snap', color: '#ff2a1a', intensity: 0.9 },
  { beat: 20, pattern: 'blackout', color: '#000000', intensity: 0 },
  { beat: 24, pattern: 'snap', color: '#fff2c0', intensity: 1.0 },
  { beat: 25, pattern: 'snap', color: '#ff2a1a', intensity: 1.0 },
  { beat: 26, pattern: 'snap', color: '#fff2c0', intensity: 1.0 },
  { beat: 27, pattern: 'snap', color: '#ff2a1a', intensity: 1.0 },
  { beat: 28, pattern: 'blackout', color: '#000000', intensity: 0 },
]
