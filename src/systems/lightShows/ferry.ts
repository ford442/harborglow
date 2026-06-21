import { LightCue } from './types'

export const ferryLightShow: LightCue[] = [
  // Laid-back reggae/calypso: warm yellow breathes on the downbeats,
  // turquoise off-beat snaps give the island skank rhythm.
  { beat: 0, pattern: 'breathe', color: '#f9d71c', intensity: 0.4 },
  { beat: 2, pattern: 'snap', color: '#1ad6ff', intensity: 0.55 },
  { beat: 4, pattern: 'breathe', color: '#f9d71c', intensity: 0.45 },
  { beat: 6, pattern: 'snap', color: '#1ad6ff', intensity: 0.6 },
  { beat: 8, pattern: 'sweep', color: '#7af0ff', intensity: 0.55 },
  { beat: 10, pattern: 'snap', color: '#f9d71c', intensity: 0.6 },
  { beat: 12, pattern: 'breathe', color: '#1ad6ff', intensity: 0.4 },
  { beat: 14, pattern: 'snap', color: '#f9d71c', intensity: 0.65 },
  { beat: 16, pattern: 'breathe', color: '#f9d71c', intensity: 0.5 },
  { beat: 18, pattern: 'snap', color: '#1ad6ff', intensity: 0.7 },
  { beat: 20, pattern: 'sweep', color: '#7af0ff', intensity: 0.65 },
  { beat: 22, pattern: 'snap', color: '#f9d71c', intensity: 0.75 },
  { beat: 24, pattern: 'breathe', color: '#1ad6ff', intensity: 0.45 },
  { beat: 26, pattern: 'snap', color: '#f9d71c', intensity: 0.7 },
  { beat: 28, pattern: 'breathe', color: '#f9d71c', intensity: 0.35 },
  { beat: 30, pattern: 'snap', color: '#1ad6ff', intensity: 0.6 },
]
