/**
 * physicsSystem — helper utilities for crane cable + container physics.
 * The actual simulation uses @react-three/rapier in the scene.
 * This module exports configuration constants used by the Rapier bodies.
 */

export const PHYSICS_CONFIG = {
  /** Gravity vector (m/s²) */
  gravity: [0, -9.81, 0] as [number, number, number],

  /** Crane hook rigid body properties */
  hookMass: 1200, // kg
  hookLinearDamping: 0.5,
  hookAngularDamping: 0.8,

  /** Container rigid body properties */
  containerMass: 24000, // kg (empty 20ft container)
  containerLinearDamping: 0.3,
  containerAngularDamping: 0.6,

  /** Wind impulse scale factor */
  windImpulseScale: 0.0008,

  /** Rope segment count (more = more realistic but slower) */
  ropeSegments: 8,
  ropeSegmentLength: 0.5,
  ropeSegmentMass: 5,
}

/**
 * Calculate the wind impulse vector for a given wind strength and direction.
 * @param windStrength - Wind speed in m/s
 * @param time - Current simulation time (for gusts)
 */
export function getWindImpulse(
  windStrength: number,
  time: number
): [number, number, number] {
  // Simulate gusty wind with sinusoidal variation
  const gust = 1 + 0.3 * Math.sin(time * 0.7) + 0.15 * Math.sin(time * 1.9)
  const effective = windStrength * gust * PHYSICS_CONFIG.windImpulseScale

  return [
    effective * Math.cos(time * 0.2), // Varying X direction
    0,
    effective * Math.sin(time * 0.15), // Varying Z direction
  ]
}
