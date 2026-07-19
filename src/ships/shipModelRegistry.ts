// =============================================================================
// SHIP MODEL REGISTRY — URL map + blueprint attachment ids per GLB-capable type
// =============================================================================

import { getBlueprint } from '../types/ShipBlueprint'
import type { ShipType } from '../store/gameStoreTypes'
import {
  PRIORITY_GLB_SHIP_TYPES,
  type PriorityGlbShipType,
  type ShipGlbContract,
} from './shipModelContract'

const MODEL_BASE = './models'

/** Filename convention: snake_case matching legacy TODO list */
export const SHIP_MODEL_FILENAMES: Record<PriorityGlbShipType, string> = {
  cruise: 'cruise_liner.glb',
  container: 'container_vessel.glb',
  tanker: 'oil_tanker.glb',
}

export function getShipModelUrl(shipType: ShipType): string | null {
  const filename = (SHIP_MODEL_FILENAMES as Partial<Record<ShipType, string>>)[shipType]
  if (!filename) return null
  return `${MODEL_BASE}/${filename}`
}

export function isGlbCapableShipType(shipType: ShipType): shipType is PriorityGlbShipType {
  return (PRIORITY_GLB_SHIP_TYPES as readonly string[]).includes(shipType)
}

export function getShipGlbContract(shipType: PriorityGlbShipType): ShipGlbContract {
  const blueprint = getBlueprint(shipType)
  return {
    shipType,
    filename: SHIP_MODEL_FILENAMES[shipType],
    attachmentNodeIds: blueprint?.attachmentPoints ?? [],
  }
}

export function listGlbContracts(): ShipGlbContract[] {
  return PRIORITY_GLB_SHIP_TYPES.map(getShipGlbContract)
}
