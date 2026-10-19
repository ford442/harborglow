// =============================================================================
// AUTHORED SHOWS — the player's forked presets, keyed by ship type.
// The lighting system reads this module. The store is the thing that
// persists it. Neither path writes sim time.
// =============================================================================

import { isShipType, type ShipType } from '../../store/gameStoreDomainTypes'
import type { LightShowV2 } from './types'

let shows: Partial<Record<ShipType, LightShowV2>> = {}

export function getAuthoredShow(shipType: ShipType): LightShowV2 | undefined {
  return shows[shipType]
}

export function replaceAuthoredShows(next: Partial<Record<ShipType, LightShowV2>>): void {
  shows = next
}

export function acceptAuthoredShows(
  raw: unknown,
  parse: (input: unknown) => { ok: true; show: LightShowV2 } | { ok: false },
): Partial<Record<ShipType, LightShowV2>> {
  if (!raw || typeof raw !== 'object') return {}
  const next: Partial<Record<ShipType, LightShowV2>> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isShipType(key)) continue
    const parsed = parse(value)
    if (!parsed.ok || parsed.show.id !== key) continue
    next[key] = parsed.show
  }
  return next
}
