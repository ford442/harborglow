import { ShipType } from '../../store/useGameStore'
import { CutawayPlan } from './types'
import { oilTankerCutaway } from './oilTanker'
import { cruiseCutaway } from './cruise'

export type { CutawayCue, CutawayAction, CutawayPlan } from './types'

export const DEFAULT_CUTAWAY_PLAN: CutawayPlan = [
  { beat: 4, action: { type: 'spotlight_pulse' } },
  { beat: 12, action: { type: 'spectator_drone' } },
  { beat: 24, action: { type: 'climax' } },
  { beat: 32, action: { type: 'hide_band_name' } },
]

export const cutawayRegistry: Partial<Record<ShipType, CutawayPlan>> = {
  tanker: oilTankerCutaway,
  cruise: cruiseCutaway,
}

export function getCutawayPlan(shipType: ShipType): CutawayPlan {
  return cutawayRegistry[shipType] ?? DEFAULT_CUTAWAY_PLAN
}

export { oilTankerCutaway } from './oilTanker'
export { cruiseCutaway } from './cruise'
