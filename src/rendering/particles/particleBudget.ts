// =============================================================================
// PARTICLE BUDGET — drawn counts from the store quality preset
//
// Dispatch is rounded up to the compute workgroup so the kernel needs no
// bounds branch. The sprite draws `particleCountFor`, not the padding.
// =============================================================================

import type { QualityPreset } from '../../store/gameStoreTypes'

export const PARTICLE_WORKGROUP = 64

export const PARTICLE_BUDGET = {
  high: 250_000,
  medium: 80_000,
  low: 30_000,
} as const satisfies Record<QualityPreset, number>

/** Instanced laser cylinders. Not part of the particle pool. */
export const MAX_LASERS = 32

/** CPU emitter rows. Fireworks occupy the front; lasers follow them. */
export const MAX_EMITTERS = 64

/** Floats per emitter: xyz, active, dir xyz, kind, rgb, intensity. */
export const EMITTER_STRIDE = 12

export function particleCountFor(preset: QualityPreset): number {
  return PARTICLE_BUDGET[preset]
}

/** Storage length and compute dispatch size. Always a multiple of the workgroup. */
export function dispatchCountFor(drawn: number): number {
  if (drawn <= 0) return PARTICLE_WORKGROUP
  return Math.ceil(drawn / PARTICLE_WORKGROUP) * PARTICLE_WORKGROUP
}
