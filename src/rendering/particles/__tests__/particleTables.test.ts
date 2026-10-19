import { describe, expect, it } from 'vitest'
import { EMITTER_PRESETS, PRESET_TABLE_ROWS, packPresetTable } from '../emitterPresets'
import {
  MAX_SPAWN_BATCHES,
  PALETTE_SLOTS,
  PARTICLE_BUDGET,
  PARTICLE_WORKGROUP,
  maxSpawnPerFrame,
  particleCapacity,
} from '../particleBudget'
import { PaletteAllocator, SpawnBatchPacker } from '../spawnBatches'

describe('particle budget', () => {
  it('matches the issue targets and rounds to whole workgroups', () => {
    expect(PARTICLE_BUDGET.high).toBe(250_000)
    expect(PARTICLE_BUDGET.low).toBeLessThanOrEqual(30_000)
    for (const b of Object.values(PARTICLE_BUDGET)) {
      const cap = particleCapacity(b)
      expect(cap % PARTICLE_WORKGROUP).toBe(0)
      expect(cap).toBeGreaterThanOrEqual(b)
      expect(cap - b).toBeLessThan(PARTICLE_WORKGROUP)
      expect(maxSpawnPerFrame(cap) % PARTICLE_WORKGROUP).toBe(0)
      expect(maxSpawnPerFrame(cap)).toBeLessThan(cap)
    }
  })
})

describe('emitter presets', () => {
  it('have unique indices below the table size', () => {
    const idx = Object.values(EMITTER_PRESETS).map((p) => p.index)
    expect(new Set(idx).size).toBe(idx.length)
    for (const i of idx) expect(i).toBeLessThan(PRESET_TABLE_ROWS)
  })

  it('keep the per-particle code (preset*16 + slot + fract) exact in float32', () => {
    const maxCode = (PRESET_TABLE_ROWS - 1) * PALETTE_SLOTS + (PALETTE_SLOTS - 1) + 0.99
    expect(maxCode).toBeLessThan(128)
    expect(Math.fround(maxCode)).toBeCloseTo(maxCode, 5)
  })

  it('pack two rows per preset in the documented order', () => {
    const t = packPresetTable()
    expect(t.length).toBe(PRESET_TABLE_ROWS * 8)
    const s = EMITTER_PRESETS.spark
    expect(Array.from(t.slice(s.index * 8, s.index * 8 + 8))).toEqual(
      [s.gravity, s.drag, s.lifeS, s.size, s.turbulence, s.beatGain.bass, s.beatGain.treble, s.sizeEnd].map(Math.fround),
    )
    for (const p of Object.values(EMITTER_PRESETS)) expect(t[p.index * 8 + 2]).toBeGreaterThan(0)
  })
})

describe('SpawnBatchPacker', () => {
  it('assigns contiguous prefix ranges and clamps to the frame cap', () => {
    const p = new SpawnBatchPacker(1000)
    expect(p.push(EMITTER_PRESETS.spark, 1, 2, 3, 0, 2, 0, 600, 3, 0.25)).toBe(600)
    expect(p.push(EMITTER_PRESETS.mist, 0, 0, 0, 1, 0, 0, 600, 0, 1.5)).toBe(400)
    expect(p.push(EMITTER_PRESETS.glitter, 0, 0, 0, 0, 1, 0, 10, 0, 0)).toBe(0)
    expect(p.total).toBe(1000)
    expect(p.batches).toBe(2)
    const d = p.data
    expect([d[0], d[1], d[2], d[3]]).toEqual([1, 2, 3, EMITTER_PRESETS.spark.index])
    expect([d[4], d[5], d[6]]).toEqual([0, 1, 0]) // normalised
    expect([d[8], d[9]]).toEqual([0, 600])
    expect([d[24], d[25]]).toEqual([600, 400])
    expect(d[12]).toBe(3)
    expect(d[29]).toBeCloseTo(0.5) // fract(seed)
    expect(p.dispatchCount()).toBe(1024)
  })

  it('caps at MAX_SPAWN_BATCHES and reset zeroes used counts', () => {
    const p = new SpawnBatchPacker(1_000_000)
    for (let i = 0; i < MAX_SPAWN_BATCHES + 5; i++) p.push(EMITTER_PRESETS.spark, 0, 0, 0, 0, 1, 0, 1, 0, 0)
    expect(p.batches).toBe(MAX_SPAWN_BATCHES)
    p.reset()
    expect(p.total).toBe(0)
    expect(p.dispatchCount()).toBe(0)
    for (let b = 0; b < MAX_SPAWN_BATCHES; b++) expect(p.data[b * 16 + 9]).toBe(0)
  })
})

describe('PaletteAllocator', () => {
  it('reserves slot 0 for white and recycles 1..15', () => {
    const a = new PaletteAllocator()
    const assigned: [number, string][] = []
    const assign = (s: number, c: string) => assigned.push([s, c])
    expect(a.slotFor(null, assign)).toBe(0)
    expect(a.slotFor('#FF0000', assign)).toBe(1)
    expect(a.slotFor('#ff0000', assign)).toBe(1)
    expect(assigned).toEqual([[1, '#ff0000']])
    for (let i = 0; i < PALETTE_SLOTS - 1; i++) a.slotFor(`#0000${i.toString(16).padStart(2, '0')}`, assign)
    // 15 new colours wrapped back over slot 1, evicting red.
    expect(a.slotFor('#ff0000', assign)).not.toBe(0)
    expect(assigned.length).toBe(1 + (PALETTE_SLOTS - 1) + 1)
  })
})

describe('frame budget percentile', () => {
  it('sorts into scratch without touching the source', async () => {
    const { percentile } = await import('../../frameBudgetState')
    const src = [5, 1, 4, 2, 3]
    const scratch = new Float64Array(8)
    expect(percentile(src, 5, 0.95, scratch)).toBe(5)
    expect(percentile(src, 5, 0.5, scratch)).toBe(3)
    expect(percentile(src, 0, 0.5, scratch)).toBe(0)
    expect(src).toEqual([5, 1, 4, 2, 3])
  })
})
