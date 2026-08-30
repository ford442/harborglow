import { beforeEach, describe, expect, it, vi } from 'vitest'
import { waveSystem, OCEAN_FFT_UPDATE_INTERVAL } from '../../WaveSystem'
import { oceanFFTSeed, OCEAN_FFT_SIZE_BY_QUALITY } from '../index'
import { createSimContext, setSim, getSim, SIM_DT } from '../../sim/SimContext'
import { hashSimSnapshot } from '../../sim/hashState'
import { runHeadlessTicks } from '../../sim/headless'

/** Drive the wave system for `ticks` fixed steps and fingerprint the surface. */
function runOcean(seed: number, ticks: number): number[] {
  setSim(createSimContext(seed))
  waveSystem.reset()
  waveSystem.setOceanFFT(true, { size: 32, patchSize: 64, seed: oceanFFTSeed() })

  for (let i = 0; i < ticks; i++) waveSystem.update(SIM_DT)

  const probes: number[] = []
  for (let i = 0; i < 16; i++) {
    probes.push(waveSystem.getWaterHeight(i * 3.7, i * -5.3))
  }
  return probes
}

describe('FFT ocean determinism', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    waveSystem.reset()
  })

  it('same seed → identical surface after N ticks', () => {
    expect(runOcean(42, 90)).toEqual(runOcean(42, 90))
  })

  it('different seeds → different surface', () => {
    expect(runOcean(1, 90)).not.toEqual(runOcean(2, 90))
  })

  it('leaves the sim RNG untouched when seeding the spectrum', () => {
    setSim(createSimContext(42))
    const before = getSim().rng.getState()
    oceanFFTSeed()
    oceanFFTSeed()
    expect(getSim().rng.getState()).toEqual(before)
  })

  it('does not perturb the headless sim hash', () => {
    // The CPU FFT path must be invisible to the replay fingerprint: it derives
    // from a forked stream and contributes nothing to captureSimSnapshot().
    const baseline = runHeadlessTicks(42, 240, 60, { startStorm: true })

    setSim(createSimContext(42))
    waveSystem.setOceanFFT(true, { size: 32, patchSize: 64, seed: oceanFFTSeed() })
    const withFft = runHeadlessTicks(42, 240, 60, { startStorm: true })

    expect(withFft).toBe(baseline)
  })

  it('advances the field on the throttled cadence, not per frame', () => {
    setSim(createSimContext(42))
    waveSystem.reset()
    const field = waveSystem.setOceanFFT(true, { size: 32, patchSize: 64, seed: 5 })
    expect(field).not.toBeNull()

    waveSystem.consumeOceanFFTDirty()
    const ticksPerUpdate = Math.ceil(OCEAN_FFT_UPDATE_INTERVAL / SIM_DT)

    waveSystem.update(SIM_DT)
    expect(waveSystem.consumeOceanFFTDirty()).toBe(false)

    for (let i = 1; i < ticksPerUpdate; i++) waveSystem.update(SIM_DT)
    expect(waveSystem.consumeOceanFFTDirty()).toBe(true)
  })

  it('falls back to Gerstner when the field is disabled', () => {
    setSim(createSimContext(42))
    waveSystem.reset()
    waveSystem.setOceanFFT(true, { size: 32, patchSize: 64, seed: 5 })
    waveSystem.update(SIM_DT)
    const fftHeight = waveSystem.getWaterHeight(10, 20)

    waveSystem.setOceanFFT(false)
    expect(waveSystem.getOceanFFT()).toBeNull()
    const gerstnerHeight = waveSystem.getWaterHeight(10, 20)
    expect(gerstnerHeight).not.toBe(fftHeight)
  })

  it('gates the field on the quality preset', () => {
    expect(OCEAN_FFT_SIZE_BY_QUALITY.low).toBe(0)
    expect(OCEAN_FFT_SIZE_BY_QUALITY.medium).toBe(0)
    expect(OCEAN_FFT_SIZE_BY_QUALITY.high).toBeGreaterThan(0)
  })

  it('keeps batch and single height queries consistent on the FFT tier', () => {
    setSim(createSimContext(42))
    waveSystem.reset()
    waveSystem.setOceanFFT(true, { size: 32, patchSize: 64, seed: 5 })
    waveSystem.update(SIM_DT)

    const xs = Float32Array.from([0, 11.5, -20.25, 130])
    const zs = Float32Array.from([0, -3.5, 40.75, 9])
    const batch = waveSystem.getWaterHeightBatch(xs, zs)
    for (let i = 0; i < xs.length; i++) {
      expect(batch[i]).toBeCloseTo(waveSystem.getWaterHeight(xs[i], zs[i]), 5)
    }
  })
})
