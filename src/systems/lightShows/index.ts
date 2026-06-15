import { ShipType } from '../../store/useGameStore'
import type { LightCue } from './types'
import { lngLightShow } from './lngShow'
import { tankerLightShow } from './tankerShow'

export type { LightCue, LightPattern } from './types'

/**
 * Per-band light-cue schedules. Ships with no entry here fall back to
 * lightingSystem's generic shared beat-intensity curve.
 */
const lightShows: Partial<Record<ShipType, LightCue[]>> = {
  lng: lngLightShow,
  tanker: tankerLightShow,
}

export function getLightShow(shipType: ShipType): LightCue[] | undefined {
  return lightShows[shipType]
}
