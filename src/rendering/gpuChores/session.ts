import * as THREE from 'three'
import type { ComputeProbeStatus } from '../types'
import { getRendererDiagnostics } from '../rendererState'
import { getWebgpuProbe } from '../webgpuProbe'
import { selectChoreBackend } from './backend'
import { publishGpuChoresBreadcrumb } from './breadcrumbs'
import { adoptComputeDevice, resolveGpuTexture } from './deviceAdopt'
import { GpuChorePipelines } from './gpuPipelines'
import {
  downsample2d,
  exposureFromLogAverage,
  logAverageLuma,
  lumaHistogramBt709,
  reduceLuma,
  separableBlur,
} from './jsJobs'
import { parseNoGpuCompute } from './killSwitch'
import { composerColorTexture, sampleTinyRgba } from './sampleTiny'
import {
  defaultGpuChoresBreadcrumb,
  METER_HEIGHT,
  METER_WIDTH,
  type GpuChoreBackend,
  type GpuChoreJobStatus,
  type GpuDeviceLike,
} from './types'

const HIST_PERIOD = 8
const BLUR_OFFSET = 4
const EXPOSURE_LERP = 0.08
const BLUR_W = 32
const BLUR_H = 18

type SessionRenderer = {
  backend?: { isWebGPUBackend?: boolean; device?: GpuDeviceLike | null; get?: (resource: unknown) => unknown }
  toneMappingExposure?: number
  domElement?: HTMLCanvasElement
  setRenderTarget?: (target: THREE.WebGLRenderTarget | null) => void
  getRenderTarget?: () => THREE.WebGLRenderTarget | null
  render?: (scene: THREE.Scene, camera: THREE.Camera) => void
  readRenderTargetPixels?: (
    target: THREE.WebGLRenderTarget,
    x: number,
    y: number,
    w: number,
    h: number,
    buffer: ArrayBufferView,
  ) => void
}

export interface GpuChoreTickArgs {
  renderer: SessionRenderer
  composer?: {
    readBuffer?: { texture?: THREE.Texture }
    writeBuffer?: { texture?: THREE.Texture }
    renderTarget2?: { texture?: THREE.Texture }
  } | null
  dofEnabled?: boolean
}

export class GpuChoreSession {
  private renderer: SessionRenderer | null = null
  private pipelines: GpuChorePipelines | null = null
  private gpuLatchedOff = false
  private frame = 0
  private meterPixels = new Uint8Array(METER_WIDTH * METER_HEIGHT * 4)
  private halfPixels = new Uint8Array(BLUR_W * BLUR_H * 4)
  private blurPixels = new Uint8Array(BLUR_W * BLUR_H * 4)
  private blurTemp = new Uint8Array(BLUR_W * BLUR_H * 4)
  private histInflight = false
  private exposure = 1
  private blurMap: THREE.DataTexture | null = null
  private hasBlur = false
  private backend: GpuChoreBackend = 'off'
  private lastError: string | null = null

  attach(renderer: SessionRenderer): void {
    this.detach()
    this.renderer = renderer
    this.gpuLatchedOff = false
    this.lastError = null
    this.frame = 0
    this.exposure = typeof renderer.toneMappingExposure === 'number' ? renderer.toneMappingExposure : 1
    this.blurMap = new THREE.DataTexture(this.blurPixels, BLUR_W, BLUR_H, THREE.RGBAFormat)
    this.blurMap.minFilter = THREE.LinearFilter
    this.blurMap.magFilter = THREE.LinearFilter
    this.blurMap.needsUpdate = true

    const killSwitch = parseNoGpuCompute()
    const diag = getRendererDiagnostics()
    if (getWebgpuProbe()?.ok === false) {
      this.gpuLatchedOff = true
      this.backend = 'off'
      this.publish({
        killSwitch,
        backend: 'off',
        deviceAdopted: false,
        lastError: getWebgpuProbe()?.reason ?? 'webgpu-probe-failed',
      })
      return
    }

    const device = adoptComputeDevice(renderer)
    this.backend = selectChoreBackend({
      killSwitch,
      activeBackend: diag.activeBackend,
      computeProbe: diag.computeProbe,
      device,
      wasmAvailable: false,
    })

    if (this.backend === 'webgpu' && device) {
      const pipes = new GpuChorePipelines(device)
      if (pipes.init()) {
        this.pipelines = pipes
      } else {
        this.degrade(pipes.error ?? 'gpu chore pipeline init failed')
      }
    }

    this.publish({
      killSwitch,
      backend: this.backend,
      deviceAdopted: device != null,
      lastError: this.lastError,
    })
  }

  detach(): void {
    this.pipelines?.destroy()
    this.pipelines = null
    this.blurMap?.dispose()
    this.blurMap = null
    this.renderer = null
    this.hasBlur = false
    this.histInflight = false
  }

  getBlurTexture(): THREE.DataTexture | null {
    return this.blurMap
  }

  blurReady(): boolean {
    return this.hasBlur
  }

  tick(args: GpuChoreTickArgs): void {
    const renderer = args.renderer ?? this.renderer
    if (!renderer) return
    this.renderer = renderer
    this.frame += 1

    const killSwitch = parseNoGpuCompute()
    const diag = getRendererDiagnostics()
    if (getWebgpuProbe()?.ok === false) {
      this.gpuLatchedOff = true
      this.backend = 'off'
      return
    }
    if (!this.gpuLatchedOff) {
      const device = adoptComputeDevice(renderer)
      this.backend = selectChoreBackend({
        killSwitch,
        activeBackend: diag.activeBackend,
        computeProbe: diag.computeProbe as ComputeProbeStatus,
        device: this.pipelines ? device : null,
        wasmAvailable: false,
      })
      if (this.backend === 'webgpu' && !this.pipelines && device && diag.computeProbe === 'passed') {
        const pipes = new GpuChorePipelines(device)
        if (pipes.init()) this.pipelines = pipes
        else this.degrade(pipes.error ?? 'gpu chore pipeline init failed')
      }
    }

    const srcTex = composerColorTexture(args.composer ?? null)
    const doHist = this.frame % HIST_PERIOD === 1
    const doBlur = args.dofEnabled !== false && this.frame % HIST_PERIOD === BLUR_OFFSET

    if (doHist) this.tickHistogram(renderer, srcTex)
    if (doBlur) this.tickBlur(renderer, srcTex)

    if (typeof renderer.toneMappingExposure === 'number') {
      renderer.toneMappingExposure += (this.exposure - renderer.toneMappingExposure) * EXPOSURE_LERP
    }
  }

  private tickHistogram(renderer: SessionRenderer, srcTex: THREE.Texture | null): void {
    const gpuTex = srcTex ? resolveGpuTexture(renderer, srcTex) : null
    if (this.backend === 'webgpu' && this.pipelines && gpuTex && !this.histInflight) {
      const width = gpuTex.width ?? METER_WIDTH
      const height = gpuTex.height ?? METER_HEIGHT
      this.histInflight = true
      try {
        const view = gpuTex.createView()
        void this.pipelines
          .dispatchHistogram(view, width, height)
          .then((bins) => {
            this.applyHistogram(bins, 'webgpu')
            this.histInflight = false
          })
          .catch((err) => {
            this.histInflight = false
            this.degrade(err instanceof Error ? err.message : String(err))
            this.histogramFromTiny(renderer, srcTex)
          })
        return
      } catch (err) {
        this.histInflight = false
        this.degrade(err instanceof Error ? err.message : String(err))
      }
    }
    this.histogramFromTiny(renderer, srcTex)
  }

  private histogramFromTiny(renderer: SessionRenderer, srcTex: THREE.Texture | null): void {
    if (!sampleTinyRgba(renderer, srcTex, this.meterPixels)) {
      this.publishJob('luma_histogram_bt709', 'skipped')
      this.publishJob('reduce', 'skipped')
      return
    }
    const status: GpuChoreJobStatus = this.backend === 'wasm' ? 'wasm' : 'js'
    const bins = lumaHistogramBt709(this.meterPixels, METER_WIDTH * METER_HEIGHT, 4, false)
    this.applyHistogram(bins, status)
    const meters = reduceLuma(this.meterPixels, METER_WIDTH * METER_HEIGHT, 4, false)
    this.publishJob('reduce', status)
    publishGpuChoresBreadcrumb({ meters: { mean: meters.mean, max: meters.max } }, renderer.domElement)
  }

  private applyHistogram(bins: Uint32Array, status: GpuChoreJobStatus): void {
    const logAvg = logAverageLuma(bins)
    this.exposure = exposureFromLogAverage(logAvg)
    this.publishJob('luma_histogram_bt709', status)
    if (status === 'webgpu') {
      // Reduce meters from the same 256-bin readback (no extra image read).
      let sum = 0
      let count = 0
      let maxBin = 0
      for (let i = 0; i < bins.length; i++) {
        const n = bins[i]
        if (!n) continue
        sum += n * ((i + 0.5) / bins.length)
        count += n
        if (i > maxBin && n > 0) maxBin = i
      }
      this.publishJob('reduce', 'webgpu')
      publishGpuChoresBreadcrumb(
        { meters: { mean: count ? sum / count : 0, max: (maxBin + 0.5) / bins.length } },
        this.renderer?.domElement,
      )
    }
  }

  private tickBlur(renderer: SessionRenderer, srcTex: THREE.Texture | null): void {
    if (!sampleTinyRgba(renderer, srcTex, this.meterPixels)) {
      this.publishJob('downsample_2d', 'skipped')
      this.publishJob('separable_blur', 'skipped')
      return
    }
    const status: GpuChoreJobStatus = this.backend === 'wasm' ? 'wasm' : 'js'
    downsample2d(this.meterPixels, METER_WIDTH, METER_HEIGHT, BLUR_W, BLUR_H, this.halfPixels)
    separableBlur(this.halfPixels, BLUR_W, BLUR_H, this.blurPixels, this.blurTemp)
    this.publishJob('downsample_2d', status)
    this.publishJob('separable_blur', status)
    if (this.blurMap) {
      this.blurMap.needsUpdate = true
      this.hasBlur = true
    }
  }

  private degrade(message: string): void {
    this.gpuLatchedOff = true
    this.lastError = message
    this.backend = 'js'
    this.pipelines?.destroy()
    this.pipelines = null
    this.publish({
      backend: 'js',
      lastError: message,
    })
  }

  private publishJob(
    job: 'luma_histogram_bt709' | 'downsample_2d' | 'separable_blur' | 'reduce',
    status: GpuChoreJobStatus,
  ): void {
    publishGpuChoresBreadcrumb({ jobs: { [job]: status } }, this.renderer?.domElement)
  }

  private publish(partial: Parameters<typeof publishGpuChoresBreadcrumb>[0]): void {
    publishGpuChoresBreadcrumb(
      {
        backend: this.backend,
        ...partial,
      },
      this.renderer?.domElement,
    )
  }
}

let singleton: GpuChoreSession | null = null

export function getGpuChoreSession(): GpuChoreSession {
  if (!singleton) singleton = new GpuChoreSession()
  return singleton
}

export function resetGpuChoreSession(): void {
  singleton?.detach()
  singleton = null
}
