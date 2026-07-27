// =============================================================================
// useShipModel — runtime GLB availability + attachment pose lookup
// =============================================================================

import { useMemo } from 'react'
import { useGameStore } from '../store/useGameStore'
import type { ShipType } from '../store/gameStoreTypes'
import {
  getShipModelAttachmentPose,
  getShipModelCacheEntry,
  isShipModelAvailable,
} from '../ships/shipModelCache'
import { getShipModelSettings } from '../ships/shipModelRegistry'
import type { ShipModelAttachmentPose } from '../ships/shipModelContract'
import { isGlbAllowedForQuality } from '../ships/shipModelContract'

export { GLB_ENABLED_QUALITY_PRESETS, isGlbAllowedForQuality } from '../ships/shipModelContract'

export interface UseShipModelResult {
  /** Whether a GLB hull should render at LOD0 */
  useGlb: boolean
  url: string | null
  /** Extra scale from ShipModelConfig, on top of blueprint.scale */
  scale: number
  /** Vertical nudge in metres from ShipModelConfig */
  yOffset: number
  attachments: Record<string, ShipModelAttachmentPose>
  source: 'glb' | 'procedural'
  /** Why the GLB is not used (null when it is) — handy for debug overlays. */
  fallbackReason: 'none' | 'quality-preset' | 'not-loaded' | null
}

export function useShipModel(shipType: ShipType): UseShipModelResult {
  const entry = getShipModelCacheEntry(shipType)
  const settings = getShipModelSettings(shipType)
  const qualityPreset = useGameStore((state) => state.qualityPreset)

  return useMemo(() => {
    const qualityAllows = isGlbAllowedForQuality(qualityPreset)
    const loaded = isShipModelAvailable(shipType)
    const available = qualityAllows && loaded && settings !== null

    let fallbackReason: UseShipModelResult['fallbackReason'] = null
    if (!available) {
      if (!qualityAllows) fallbackReason = 'quality-preset'
      else if (!loaded || !settings) fallbackReason = 'not-loaded'
      else fallbackReason = 'none'
    }

    return {
      useGlb: available,
      url: available ? settings!.url : null,
      scale: settings?.scale ?? 1,
      yOffset: settings?.yOffset ?? 0,
      attachments: entry?.attachments ?? {},
      source: available ? 'glb' : 'procedural',
      fallbackReason,
    }
  }, [shipType, entry, settings, qualityPreset])
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
