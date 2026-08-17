import { afterEach, describe, expect, it, vi } from 'vitest'
import { selectChoreBackend } from '../backend'
import { publishGpuChoresBreadcrumb, resetGpuChoresBreadcrumb, getGpuChoresBreadcrumb } from '../breadcrumbs'
import { adoptComputeDevice, resolveGpuTexture } from '../deviceAdopt'
import {
  downsample2d,
  exposureFromLogAverage,
  logAverageLuma,
  lumaHistogramBt709,
  reduceLuma,
  separableBlur,
} from '../jsJobs'
import { parseNoGpuCompute } from '../killSwitch'
import {
  DOWNSAMPLE_2D_WGSL,
  LUMA_HISTOGRAM_BT709_WGSL,
  REDUCE_WGSL,
  SEPARABLE_BLUR_WGSL,
} from '../shaders'
import { BT709_LUMA, EXPOSURE_MAX, EXPOSURE_MIN, GPU_CHORE_JOBS, HIST_BINS } from '../types'
import { GpuChoreSession } from '../session'
import { publishWebgpuProbe, resetWebgpuProbe } from '../../webgpuProbe'

afterEach(() => {
  resetGpuChoresBreadcrumb()
  resetWebgpuProbe()
  vi.unstubAllGlobals()
})

describe('parseNoGpuCompute', () => {
  it('is off by default', () => {
    expect(parseNoGpuCompute('')).toBe(false)
    expect(parseNoGpuCompute('?renderer=webgpu')).toBe(false)
  })

  it('is enabled by ?no_gpu_compute=1 or true', () => {
    expect(parseNoGpuCompute('?no_gpu_compute=1')).toBe(true)
    expect(parseNoGpuCompute('?no_gpu_compute=true')).toBe(true)
    expect(parseNoGpuCompute('?no_gpu_compute=0')).toBe(false)
  })
})

describe('adoptComputeDevice', () => {
  it('returns backend.device and never calls requestDevice', () => {
    const requestDevice = vi.fn()
    const requestAdapter = vi.fn()
    vi.stubGlobal('navigator', { gpu: { requestDevice, requestAdapter } })
    const device = { id: 'adopted' }
    const result = adoptComputeDevice({
      backend: { isWebGPUBackend: true, device: device as never },
    })
    expect(result).toBe(device)
    expect(requestDevice).not.toHaveBeenCalled()
    expect(requestAdapter).not.toHaveBeenCalled()
  })

  it('returns null on WebGL backends', () => {
    expect(adoptComputeDevice({ backend: { isWebGPUBackend: false, device: {} as never } })).toBeNull()
    expect(adoptComputeDevice({})).toBeNull()
    expect(adoptComputeDevice(null)).toBeNull()
  })

  it('resolves a GPUTexture from backend.get without a second device', () => {
    const gpuTex = { createView: () => 'view', width: 64, height: 36 }
    const renderer = { backend: { get: () => ({ texture: gpuTex }) } }
    expect(resolveGpuTexture(renderer, { uuid: 't' })).toBe(gpuTex)
    expect(resolveGpuTexture({ backend: { get: () => null } }, {})).toBeNull()
  })
})

describe('selectChoreBackend', () => {
  const device = { createShaderModule: () => ({}) } as never

  it('uses WebGPU only when the probe passed and a device was adopted', () => {
    expect(
      selectChoreBackend({
        killSwitch: false,
        activeBackend: 'webgpu',
        computeProbe: 'passed',
        device,
      }),
    ).toBe('webgpu')
  })

  it('falls back to JS when the kill switch is set', () => {
    expect(
      selectChoreBackend({
        killSwitch: true,
        activeBackend: 'webgpu',
        computeProbe: 'passed',
        device,
      }),
    ).toBe('js')
  })

  it('falls back to WASM when requested and WebGPU is unavailable', () => {
    expect(
      selectChoreBackend({
        killSwitch: false,
        activeBackend: 'webgpu',
        computeProbe: 'failed',
        device,
        wasmAvailable: true,
      }),
    ).toBe('wasm')
  })

  it('uses JS on a WebGL session even if a device object is present', () => {
    expect(
      selectChoreBackend({
        killSwitch: false,
        activeBackend: 'webgl',
        computeProbe: 'unsupported',
        device,
      }),
    ).toBe('js')
  })

  it('skips WebGPU when the boot probe failed', () => {
    publishWebgpuProbe({
      ok: false,
      browser: { brand: 'Google Chrome', ua: '' },
      adapterInfo: null,
      limits: null,
      compute: 'not-run',
      reason: 'no-gpu',
      ignoredForceGl: false,
      device: null,
    })
    expect(
      selectChoreBackend({
        killSwitch: false,
        activeBackend: 'webgpu',
        computeProbe: 'passed',
        device,
      }),
    ).toBe('js')
  })
})

describe('luma_histogram_bt709', () => {
  it('bins known RGB into BT.709 luma', () => {
    const white = lumaHistogramBt709([1, 1, 1, 1], 1, 4, true)
    expect(white[HIST_BINS - 1]).toBe(1)
    expect(white.reduce((a, b) => a + b, 0)).toBe(1)

    const red = lumaHistogramBt709([1, 0, 0, 1], 1, 4, true)
    const redBin = Math.min(HIST_BINS - 1, Math.floor(BT709_LUMA.r * (HIST_BINS - 1) + 1e-6))
    expect(red[redBin]).toBe(1)

    const black = lumaHistogramBt709([0, 0, 0, 255], 1, 4, false)
    expect(black[0]).toBe(1)
  })

  it('maps log-average luma onto a clamped night-harbor exposure', () => {
    const bins = new Uint32Array(HIST_BINS)
    bins[Math.floor(0.18 * 255)] = 100
    const exposure = exposureFromLogAverage(logAverageLuma(bins))
    expect(exposure).toBeGreaterThanOrEqual(EXPOSURE_MIN)
    expect(exposure).toBeLessThanOrEqual(EXPOSURE_MAX)
  })
})

describe('downsample_2d / separable_blur / reduce', () => {
  it('box-filters a 2×2 solid block to one pixel', () => {
    const src = new Uint8Array([
      10, 20, 30, 255, 10, 20, 30, 255, 10, 20, 30, 255, 10, 20, 30, 255,
    ])
    const dst = downsample2d(src, 2, 2, 1, 1)
    expect([...dst]).toEqual([10, 20, 30, 255])
  })

  it('spreads an impulse under a separable blur', () => {
    const src = new Uint8Array(5 * 5 * 4)
    const mid = (2 * 5 + 2) * 4
    src[mid] = 255
    src[mid + 3] = 255
    const dst = separableBlur(src, 5, 5)
    expect(dst[mid]).toBeGreaterThan(0)
    expect(dst[mid]).toBeLessThan(255)
    expect(dst[(2 * 5 + 1) * 4]).toBeGreaterThan(0)
  })

  it('reduces BT.709 mean and max', () => {
    const src = new Uint8Array([255, 255, 255, 255, 0, 0, 0, 255])
    const { mean, max, count } = reduceLuma(src, 2, 4, false)
    expect(count).toBe(2)
    expect(max).toBeCloseTo(1, 5)
    expect(mean).toBeCloseTo(0.5, 5)
  })
})

describe('job names and workgroups', () => {
  it('matches image_video_effects job ids', () => {
    expect(GPU_CHORE_JOBS.luma_histogram_bt709).toBe('luma_histogram_bt709')
    expect(GPU_CHORE_JOBS.downsample_2d).toBe('downsample_2d')
    expect(GPU_CHORE_JOBS.separable_blur).toBe('separable_blur')
    expect(GPU_CHORE_JOBS.reduce).toBe('reduce')
  })

  it('uses (8,8) image workgroups and (64) reduce', () => {
    expect(LUMA_HISTOGRAM_BT709_WGSL).toContain('@workgroup_size(8, 8, 1)')
    expect(DOWNSAMPLE_2D_WGSL).toContain('@workgroup_size(8, 8, 1)')
    expect(SEPARABLE_BLUR_WGSL).toContain('@workgroup_size(8, 8, 1)')
    expect(REDUCE_WGSL).toContain('@workgroup_size(64, 1, 1)')
  })
})

describe('breadcrumbs', () => {
  it('merges job status without dropping siblings', () => {
    publishGpuChoresBreadcrumb({ backend: 'js', jobs: { luma_histogram_bt709: 'js' } })
    const next = publishGpuChoresBreadcrumb({ jobs: { downsample_2d: 'js' } })
    expect(next.jobs.luma_histogram_bt709).toBe('js')
    expect(next.jobs.downsample_2d).toBe('js')
    expect(next.backend).toBe('js')
  })
})

describe('GpuChoreSession after failed boot probe', () => {
  it('never calls requestDevice when attach runs after a failed probe', () => {
    const requestDevice = vi.fn()
    const requestAdapter = vi.fn()
    vi.stubGlobal('navigator', { gpu: { requestDevice, requestAdapter } })
    publishWebgpuProbe({
      ok: false,
      browser: { brand: 'Google Chrome', ua: '' },
      adapterInfo: null,
      limits: null,
      compute: 'not-run',
      reason: 'no-gpu',
      ignoredForceGl: false,
      device: null,
    })

    const session = new GpuChoreSession()
    session.attach({
      backend: { isWebGPUBackend: true, device: { id: 'should-not-adopt' } as never },
    })

    expect(requestDevice).not.toHaveBeenCalled()
    expect(requestAdapter).not.toHaveBeenCalled()
    expect(getGpuChoresBreadcrumb().backend).toBe('off')
    expect(getGpuChoresBreadcrumb().deviceAdopted).toBe(false)
    session.detach()
  })
})
