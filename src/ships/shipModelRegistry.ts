// =============================================================================
// SHIP MODEL REGISTRY — URL map + blueprint attachment ids per GLB-capable type
//
// Source of truth is the blueprint's optional `model` block (ShipModelConfig).
// SHIP_MODEL_FILENAMES remains a convention fallback for blueprints that have
// not declared one, so adding a hero model stays a JSON-only change.
// =============================================================================

import { getBlueprint, getShipModelConfig } from '../types/ShipBlueprint'
import type { ShipType } from '../store/gameStoreTypes'
import {
  PRIORITY_GLB_SHIP_TYPES,
  type PriorityGlbShipType,
  type ShipGlbContract,
  type ShipModelSettings,
} from './shipModelContract'

const MODEL_BASE = './models'

/** Filename convention: snake_case matching legacy TODO list */
export const SHIP_MODEL_FILENAMES: Record<PriorityGlbShipType, string> = {
  cruise: 'cruise_liner.glb',
  container: 'container_vessel.glb',
  tanker: 'oil_tanker.glb',
}

/**
 * Fully-resolved model settings for a ship type, or null when it has no GLB.
 * Blueprint `model` wins; otherwise the filename convention covers the priority
 * trio. An invalid blueprint config resolves to null, i.e. procedural.
 */
export function getShipModelSettings(shipType: ShipType): ShipModelSettings | null {
  const config = getShipModelConfig(shipType)
  if (config) {
    return {
      url: config.url,
      scale: config.scale ?? 1,
      yOffset: config.yOffset ?? 0,
      attachmentSocketMap: config.attachmentSocketMap ?? {},
    }
  }

  const filename = (SHIP_MODEL_FILENAMES as Partial<Record<ShipType, string>>)[shipType]
  if (!filename) return null
  return {
    url: `${MODEL_BASE}/${filename}`,
    scale: 1,
    yOffset: 0,
    attachmentSocketMap: {},
  }
}

export function getShipModelUrl(shipType: ShipType): string | null {
  return getShipModelSettings(shipType)?.url ?? null
}

/** A type is GLB-capable when a model URL resolves for it — blueprint or convention. */
export function isGlbCapableShipType(shipType: ShipType): boolean {
  return getShipModelSettings(shipType) !== null
}

/** True only for the hero trio that is preloaded during the loading screen. */
export function isPriorityGlbShipType(shipType: ShipType): shipType is PriorityGlbShipType {
  return (PRIORITY_GLB_SHIP_TYPES as readonly string[]).includes(shipType)
}

export function getShipGlbContract(shipType: ShipType): ShipGlbContract {
  const blueprint = getBlueprint(shipType)
  const settings = getShipModelSettings(shipType)
  return {
    shipType,
    filename: settings ? (settings.url.split('/').pop() ?? '') : '',
    attachmentNodeIds: blueprint?.attachmentPoints ?? [],
    attachmentSocketMap: settings?.attachmentSocketMap ?? {},
  }
}

export function listGlbContracts(): ShipGlbContract[] {
  return PRIORITY_GLB_SHIP_TYPES.map((shipType) => getShipGlbContract(shipType))
}
