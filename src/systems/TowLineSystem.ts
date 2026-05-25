// =============================================================================
// TOW LINE SYSTEM — HarborGlow
// Module-level state shared between TugboatTargetShip.tsx (ship-position writer)
// and the TowLineVisual component (reader).  Uses direct object mutation inside
// useFrame — no React state, no re-renders.
// =============================================================================

import * as THREE from 'three'

// -------------------------------------------------------------------------
// TYPES
// -------------------------------------------------------------------------

/**
 * Runtime tow-line state.  Written by TugboatTargetShip, read by
 * TowLineVisual to drive the rope geometry each frame.
 */
export interface TowLineState {
  /** Whether a tow-line constraint is currently active */
  active: boolean
  /** World-space position of the towed ship's attachment point */
  shipPosition: THREE.Vector3
}

// -------------------------------------------------------------------------
// SINGLETON STATE
// -------------------------------------------------------------------------

/**
 * Singleton tow-line state.  Mutated directly inside TugboatTargetShip's
 * useFrame — zero React reconciliation overhead.
 */
export const towLineState: TowLineState = {
  active: false,
  shipPosition: new THREE.Vector3(0, 0, 0),
}

// -------------------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------------------

/** Reset tow-line state to idle (call when tugboat mode ends). */
export function resetTowLineState(): void {
  towLineState.active = false
}
