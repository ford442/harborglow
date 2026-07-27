// =============================================================================
// SHIP MODEL CACHE — availability + attachment poses from probed GLB files
// =============================================================================

import type { ShipType } from '../store/gameStoreTypes'
import type { ShipModelAttachmentPose, ShipModelCacheEntry } from './shipModelContract'

const cache = new Map<ShipType, ShipModelCacheEntry>()

export function getShipModelCacheEntry(shipType: ShipType): ShipModelCacheEntry | undefined {
  return cache.get(shipType)
}

export function isShipModelAvailable(shipType: ShipType): boolean {
  return cache.get(shipType)?.available === true
}

export function setShipModelCacheEntry(shipType: ShipType, entry: ShipModelCacheEntry): void {
  cache.set(shipType, entry)
}

export function getShipModelAttachmentPose(
  shipType: ShipType,
  attachmentId: string,
): ShipModelAttachmentPose | undefined {
  return cache.get(shipType)?.attachments[attachmentId]
}

/**
 * Mark a model as unusable after a runtime failure (bad parse, mid-session 404).
 * Keeps the cached URL so diagnostics can still report what was attempted.
 */
export function markShipModelUnavailable(shipType: ShipType): void {
  const existing = cache.get(shipType)
  cache.set(shipType, {
    available: false,
    url: existing?.url ?? '',
    attachments: existing?.attachments ?? {},
  })
}

export function clearShipModelCache(): void {
  cache.clear()
}

export function getCachedShipModelTypes(): ShipType[] {
  return [...cache.entries()].filter(([, e]) => e.available).map(([t]) => t)
}
