import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { hashSimSnapshot, simScheduler } from '../index'
import {
  bootHeadlessRegistry,
  resetDeterministicSystems,
  runHeadlessTicks,
  stepHeadless,
} from '../headless'
import { getSim } from '../SimContext'
import { stormSystem } from '../../StormSystem'
import { musicSystem } from '../../music/MusicSystem'
import { transport } from '../../audio/transport'
import { audioRuntime } from '../../audio/AudioRuntime'
import type { FakeAudioRuntime } from '../../../test/audioRuntimeMock'

// Music reads sim time to find its beat; it must never write sim state.

const fake = audioRuntime as unknown as FakeAudioRuntime

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  musicSystem.stopAllMusic()
  fake.reset()
})

describe('audio ↔ sim isolation', () => {
  it('playing sim-clocked music does not change the sim hash', async () => {
    const ticks = 240
    const silent = runHeadlessTicks(42, ticks, 60, { startStorm: true })

    simScheduler.reset(42)
    resetDeterministicSystems()
    bootHeadlessRegistry()
    stormSystem.start(180)
    await musicSystem.startMusic('cruise', getSim().simTime)
    fake.reset()

    while (simScheduler.tick < ticks) {
      stepHeadless(1 / 60, () => transport.update())
      if (simScheduler.tick === 120) musicSystem.setBPM(150)
    }

    expect(fake.notes.length).toBeGreaterThan(0)
    expect(hashSimSnapshot()).toBe(silent)
  })

  it('music beat position is a function of sim time', async () => {
    simScheduler.reset(7)
    await musicSystem.startMusic('cruise', 10)
    // cruise = 120 BPM → 10 s of sim time into the song is beat 20
    expect(transport.clock).toBe('sim')
    expect(transport.beats).toBeCloseTo(20)
    expect(musicSystem.getTransportPosition('cruise')).toBe('5:0:0')
  })
})
