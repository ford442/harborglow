import { afterEach, describe, expect, it } from 'vitest'
import { publishWebgpuProbe, resetWebgpuProbe } from '../../webgpuProbe'
import { canUseGpuParticles, hasFloat32Filterable } from '../particleGate'

afterEach(() => {
  resetWebgpuProbe()
})

function passedProbe(grantedFeatures: string[]) {
  publishWebgpuProbe({
    ok: true,
    browser: { brand: 'test', ua: '' },
    adapterInfo: null,
    limits: null,
    compute: 'passed',
    reason: null,
    ignoredForceGl: false,
    grantedFeatures,
    device: { id: 'probe' } as never,
  })
}

const renderer = {
  computeAsync: async () => {},
  backend: { isWebGPUBackend: true, device: { id: 'adopted' } },
}

describe('canUseGpuParticles', () => {
  it('is false without a passed compute probe', () => {
    expect(canUseGpuParticles(renderer)).toBe(false)
  })

  it('is true without float32-filterable', () => {
    passedProbe([])
    expect(hasFloat32Filterable([])).toBe(false)
    expect(canUseGpuParticles(renderer)).toBe(true)
  })

  it('stays true when float32-filterable was granted', () => {
    passedProbe(['float32-filterable'])
    expect(hasFloat32Filterable(['float32-filterable'])).toBe(true)
    expect(canUseGpuParticles(renderer)).toBe(true)
  })

  it('forces the layer off under ?no_gpu_compute=1', () => {
    passedProbe([])
    expect(canUseGpuParticles(renderer, '?no_gpu_compute=1')).toBe(false)
    expect(canUseGpuParticles(renderer, '?no_gpu_compute=true')).toBe(false)
    expect(canUseGpuParticles(renderer, '?no_gpu_compute=0')).toBe(true)
  })

  it('rejects renderers without computeAsync or an adopted device', () => {
    passedProbe([])
    expect(canUseGpuParticles({ backend: { isWebGPUBackend: true, device: {} } })).toBe(false)
    expect(canUseGpuParticles({ computeAsync: async () => {}, backend: { isWebGPUBackend: false } })).toBe(false)
    expect(canUseGpuParticles(null)).toBe(false)
  })
})
