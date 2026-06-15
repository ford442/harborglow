import { ShipType } from '../../store/useGameStore'
import { LightCue } from './types'
import { lngLightShow } from './lng'
import { tankerLightShow } from './tanker'

export const SHIP_BPM: Record<ShipType, number> = {
  cruise: 120, container: 128, tanker: 140, bulk: 135, lng: 118,
  roro: 125, research: 110, droneship: 105, ferry: 115, trawler: 95, horizon: 100
}

export const lightShowRegistry: Record<ShipType, LightCue[] | undefined> = {
  lng: lngLightShow,
  tanker: tankerLightShow,
  // All other ship types intentionally undefined — they fall back to the generic curve.
  cruise: undefined,
  container: undefined,
  bulk: undefined,
  roro: undefined,
  research: undefined,
  droneship: undefined,
  ferry: undefined,
  trawler: undefined,
  horizon: undefined,
}

export * from './types'
export { lngLightShow } from './lng'
export { tankerLightShow } from './tanker'
