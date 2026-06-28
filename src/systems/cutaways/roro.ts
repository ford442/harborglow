import { CutawayPlan } from './types'

// 125 BPM Synthwave / Driving Rock — sunset-soaked driving angles that cut like neon highway lanes.
export const roroCutaway: CutawayPlan = [
  { beat: 4, action: { type: 'spotlight_pulse' } },
  { beat: 6, action: { type: 'camera_mode', mode: 'ship-low' }, holdFor: 4 },
  { beat: 10, action: { type: 'camera_mode', mode: 'ship-aerial' }, holdFor: 4 },
  { beat: 14, action: { type: 'camera_mode', mode: 'ship-rig' }, holdFor: 3 },
  { beat: 17, action: { type: 'camera_mode', mode: 'ship-water' }, holdFor: 3 },
  { beat: 20, action: { type: 'camera_mode', mode: 'ship-low' }, holdFor: 4 },
  { beat: 24, action: { type: 'climax' } },
  { beat: 28, action: { type: 'spectator_drone', duration: 9 } },
  { beat: 32, action: { type: 'hide_band_name' } },
]
