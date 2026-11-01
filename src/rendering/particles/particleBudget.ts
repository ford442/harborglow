// =============================================================================
// PARTICLE BUDGET — per quality tier capacity of the GPU particle ring (#248)
// Pure TS: no three/tsl import, so it can sit in the eager chunk.
// =============================================================================

import type { QualityPreset } from '../../store/gameStoreDomainTypes'

/** Compute workgroup width shared by every particle kernel. */
export const PARTICLE_WORKGROUP = 64

/** Live-particle ring capacity per tier (issue #236: 250k at high, ≤30k at low). */
export const PARTICLE_BUDGET: Record<QualityPreset, number> = {
  low: 30_000,
  medium: 100_000,
  high: 250_000,
}

/** Laser beam instances per tier. */
export const LASER_BUDGET: Record<QualityPreset, number> = {
  low: 8,
  medium: 16,
  high: 24,
}

/** Spawn batches packed per frame (one per emitter burst/stream). */
export const MAX_SPAWN_BATCHES = 32

/** Colour slots in the palette uniform; a particle stores its slot index. */
export const PALETTE_SLOTS = 16

/** Ring capacity rounded up to whole workgroups, so the update kernel needs no bounds check. */
export function particleCapacity(budget: number): number {
  return Math.max(PARTICLE_WORKGROUP, Math.ceil(budget / PARTICLE_WORKGROUP) * PARTICLE_WORKGROUP)
}

/** Most particles one frame may spawn: a twentieth of the ring, in whole workgroups. */
export function maxSpawnPerFrame(capacity: number): number {
  return Math.max(PARTICLE_WORKGROUP, Math.floor(capacity / 20 / PARTICLE_WORKGROUP) * PARTICLE_WORKGROUP)
}
