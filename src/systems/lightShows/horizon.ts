import { LightCue } from './types'

export const horizonLightShow: LightCue[] = [
  // Oceanic ambient/post-rock: sparse deep-blue/teal breaths build
  // gradually toward a wide sweep climax, then fade back into the dark.
  { beat: 0, pattern: 'breathe', color: '#0a4f6b', intensity: 0.3 },
  { beat: 8, pattern: 'breathe', color: '#0d6e8c', intensity: 0.4 },
  { beat: 16, pattern: 'breathe', color: '#108aa8', intensity: 0.55 },
  { beat: 20, pattern: 'breathe', color: '#14a5c5', intensity: 0.65 },
  { beat: 24, pattern: 'sweep', color: '#1ad6ff', intensity: 0.85 },
  { beat: 28, pattern: 'breathe', color: '#0d6e8c', intensity: 0.45 },
  { beat: 30, pattern: 'breathe', color: '#0a4f6b', intensity: 0.25 },
]
