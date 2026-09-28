import { ShipType } from '../../store/useGameStore'
import { LightCue, LightShowV2 } from './types'
import { migrateShowV1toV2 } from './migrate'
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
import { fireboatLightShow } from './fireboat'
import { icebreakerLightShow } from './icebreaker'

export type {
  LightCue,
  LightCueV1,
  LightCueV2,
  LightCueEasing,
  LightCuePattern,
  LightPattern,
  LightShowV2,
  RigGroupId,
} from './types'

/** Every factory preset loops on this many beats (the 32-beat upgrade cinematic). */
export const PRESET_LOOP_BEATS = 32

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
  fireboat: 152,
  icebreaker: 108,
}

export const lightShowRegistry: Record<ShipType, LightCue[]> = {
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
  fireboat: fireboatLightShow,
  icebreaker: icebreakerLightShow,
}

export function getLightShow(shipType: ShipType): LightCue[] | undefined {
  return lightShowRegistry[shipType]
}

/**
 * V2 show documents, migrated once at module load from the authored V1 presets
 * above (which stay the source of truth for factory presets).
 */
export const lightShowRegistryV2 = Object.fromEntries(
  (Object.keys(lightShowRegistry) as ShipType[]).map((shipType) => [
    shipType,
    migrateShowV1toV2(shipType, lightShowRegistry[shipType], PRESET_LOOP_BEATS),
  ]),
) as Record<ShipType, LightShowV2>

export function getLightShowV2(shipType: ShipType): LightShowV2 | undefined {
  return lightShowRegistryV2[shipType]
}

export { lngLightShow } from './lng'
export { tankerLightShow } from './tanker'
export { icebreakerLightShow } from './icebreaker'
