import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  simScheduler,
  serializeReplay,
  parseReplay,
  hashSimSnapshot,
} from '../index'
import {
  runHeadlessTicks,
  runHeadlessReplay,
  bootHeadlessRegistry,
  resetDeterministicSystems,
  stepHeadless,
} from '../headless'
import { stormSystem } from '../../StormSystem'
import { SIM_DT } from '../SimContext'

const STORM = { startStorm: true as const }

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('headless determinism harness', () => {
  it('same seed → identical state hash after N ticks', () => {
    const a = runHeadlessTicks(42, 240, 60, STORM)
    const b = runHeadlessTicks(42, 240, 60, STORM)
    expect(a).toBe(b)
  })

  it('different seeds diverge', () => {
    const a = runHeadlessTicks(1, 240, 60, STORM)
    const b = runHeadlessTicks(2, 240, 60, STORM)
    expect(a).not.toBe(b)
  })

  it('10,000 ticks at 30/60/144 Hz produce identical state', () => {
    const opts = { startStorm: true, coreOnly: true }
    const ticks = 10_000
    const at30 = runHeadlessTicks(42, ticks, 30, opts)
    const at60 = runHeadlessTicks(42, ticks, 60, opts)
    const at144 = runHeadlessTicks(42, ticks, 144, opts)
    expect(at30).toBe(at60)
    expect(at60).toBe(at144)
  }, 60_000)
})

describe('canned ice-escort seed replay', () => {
  it('identical hashes from the same ice seed log', () => {
    const file = {
      version: 1 as const,
      seed: 204,
      dt: SIM_DT,
      inputs: [
        { tick: 10, action: 'mission.iceEscort.start', payload: { seed: 204 } },
      ],
    }
    const a = runHeadlessReplay(file, 240)
    const b = runHeadlessReplay(file, 240)
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{8}$/)
  })
})

describe('two headless instances share a spawn + storm input log', () => {
  it('identical hashes from the same seed and recorded log', () => {
    const file = {
      version: 1 as const,
      seed: 77,
      dt: SIM_DT,
      inputs: [
        { tick: 10, action: 'ship.spawn', payload: { type: 'cruise' as const } },
        { tick: 20, action: 'storm.start', payload: { duration: 180 } },
      ],
    }
    const a = runHeadlessReplay(file, 240)
    const b = runHeadlessReplay(file, 240)
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{8}$/)
  })
})

describe('record / replay round-trip', () => {
  it('replays a recorded storm.start to the same hash', () => {
    simScheduler.reset(9)
    resetDeterministicSystems()
    bootHeadlessRegistry()
    simScheduler.startRecording()
    stepHeadless(SIM_DT, () => {
      stormSystem.start(180)
      simScheduler.record('storm.start', { duration: 180 })
    })
    while (simScheduler.tick < 120) {
      stepHeadless(SIM_DT)
    }
    const file = simScheduler.stopRecording()
    const liveHash = hashSimSnapshot()
    const parsed = parseReplay(serializeReplay(file))

    expect(parsed.seed).toBe(9)
    expect(parsed.inputs.some((entry) => entry.action === 'storm.start')).toBe(true)
    expect(runHeadlessReplay(parsed, 120)).toBe(liveHash)
  })
})
