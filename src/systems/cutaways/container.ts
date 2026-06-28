import { CutawayPlan } from './types'

// 128 BPM Future Bass / Techno — rapid neon-lit cuts that chase the freight lines like a warehouse strobe.
export const containerCutaway: CutawayPlan = [
  { beat: 4, action: { type: 'spotlight_pulse' } },
  { beat: 5, action: { type: 'camera_mode', mode: 'ship-low' }, holdFor: 3 },
  { beat: 8, action: { type: 'camera_mode', mode: 'ship-rig' }, holdFor: 3 },
  { beat: 11, action: { type: 'camera_mode', mode: 'ship-low' }, holdFor: 2 },
  { beat: 13, action: { type: 'camera_mode', mode: 'ship-rig' }, holdFor: 2 },
  { beat: 15, action: { type: 'camera_mode', mode: 'ship-water' }, holdFor: 2 },
  { beat: 17, action: { type: 'camera_mode', mode: 'ship-low' }, holdFor: 2 },
  { beat: 19, action: { type: 'camera_mode', mode: 'ship-rig' }, holdFor: 2 },
  { beat: 21, action: { type: 'camera_mode', mode: 'ship-aerial' }, holdFor: 3 },
  { beat: 24, action: { type: 'climax' } },
  { beat: 25, action: { type: 'spectator_drone', duration: 8 } },
  { beat: 32, action: { type: 'hide_band_name' } },
]
