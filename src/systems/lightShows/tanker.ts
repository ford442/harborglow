import { LightCue } from './types'

export const tankerLightShow: LightCue[] = [
  // Intro: hard amber snaps on the half-phrase
  { beat: 0, pattern: 'snap', color: '#ffaa00', intensity: 0.8 },
  { beat: 4, pattern: 'snap', color: '#ffaa00', intensity: 0.85 },
  { beat: 8, pattern: 'snap', color: '#ffaa00', intensity: 0.9 },

  // Build phrase: alternating snaps, tension rising
  { beat: 16, pattern: 'snap', color: '#ff2200', intensity: 0.85 },
  { beat: 20, pattern: 'snap', color: '#ffaa00', intensity: 0.9 },
  { beat: 24, pattern: 'snap', color: '#ff2200', intensity: 0.95 },

  // Blackout before first drop
  { beat: 30, pattern: 'blackout', color: '#000000', intensity: 0 },

  // Drop 1: red strobe on the downbeat
  { beat: 32, pattern: 'strobe', color: '#ff2200', intensity: 1.0 },
  { beat: 36, pattern: 'strobe', color: '#ffaa00', intensity: 0.95 },

  // Mid-phrase blackouts for industrial feel
  { beat: 44, pattern: 'blackout', color: '#000000', intensity: 0 },
  { beat: 48, pattern: 'snap', color: '#ffaa00', intensity: 0.9 },
  { beat: 52, pattern: 'snap', color: '#ff2200', intensity: 0.9 },

  // Blackout before second drop
  { beat: 58, pattern: 'blackout', color: '#000000', intensity: 0 },

  // Drop 2: red strobe
  { beat: 60, pattern: 'strobe', color: '#ff2200', intensity: 1.0 },
  { beat: 64, pattern: 'strobe', color: '#ffaa00', intensity: 0.95 },

  // Outro snap then fade
  { beat: 68, pattern: 'snap', color: '#ff2200', intensity: 0.7 },
]
