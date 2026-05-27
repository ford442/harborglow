// =============================================================================
// TOW LINE SYSTEM — HarborGlow
// Module-level state shared between TugboatTargetShip.tsx (writer)
// and TowLineVisual (reader).  All mutations happen inside useFrame — zero
// React reconciliation overhead, zero per-frame allocation.
// =============================================================================

import * as THREE from 'three'

// -------------------------------------------------------------------------
// CABLE CONFIG (mutable — patched by Leva controls at runtime)
// -------------------------------------------------------------------------

/**
 * Mutable cable-physics parameters.  Values can be overridden at runtime via
 * the "Tow Line" Leva folder in TugboatTargetShip.tsx.
 */
export const towLineCableConfig = {
  /** Spring constant (N/m) — impulse per metre of excess length per second */
  springK: 200000,
  /** Velocity-based damping coefficient */
  damping: 5000,
  /** Maximum normalisation denominator for 0-1 tension scale (N) */
  maxTension: 1_400_000,
  /** Seconds the cable may sustain ≥ maxTension before it snaps */
  snapDelay: 0.4,
  /** Visual sag scale when slack (0 = no sag, 1 = full parabolic sag) */
  sagAmount: 1.0,
}

// -------------------------------------------------------------------------
// SEGMENT CONSTANTS
// -------------------------------------------------------------------------

/** Number of straight-line segments in the visual cable. */
export const N_SEGMENTS = 16
/** Number of vertex positions (segments + 1). */
export const N_POINTS = N_SEGMENTS + 1

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
  /** World-space position of the tugboat attachment point */
  tugPosition: THREE.Vector3
  /** Normalised tension 0–1 (0 = slack, 1 = at max tension) */
  tension: number
  /** Raw spring tension in Newtons */
  tensionRaw: number
  /** Cumulative seconds the cable has been at or above maxTension */
  overloadTimer: number
  /**
   * Set to true for ~1 second immediately after a snap event, then cleared
   * via a setTimeout.  Readers (TowLineVisual, TowCableHUD) can react to it.
   */
  snapFlag: boolean
  /**
   * Pre-allocated control points for the catenary curve (N_POINTS items).
   * Written each frame; no allocations.
   */
  segmentPoints: THREE.Vector3[]
}

// -------------------------------------------------------------------------
// SINGLETON STATE
// -------------------------------------------------------------------------

/** Pre-allocate all segment-point objects once — mutated each frame. */
const _segmentPoints: THREE.Vector3[] = Array.from(
  { length: N_POINTS },
  () => new THREE.Vector3()
)

/**
 * Singleton tow-line state.  Mutated directly inside TugboatTargetShip's
 * useFrame — zero React reconciliation overhead.
 */
export const towLineState: TowLineState = {
  active:        false,
  shipPosition:  new THREE.Vector3(0, 0, 0),
  tugPosition:   new THREE.Vector3(0, 0, 0),
  tension:       0,
  tensionRaw:    0,
  overloadTimer: 0,
  snapFlag:      false,
  segmentPoints: _segmentPoints,
}

// -------------------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------------------

/** Reset tow-line state to idle (call when tugboat mode ends). */
export function resetTowLineState(): void {
  towLineState.active        = false
  towLineState.tension       = 0
  towLineState.tensionRaw    = 0
  towLineState.overloadTimer = 0
  towLineState.snapFlag      = false
}
