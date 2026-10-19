import { afterEach, describe, expect, it } from 'vitest'
import { EMITTER_STRIDE, MAX_EMITTERS } from '../../../rendering/particles/particleBudget'
import {
  EMITTER_KIND,
  burstStorage,
  emitterKindForPoint,
  emitterStorage,
  fireworkSlotCount,
  laserSlotCount,
  resetFxBus,
  spawnBurst,
  syncShowEmitters,
  tickBursts,
} from '../fxBus'

afterEach(() => {
  resetFxBus()
})

const funnel = { partName: 'funnel', position: [0, 5, 0] as const, rotation: [0, 0, 0] as const }
const mast = { partName: 'mast', position: [1, 8, 0] as const, rotation: [0, 0, 0] as const }

describe('fxBus', () => {
  it('spawnBurst reuses one table', () => {
    const bursts = burstStorage()
    const emitters = emitterStorage()
    for (let i = 0; i < 20; i++) spawnBurst([i, 1, 2], '#ff00aa')
    expect(burstStorage()).toBe(bursts)
    expect(emitterStorage()).toBe(emitters)
    expect(bursts[0]).toBe(16)
    expect(bursts[3]).toBeCloseTo(1)
    expect(bursts[4]).toBeCloseTo(0)
    expect(bursts[5]).toBeCloseTo(170 / 255)
  })

  it('packs fireworks in front of lasers and filters by cue target', () => {
    const table = emitterStorage()
    syncShowEmitters(10, 0, 0, [funnel, mast], 'all', '#ff0000', 0.5)
    expect(emitterStorage()).toBe(table)
    expect(fireworkSlotCount()).toBe(1)
    expect(laserSlotCount()).toBe(1)
    expect(table[0]).toBe(10)
    expect(table[1]).toBe(5)
    expect(table[5]).toBeCloseTo(1)
    expect(table[7]).toBe(EMITTER_KIND.firework)
    expect(table[EMITTER_STRIDE + 7]).toBe(EMITTER_KIND.laser)
    expect(table[8]).toBeCloseTo(1)
    expect(table[11]).toBeCloseTo(0.5)

    syncShowEmitters(10, 0, 0, [funnel, mast], 'funnel', '#00ff00', 1)
    expect(fireworkSlotCount()).toBe(1)
    expect(laserSlotCount()).toBe(0)
    expect(table[EMITTER_STRIDE + 3]).toBe(0)
  })

  it('appends live bursts after show fireworks', () => {
    spawnBurst([3, 4, 5], '#ffffff')
    syncShowEmitters(0, 0, 0, [funnel], 'all', '#ffffff', 1)
    expect(fireworkSlotCount()).toBe(2)
    expect(emitterStorage()[EMITTER_STRIDE]).toBe(3)
    tickBursts(3)
    syncShowEmitters(0, 0, 0, [funnel], 'all', '#ffffff', 1)
    expect(fireworkSlotCount()).toBe(1)
  })

  it('classifies mast, gantry, and searchlight as lasers', () => {
    expect(emitterKindForPoint('mast', 'mast')).toBe(EMITTER_KIND.laser)
    expect(emitterKindForPoint('loadingArm', 'gantry')).toBe(EMITTER_KIND.laser)
    expect(emitterKindForPoint('bowSearchlight', 'accent')).toBe(EMITTER_KIND.laser)
    expect(emitterKindForPoint('funnel', 'funnel')).toBe(EMITTER_KIND.firework)
    expect(MAX_EMITTERS).toBe(64)
  })
})
