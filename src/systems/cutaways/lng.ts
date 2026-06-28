import { CutawayPlan } from './types'

// 118 BPM Ambient / Cryogenic Techno — slow, icy sweeps; the camera breathes with the frost-blue pads.
export const lngCutaway: CutawayPlan = [
  { beat: 4, action: { type: 'spotlight_pulse' } },
  { beat: 6, action: { type: 'camera_mode', mode: 'ship-aerial' }, holdFor: 8 },
  { beat: 14, action: { type: 'camera_mode', mode: 'ship-water' }, holdFor: 6 },
  { beat: 20, action: { type: 'camera_mode', mode: 'ship-rig' }, holdFor: 4 },
  { beat: 24, action: { type: 'climax' } },
  { beat: 28, action: { type: 'spectator_drone', duration: 10 } },
  { beat: 32, action: { type: 'hide_band_name' } },
]
