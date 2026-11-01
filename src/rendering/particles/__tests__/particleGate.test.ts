import { afterEach, describe, expect, it } from 'vitest'
import { hasGpuFeature, publishWebgpuProbe, resetWebgpuProbe } from '../../webgpuProbe'
import { canUseGpuParticles, parseParticlesOff } from '../particleGate'

afterEach(() => {
  resetWebgpuProbe()
})

function probe(compute: 'passed' | 'failed', grantedFeatures: string[] = []) {
  publishWebgpuProbe({
    ok: true,
    browser: { brand: 'test', ua: '' },
    adapterInfo: null,
    limits: null,
    compute,
    reason: null,
    ignoredForceGl: false,
    grantedFeatures,
    device: { id: 'probe' } as never,
  })
}

const renderer = {
  compute: () => {},
  computeAsync: async () => {},
  backend: { isWebGPUBackend: true },
}

describe('canUseGpuParticles', () => {
  it('is false before the probe publishes or when compute failed', () => {
    expect(canUseGpuParticles(renderer, '')).toBe(false)
    probe('failed')
    expect(canUseGpuParticles(renderer, '')).toBe(false)
  })

  it('is true with a passed probe on a WebGPU backend with compute', () => {
    probe('passed')
    expect(canUseGpuParticles(renderer, '')).toBe(true)
  })

  it('honours ?no_gpu_compute=1 and ?particles=0', () => {
    probe('passed')
    expect(canUseGpuParticles(renderer, '?no_gpu_compute=1')).toBe(false)
    expect(canUseGpuParticles(renderer, '?particles=0')).toBe(false)
    expect(canUseGpuParticles(renderer, '?particles=1')).toBe(true)
  })

  it('rejects non-WebGPU backends and renderers without compute', () => {
    probe('passed')
    expect(canUseGpuParticles({ ...renderer, backend: { isWebGPUBackend: false } }, '')).toBe(false)
    expect(canUseGpuParticles({ computeAsync: renderer.computeAsync, backend: renderer.backend }, '')).toBe(false)
    expect(canUseGpuParticles(null, '')).toBe(false)
  })
})

describe('parseParticlesOff', () => {
  it('is on only for explicit off values', () => {
    expect(parseParticlesOff('')).toBe(false)
    expect(parseParticlesOff('?particles=0')).toBe(true)
    expect(parseParticlesOff('?particles=off')).toBe(true)
    expect(parseParticlesOff('?particles=1')).toBe(false)
  })
})

describe('hasGpuFeature', () => {
  it('reads the probe grantedFeatures', () => {
    expect(hasGpuFeature('float32-filterable')).toBe(false)
    probe('passed', ['float32-filterable'])
    expect(hasGpuFeature('float32-filterable')).toBe(true)
    expect(hasGpuFeature('timestamp-query')).toBe(false)
  })
})
