import { beforeEach, describe, expect, it, vi } from 'vitest'
import { waveSystem } from '../WaveSystem'
import { wasmDSP } from '../wasmDSP'
import { createSimContext, setSim } from '../sim/SimContext'
import { oceanFFTSeed } from '../ocean'

describe('hull sample batch', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    waveSystem.reset()
    setSim(createSimContext(7))
  })

  it('Gerstner hull batch matches looped height and normal queries', () => {
    waveSystem.setOceanFFT(false)
    const xs = Float32Array.from([0, 4.5, -8, 12.25])
    const zs = Float32Array.from([1, -2, 3.5, 0])
    const heights = new Float32Array(xs.length)
    const normals = new Float32Array(xs.length * 3)
    waveSystem.getHullSampleBatch(xs, zs, heights, normals)

    for (let i = 0; i < xs.length; i++) {
      expect(heights[i]).toBeCloseTo(waveSystem.getWaterHeight(xs[i], zs[i]), 5)
      const n = waveSystem.getWaterNormal(xs[i], zs[i])
      expect(normals[i * 3]).toBeCloseTo(n.x, 5)
      expect(normals[i * 3 + 1]).toBeCloseTo(n.y, 5)
      expect(normals[i * 3 + 2]).toBeCloseTo(n.z, 5)
    }
  })

  it('FFT hull batch matches heightAt and finite-diff normals', () => {
    waveSystem.setOceanFFT(true, { size: 32, patchSize: 64, seed: oceanFFTSeed() })
    waveSystem.update(1 / 30)
    const xs = Float32Array.from([0, 11.5, -20.25, 40])
    const zs = Float32Array.from([0, -3.5, 40.75, 9])
    const heights = new Float32Array(xs.length)
    const normals = new Float32Array(xs.length * 3)
    waveSystem.getHullSampleBatch(xs, zs, heights, normals)

    for (let i = 0; i < xs.length; i++) {
      expect(heights[i]).toBeCloseTo(waveSystem.getWaterHeight(xs[i], zs[i]), 5)
      const n = waveSystem.getWaterNormal(xs[i], zs[i])
      expect(normals[i * 3]).toBeCloseTo(n.x, 4)
      expect(normals[i * 3 + 1]).toBeCloseTo(n.y, 4)
      expect(normals[i * 3 + 2]).toBeCloseTo(n.z, 4)
    }
  })

  it('remap degenerate span returns lo2', () => {
    expect(wasmDSP.remap(3, 5, 5, 0, 100)).toBe(0)
  })
})
