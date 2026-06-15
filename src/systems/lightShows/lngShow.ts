import { LightCue } from './types'

// =============================================================================
// LNG CARRIER — "Cryogenic Pulse" (Ambient / Cryogenic Techno, 118 BPM)
// Slow cyan breathing with a frost-blue strobe on the drop.
// =============================================================================

export const lngLightShow: LightCue[] = [
  { beat: 0, pattern: 'breathe', color: '#1ad6ff', intensity: 0.35 },
  { beat: 8, pattern: 'breathe', color: '#0a8fb8', intensity: 0.5 },
  { beat: 16, pattern: 'sweep', color: '#7af0ff', intensity: 0.7 },
  { beat: 24, pattern: 'strobe', color: '#eafcff', intensity: 1.0 },
  { beat: 28, pattern: 'breathe', color: '#1ad6ff', intensity: 0.4 },
]
