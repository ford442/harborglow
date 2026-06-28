import { CutawayPlan } from './types'

// 115 BPM Reggae / Calypso Fusion — laid-back island groove, warm waterline and bow sweeps.
export const ferryCutaway: CutawayPlan = [
  { beat: 4, action: { type: 'spotlight_pulse' } },
  { beat: 6, action: { type: 'camera_mode', mode: 'ship-water' }, holdFor: 5 },
  { beat: 11, action: { type: 'camera_mode', mode: 'ship-low' }, holdFor: 5 },
  { beat: 16, action: { type: 'camera_mode', mode: 'ship-aerial' }, holdFor: 4 },
  { beat: 20, action: { type: 'camera_mode', mode: 'ship-water' }, holdFor: 4 },
  { beat: 24, action: { type: 'climax' } },
  { beat: 28, action: { type: 'spectator_drone', duration: 9 } },
  { beat: 32, action: { type: 'hide_band_name' } },
]
