// =============================================================================
// PHYSICS MATH — Pure helpers for attachment magnetic guidance & sway settling
// =============================================================================

/** Proximity falloff: 1 at center → 0 at/beyond radius. */
export function calcMagneticFalloff(distance: number, radius: number, curve = 2.0): number {
  if (radius <= 0 || distance >= radius) return 0
  return Math.pow(1 - distance / radius, curve)
}

/**
 * Ease settling damping from peak (snappier) back to base (normal).
 * Returns `peak` at t=0 and `base` at/after duration.
 */
export function calcSettlingDamping(
  elapsed: number,
  duration: number,
  base: number,
  peak: number,
): number {
  if (duration <= 0 || elapsed >= duration) return base
  const t = Math.max(0, Math.min(1, elapsed / duration))
  return peak + (base - peak) * Math.pow(t, 3)
}

export interface SpringStepResult {
  velocity: number
  acceleration: number
}

/** Critically-damped spring step (frequency + damping-ratio form). */
export function springStep(
  offset: number,
  velocity: number,
  stiffnessHz: number,
  dampingRatio: number,
  dt: number,
): SpringStepResult {
  const k = stiffnessHz * 2 * Math.PI
  const c = 2 * dampingRatio * k
  const acceleration = offset * k * k - velocity * c
  return {
    velocity: velocity + acceleration * dt,
    acceleration,
  }
}
