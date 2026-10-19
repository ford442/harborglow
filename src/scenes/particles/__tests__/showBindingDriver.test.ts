import * as THREE from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EMITTER_PRESETS } from '../../../rendering/particles/emitterPresets'
import { maxSpawnPerFrame, particleCapacity } from '../../../rendering/particles/particleBudget'
import { FACTORY_SHOW_EMITTERS, type ShowEmitterBinding } from '../../../systems/lightShows/showEmitters'
import { emitterAnchorKey } from '../emitterAnchors'
import { FIREWORK_ALTITUDE } from '../showEmitterDriver'
import { forceGc } from './forceGc'
import {
  createBindingFrame,
  emitterShares,
  hasShowBindings,
  ShowBindingDriver,
  showBeatInLoop,
  type AnchorLookup,
  type BindingFrame,
} from '../showBindingDriver'

const CAPACITY = particleCapacity(100_000)
const MAX_SPAWN = maxSpawnPerFrame(CAPACITY)
const DT = 1 / 60

type Call = { preset: string; x: number; y: number; z: number; dx: number; dy: number; dz: number; count: number; color: string | null }

function recorder() {
  const calls: Call[] = []
  const emit = (
    preset: string, x: number, y: number, z: number,
    dx: number, dy: number, dz: number, count: number, color: string | null,
  ) => {
    calls.push({ preset, x, y, z, dx, dy, dz, count, color })
  }
  return { calls, emit: emit as unknown as Parameters<ShowBindingDriver['update']>[1] }
}

/** Anchors for every attachment point any factory show names, on ship `shipId`. */
function anchorsFor(shipId: string, skip: string[] = []): AnchorLookup {
  const map = new Map<string, { position: THREE.Vector3; quaternion: THREE.Quaternion }>()
  let i = 0
  for (const bindings of Object.values(FACTORY_SHOW_EMITTERS)) {
    for (const b of bindings!) {
      if (skip.includes(b.attachmentPoint)) continue
      i++
      map.set(emitterAnchorKey(shipId, b.attachmentPoint), {
        position: new THREE.Vector3(i, 10 + i, -i),
        quaternion: new THREE.Quaternion(),
      })
    }
  }
  return (key) => map.get(key)
}

function frame(over: Partial<BindingFrame>): BindingFrame {
  return { ...createBindingFrame(), shipId: 'ship-1', shipType: 'fireboat', beatInLoop: 2, beatSeconds: 60 / 152, dt: DT, ...over }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('showBeatInLoop', () => {
  it('counts beats at the show BPM and wraps on the loop', () => {
    expect(showBeatInLoop(0, 120, 32)).toBe(0)
    expect(showBeatInLoop(12_000, 120, 32)).toBe(24)
    expect(showBeatInLoop(14_000, 120, 32)).toBe(28)
    expect(showBeatInLoop(16_000, 120, 32)).toBe(0)
    expect(showBeatInLoop(16_500, 120, 32)).toBeCloseTo(1, 12)
  })

  it('handles non-integer beat lengths (fireboat, 152 BPM)', () => {
    const beatMs = (60 / 152) * 1000
    expect(showBeatInLoop(beatMs * 16, 152, 32)).toBeCloseTo(16, 9)
    expect(showBeatInLoop(beatMs * 33, 152, 32)).toBeCloseTo(1, 9)
  })
})

describe('hasShowBindings', () => {
  it('is true for exactly the three factory-emitter ships', () => {
    expect(hasShowBindings('cruise')).toBe(true)
    expect(hasShowBindings('fireboat')).toBe(true)
    expect(hasShowBindings('icebreaker')).toBe(true)
    expect(hasShowBindings('tanker')).toBe(false)
    expect(hasShowBindings(null)).toBe(false)
  })
})

describe('emitterShares', () => {
  const b = (density: number): ShowEmitterBinding => ({
    kind: 'mist', attachmentPoint: 'x', beat: 0, lengthBeats: 1, density, color: '#ffffff',
  })

  it('gives each binding density × capacity when they fit', () => {
    const out = emitterShares([b(0.25), b(0.5)], 1000, [])
    expect(out).toEqual([250, 500])
  })

  it('scales concurrent bindings together so they never exceed the ring', () => {
    const out = emitterShares([b(0.8), b(0.8), b(0.4)], 1000, [])
    expect(out.reduce((a, c) => a + c, 0)).toBeCloseTo(1000, 9)
    expect(out[0]).toBeCloseTo(out[1], 9)
    expect(out[0] / out[2]).toBeCloseTo(2, 9)
  })

  it('reuses and resizes the output array', () => {
    const out = [1, 2, 3, 4]
    expect(emitterShares([b(0.1)], 100, out)).toBe(out)
    expect(out).toEqual([10])
  })
})

describe('ShowBindingDriver', () => {
  it('emits nothing without a ship or outside every window', () => {
    const d = new ShowBindingDriver(CAPACITY, MAX_SPAWN, anchorsFor('ship-1'))
    const { calls, emit } = recorder()
    d.update(frame({ shipId: null, shipType: null }), emit)
    d.update(frame({ shipType: 'fireboat', beatInLoop: 31 }), emit)
    d.update(frame({ shipType: 'tanker', beatInLoop: 2 }), emit)
    expect(calls).toEqual([])
    expect(d.activeCount).toBe(0)
  })

  it('fireboat: both cannons stream mist at density × ring / lifetime, foam deck only from beat 16', () => {
    const d = new ShowBindingDriver(CAPACITY, MAX_SPAWN, anchorsFor('ship-1'))
    const { calls, emit } = recorder()
    for (let i = 0; i < 60; i++) d.update(frame({ beatInLoop: 2 }), emit)
    expect(d.activeCount).toBe(2)
    expect(new Set(calls.map((c) => c.preset))).toEqual(new Set(['mist']))
    const perCannon = (0.4 * CAPACITY) / EMITTER_PRESETS.mist.lifeS
    const total = calls.reduce((s, c) => s + c.count, 0)
    expect(total).toBeGreaterThan(2 * perCannon * 0.98)
    expect(total).toBeLessThanOrEqual(2 * perCannon * 1.001)
    expect(calls[0].color).toBe('#cfefff')

    calls.length = 0
    d.update(frame({ beatInLoop: 17 }), emit)
    expect(d.activeCount).toBe(3)
  })

  it('streams along the anchor up axis', () => {
    const lookup: AnchorLookup = () => ({
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2)),
    })
    const d = new ShowBindingDriver(CAPACITY, MAX_SPAWN, lookup)
    const { calls, emit } = recorder()
    d.update(frame({ beatInLoop: 2, dt: 1 }), emit)
    expect(calls[0].dx).toBeCloseTo(1, 6)
    expect(calls[0].dy).toBeCloseTo(0, 6)
  })

  it('cruise: one shell per anchor per beat, above the anchor, none between beats', () => {
    const d = new ShowBindingDriver(CAPACITY, MAX_SPAWN, anchorsFor('ship-1'))
    const { calls, emit } = recorder()
    const cruise = (beatInLoop: number) => frame({ shipType: 'cruise', beatInLoop, beatSeconds: 0.5 })

    d.update(cruise(23.9), emit)
    expect(calls).toHaveLength(0)

    d.update(cruise(24.0), emit)
    expect(calls.map((c) => c.preset)).toEqual(['firework', 'firework'])
    expect(calls.every((c) => c.color === '#ffd700')).toBe(true)
    const lookup = anchorsFor('ship-1')
    const funnel1 = lookup(emitterAnchorKey('ship-1', 'funnel1'))!
    expect(calls[0].y).toBeCloseTo(funnel1.position.y + FIREWORK_ALTITUDE, 9)

    d.update(cruise(24.4), emit)
    expect(calls).toHaveLength(2)

    d.update(cruise(25.0), emit)
    expect(calls).toHaveLength(4)
  })

  it('cruise finale adds the balconies on beat 28 in white', () => {
    const d = new ShowBindingDriver(CAPACITY, MAX_SPAWN, anchorsFor('ship-1'))
    const { calls, emit } = recorder()
    d.update(frame({ shipType: 'cruise', beatInLoop: 28, beatSeconds: 0.5 }), emit)
    expect(calls).toHaveLength(4)
    expect(calls.filter((c) => c.color === '#ffffff')).toHaveLength(2)
    expect(d.activeCount).toBe(4)
  })

  it('shells fire again when the window reopens on the next loop', () => {
    const d = new ShowBindingDriver(CAPACITY, MAX_SPAWN, anchorsFor('ship-1'))
    const { calls, emit } = recorder()
    const cruise = (beatInLoop: number) => frame({ shipType: 'cruise', beatInLoop, beatSeconds: 0.5 })
    d.update(cruise(30.5), emit)
    const first = calls.length
    d.update(cruise(31.9), emit) // window closed at 31, gap frame
    d.update(cruise(2), emit)
    d.update(cruise(24.0), emit)
    expect(calls.length).toBe(first + 2)
  })

  it('never asks for more than the per-frame spawn cap across live bindings', () => {
    const cap = 600
    const d = new ShowBindingDriver(250_000, cap, anchorsFor('ship-1'))
    const { calls, emit } = recorder()
    d.update(frame({ shipType: 'cruise', beatInLoop: 28, beatSeconds: 0.5 }), emit)
    expect(calls.reduce((s, c) => s + c.count, 0)).toBeLessThanOrEqual(cap)
    calls.length = 0
    d.update(frame({ beatInLoop: 2 }), emit)
    expect(calls.reduce((s, c) => s + c.count, 0)).toBeLessThanOrEqual(cap)
  })

  it('drops over-cap stream particles instead of queueing them behind later frames', () => {
    const d = new ShowBindingDriver(CAPACITY, MAX_SPAWN, anchorsFor('ship-1'))
    const { calls, emit } = recorder()
    d.update(frame({ beatInLoop: 2, dt: 10 }), emit) // a stall: 10 s worth of rate in one frame
    expect(calls.reduce((s, c) => s + c.count, 0)).toBeLessThanOrEqual(MAX_SPAWN)
    calls.length = 0
    d.update(frame({ beatInLoop: 2, dt: DT }), emit)
    const perCannonPerFrame = ((0.4 * CAPACITY) / EMITTER_PRESETS.mist.lifeS) * DT
    expect(calls.reduce((s, c) => s + c.count, 0)).toBeLessThanOrEqual(Math.ceil(perCannonPerFrame) * 2)
  })

  it('skips a missing attachment point, warns once per id, and keeps the rest playing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const d = new ShowBindingDriver(CAPACITY, MAX_SPAWN, anchorsFor('ship-1', ['funnel2']))
    const { calls, emit } = recorder()
    for (let i = 0; i < 5; i++) d.update(frame({ shipType: 'cruise', beatInLoop: 24 + i * 0.01, beatSeconds: 0.5 }), emit)
    expect(calls).toHaveLength(1)
    expect(d.activeCount).toBe(1)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('funnel2')
  })

  it('looks anchors up on the show ship only', () => {
    const d = new ShowBindingDriver(CAPACITY, MAX_SPAWN, anchorsFor('other-ship'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { calls, emit } = recorder()
    d.update(frame({ shipId: 'ship-1', beatInLoop: 2 }), emit)
    expect(calls).toEqual([])
    expect(warn).toHaveBeenCalled()
  })

  it('plays the three factory shows back to back (festival order) on one driver', () => {
    const d = new ShowBindingDriver(CAPACITY, MAX_SPAWN, () => ({
      position: new THREE.Vector3(1, 2, 3),
      quaternion: new THREE.Quaternion(),
    }))
    const { calls, emit } = recorder()
    d.update(frame({ shipId: 'a', shipType: 'cruise', beatInLoop: 24, beatSeconds: 0.5 }), emit)
    d.update(frame({ shipId: null, shipType: null }), emit) // intermission
    d.update(frame({ shipId: 'b', shipType: 'fireboat', beatInLoop: 2 }), emit)
    d.update(frame({ shipId: null, shipType: null }), emit)
    d.update(frame({ shipId: 'c', shipType: 'icebreaker', beatInLoop: 17, beatSeconds: 60 / 108 }), emit)
    expect(new Set(calls.map((c) => c.preset))).toEqual(new Set(['firework', 'mist', 'glitter']))
  })

  it('does not allocate on the per-frame bookkeeping path', () => {
    const d = new ShowBindingDriver(CAPACITY, MAX_SPAWN, anchorsFor('ship-1'))
    // A Float64Array slot, not a captured `let`: boxing a double into a closure
    // slot would itself allocate and hide what the driver does.
    const sink = new Float64Array(1)
    const emit = ((_p: string, x: number, _y: number, _z: number, _dx: number, _dy: number, _dz: number, count: number) => {
      sink[0] += x + count
    }) as unknown as Parameters<ShowBindingDriver['update']>[1]
    // Cruise at beat 24.3: both firework bindings are live and already fired for beat 24,
    // so every frame runs the whole path (collect, shares, state, anchor lookup) and emits
    // nothing. Emitting frames are left out on purpose: they pass doubles across the
    // emit() call, whose boxing cost depends on the V8 version and JIT state (3-46 B/frame
    // measured across Node 20 and 24), which would make a byte bound here a flake.
    const f = frame({ shipType: 'cruise', beatInLoop: 24.3, beatSeconds: 0.5 })
    d.update(f, emit)
    expect(sink[0]).toBeGreaterThan(0)
    const run = (n: number) => {
      for (let i = 0; i < n; i++) d.update(f, emit)
    }
    run(30_000) // warm the JIT
    forceGc()?.()
    const before = process.memoryUsage().heapUsed
    run(100_000)
    const grown = process.memoryUsage().heapUsed - before
    // The regressions this guards (a key string per binding per frame, `out.length = 0` on a
    // reused array) cost 30-70 B/frame, i.e. 3-7 MB here. This path measures ~0.1 B/frame; the
    // rest of the bound is the test runner's own noise (up to ~300 KB seen).
    expect(grown).toBeLessThan(700_000)
  })
})
