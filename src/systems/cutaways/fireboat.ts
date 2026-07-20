import { CutawayPlan } from './types'

// 152 BPM Emergency Pulse — rapid siren cuts, waterline hero shots, early climax
export const fireboatCutaway: CutawayPlan = [
  { beat: 2, action: { type: 'spotlight_pulse' } },
  { beat: 4, action: { type: 'camera_mode', mode: 'ship-low' }, holdFor: 4 },
  { beat: 8, action: { type: 'camera_mode', mode: 'ship-water' }, holdFor: 4 },
  { beat: 12, action: { type: 'camera_mode', mode: 'ship-rig' }, holdFor: 4 },
  { beat: 16, action: { type: 'climax' } },
  { beat: 20, action: { type: 'camera_mode', mode: 'ship-aerial' }, holdFor: 4 },
  { beat: 24, action: { type: 'spectator_drone', duration: 8 } },
  { beat: 32, action: { type: 'hide_band_name' } },
]
