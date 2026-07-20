import { ShipType } from '../../store/useGameStore'
import { CutawayPlan } from './types'
import { oilTankerCutaway } from './oilTanker'
import { cruiseCutaway } from './cruise'
import { containerCutaway } from './container'
import { bulkCutaway } from './bulk'
import { lngCutaway } from './lng'
import { roroCutaway } from './roro'
import { researchCutaway } from './research'
import { droneshipCutaway } from './droneship'
import { ferryCutaway } from './ferry'
import { trawlerCutaway } from './trawler'
import { horizonCutaway } from './horizon'
import { fireboatCutaway } from './fireboat'

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
  container: containerCutaway,
  bulk: bulkCutaway,
  lng: lngCutaway,
  roro: roroCutaway,
  research: researchCutaway,
  droneship: droneshipCutaway,
  ferry: ferryCutaway,
  trawler: trawlerCutaway,
  horizon: horizonCutaway,
  fireboat: fireboatCutaway,
}

export function getCutawayPlan(shipType: ShipType): CutawayPlan {
  return cutawayRegistry[shipType] ?? DEFAULT_CUTAWAY_PLAN
}

export { oilTankerCutaway } from './oilTanker'
export { cruiseCutaway } from './cruise'
export { containerCutaway } from './container'
export { bulkCutaway } from './bulk'
export { lngCutaway } from './lng'
export { roroCutaway } from './roro'
export { researchCutaway } from './research'
export { droneshipCutaway } from './droneship'
export { ferryCutaway } from './ferry'
export { trawlerCutaway } from './trawler'
export { horizonCutaway } from './horizon'
export { fireboatCutaway } from './fireboat'
