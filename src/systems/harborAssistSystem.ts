// =============================================================================
// HARBOR ASSIST SYSTEM — HarborGlow
// Registry of fleet-ship dynamic rigid bodies that can be pushed / towed by
// the tugboat.  Ships register themselves on entering tugboat mode and
// unregister when leaving it.  The registry is read by Tugboat.tsx when the
// player presses 'T' to attach a tow line to the nearest fleet vessel.
//
// Zero React state / zero allocations on the hot path — all mutations happen
// directly on the map using module-level references.
// =============================================================================

import type { RapierRigidBody } from '@react-three/rapier'

// -------------------------------------------------------------------------
// TYPES
// -------------------------------------------------------------------------

export interface AssistShipEntry {
  id: string
  rb: RapierRigidBody
}

// -------------------------------------------------------------------------
// SINGLETON REGISTRY
// -------------------------------------------------------------------------

const _registry = new Map<string, RapierRigidBody>()

/**
 * Register a fleet ship's dynamic rigid body so the tugboat can interact
 * with it.  Called by Ship.tsx when entering tugboat mode.
 */
export function registerAssistShip(id: string, rb: RapierRigidBody): void {
  _registry.set(id, rb)
}

/**
 * Remove a fleet ship from the registry.  Called by Ship.tsx when leaving
 * tugboat mode or unmounting.
 */
export function unregisterAssistShip(id: string): void {
  _registry.delete(id)
}

/**
 * Return the nearest registered fleet ship within `maxDist` metres of
 * (tugX, tugZ), or null if none is close enough.
 */
export function getNearestAssistShip(
  tugX: number,
  tugZ: number,
  maxDist = 30,
): AssistShipEntry | null {
  let nearest: AssistShipEntry | null = null
  let nearestDist = maxDist

  for (const [id, rb] of _registry) {
    const pos = rb.translation()
    const d = Math.sqrt((pos.x - tugX) ** 2 + (pos.z - tugZ) ** 2)
    if (d < nearestDist) {
      nearestDist = d
      nearest = { id, rb }
    }
  }

  return nearest
}

/**
 * Return all currently registered ship IDs (for debugging / HUD).
 */
export function getAssistShipIds(): string[] {
  return Array.from(_registry.keys())
}
