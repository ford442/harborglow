// =============================================================================
// SPAWN BATCHES — CPU side of the GPU spawn kernel (#248)
//
// The CPU never holds per-particle state. Each frame, bursts and stream
// accumulators become ≤ MAX_SPAWN_BATCHES batches; the spawn kernel runs one
// thread per new particle and finds its batch by prefix range. Layout per
// batch, four vec4 (BATCH_VEC4S):
//   v0 = [origin.xyz, presetIndex]
//   v1 = [dir.xyz,    cone]
//   v2 = [start,      count, speedMin, speedMax]
//   v3 = [paletteSlot, seed, jitter,   0]
// Pure TS — no three/tsl import.
// =============================================================================

import type { EmitterPreset } from './emitterPresets'
import { MAX_SPAWN_BATCHES, PALETTE_SLOTS, PARTICLE_WORKGROUP } from './particleBudget'

export const BATCH_VEC4S = 4

export class SpawnBatchPacker {
  /** MAX_SPAWN_BATCHES × BATCH_VEC4S × 4 floats, uploaded as a vec4 uniform array. */
  readonly data = new Float32Array(MAX_SPAWN_BATCHES * BATCH_VEC4S * 4)
  batches = 0
  total = 0

  constructor(readonly maxPerFrame: number) {}

  reset(): void {
    // Only `count` (v2.y) gates a batch on the GPU; zero the ones used last frame.
    for (let b = 0; b < this.batches; b++) this.data[b * 16 + 9] = 0
    this.batches = 0
    this.total = 0
  }

  /** Queue `count` particles; returns how many fit this frame (0 when full). */
  push(
    preset: EmitterPreset,
    ox: number, oy: number, oz: number,
    dx: number, dy: number, dz: number,
    count: number,
    paletteSlot: number,
    seed: number,
  ): number {
    const n = Math.min(Math.floor(count), this.maxPerFrame - this.total)
    if (n <= 0 || this.batches >= MAX_SPAWN_BATCHES) return 0
    const len = Math.hypot(dx, dy, dz) || 1
    const o = this.batches * 16
    const d = this.data
    d[o] = ox; d[o + 1] = oy; d[o + 2] = oz; d[o + 3] = preset.index
    d[o + 4] = dx / len; d[o + 5] = dy / len; d[o + 6] = dz / len; d[o + 7] = preset.cone
    d[o + 8] = this.total; d[o + 9] = n; d[o + 10] = preset.speed[0]; d[o + 11] = preset.speed[1]
    d[o + 12] = paletteSlot; d[o + 13] = seed - Math.floor(seed); d[o + 14] = preset.jitter; d[o + 15] = 0
    this.batches++
    this.total += n
    return n
  }

  /**
   * Threads to dispatch: `total` rounded up to a whole workgroup. Padding
   * threads belong to no batch and write dead particles into the next (oldest)
   * ring slots, so the kernel needs no bounds branch.
   */
  dispatchCount(): number {
    return Math.ceil(this.total / PARTICLE_WORKGROUP) * PARTICLE_WORKGROUP
  }
}

/**
 * Maps CSS colours to palette slots. Slot 0 is fixed white; 1..15 are reused
 * round-robin, so a recycled slot recolours the (short-lived) particles that
 * still reference it.
 */
export class PaletteAllocator {
  private readonly bySlot: (string | null)[] = new Array(PALETTE_SLOTS).fill(null)
  private readonly byColor = new Map<string, number>()
  private next = 1

  /** Returns the slot, calling `assign(slot, color)` when it (re)binds one. */
  slotFor(color: string | null, assign: (slot: number, color: string) => void): number {
    if (!color) return 0
    const key = color.toLowerCase()
    const hit = this.byColor.get(key)
    if (hit !== undefined) return hit
    const slot = this.next
    this.next = this.next + 1 >= PALETTE_SLOTS ? 1 : this.next + 1
    const old = this.bySlot[slot]
    if (old) this.byColor.delete(old)
    this.bySlot[slot] = key
    this.byColor.set(key, slot)
    assign(slot, key)
    return slot
  }
}
