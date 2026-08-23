/**
 * WebGPU boot probe. Owns the single GPUDevice HarborGlow will use.
 *
 * Three's WebGPURenderer.init() must receive this device so it does not call
 * requestAdapter/requestDevice a second time (Chrome/Edge flake). A failed
 * probe never constructs a scene renderer — WebGL rescue is deferred.
 */

import type { GpuDeviceLike } from './gpuChores/types'

export type WebgpuProbeCompute = 'not-run' | 'passed' | 'failed' | 'unsupported'

export interface WebgpuProbeBrowser {
  brand: string
  version?: string
  ua: string
}

export interface WebgpuProbeAdapterInfo {
  vendor?: string
  architecture?: string
  device?: string
  description?: string
}

/** JSON published on window.webgpuProbe (no live GPUDevice). */
export interface WebgpuProbePublic {
  ok: boolean
  browser: WebgpuProbeBrowser
  adapterInfo: WebgpuProbeAdapterInfo | null
  limits: Record<string, number> | null
  compute: WebgpuProbeCompute
  reason: string | null
  ignoredForceGl: boolean
  grantedFeatures?: string[]
  grantedLimits?: Record<string, number>
  requestedFeatures?: string[]
  requestedLimits?: Record<string, number>
  ready?: Promise<void>
}

export interface WebgpuProbeOutcome extends WebgpuProbePublic {
  device: GpuDeviceLike | null
}

export const OPTIONAL_FEATURES = [
  'float32-filterable',
  'timestamp-query',
  'rg11b10ufloat-renderable',
  'texture-compression-bc',
  'texture-compression-etc2',
  'texture-compression-astc',
] as const

export const TARGET_LIMITS: Record<string, number> = {
  maxTextureDimension2D: 8192,
  maxBufferSize: 256 * 1024 * 1024,
  maxStorageBufferBindingSize: 128 * 1024 * 1024,
  maxComputeWorkgroupSizeX: 256,
}

export class WebgpuRequiredError extends Error {
  readonly reason: string

  constructor(reason: string, message?: string) {
    super(message ?? `WebGPU is required (${reason})`)
    this.name = 'WebgpuRequiredError'
    this.reason = reason
  }
}

const LIMIT_KEYS = [
  'maxTextureDimension2D',
  'maxBufferSize',
  'maxStorageBufferBindingSize',
  'maxComputeWorkgroupSizeX',
  'maxComputeInvocationsPerWorkgroup',
  'maxComputeWorkgroupsPerDimension',
  'maxBindGroups',
] as const

const TRIVIAL_COMPUTE_WGSL = `@compute @workgroup_size(1)
fn main() {}`

const FORCE_GL_STORAGE_KEY = 'harborglow.renderer.preference'

type ProbeCanvas = {
  width: number
  height: number
  getContext: (type: string) => unknown
}

type ProbeAdapter = {
  info?: WebgpuProbeAdapterInfo | null
  limits?: Record<string, number>
  features?: { has: (feature: string) => boolean; forEach?: (cb: (f: string) => void) => void }
  requestDevice: (desc?: unknown) => Promise<GpuDeviceLike>
  requestAdapterInfo?: () => Promise<WebgpuProbeAdapterInfo>
}

type ProbeGpu = {
  requestAdapter: (opts?: { powerPreference?: string }) => Promise<ProbeAdapter | null>
  getPreferredCanvasFormat?: () => string
}

let lastProbe: WebgpuProbeOutcome | null = null

export function getWebgpuProbe(): WebgpuProbeOutcome | null {
  return lastProbe
}

export function toWebgpuProbePublic(outcome: WebgpuProbeOutcome): WebgpuProbePublic {
  return {
    ok: outcome.ok,
    browser: outcome.browser,
    adapterInfo: outcome.adapterInfo,
    limits: outcome.limits,
    compute: outcome.compute,
    reason: outcome.reason,
    ignoredForceGl: outcome.ignoredForceGl,
    grantedFeatures: outcome.grantedFeatures,
    grantedLimits: outcome.grantedLimits,
    requestedFeatures: outcome.requestedFeatures,
    requestedLimits: outcome.requestedLimits,
    ready: outcome.ready,
  }
}

export function publishWebgpuProbe(outcome: WebgpuProbeOutcome): WebgpuProbeOutcome {
  lastProbe = outcome
  if (typeof window !== 'undefined') {
    ;(window as unknown as { webgpuProbe: WebgpuProbePublic }).webgpuProbe =
      toWebgpuProbePublic(outcome)
  }
  return outcome
}

export function resetWebgpuProbe(): void {
  lastProbe = null
  if (typeof window !== 'undefined') {
    delete (window as unknown as { webgpuProbe?: WebgpuProbePublic }).webgpuProbe
  }
}

export function detectBrowserBrand(
  nav: {
    userAgent?: string
    userAgentData?: { brands?: { brand: string; version: string }[] }
  } = typeof navigator !== 'undefined' ? navigator : {},
): WebgpuProbeBrowser {
  const ua = nav.userAgent ?? ''
  const brands = nav.userAgentData?.brands
  if (Array.isArray(brands) && brands.length > 0) {
    const edge = brands.find((b) => /Edge/i.test(b.brand))
    const chrome = brands.find((b) => /Google Chrome|^Chrome$/i.test(b.brand))
    const other = brands.find(
      (b) =>
        b.brand !== 'Chromium' &&
        !/^Not[ :_]/i.test(b.brand) &&
        !/Not.A.Brand/i.test(b.brand),
    )
    const pick = edge ?? chrome ?? other
    if (pick) return { brand: pick.brand, version: pick.version, ua }
  }

  const edgeVer = ua.match(/Edg(?:e|A|iOS)?\/(\d[\d.]*)/)
  if (edgeVer) return { brand: 'Microsoft Edge', version: edgeVer[1], ua }

  const chromeVer = ua.match(/Chrome\/(\d[\d.]*)/)
  if (chromeVer) return { brand: 'Google Chrome', version: chromeVer[1], ua }

  const firefoxVer = ua.match(/Firefox\/(\d[\d.]*)/)
  if (firefoxVer) return { brand: 'Firefox', version: firefoxVer[1], ua }

  const safariVer = ua.match(/Version\/(\d[\d.]*)/)
  if (/Safari\//.test(ua) && safariVer) return { brand: 'Safari', version: safariVer[1], ua }

  return { brand: 'unknown', ua }
}

export function wasForceGlRequested(
  search = typeof window === 'undefined' ? '' : window.location.search,
): boolean {
  const raw = new URLSearchParams(search).get('renderer')
  if (raw === 'webgl') return true
  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage.getItem(FORCE_GL_STORAGE_KEY) === 'webgl') return true
    } catch {
      // private mode
    }
  }
  return false
}

function pickAdapterInfo(info: WebgpuProbeAdapterInfo | null | undefined): WebgpuProbeAdapterInfo | null {
  if (!info || typeof info !== 'object') return null
  const picked: WebgpuProbeAdapterInfo = {}
  if (info.vendor) picked.vendor = info.vendor
  if (info.architecture) picked.architecture = info.architecture
  if (info.device) picked.device = info.device
  if (info.description) picked.description = info.description
  return Object.keys(picked).length > 0 ? picked : null
}

function pickLimits(source: Record<string, number> | undefined | null): Record<string, number> | null {
  if (!source) return null
  const limits: Record<string, number> = {}
  for (const key of LIMIT_KEYS) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) limits[key] = value
  }
  return Object.keys(limits).length > 0 ? limits : null
}

function fail(
  partial: Partial<WebgpuProbeOutcome> & { reason: string; browser: WebgpuProbeBrowser; ignoredForceGl: boolean },
): WebgpuProbeOutcome {
  return publishWebgpuProbe({
    ok: false,
    adapterInfo: null,
    limits: null,
    compute: 'not-run',
    device: null,
    ...partial,
  })
}

async function readAdapterInfo(adapter: ProbeAdapter): Promise<WebgpuProbeAdapterInfo | null> {
  const direct = pickAdapterInfo(adapter.info)
  if (direct) return direct
  if (typeof adapter.requestAdapterInfo === 'function') {
    try {
      return pickAdapterInfo(await adapter.requestAdapterInfo())
    } catch {
      return null
    }
  }
  return null
}

function resolveProbeCanvas(explicit?: ProbeCanvas | null): ProbeCanvas | null {
  if (explicit) return explicit
  if (typeof document === 'undefined') return null
  const el = document.createElement('canvas')
  el.width = 1
  el.height = 1
  return el
}

function configureCanvas(device: GpuDeviceLike, canvas: ProbeCanvas, gpu: ProbeGpu): boolean {
  const ctx = canvas.getContext('webgpu') as { configure?: (desc: Record<string, unknown>) => void } | null
  if (!ctx || typeof ctx.configure !== 'function') return false
  const format = typeof gpu.getPreferredCanvasFormat === 'function' ? gpu.getPreferredCanvasFormat() : 'bgra8unorm'
  ctx.configure({
    device,
    format,
    alphaMode: 'opaque',
    usage: 0x10, // GPUTextureUsage.RENDER_ATTACHMENT
  })
  return true
}

async function runTrivialCompute(device: GpuDeviceLike): Promise<WebgpuProbeCompute> {
  if (typeof device.createShaderModule !== 'function' || typeof device.createComputePipeline !== 'function') {
    return 'unsupported'
  }
  try {
    const module = device.createShaderModule({ code: TRIVIAL_COMPUTE_WGSL })
    const pipeline = device.createComputePipeline({
      layout: 'auto',
      compute: { module, entryPoint: 'main' },
    })
    const encoder = device.createCommandEncoder()
    const pass = encoder.beginComputePass()
    pass.setPipeline(pipeline)
    pass.dispatchWorkgroups(1)
    pass.end()
    device.queue.submit([encoder.finish()])
    const done = (device.queue as GpuDeviceLike['queue'] & { onSubmittedWorkDone?: () => Promise<void> })
      .onSubmittedWorkDone
    if (typeof done === 'function') await done.call(device.queue)
    return 'passed'
  } catch {
    return 'failed'
  }
}

export interface RunWebgpuBootProbeOptions {
  canvas?: ProbeCanvas | null
  search?: string
  navigatorLike?: {
    gpu?: ProbeGpu
    userAgent?: string
    userAgentData?: { brands?: { brand: string; version: string }[] }
  }
}

/**
 * Probe adapter + device + canvas configure. Optional trivial compute is recorded
 * but does not fail the probe. Always publishes window.webgpuProbe.
 */
export async function runWebgpuBootProbe(
  options: RunWebgpuBootProbeOptions = {},
): Promise<WebgpuProbeOutcome> {
  const nav =
    options.navigatorLike ??
    (typeof navigator !== 'undefined' ? (navigator as RunWebgpuBootProbeOptions['navigatorLike']) : undefined)
  const browser = detectBrowserBrand(nav ?? {})
  const ignoredForceGl = wasForceGlRequested(options.search)
  const gpu = nav?.gpu

  if (!gpu || typeof gpu.requestAdapter !== 'function') {
    return fail({ reason: 'no-gpu', browser, ignoredForceGl })
  }

  let adapter: ProbeAdapter | null
  try {
    adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' })
  } catch {
    return fail({
      reason: 'adapter-null',
      browser,
      ignoredForceGl,
      adapterInfo: null,
    })
  }

  if (!adapter) {
    return fail({ reason: 'adapter-null', browser, ignoredForceGl })
  }

  const adapterInfo = await readAdapterInfo(adapter)

  let device: GpuDeviceLike
  const requiredLimits: Record<string, number> = {}
  if (adapter.limits) {
    for (const [k, wanted] of Object.entries(TARGET_LIMITS)) {
      const have = adapter.limits[k]
      if (have == null) continue
      requiredLimits[k] = k.startsWith('min') ? Math.max(wanted, have) : Math.min(wanted, have)
    }
  }

  const requestedFeatures = OPTIONAL_FEATURES.filter(f => adapter?.features?.has(f))

  try {
    device = await adapter.requestDevice({
      label: 'harborglow-gpu',
      requiredFeatures: requestedFeatures,
      requiredLimits,
    })
  } catch {
    try {
      device = await adapter.requestDevice({})
    } catch {
      return fail({
        reason: 'requestDevice-rejected',
        browser,
        ignoredForceGl,
        adapterInfo,
      })
    }
  }

  if (device && (device as any).lost) {
    (device as any).lost.then((info: any) => {
      if (info.reason === 'destroyed') return
      if (typeof window !== 'undefined' && (window as any).webgpuProbe) {
        (window as any).webgpuProbe.reason = 'device-lost'
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gpu-fatal', { detail: info?.message || 'Device lost' }))
      }
    })
  }

  const grantedFeatures: string[] = []
  if ((device as any).features?.forEach) {
    (device as any).features.forEach((f: string) => grantedFeatures.push(f))
  } else if ((device as any).features?.has) {
    // Fallback if no forEach, we can't easily iterate Set-like if not array, but we can check optional ones
    OPTIONAL_FEATURES.forEach(f => {
      if ((device as any).features.has(f)) grantedFeatures.push(f)
    })
  }
  const grantedLimits = { ...((device as any).limits || adapter.limits || {}) }

  const limits = pickLimits(
    (device as GpuDeviceLike & { limits?: Record<string, number> }).limits ?? adapter.limits,
  )

  const canvas = resolveProbeCanvas(options.canvas)
  if (!canvas) {
    return fail({
      reason: 'configure-failed',
      browser,
      ignoredForceGl,
      adapterInfo,
      limits,
      device: null,
    })
  }

  try {
    if (!configureCanvas(device, canvas, gpu)) {
      return fail({
        reason: 'configure-failed',
        browser,
        ignoredForceGl,
        adapterInfo,
        limits,
        device: null,
      })
    }
  } catch {
    return fail({
      reason: 'configure-failed',
      browser,
      ignoredForceGl,
      adapterInfo,
      limits,
      device: null,
    })
  }

  const compute = await runTrivialCompute(device)

  return publishWebgpuProbe({
    ok: true,
    browser,
    adapterInfo,
    limits,
    compute,
    reason: null,
    ignoredForceGl,
    device,
    grantedFeatures,
    grantedLimits,
    requestedFeatures,
    requestedLimits: requiredLimits,
    ready: Promise.resolve(),
  })
}
