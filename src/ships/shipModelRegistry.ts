// =============================================================================
// SHIP MODEL REGISTRY — URL map + blueprint attachment ids per GLB-capable type
//
// Source of truth is the blueprint's optional `model` block (ShipModelConfig).
// SHIP_MODEL_FILENAMES remains a convention fallback for blueprints that have
// not declared one, so adding a hero model stays a JSON-only change.
// =============================================================================

import { getBlueprint, getShipModelConfig, SHIP_BLUEPRINTS } from '../types/ShipBlueprint'
import type { ShipType } from '../store/gameStoreTypes'
import {
  PRIORITY_GLB_SHIP_TYPES,
  type PriorityGlbShipType,
  type ShipGlbContract,
  type ShipModelSettings,
} from './shipModelContract'

const MODEL_BASE = './models'

/** Filename convention: snake_case matching legacy TODO list + stretch fleet */
export const SHIP_MODEL_FILENAMES: Record<string, string> = {
  cruise: 'cruise_liner.glb',
  container: 'container_vessel.glb',
  tanker: 'oil_tanker.glb',
  fireboat: 'fireboat.glb',
  lng: 'lng_carrier.glb',
}

/**
 * Fully-resolved model settings for a ship type, or null when it has no GLB.
 * Blueprint `model` wins; otherwise the filename convention covers known hulls.
 * An invalid blueprint config resolves to null, i.e. procedural.
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

  const filename = SHIP_MODEL_FILENAMES[shipType]
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

/** True for the original hero trio (convention fallback filenames). */
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

/**
 * All ship types with a resolvable GLB (blueprint `model` or filename convention).
 * Loading screen preloads every contract so stretch hulls (fireboat, LNG) warm too.
 */
export function listGlbCapableShipTypes(): ShipType[] {
  const ids = new Set<ShipType>()
  for (const bp of SHIP_BLUEPRINTS) {
    const id = bp.id as ShipType
    if (getShipModelSettings(id)) ids.add(id)
  }
  for (const id of Object.keys(SHIP_MODEL_FILENAMES) as ShipType[]) {
    if (getShipModelSettings(id)) ids.add(id)
  }
  // Stable order: priority heroes first, then the rest alphabetically.
  const priority = PRIORITY_GLB_SHIP_TYPES.filter((t) => ids.has(t))
  const rest = [...ids].filter((t) => !priority.includes(t as PriorityGlbShipType)).sort()
  return [...priority, ...rest]
}

export function listGlbContracts(): ShipGlbContract[] {
  return listGlbCapableShipTypes().map((shipType) => getShipGlbContract(shipType))
}
