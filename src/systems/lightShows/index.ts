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
import { cruiseFinaleShow } from './cruiseFinale'
import { fireboatWaterCannonShow } from './fireboatWaterCannon'
import { icebreakerAuroraShow } from './icebreakerAurora'

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
 * Factory presets authored natively in V2 (rig-group targeting, easing). They
 * supersede that ship's V1 list in `lightShowRegistryV2`; the V1 list stays in
 * `lightShowRegistry` as the classic show.
 */
export const authoredShowsV2: Partial<Record<ShipType, LightShowV2>> = {
  cruise: cruiseFinaleShow,
  fireboat: fireboatWaterCannonShow,
  icebreaker: icebreakerAuroraShow,
}

/**
 * V2 show documents: the native V2 presets above, and for every other ship the
 * authored V1 list migrated once at module load.
 */
export const lightShowRegistryV2 = Object.fromEntries(
  (Object.keys(lightShowRegistry) as ShipType[]).map((shipType) => [
    shipType,
    authoredShowsV2[shipType] ?? migrateShowV1toV2(shipType, lightShowRegistry[shipType], PRESET_LOOP_BEATS),
  ]),
) as Record<ShipType, LightShowV2>

export function getLightShowV2(shipType: ShipType): LightShowV2 | undefined {
  return lightShowRegistryV2[shipType]
}

export { lngLightShow } from './lng'
export { tankerLightShow } from './tanker'
export { icebreakerLightShow } from './icebreaker'
