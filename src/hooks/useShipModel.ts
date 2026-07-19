// =============================================================================
// useShipModel — runtime GLB availability + attachment pose lookup
// =============================================================================

import { useMemo } from 'react'
import type { ShipType } from '../store/gameStoreTypes'
import {
  getShipModelAttachmentPose,
  getShipModelCacheEntry,
  isShipModelAvailable,
} from '../ships/shipModelCache'
import { getShipModelUrl } from '../ships/shipModelRegistry'
import type { ShipModelAttachmentPose } from '../ships/shipModelContract'

export interface UseShipModelResult {
  /** Whether a GLB hull should render at LOD0 */
  useGlb: boolean
  url: string | null
  attachments: Record<string, ShipModelAttachmentPose>
  source: 'glb' | 'procedural'
}

export function useShipModel(shipType: ShipType): UseShipModelResult {
  const entry = getShipModelCacheEntry(shipType)
  const url = getShipModelUrl(shipType)

  return useMemo(() => {
    const available = isShipModelAvailable(shipType)
    return {
      useGlb: available,
      url: available ? url : null,
      attachments: entry?.attachments ?? {},
      source: available ? 'glb' : 'procedural',
    }
  }, [shipType, entry, url])
}

export function resolveAttachmentPose(
  shipType: ShipType,
  attachmentId: string,
  blueprintPosition: [number, number, number],
  blueprintRotation: [number, number, number] = [0, 0, 0],
): ShipModelAttachmentPose {
  const fromGlb = getShipModelAttachmentPose(shipType, attachmentId)
  if (fromGlb) return fromGlb
  return { position: blueprintPosition, rotation: blueprintRotation }
}
