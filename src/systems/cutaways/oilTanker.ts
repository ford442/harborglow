import { CutawayPlan } from './types'

// 140 BPM dubstep/industrial — hard cuts aligned to wobble drops (blackouts at 4/12/20/28).
export const oilTankerCutaway: CutawayPlan = [
  { beat: 4, action: { type: 'spotlight_pulse' } },
  { beat: 5, action: { type: 'camera_mode', mode: 'ship-low' }, holdFor: 3 },
  { beat: 8, action: { type: 'camera_mode', mode: 'ship-water' }, holdFor: 4 },
  { beat: 12, action: { type: 'camera_mode', mode: 'ship-low' }, holdFor: 4 },
  { beat: 16, action: { type: 'camera_mode', mode: 'ship-water' }, holdFor: 4 },
  { beat: 20, action: { type: 'camera_mode', mode: 'ship-rig' }, holdFor: 4 },
  { beat: 24, action: { type: 'climax' } },
  { beat: 25, action: { type: 'spectator_drone', duration: 8 } },
  { beat: 32, action: { type: 'hide_band_name' } },
]
