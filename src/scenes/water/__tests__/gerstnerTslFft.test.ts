import { describe, expect, it } from 'vitest'
import { OceanFFTField } from '../../../systems/ocean/OceanFFTField'
import { createOceanFFTTexture } from '../oceanFFTTexture'
import { createWaterNodeMaterial, type WaterTslUserData } from '../gerstnerTsl'

const BASE = {
  isNight: true,
  weather: 'clear',
  waveAmp: 1,
  waveSpeed: 1,
  stormIntensity: 0,
}

function fftOptions() {
  const field = new OceanFFTField({ size: 32, patchSize: 64, seed: 2 })
  const packed = createOceanFFTTexture(field)
  return { texture: packed.texture, patchSize: field.patchSize, size: field.size }
}

describe('water material tier gating', () => {
  it('leaves the Gerstner tier without an FFT uniform', () => {
    const mat = createWaterNodeMaterial(BASE)
    const u = mat.userData as unknown as WaterTslUserData
    expect(u.uFftStrength?.value).toBe(0)
  })

  it('enables the FFT uniform when a field is supplied', () => {
    const mat = createWaterNodeMaterial({ ...BASE, fft: fftOptions() })
    const u = mat.userData as unknown as WaterTslUserData
    expect(u.uFftStrength?.value).toBe(1)
  })

  it('still exposes every Gerstner uniform on the FFT tier', () => {
    // Ripple detail, tug wake and the dynamic-light rig are shared by both
    // tiers; the FFT swap must not drop their uniforms.
    const mat = createWaterNodeMaterial({ ...BASE, fft: fftOptions() })
    const u = mat.userData as unknown as WaterTslUserData
    for (const key of [
      'uTime', 'uCameraPos', 'uStormIntensity', 'uWaveAmplitudes',
      'uDynLightPositions', 'uDynLightCount', 'uTugPos', 'uPropWashPower',
    ] as const) {
      expect(u[key], key).toBeDefined()
    }
  })
})
