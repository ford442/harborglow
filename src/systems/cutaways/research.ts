import { CutawayPlan } from './types'

// 110 BPM Ambient / Scientific — observational, sonar-calm holds over water and aerial survey.
export const researchCutaway: CutawayPlan = [
  { beat: 4, action: { type: 'spotlight_pulse' } },
  { beat: 6, action: { type: 'camera_mode', mode: 'ship-aerial' }, holdFor: 8 },
  { beat: 14, action: { type: 'camera_mode', mode: 'ship-water' }, holdFor: 7 },
  { beat: 21, action: { type: 'camera_mode', mode: 'ship-rig' }, holdFor: 3 },
  { beat: 24, action: { type: 'climax' } },
  { beat: 28, action: { type: 'spectator_drone', duration: 10 } },
  { beat: 32, action: { type: 'hide_band_name' } },
]
