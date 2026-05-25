// =============================================================================
// TUGBOAT WAKE SYSTEM — HarborGlow
// Module-level state shared between Tugboat.tsx (writer) and Water.tsx (reader).
// Uses direct object mutation inside useFrame — no React state, no re-renders.
// =============================================================================

import * as THREE from 'three'

// -------------------------------------------------------------------------
// TYPES
// -------------------------------------------------------------------------

/**
 * Tugboat wake parameters consumed by the water shader each frame.
 * Written by Tugboat.tsx, read by Water.tsx via useFrame.
 */
export interface TugboatWakeState {
  /** Whether the tugboat is currently active (mounted and in tugboat mode) */
  active: boolean
  /** World-space position of the tugboat */
  position: THREE.Vector3
  /** Normalised forward direction vector of the tugboat */
  direction: THREE.Vector3
  /**
   * Combined prop-wash power scalar [0..1].
   * Derived from throttle magnitude, speed, and average absolute engine RPM.
   */
  propWashPower: number
  /**
   * Differential thrust factor [-1..1].
   * Positive = port stronger (boat turning to starboard), negative = inverse.
   * Controls subtle wake asymmetry during turns.
   */
  washAsymmetry: number
  /** Current horizontal speed in m/s */
  speed: number
}

// -------------------------------------------------------------------------
// SINGLETON STATE
// -------------------------------------------------------------------------

/**
 * Singleton wake state.  Mutated directly inside Tugboat.tsx's useFrame —
 * no React state transitions, no unnecessary reconciliation cycles.
 *
 * Usage:
 *   import { tugboatWakeState } from '../systems/TugboatWakeSystem'
 *
 *   // In Tugboat.tsx useFrame (writer):
 *   tugboatWakeState.active = true
 *   tugboatWakeState.position.set(px, py, pz)
 *   ...
 *
 *   // In Water.tsx useFrame (reader):
 *   mat.uniforms.uTugActive.value = tugboatWakeState.active
 *   mat.uniforms.uTugPos.value.copy(tugboatWakeState.position)
 *   ...
 */
export const tugboatWakeState: TugboatWakeState = {
  active: false,
  position: new THREE.Vector3(0, 0, 0),
  direction: new THREE.Vector3(0, 0, 1),
  propWashPower: 0,
  washAsymmetry: 0,
  speed: 0,
}

// -------------------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------------------

/**
 * Resets wake state to idle.
 * Call this when the tugboat unmounts or operation mode changes away from
 * 'tugboat', so the water shader short-circuits without visible artefacts.
 */
export function resetTugboatWakeState(): void {
  tugboatWakeState.active = false
  tugboatWakeState.propWashPower = 0
  tugboatWakeState.washAsymmetry = 0
  tugboatWakeState.speed = 0
}

// -------------------------------------------------------------------------
// GLSL WAKE MATH SNIPPET
// -------------------------------------------------------------------------

/**
 * GLSL snippet injected into the Water.tsx vertex shader.
 * Implements a simplified Kelvin wake (divergent + transverse waves) and a
 * turbulent stern wash trail.
 *
 * Uniforms expected by this snippet:
 *   uniform bool  uTugActive;
 *   uniform vec3  uTugPos;
 *   uniform vec3  uTugDir;
 *   uniform float uPropWashPower;
 *   uniform float uWashAsymmetry;
 *
 * Functions exposed:
 *   float getTugWakeDisp(vec2 worldPos, float t)  — vertex height offset
 *   float getTugWakeFoam(vec2 worldPos, float t)  — foam intensity [0..1]
 */
export const TUGBOAT_WAKE_GLSL = /* glsl */ `
  uniform bool  uTugActive;
  uniform vec3  uTugPos;
  uniform vec3  uTugDir;
  uniform float uPropWashPower;
  uniform float uWashAsymmetry;

  // -----------------------------------------------------------------------
  // Kelvin wake + stern wash — height displacement
  //
  // Coordinate frame:
  //   behind   > 0 ⇒ behind the stern  (wake exists here)
  //   sideways > 0 ⇒ starboard
  //
  // Kelvin half-angle: ~19.47°  →  tan ≈ 0.354
  // -----------------------------------------------------------------------
  float getTugWakeDisp(vec2 worldPos, float t) {
    if (!uTugActive || uPropWashPower < 0.01) return 0.0;

    vec2 tugPos2d = uTugPos.xz;
    vec2 tugFwd2d = normalize(uTugDir.xz);
    vec2 tugRgt2d = vec2(-tugFwd2d.y, tugFwd2d.x);  // 90° CW = starboard

    vec2  delta    = worldPos - tugPos2d;
    float behind   = -dot(delta, tugFwd2d);   // positive behind the stern
    float sideways =  dot(delta, tugRgt2d);   // positive to starboard

    if (behind < 0.0) return 0.0;            // nothing ahead of the bow

    // --- Kelvin V mask (smoothed) ---
    float kelvinEdge = behind * 0.364 + 0.5; // +0.5 m for hull width
    float insideV    = 1.0 - smoothstep(0.0, kelvinEdge, abs(sideways));

    // --- Global decay over wake length ---
    float decay = exp(-behind * 0.06);

    // --- Transverse waves (crests roughly perpendicular to heading) ---
    float tFreq     = 0.65 + uPropWashPower * 0.25;
    float transWave = sin(behind * tFreq - t * 2.4) * insideV * 0.55;

    // --- Divergent waves (angled crests running along the V arms) ---
    float divOuter = abs(sideways) * 0.55 + behind * 0.18 - t * 1.7;
    float divInner = abs(sideways) * 0.35 - behind * 0.22 - t * 2.0;
    float divWave  = (sin(divOuter) * 0.4 + sin(divInner) * 0.3) * insideV;
    // Slight asymmetry from differential engine thrust during turns
    divWave *= 1.0 + sign(sideways) * uWashAsymmetry * 0.25;

    // --- Stern turbulent wash (tight high-frequency cone) ---
    float washHalfW = 1.5 + behind * 0.20;
    float washInside = max(0.0, 1.0 - abs(sideways) / washHalfW);
    washInside = pow(washInside, 2.0);
    float washDecay = exp(-behind * 0.14);
    float sternWash = sin(behind * 3.2 - t * 8.5)
                    * cos(sideways * 1.5 + t * 3.8)
                    * washInside * washDecay * 0.9;

    return (transWave * 0.55 + divWave * 0.35 + sternWash * 0.55)
           * uPropWashPower * decay;
  }

  // -----------------------------------------------------------------------
  // Wake foam mask — passed to the fragment shader via a varying.
  // Returns [0..1] intensity: 1 = dense white foam at the stern.
  // -----------------------------------------------------------------------
  float getTugWakeFoam(vec2 worldPos, float t) {
    if (!uTugActive || uPropWashPower < 0.01) return 0.0;

    vec2 tugPos2d = uTugPos.xz;
    vec2 tugFwd2d = normalize(uTugDir.xz);
    vec2 tugRgt2d = vec2(-tugFwd2d.y, tugFwd2d.x);

    vec2  delta    = worldPos - tugPos2d;
    float behind   = -dot(delta, tugFwd2d);
    float sideways =  dot(delta, tugRgt2d);

    if (behind < 0.0) return 0.0;

    // Kelvin V mask
    float kelvinEdge = behind * 0.364 + 0.5;
    float insideV    = 1.0 - smoothstep(0.0, kelvinEdge, abs(sideways));

    // Dense stern wash foam (close to the propellers)
    float washHalfW = 1.3 + behind * 0.15;
    float sternFoam = max(0.0, 1.0 - abs(sideways) / washHalfW)
                    * exp(-behind * 0.11);
    sternFoam = pow(sternFoam, 1.5);

    // Lighter foam along the Kelvin V arms (wake crests)
    float edgeFoam = insideV * exp(-behind * 0.05) * 0.35;

    return (sternFoam * 0.85 + edgeFoam) * uPropWashPower;
  }
`
