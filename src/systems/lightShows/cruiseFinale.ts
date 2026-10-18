import { authorShowV2, cue } from './author'

// 120 BPM "Aurora Glow" finale — native V2 preset (#253).
// Rig groups on the liner's blueprint: funnel (funnel1/2) and hullStrip (balconies).
// Balconies swell up in gold, the funnels answer on the beat, the whole ship
// builds toward the drop and hits white on the last bar before a one-beat hush.
export const cruiseFinaleShow = authorShowV2('cruise', 32, [
  // Bars 1–2: overture — balconies swell, funnels idle warm.
  cue(0, 8, 'hullStrip', 'breathe', '#ffd700', 0.7, 'easeIn'),
  cue(0, 8, 'funnel', 'breathe', '#ffb347', 0.35),

  // Bars 3–4: the chase — balconies sweep white, funnels snap on the beat.
  cue(8, 8, 'hullStrip', 'sweep', '#fff8e7', 0.75),
  cue(8, 8, 'funnel', 'snap', '#ffd700', 0.85),

  // Bars 5–6: the build — the whole ship sweeps and swells toward the drop.
  cue(16, 8, 'all', 'sweep', '#ffec8b', 0.95, 'easeIn'),

  // Bar 7: the drop — funnels strobe white over gold balconies.
  cue(24, 4, 'funnel', 'strobe', '#ffffff', 1),
  cue(24, 4, 'hullStrip', 'strobe', '#ffd700', 0.9),

  // Bar 8: finale hits, then a one-beat hush before the loop.
  cue(28, 3, 'all', 'snap', '#ffffff', 1),
  cue(31, 1, 'all', 'blackout', '#000000', 0.05),
])
