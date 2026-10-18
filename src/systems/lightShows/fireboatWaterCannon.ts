import { authorShowV2, cue } from './author'

// 152 BPM "Rescue Pulse" water-cannon show — native V2 preset (#253).
// Rig groups on the fireboat: accent (the two water cannons), mast (siren mast),
// bridge, hullStrip (hull wash), deck (foam deck).
// The siren keeps the red/blue pulse; the cannons arc up, hold and fire on the beat.
export const fireboatWaterCannonShow = authorShowV2('fireboat', 32, [
  // Siren mast: red/blue alternation for the whole loop.
  cue(0, 4, 'mast', 'strobe', '#ff2222', 0.9),
  cue(4, 4, 'mast', 'strobe', '#2244ff', 0.85),
  cue(8, 4, 'mast', 'strobe', '#ff2222', 0.9),
  cue(12, 4, 'mast', 'strobe', '#2244ff', 0.85),
  cue(16, 4, 'mast', 'strobe', '#ff1111', 1),
  cue(20, 4, 'mast', 'strobe', '#1133ff', 0.95),
  cue(24, 6, 'mast', 'strobe', '#ff0000', 1),

  // Hull wash: a slow blue tide under everything.
  cue(0, 30, 'hullStrip', 'breathe', '#4488ff', 0.55),

  // Water cannons: arc up, hold the jets, sweep the harbor, then fire on the beat.
  cue(0, 8, 'accent', 'sweep', '#66ccff', 0.85, 'easeIn'),
  cue(8, 8, 'accent', 'breathe', '#aee6ff', 0.8),
  cue(16, 8, 'accent', 'sweep', '#e8f8ff', 1),
  cue(24, 6, 'accent', 'snap', '#ffffff', 1),

  // Bridge floods white on the cannon cues.
  cue(8, 4, 'bridge', 'snap', '#ffffff', 0.75),
  cue(24, 6, 'bridge', 'snap', '#ffffff', 0.85),

  // Foam deck swells with the third phrase.
  cue(16, 8, 'deck', 'breathe', '#e8f6ff', 0.8, 'easeInOut'),

  // Two-beat blackout before the loop.
  cue(30, 2, 'all', 'blackout', '#000000', 0.1),
])
