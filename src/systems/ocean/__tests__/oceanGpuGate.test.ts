import { afterEach, describe, expect, it, vi } from 'vitest'
import { publishWebgpuProbe, resetWebgpuProbe } from '../../../rendering/webgpuProbe'
import { canUseGpuOceanFft, parseOceanCinema } from '../oceanGpuGate'

afterEach(() => {
  resetWebgpuProbe()
  vi.unstubAllGlobals()
})

function passedProbe() {
  publishWebgpuProbe({
    ok: true,
    browser: { brand: 'test', ua: '' },
    adapterInfo: null,
    limits: null,
    compute: 'passed',
    reason: null,
    ignoredForceGl: false,
    device: { id: 'probe' } as never,
  })
}

describe('canUseGpuOceanFft', () => {
  const renderer = {
    computeAsync: async () => {},
    backend: { isWebGPUBackend: true, device: { id: 'adopted' } },
  }

  it('is false without a passed compute probe', () => {
    expect(canUseGpuOceanFft(renderer)).toBe(false)
  })

  it('is true when probe passed, device adopted, and computeAsync exists', () => {
    passedProbe()
    expect(canUseGpuOceanFft(renderer)).toBe(true)
  })

  it('forces the CPU/WASM path under ?no_gpu_compute=1', () => {
    passedProbe()
    expect(canUseGpuOceanFft(renderer, '?no_gpu_compute=1')).toBe(false)
    expect(canUseGpuOceanFft(renderer, '?no_gpu_compute=true')).toBe(false)
    expect(canUseGpuOceanFft(renderer, '?no_gpu_compute=0')).toBe(true)
  })

  it('rejects renderers without computeAsync or an adopted device', () => {
    passedProbe()
    expect(canUseGpuOceanFft({ backend: { isWebGPUBackend: true, device: {} } })).toBe(false)
    expect(canUseGpuOceanFft({ computeAsync: async () => {}, backend: { isWebGPUBackend: false } })).toBe(false)
    expect(canUseGpuOceanFft(null)).toBe(false)
  })
})

describe('parseOceanCinema', () => {
  it('is on only for ?ocean=cinema', () => {
    expect(parseOceanCinema('')).toBe(false)
    expect(parseOceanCinema('?ocean=high')).toBe(false)
    expect(parseOceanCinema('?ocean=cinema')).toBe(true)
  })
})
