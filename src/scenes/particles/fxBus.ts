// =============================================================================
// FX BUS — public API for GPU light-show emitters
//
// A fixed table (no per-burst allocation). The particle layer copies it into
// a storage buffer once per frame. Kinds stay numeric so mist and glitter
// can be added without a new layout.
// =============================================================================

import { EMITTER_STRIDE, MAX_EMITTERS, MAX_LASERS } from '../../rendering/particles/particleBudget'
import type { RigGroupId } from '../../systems/lightShows/types'
import { rigGroupForAttachmentPoint } from '../../systems/lightShows/rigGroups'

export { EMITTER_STRIDE, MAX_EMITTERS, MAX_LASERS }

export const EMITTER_KIND = {
  firework: 0,
  laser: 1,
} as const

export const BURST_SLOTS = 8
const BURST_STRIDE = 8
const BURST_LIFE = 2

export interface EmitterPoint {
  partName: string
  position: readonly [number, number, number]
  rotation: readonly [number, number, number]
}

const emitterTable = new Float32Array(MAX_EMITTERS * EMITTER_STRIDE)
const burstTable = new Float32Array(BURST_SLOTS * BURST_STRIDE)
const colorScratch = new Float32Array(3)

let fireworkCount = 0
let laserCount = 0
let burstCursor = 0

export function emitterStorage(): Float32Array {
  return emitterTable
}

export function burstStorage(): Float32Array {
  return burstTable
}

export function fireworkSlotCount(): number {
  return fireworkCount
}

export function laserSlotCount(): number {
  return laserCount
}

export function resetFxBus(): void {
  emitterTable.fill(0)
  burstTable.fill(0)
  fireworkCount = 0
  laserCount = 0
  burstCursor = 0
}

export function emitterKindForPoint(partName: string, group: RigGroupId): number {
  if (group === 'mast' || group === 'gantry') return EMITTER_KIND.laser
  if (includesAsciiIgnoreCase(partName, 'searchlight')) return EMITTER_KIND.laser
  return EMITTER_KIND.firework
}

/** One-shot firework at a world position. Overwrites the oldest burst slot. */
export function spawnBurst(position: readonly [number, number, number], color: string): void {
  const slot = burstCursor % BURST_SLOTS
  burstCursor = (burstCursor + 1) % BURST_SLOTS
  const o = slot * BURST_STRIDE
  burstTable[o] = position[0]
  burstTable[o + 1] = position[1]
  burstTable[o + 2] = position[2]
  writeHexRgb(color, burstTable, o + 3)
  burstTable[o + 6] = BURST_LIFE
  burstTable[o + 7] = 1
}

export function tickBursts(dt: number): void {
  const step = dt > 0 ? dt : 0
  for (let i = 0; i < BURST_SLOTS; i++) {
    const o = i * BURST_STRIDE
    if (burstTable[o + 7] < 0.5) continue
    burstTable[o + 6] -= step
    if (burstTable[o + 6] <= 0) burstTable[o + 7] = 0
  }
}

/**
 * Rebuild the emitter table from attachment points plus any live bursts.
 * Fireworks are packed first so the compute kernel can modulo that count.
 */
export function syncShowEmitters(
  originX: number,
  originY: number,
  originZ: number,
  points: readonly EmitterPoint[],
  target: RigGroupId | 'all',
  color: string,
  intensity: number,
): void {
  emitterTable.fill(0)
  writeHexRgb(color, colorScratch, 0)
  const gain = intensity > 0 ? intensity : 0
  let slot = 0

  for (let i = 0; i < points.length && slot < MAX_EMITTERS; i++) {
    const point = points[i]
    const group = rigGroupForAttachmentPoint(point.partName)
    if (target !== 'all' && group !== target) continue
    if (emitterKindForPoint(point.partName, group) !== EMITTER_KIND.firework) continue
    writePoint(slot, originX, originY, originZ, point, EMITTER_KIND.firework, gain)
    slot++
  }

  for (let i = 0; i < BURST_SLOTS && slot < MAX_EMITTERS; i++) {
    const o = i * BURST_STRIDE
    if (burstTable[o + 7] < 0.5) continue
    writeBurst(slot, o)
    slot++
  }

  fireworkCount = slot
  let lasers = 0
  for (let i = 0; i < points.length && slot < MAX_EMITTERS && lasers < MAX_LASERS; i++) {
    const point = points[i]
    const group = rigGroupForAttachmentPoint(point.partName)
    if (target !== 'all' && group !== target) continue
    if (emitterKindForPoint(point.partName, group) !== EMITTER_KIND.laser) continue
    writePoint(slot, originX, originY, originZ, point, EMITTER_KIND.laser, gain)
    slot++
    lasers++
  }
  laserCount = lasers
}

function writePoint(
  slot: number,
  originX: number,
  originY: number,
  originZ: number,
  point: EmitterPoint,
  kind: number,
  intensity: number,
): void {
  const o = slot * EMITTER_STRIDE
  emitterTable[o] = originX + point.position[0]
  emitterTable[o + 1] = originY + point.position[1]
  emitterTable[o + 2] = originZ + point.position[2]
  emitterTable[o + 3] = 1
  writeEulerUp(point.rotation[0], point.rotation[1], point.rotation[2], emitterTable, o + 4)
  emitterTable[o + 7] = kind
  emitterTable[o + 8] = colorScratch[0]
  emitterTable[o + 9] = colorScratch[1]
  emitterTable[o + 10] = colorScratch[2]
  emitterTable[o + 11] = intensity
}

function writeBurst(slot: number, burstOffset: number): void {
  const o = slot * EMITTER_STRIDE
  emitterTable[o] = burstTable[burstOffset]
  emitterTable[o + 1] = burstTable[burstOffset + 1]
  emitterTable[o + 2] = burstTable[burstOffset + 2]
  emitterTable[o + 3] = 1
  emitterTable[o + 4] = 0
  emitterTable[o + 5] = 1
  emitterTable[o + 6] = 0
  emitterTable[o + 7] = EMITTER_KIND.firework
  emitterTable[o + 8] = burstTable[burstOffset + 3]
  emitterTable[o + 9] = burstTable[burstOffset + 4]
  emitterTable[o + 10] = burstTable[burstOffset + 5]
  emitterTable[o + 11] = 1
}

/** Rotate +Y by an XYZ Euler. Identity stays (0, 1, 0). */
function writeEulerUp(rx: number, ry: number, rz: number, out: Float32Array, offset: number): void {
  const cx = Math.cos(rx)
  const sx = Math.sin(rx)
  const cy = Math.cos(ry)
  const sy = Math.sin(ry)
  const cz = Math.cos(rz)
  const sz = Math.sin(rz)
  const y1 = cx
  const z1 = sx
  const x2 = sy * z1
  const y2 = y1
  const z2 = cy * z1
  out[offset] = cz * x2 - sz * y2
  out[offset + 1] = sz * x2 + cz * y2
  out[offset + 2] = z2
}

function writeHexRgb(hex: string, out: Float32Array, offset: number): void {
  const start = hex.charCodeAt(0) === 35 ? 1 : 0
  out[offset] = byteAt(hex, start) / 255
  out[offset + 1] = byteAt(hex, start + 2) / 255
  out[offset + 2] = byteAt(hex, start + 4) / 255
}

function byteAt(hex: string, index: number): number {
  return nibble(hex.charCodeAt(index)) * 16 + nibble(hex.charCodeAt(index + 1))
}

function nibble(code: number): number {
  if (code >= 48 && code <= 57) return code - 48
  if (code >= 65 && code <= 70) return code - 55
  if (code >= 97 && code <= 102) return code - 87
  return 0
}

function includesAsciiIgnoreCase(hay: string, needle: string): boolean {
  const n = needle.length
  const h = hay.length
  if (n === 0 || h < n) return false
  for (let i = 0; i <= h - n; i++) {
    let ok = true
    for (let j = 0; j < n; j++) {
      let c = hay.charCodeAt(i + j)
      if (c >= 65 && c <= 90) c += 32
      if (c !== needle.charCodeAt(j)) {
        ok = false
        break
      }
    }
    if (ok) return true
  }
  return false
}
