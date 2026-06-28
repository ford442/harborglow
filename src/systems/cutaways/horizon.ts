import { CutawayPlan } from './types'

// 100 BPM Oceanic Ambient / Post-Rock — vast swells, wide aerial-to-water arcs, patient build.
export const horizonCutaway: CutawayPlan = [
  { beat: 4, action: { type: 'spotlight_pulse' } },
  { beat: 6, action: { type: 'camera_mode', mode: 'ship-aerial' }, holdFor: 8 },
  { beat: 14, action: { type: 'camera_mode', mode: 'ship-water' }, holdFor: 7 },
  { beat: 21, action: { type: 'camera_mode', mode: 'ship-low' }, holdFor: 3 },
  { beat: 24, action: { type: 'climax' } },
  { beat: 28, action: { type: 'spectator_drone', duration: 10 } },
  { beat: 32, action: { type: 'hide_band_name' } },
]
