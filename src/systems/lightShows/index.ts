import { ShipType } from '../../store/useGameStore'
import { LightCue } from './types'
import { lngLightShow } from './lng'
import { tankerLightShow } from './tanker'
import { cruiseLightShow } from './cruise'
import { containerLightShow } from './container'
import { bulkLightShow } from './bulk'
import { roroLightShow } from './roro'
import { researchLightShow } from './research'
import { droneshipLightShow } from './droneship'
import { ferryLightShow } from './ferry'
import { trawlerLightShow } from './trawler'
import { horizonLightShow } from './horizon'

export type { LightCue, LightCuePattern, LightPattern } from './types'

export const SHIP_BPM: Record<ShipType, number> = {
  cruise: 120,
  container: 128,
  tanker: 140,
  bulk: 135,
  lng: 118,
  roro: 125,
  research: 110,
  droneship: 105,
  ferry: 115,
  trawler: 95,
  horizon: 100,
}

export const lightShowRegistry: Record<ShipType, LightCue[] | undefined> = {
  lng: lngLightShow,
  tanker: tankerLightShow,
  cruise: cruiseLightShow,
  container: containerLightShow,
  bulk: bulkLightShow,
  roro: roroLightShow,
  research: researchLightShow,
  droneship: droneshipLightShow,
  ferry: ferryLightShow,
  trawler: trawlerLightShow,
  horizon: horizonLightShow,
}

export function getLightShow(shipType: ShipType): LightCue[] | undefined {
  return lightShowRegistry[shipType]
}

export { lngLightShow } from './lng'
export { tankerLightShow } from './tanker'
