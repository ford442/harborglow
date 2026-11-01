import { authorShowV2, cue } from './author'

// 108 BPM aurora show for the Yamal icebreaker — native V2 preset (#253).
// Rig groups: funnel (funnelMain, secondaryStack), mast (mastArray), bridge,
// deck (heliDeck), gantry (secondaryCrane, towingNotch), accent (spoon bow).
// Green curtains rise over the whole ship, ripple teal and violet group by group,
// glitter white on the stacks and mast, and the escort gantry keeps its orange.
export const icebreakerAuroraShow = authorShowV2('icebreaker', 32, [
  // Bars 1–2: the aurora rises over the whole ship.
  cue(0, 8, 'all', 'breathe', '#3dff9e', 0.75, 'easeIn'),

  // Bars 3–4: curtains ripple group by group.
  cue(8, 8, 'mast', 'sweep', '#26e0c8', 0.8),
  cue(8, 8, 'funnel', 'breathe', '#9b6bff', 0.7),
  cue(8, 8, 'deck', 'sweep', '#3dff9e', 0.65),
  cue(8, 8, 'bridge', 'breathe', '#e8f4ff', 0.45),
  cue(8, 8, 'gantry', 'breathe', '#e65c00', 0.5),
  cue(8, 8, 'accent', 'breathe', '#c41e3a', 0.45),

  // Bar 5: violet corona across the ship.
  cue(16, 4, 'all', 'sweep', '#9b6bff', 0.85),

  // Bar 6: ice-crystal glitter on the stacks and mast, nuclear-red bow.
  cue(20, 4, 'funnel', 'strobe', '#e8f4ff', 0.9),
  cue(20, 4, 'mast', 'strobe', '#ffffff', 0.95),
  cue(20, 4, 'deck', 'snap', '#a8d8ea', 0.8),
  cue(20, 4, 'bridge', 'sweep', '#26e0c8', 0.6),
  cue(20, 4, 'gantry', 'sweep', '#3dff9e', 0.6),
  cue(20, 4, 'accent', 'snap', '#c41e3a', 1),

  // Bars 7–8: teal fade, escort-orange gantry, then the polar night.
  cue(24, 6, 'all', 'breathe', '#26e0c8', 0.8, 'easeInOut'),
  cue(24, 4, 'gantry', 'snap', '#e65c00', 0.85),
  cue(30, 2, 'all', 'blackout', '#000000', 0.1),
])
