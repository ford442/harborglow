import { afterEach, describe, expect, it, vi } from 'vitest'
import { GPU_TEXTURE_USAGE, HARBOR_CANVAS_USAGE } from '../canvasSurface'
import { createGameRenderer, resolveContextOptions } from '../createRenderer'
import { parseRendererPreference } from '../rendererConfig'
import {
  detectBrowserBrand,
  getWebgpuProbe,
  onWebgpuDeviceLost,
  publishWebgpuProbe,
  reportWebgpuDeviceLost,
  resetWebgpuProbe,
  runWebgpuBootProbe,
  wasForceGlRequested,
  WebgpuRequiredError,
} from '../webgpuProbe'
import type { GpuDeviceLike } from '../gpuChores/types'

const threeWebgpu = vi.hoisted(() => ({ instances: [] as Array<Record<string, any>> }))

vi.mock('three/webgpu', () => ({
  WebGPURenderer: class {
    backend = { isWebGPUBackend: true }
    domElement = {}
    shadowMap = { enabled: false, type: null }
    toneMapping = 0
    toneMappingExposure = 1
    outputColorSpace = ''
    options: unknown
    _isDeviceLost = false
    onDeviceLost: ((info: unknown) => void) | null = null
    init = vi.fn(async () => undefined)
    dispose = vi.fn()
    setAnimationLoop = vi.fn()
    setClearColor = vi.fn()
    constructor(options: unknown) {
      this.options = options
      threeWebgpu.instances.push(this as unknown as Record<string, any>)
    }
  },
}))

afterEach(() => {
  threeWebgpu.instances.length = 0
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

function deferredLost() {
  let resolve!: (info: { reason?: string; message?: string }) => void
  const lost = new Promise<{ reason?: string; message?: string }>((r) => {
    resolve = r
  })
  return { lost, resolve }
}

function okNavigator(device: GpuDeviceLike) {
  return {
    userAgent: 'Mozilla/5.0 Chrome/120',
    gpu: {
      requestAdapter: async () => ({
        info: { vendor: 'acme' },
        requestDevice: async () => device,
      }),
      getPreferredCanvasFormat: () => 'bgra8unorm',
    },
  }
}

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('canvas surface', () => {
  it('configures the probe swapchain with RENDER_ATTACHMENT | COPY_SRC and opaque alpha', async () => {
    const configure = vi.fn()
    const result = await runWebgpuBootProbe({
      canvas: makeCanvas(configure),
      navigatorLike: okNavigator(makeDevice()),
    })
    expect(result.ok).toBe(true)
    const desc = configure.mock.calls[0][0]
    expect(desc.usage).toBe(HARBOR_CANVAS_USAGE)
    expect(desc.usage & GPU_TEXTURE_USAGE.COPY_SRC).toBe(GPU_TEXTURE_USAGE.COPY_SRC)
    expect(desc.usage & GPU_TEXTURE_USAGE.RENDER_ATTACHMENT).toBe(GPU_TEXTURE_USAGE.RENDER_ATTACHMENT)
    expect(desc.alphaMode).toBe('opaque')
    expect(result.canvas).toEqual({ format: 'bgra8unorm', alphaMode: 'opaque', usage: HARBOR_CANVAS_USAGE })
  })

  it('derives premultipliedAlpha from alpha so it cannot disagree with alphaMode', () => {
    expect(resolveContextOptions({}).alpha).toBe(false)
    expect(resolveContextOptions({}).premultipliedAlpha).toBe(false)
    expect(resolveContextOptions({ premultipliedAlpha: true }).premultipliedAlpha).toBe(false)
    expect(resolveContextOptions({ alpha: true }).premultipliedAlpha).toBe(true)
  })
})

describe('device lost', () => {
  it('republishes the probe as failed, notifies listeners and dispatches gpu-fatal', async () => {
    vi.stubGlobal('window', Object.assign(new EventTarget(), { localStorage: { getItem: () => null } }))
    const { lost, resolve } = deferredLost()
    const device = Object.assign(makeDevice(), { lost })
    await runWebgpuBootProbe({ canvas: makeCanvas(), search: '', navigatorLike: okNavigator(device) })
    expect(getWebgpuProbe()?.ok).toBe(true)

    const listener = vi.fn()
    onWebgpuDeviceLost(listener)
    const fatal = vi.fn()
    window.addEventListener('gpu-fatal', fatal)
    resolve({ reason: 'unknown', message: 'TDR' })
    await flush()

    expect(getWebgpuProbe()).toMatchObject({ ok: false, reason: 'device-lost', device: null, deviceLostMessage: 'TDR' })
    expect((window as unknown as { webgpuProbe: { reason: string } }).webgpuProbe.reason).toBe('device-lost')
    expect(listener).toHaveBeenCalledWith({ reason: 'unknown', message: 'TDR' })
    expect(fatal).toHaveBeenCalledTimes(1)
    expect((fatal.mock.calls[0][0] as CustomEvent).detail).toBe('TDR')
  })

  it("ignores reason 'destroyed'", async () => {
    const { lost, resolve } = deferredLost()
    const device = Object.assign(makeDevice(), { lost })
    await runWebgpuBootProbe({ canvas: makeCanvas(), navigatorLike: okNavigator(device) })
    const listener = vi.fn()
    onWebgpuDeviceLost(listener)
    resolve({ reason: 'destroyed', message: '' })
    await flush()
    expect(getWebgpuProbe()?.ok).toBe(true)
    expect(listener).not.toHaveBeenCalled()
  })

  it('reports once even when the probe watcher and Three both fire', async () => {
    const { lost, resolve } = deferredLost()
    const device = Object.assign(makeDevice(), { lost })
    await runWebgpuBootProbe({ canvas: makeCanvas(), navigatorLike: okNavigator(device) })
    const listener = vi.fn()
    onWebgpuDeviceLost(listener)
    reportWebgpuDeviceLost({ reason: 'unknown', message: 'from three' })
    resolve({ reason: 'unknown', message: 'from probe' })
    await flush()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(getWebgpuProbe()?.deviceLostMessage).toBe('from three')
  })

  it('disposes the live renderer and stops its loop instead of leaving a frozen canvas', async () => {
    const { lost, resolve } = deferredLost()
    const device = Object.assign(makeDevice(), { lost })
    await runWebgpuBootProbe({ canvas: makeCanvas(), navigatorLike: okNavigator(device) })
    await createGameRenderer({} as HTMLCanvasElement, { preference: 'webgpu' })
    const renderer = threeWebgpu.instances[0]
    expect(renderer.options).toMatchObject({ device, alpha: false })

    resolve({ reason: 'unknown', message: 'gone' })
    await flush()

    expect(renderer._isDeviceLost).toBe(true)
    expect(renderer.setAnimationLoop).toHaveBeenCalledWith(null)
    expect(renderer.dispose).toHaveBeenCalledTimes(1)
  })

  it("routes Three's onDeviceLost through the same path", async () => {
    const device = Object.assign(makeDevice(), { lost: deferredLost().lost })
    await runWebgpuBootProbe({ canvas: makeCanvas(), navigatorLike: okNavigator(device) })
    await createGameRenderer({} as HTMLCanvasElement, { preference: 'webgpu' })
    const renderer = threeWebgpu.instances[0]

    renderer.onDeviceLost({ api: 'WebGPU', message: 'three saw it', reason: 'unknown' })

    expect(getWebgpuProbe()).toMatchObject({ ok: false, reason: 'device-lost' })
    expect(renderer.dispose).toHaveBeenCalledTimes(1)
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
