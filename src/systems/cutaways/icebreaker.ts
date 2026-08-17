import { CutawayPlan } from './types'

// 108 BPM Polar Convoy — held ice-line shots, escort silhouette, late climax
export const icebreakerCutaway: CutawayPlan = [
  { beat: 4, action: { type: 'spotlight_pulse' } },
  { beat: 8, action: { type: 'camera_mode', mode: 'ship-low' }, holdFor: 4 },
  { beat: 12, action: { type: 'camera_mode', mode: 'ship-water' }, holdFor: 4 },
  { beat: 16, action: { type: 'camera_mode', mode: 'ship-aerial' }, holdFor: 4 },
  { beat: 20, action: { type: 'climax' } },
  { beat: 24, action: { type: 'spectator_drone', duration: 8 } },
  { beat: 32, action: { type: 'hide_band_name' } },
]
