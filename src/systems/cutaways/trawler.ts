import { CutawayPlan } from './types'

// 95 BPM Sea Shanty / Folk — slow rolling holds, lantern warmth over water and rigging.
export const trawlerCutaway: CutawayPlan = [
  { beat: 4, action: { type: 'spotlight_pulse' } },
  { beat: 6, action: { type: 'camera_mode', mode: 'ship-water' }, holdFor: 8 },
  { beat: 14, action: { type: 'camera_mode', mode: 'ship-aerial' }, holdFor: 8 },
  { beat: 22, action: { type: 'camera_mode', mode: 'ship-rig' }, holdFor: 2 },
  { beat: 24, action: { type: 'climax' } },
  { beat: 28, action: { type: 'spectator_drone', duration: 10 } },
  { beat: 32, action: { type: 'hide_band_name' } },
]
