import { LightCue } from './types'

export const lngLightShow: LightCue[] = [
  // Intro: slow cyan breathing
  { beat: 0, pattern: 'breathe', color: '#1ad6ff', intensity: 0.35 },
  { beat: 8, pattern: 'breathe', color: '#1ad6ff', intensity: 0.5 },

  // Build: gentle frost-blue sweeps rising in intensity
  { beat: 16, pattern: 'sweep', color: '#7af0ff', intensity: 0.6 },
  { beat: 24, pattern: 'sweep', color: '#7af0ff', intensity: 0.75 },
  { beat: 30, pattern: 'breathe', color: '#1ad6ff', intensity: 0.85 },

  // Drop: frost-blue strobe into white wash
  { beat: 32, pattern: 'strobe', color: '#7af0ff', intensity: 1.0 },
  { beat: 34, pattern: 'strobe', color: '#ffffff', intensity: 0.95 },

  // Body: long cyan fades with occasional frost accents
  { beat: 40, pattern: 'breathe', color: '#1ad6ff', intensity: 0.7 },
  { beat: 48, pattern: 'sweep', color: '#7af0ff', intensity: 0.65 },

  // Second drop
  { beat: 54, pattern: 'strobe', color: '#7af0ff', intensity: 1.0 },

  // Outro: slow fade to black
  { beat: 58, pattern: 'breathe', color: '#1ad6ff', intensity: 0.2 },
]
