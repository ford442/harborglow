import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGameRenderer } from '../createRenderer'
import { parseRendererPreference } from '../rendererConfig'
import {
  detectBrowserBrand,
  getWebgpuProbe,
  publishWebgpuProbe,
  resetWebgpuProbe,
  runWebgpuBootProbe,
  wasForceGlRequested,
  WebgpuRequiredError,
} from '../webgpuProbe'
import type { GpuDeviceLike } from '../gpuChores/types'

afterEach(() => {
  resetWebgpuProbe()
  vi.unstubAllGlobals()
})

function makeCanvas(configure = vi.fn()) {
  return {
    width: 1,
    height: 1,
    getContext: vi.fn(() => ({ configure })),
  }
}

function makeDevice(overrides: Partial<GpuDeviceLike> = {}): GpuDeviceLike {
  const pass = {
    setPipeline: vi.fn(),
    dispatchWorkgroups: vi.fn(),
    end: vi.fn(),
  }
  const encoder = {
    beginComputePass: vi.fn(() => pass),
    copyBufferToBuffer: vi.fn(),
    finish: vi.fn(() => ({})),
  }
  return {
    createShaderModule: vi.fn(() => ({})),
    createComputePipeline: vi.fn(() => ({ getBindGroupLayout: () => ({}) })),
    createBuffer: vi.fn(() => ({})),
    createTexture: vi.fn(() => ({ createView: () => ({}) })),
    createBindGroup: vi.fn(() => ({})),
    createCommandEncoder: vi.fn(() => encoder),
    queue: {
      submit: vi.fn(),
      writeBuffer: vi.fn(),
      onSubmittedWorkDone: vi.fn(() => Promise.resolve()),
    },
    ...overrides,
  } as GpuDeviceLike
}

describe('detectBrowserBrand', () => {
  it('distinguishes Chrome and Edge from UA-CH brands', () => {
    expect(
      detectBrowserBrand({
        userAgent: 'Mozilla/5.0 Chrome/120',
        userAgentData: {
          brands: [
            { brand: 'Chromium', version: '120' },
            { brand: 'Google Chrome', version: '120' },
          ],
        },
      }).brand,
    ).toBe('Google Chrome')

    expect(
      detectBrowserBrand({
        userAgent: 'Mozilla/5.0 Chrome/120 Edg/120',
        userAgentData: {
          brands: [
            { brand: 'Chromium', version: '120' },
            { brand: 'Microsoft Edge', version: '120' },
          ],
        },
      }).brand,
    ).toBe('Microsoft Edge')
  })

  it('falls back to UA tokens when UA-CH is missing', () => {
    expect(detectBrowserBrand({ userAgent: 'Mozilla/5.0 Chrome/121.0.0.0' }).brand).toBe(
      'Google Chrome',
    )
    expect(
      detectBrowserBrand({ userAgent: 'Mozilla/5.0 Chrome/121.0.0.0 Edg/121.0.0.0' }).brand,
    ).toBe('Microsoft Edge')
  })
})

describe('wasForceGlRequested', () => {
  it('is true for ?renderer=webgl and false otherwise', () => {
    expect(wasForceGlRequested('?renderer=webgl')).toBe(true)
    expect(wasForceGlRequested('?renderer=webgpu')).toBe(false)
    expect(wasForceGlRequested('')).toBe(false)
  })
})

describe('parseRendererPreference', () => {
  it('always returns webgpu, including when force-GL is requested', () => {
    expect(parseRendererPreference('?renderer=webgl')).toBe('webgpu')
    expect(parseRendererPreference('?renderer=webgpu')).toBe('webgpu')
    expect(parseRendererPreference('')).toBe('webgpu')
  })
})

describe('runWebgpuBootProbe', () => {
  it('fails closed with no-gpu and never calls requestDevice', async () => {
    const requestDevice = vi.fn()
    const result = await runWebgpuBootProbe({
      canvas: makeCanvas(),
      navigatorLike: { userAgent: 'Mozilla/5.0 Chrome/120', gpu: undefined },
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('no-gpu')
    expect(result.browser.brand).toBe('Google Chrome')
    expect(getWebgpuProbe()?.ok).toBe(false)
    expect(getWebgpuProbe()?.reason).toBe('no-gpu')
    expect(requestDevice).not.toHaveBeenCalled()
  })

  it('fails with adapter-null when requestAdapter returns null', async () => {
    const requestDevice = vi.fn()
    const result = await runWebgpuBootProbe({
      canvas: makeCanvas(),
      navigatorLike: {
        userAgent: 'Mozilla/5.0 Chrome/120 Edg/120',
        gpu: {
          requestAdapter: async () => null,
        },
      },
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('adapter-null')
    expect(result.browser.brand).toBe('Microsoft Edge')
    expect(requestDevice).not.toHaveBeenCalled()
  })

  it('fails with requestDevice-rejected and keeps adapter info', async () => {
    const result = await runWebgpuBootProbe({
      canvas: makeCanvas(),
      navigatorLike: {
        userAgent: 'Mozilla/5.0 Chrome/120',
        gpu: {
          requestAdapter: async () => ({
            info: { vendor: 'acme', architecture: 'gpu-1' },
            requestDevice: async () => {
              throw new Error('lost')
            },
          }),
        },
      },
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('requestDevice-rejected')
    expect(result.adapterInfo?.vendor).toBe('acme')
    expect(result.device).toBeNull()
  })

  it('succeeds with adapter + device + configure and records compute', async () => {
    const device = makeDevice()
    ;(device as GpuDeviceLike & { limits: Record<string, number> }).limits = {
      maxTextureDimension2D: 8192,
      maxComputeWorkgroupSizeX: 256,
    }
    const configure = vi.fn()
    const canvas = makeCanvas(configure)
    const result = await runWebgpuBootProbe({
      canvas,
      navigatorLike: {
        userAgent: 'Mozilla/5.0 Chrome/120',
        userAgentData: {
          brands: [
            { brand: 'Chromium', version: '120' },
            { brand: 'Google Chrome', version: '120' },
          ],
        },
        gpu: {
          requestAdapter: async () => ({
            info: { vendor: 'acme', architecture: 'gpu-1', device: 'dev', description: 'test' },
            requestDevice: async () => device,
          }),
          getPreferredCanvasFormat: () => 'bgra8unorm',
        },
      },
    })
    expect(result.ok).toBe(true)
    expect(result.device).toBe(device)
    expect(result.adapterInfo?.vendor).toBe('acme')
    expect(result.limits?.maxTextureDimension2D).toBe(8192)
    expect(result.compute).toBe('passed')
    expect(result.reason).toBeNull()
    expect(result.browser.brand).toBe('Google Chrome')
    expect(configure).toHaveBeenCalled()
  })

  it('records ignoredForceGl without changing a successful outcome', async () => {
    const device = makeDevice()
    const result = await runWebgpuBootProbe({
      canvas: makeCanvas(),
      search: '?renderer=webgl',
      navigatorLike: {
        userAgent: 'Mozilla/5.0 Chrome/120',
        gpu: {
          requestAdapter: async () => ({
            info: { vendor: 'acme' },
            requestDevice: async () => device,
          }),
          getPreferredCanvasFormat: () => 'bgra8unorm',
        },
      },
    })
    expect(result.ok).toBe(true)
    expect(result.ignoredForceGl).toBe(true)
  })

  it('fails configure without calling a second requestDevice on gpu', async () => {
    const requestDevice = vi.fn()
    const result = await runWebgpuBootProbe({
      canvas: {
        width: 1,
        height: 1,
        getContext: () => null,
      },
      navigatorLike: {
        userAgent: 'Mozilla/5.0 Chrome/120',
        gpu: {
          requestAdapter: async () => ({
            requestDevice: async () => makeDevice(),
          }),
          requestDevice,
        } as never,
      },
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('configure-failed')
    expect(requestDevice).not.toHaveBeenCalled()
  })
})

describe('createGameRenderer', () => {
  it('throws and never constructs a GL renderer when the probe failed', async () => {
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
    await expect(
      createGameRenderer({} as HTMLCanvasElement, { preference: 'webgl' }),
    ).rejects.toBeInstanceOf(WebgpuRequiredError)
  })

  it('throws when the probe has not run', async () => {
    await expect(
      createGameRenderer({} as HTMLCanvasElement, { preference: 'webgpu' }),
    ).rejects.toBeInstanceOf(WebgpuRequiredError)
  })
})
