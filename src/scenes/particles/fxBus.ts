// =============================================================================
// FX BUS — imperative particle API for gameplay, light shows and slices 3/7
//
// Callers never touch the GPU: they queue one-shot bursts (`triggerEmitter`)
// or register streams (`setContinuousEmitter`). GpuParticleLayer drains the
// queue once per frame. The queue is a fixed ring that drops the oldest
// request when full and does not allocate. While no particle engine is running
// (compute gate off, `?particles=0`, not mounted yet) bursts are dropped.
// =============================================================================

import type { EmitterPresetId } from '../../rendering/particles/emitterPresets'

export type FxVec3 = readonly [number, number, number]

export interface FxAt {
  /** `emitterAnchorKey(shipId, partName)`; wins over `position` when registered. */
  anchorKey?: string
  /** World-space fallback (or primary, without an anchor). */
  position?: FxVec3
}

export interface FxOpts {
  /** CSS colour; defaults to white. */
  color?: string
  /** Particle count; defaults to the preset's burstCount. */
  count?: number
  /** Emit direction (world); defaults to the anchor's up, else +Y. */
  direction?: FxVec3
  /** 0..1 seed; defaults to a per-request serial hash. */
  seed?: number
}

export interface FxRequest {
  preset: EmitterPresetId
  anchorKey: string | null
  hasPosition: boolean
  px: number
  py: number
  pz: number
  hasDirection: boolean
  dx: number
  dy: number
  dz: number
  color: string | null
  count: number
  seed: number
}

export interface ContinuousEmitterSpec {
  preset: EmitterPresetId
  anchorKey?: string
  position?: FxVec3
  direction?: FxVec3
  /** Particles/s; defaults to the preset's ratePerS. Scaled by `gain`. */
  ratePerS?: number
  /** 0..1 multiplier the owner can modulate each frame (e.g. cue intensity). */
  gain?: number
  color?: string
}

export const FX_QUEUE_SIZE = 64

const queue: FxRequest[] = Array.from({ length: FX_QUEUE_SIZE }, () => ({
  preset: 'spark' as EmitterPresetId,
  anchorKey: null,
  hasPosition: false,
  px: 0, py: 0, pz: 0,
  hasDirection: false,
  dx: 0, dy: 1, dz: 0,
  color: null,
  count: -1,
  seed: 0,
}))
let head = 0
let size = 0
let serial = 0
let enabled = false

const continuous = new Map<string, ContinuousEmitterSpec>()

/** Set by the particle layer once its engine is initialised (and cleared on unmount). */
export function setFxBusEnabled(on: boolean): void {
  enabled = on
  if (!on) {
    head = 0
    size = 0
  }
}

export function isFxBusEnabled(): boolean {
  return enabled
}

/** Queue a one-shot burst. No-op while no particle engine is running. */
export function triggerEmitter(preset: EmitterPresetId, at: FxAt, opts?: FxOpts): void {
  if (!enabled) return
  const slot = (head + size) % FX_QUEUE_SIZE
  if (size === FX_QUEUE_SIZE) head = (head + 1) % FX_QUEUE_SIZE
  else size++
  const r = queue[slot]
  serial = (serial + 1) >>> 0
  r.preset = preset
  r.anchorKey = at.anchorKey ?? null
  r.hasPosition = at.position !== undefined
  if (at.position) {
    r.px = at.position[0]
    r.py = at.position[1]
    r.pz = at.position[2]
  }
  r.hasDirection = opts?.direction !== undefined
  if (opts?.direction) {
    r.dx = opts.direction[0]
    r.dy = opts.direction[1]
    r.dz = opts.direction[2]
  }
  r.color = opts?.color ?? null
  r.count = opts?.count ?? -1
  r.seed = opts?.seed ?? ((Math.imul(serial, 2654435761) >>> 0) / 4294967296)
}

/** Visit and clear queued bursts, oldest first. The request objects are reused — don't keep them. */
export function drainFxRequests(visit: (r: FxRequest) => void): void {
  while (size > 0) {
    const r = queue[head]
    head = (head + 1) % FX_QUEUE_SIZE
    size--
    visit(r)
  }
}

export function pendingFxRequests(): number {
  return size
}

/** Register (or with `null`, remove) a named particle stream. */
export function setContinuousEmitter(key: string, spec: ContinuousEmitterSpec | null): void {
  if (spec) continuous.set(key, spec)
  else continuous.delete(key)
}

export function forEachContinuousEmitter(visit: (key: string, spec: ContinuousEmitterSpec) => void): void {
  continuous.forEach((spec, key) => visit(key, spec))
}

/** Test helper: drop queue, streams and the enabled flag. */
export function resetFxBus(): void {
  setFxBusEnabled(false)
  continuous.clear()
  serial = 0
}
