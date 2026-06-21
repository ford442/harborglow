import { CutawayPlan } from './types'

// 120 BPM orchestral pop — slow holds on 8-beat phrase boundaries (sweeps at 8/16/24).
export const cruiseCutaway: CutawayPlan = [
  { beat: 4, action: { type: 'spotlight_pulse' } },
  { beat: 8, action: { type: 'camera_mode', mode: 'ship-aerial' }, holdFor: 8 },
  { beat: 16, action: { type: 'camera_mode', mode: 'ship-rig' }, holdFor: 8 },
  { beat: 24, action: { type: 'climax' } },
  { beat: 28, action: { type: 'spectator_drone', duration: 10 } },
  { beat: 32, action: { type: 'hide_band_name' } },
]
