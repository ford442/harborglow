import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { EMITTER_PRESETS } from '../../../rendering/particles/emitterPresets'
import type { EmitterAnchor } from '../emitterAnchors'
import { ParticleBench, parseParticleBench } from '../particleBench'
import { FIREWORK_ALTITUDE, ShowEmitterDriver, StreamAccumulator, type ShowFrame } from '../showEmitterDriver'

function anchor(partial: Partial<EmitterAnchor> & Pick<EmitterAnchor, 'key' | 'rigType' | 'group'>): EmitterAnchor {
  return {
    shipId: 'ship-1', shipType: 'cruise', partName: partial.key, installed: true,
    position: new THREE.Vector3(10, 5, -3), quaternion: new THREE.Quaternion(),
    ...partial,
  }
}

const ANCHORS = [
  anchor({ key: 'funnel', rigType: 'rgb_matrix', group: 'funnel' }),
  anchor({ key: 'bridge', rigType: 'projector', group: 'bridge' }),
  anchor({ key: 'rail', rigType: 'led_strip', group: 'hullStrip' }),
  anchor({ key: 'flare', rigType: 'emergency_strobe', group: 'accent' }),
  anchor({ key: 'uninstalled', rigType: 'rgb_matrix', group: 'mast', installed: false }),
  anchor({ key: 'other-ship', rigType: 'rgb_matrix', group: 'mast', shipId: 'ship-2' }),
]

function frame(over: Partial<ShowFrame>): ShowFrame {
  return { shipId: 'ship-1', pattern: 'strobe', target: 'all', intensity: 1, color: '#ff00ff', beatPhase: 0.5, bass: 0, dt: 1 / 60, ...over }
}

function record() {
  const calls: Array<{ preset: string; y: number; count: number }> = []
  const emit = (preset: string, _x: number, y: number, _z: number, _dx: number, _dy: number, _dz: number, count: number) => {
    calls.push({ preset, y, count })
  }
  return { calls, emit }
}

describe('ShowEmitterDriver', () => {
  it('strobe: one spark burst per installed non-projector rig on the beat edge only', () => {
    const d = new ShowEmitterDriver(1)
    const { calls, emit } = record()
    d.update(frame({ beatPhase: 0.9 }), ANCHORS, emit)
    expect(calls).toHaveLength(0)
    d.update(frame({ beatPhase: 0.02 }), ANCHORS, emit)
    expect(calls.map((c) => c.preset)).toEqual(['spark', 'spark', 'spark'])
    expect(calls[0].count).toBe(EMITTER_PRESETS.spark.burstCount)
  })

  it('filters by the cue rig-group target and scales by budget and intensity', () => {
    const d = new ShowEmitterDriver(0.5)
    const { calls, emit } = record()
    d.update(frame({ beatPhase: 0.9, target: 'hullStrip', intensity: 0.5 }), ANCHORS, emit)
    d.update(frame({ beatPhase: 0.0, target: 'hullStrip', intensity: 0.5 }), ANCHORS, emit)
    expect(calls).toEqual([{ preset: 'spark', y: 5, count: EMITTER_PRESETS.spark.burstCount * 0.25 }])
  })

  it('snap: fireworks above mast/funnel rigs on every fourth beat', () => {
    const d = new ShowEmitterDriver(1)
    const { calls, emit } = record()
    for (let beat = 1; beat <= 8; beat++) {
      d.update(frame({ pattern: 'snap', beatPhase: 0.9 }), ANCHORS, emit)
      d.update(frame({ pattern: 'snap', beatPhase: 0.0 }), ANCHORS, emit)
    }
    expect(calls).toHaveLength(2)
    expect(calls.every((c) => c.preset === 'firework' && c.y === 5 + FIREWORK_ALTITUDE)).toBe(true)
  })

  it('breathe: glitter streams accumulate fractional rates from matrix/strip rigs', () => {
    const d = new ShowEmitterDriver(1)
    const { calls, emit } = record()
    for (let i = 0; i < 60; i++) d.update(frame({ pattern: 'breathe', bass: 0.5, dt: 1 / 60 }), ANCHORS, emit)
    const total = calls.reduce((s, c) => s + c.count, 0)
    // two rigs (funnel matrix + rail strip) × ratePerS × (0.5 + bass) × 1 s
    expect(total).toBeGreaterThanOrEqual(2 * EMITTER_PRESETS.glitter.ratePerS - 2)
    expect(total).toBeLessThanOrEqual(2 * EMITTER_PRESETS.glitter.ratePerS)
    expect(new Set(calls.map((c) => c.preset))).toEqual(new Set(['glitter']))
  })

  it('emits nothing without a show, on blackout, or at zero intensity', () => {
    const d = new ShowEmitterDriver(1)
    const { calls, emit } = record()
    for (const f of [frame({ shipId: null }), frame({ pattern: 'blackout' }), frame({ intensity: 0 })]) {
      d.update({ ...f, beatPhase: 0.9 }, ANCHORS, emit)
      d.update({ ...f, beatPhase: 0.0 }, ANCHORS, emit)
    }
    expect(calls).toHaveLength(0)
  })
})

describe('StreamAccumulator', () => {
  it('carries fractions between frames and forgets dropped keys', () => {
    const s = new StreamAccumulator()
    let n = 0
    for (let i = 0; i < 10; i++) n += s.take('a', 15, 1 / 60)
    expect(n).toBe(2)
    s.retain(() => false)
    expect(s.take('a', 0, 1)).toBe(0)
  })
})

describe('ParticleBench', () => {
  it('parses the flag and spawns enough to keep the ring full', () => {
    expect(parseParticleBench('?particleBench=1')).toBe(true)
    expect(parseParticleBench('')).toBe(false)
    const bench = new ParticleBench(250_048)
    let spawned = 0
    const emit = (_p: string, _x: number, _y: number, _z: number, _a: number, _b: number, _c: number, n: number) => { spawned += n; return n }
    for (let i = 0; i < 60; i++) bench.step(1 / 60, 0, 0, emit)
    // Sum of capacity/(8·life) over the eight emitters for one second.
    const expected = 4 * 250_048 / (8 * EMITTER_PRESETS.glitter.lifeS) + 4 * 250_048 / (8 * EMITTER_PRESETS.firework.lifeS)
    expect(spawned).toBeGreaterThan(expected - 10)
    expect(bench.stats.spawnedPerSec).toBeGreaterThan(0)
  })

  it('reports rolling average and p95 frame time', () => {
    const bench = new ParticleBench(64)
    const emit = () => 0
    // Stats refresh once per simulated second: 120 frames, the last 4 slow (< 5%).
    for (let i = 0; i < 120; i++) {
      bench.recordFrame(i < 116 ? 0.016 : 0.05)
      bench.step(1 / 60, 0, 0, emit)
    }
    expect(bench.stats.frameSamples).toBe(120)
    expect(bench.stats.frameMsAvg).toBeGreaterThan(16)
    expect(bench.stats.frameMsP95).toBeCloseTo(16, 0)
  })
})
