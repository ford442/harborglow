import { HIST_BINS, type GpuBufferLike, type GpuComputePipelineLike, type GpuDeviceLike } from './types'
import {
  DOWNSAMPLE_2D_WGSL,
  LUMA_HISTOGRAM_BT709_WGSL,
  REDUCE_WGSL,
  SEPARABLE_BLUR_WGSL,
} from './shaders'

/** GPUBufferUsage bitflags (avoid depending on DOM WebGPU lib types). */
const BUF_MAP_READ = 0x0001
const BUF_COPY_SRC = 0x0004
const BUF_COPY_DST = 0x0008
const BUF_STORAGE = 0x0080
const MAP_READ = 0x0001

export class GpuChorePipelines {
  histPipeline: GpuComputePipelineLike | null = null
  downsamplePipeline: GpuComputePipelineLike | null = null
  blurPipeline: GpuComputePipelineLike | null = null
  reducePipeline: GpuComputePipelineLike | null = null
  binsBuffer: GpuBufferLike | null = null
  histStaging: GpuBufferLike | null = null
  reduceBuffer: GpuBufferLike | null = null
  reduceStaging: GpuBufferLike | null = null
  error: string | null = null

  constructor(readonly device: GpuDeviceLike) {}

  init(): boolean {
    try {
      const histMod = this.device.createShaderModule({ code: LUMA_HISTOGRAM_BT709_WGSL })
      this.histPipeline = this.device.createComputePipeline({
        layout: 'auto',
        compute: { module: histMod, entryPoint: 'main' },
      })
      const dsMod = this.device.createShaderModule({ code: DOWNSAMPLE_2D_WGSL })
      this.downsamplePipeline = this.device.createComputePipeline({
        layout: 'auto',
        compute: { module: dsMod, entryPoint: 'main' },
      })
      const blurMod = this.device.createShaderModule({ code: SEPARABLE_BLUR_WGSL })
      this.blurPipeline = this.device.createComputePipeline({
        layout: 'auto',
        compute: { module: blurMod, entryPoint: 'main' },
      })
      const reduceMod = this.device.createShaderModule({ code: REDUCE_WGSL })
      this.reducePipeline = this.device.createComputePipeline({
        layout: 'auto',
        compute: { module: reduceMod, entryPoint: 'main' },
      })

      this.binsBuffer = this.device.createBuffer({
        size: HIST_BINS * 4,
        usage: BUF_STORAGE | BUF_COPY_SRC | BUF_COPY_DST,
      })
      this.histStaging = this.device.createBuffer({
        size: HIST_BINS * 4,
        usage: BUF_MAP_READ | BUF_COPY_DST,
      })
      this.reduceBuffer = this.device.createBuffer({
        size: 12,
        usage: BUF_STORAGE | BUF_COPY_SRC | BUF_COPY_DST,
      })
      this.reduceStaging = this.device.createBuffer({
        size: 12,
        usage: BUF_MAP_READ | BUF_COPY_DST,
      })
      return true
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err)
      this.destroy()
      return false
    }
  }

  async dispatchHistogram(
    srcView: unknown,
    width: number,
    height: number,
  ): Promise<Uint32Array> {
    const pipeline = this.histPipeline
    const bins = this.binsBuffer
    const staging = this.histStaging
    if (!pipeline || !bins || !staging) throw new Error('histogram pipeline not ready')

    this.device.queue.writeBuffer(bins, 0, new Uint32Array(HIST_BINS))
    const bindGroup = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: srcView },
        { binding: 1, resource: { buffer: bins } },
      ],
    })
    const encoder = this.device.createCommandEncoder()
    const pass = encoder.beginComputePass()
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8), 1)
    pass.end()
    encoder.copyBufferToBuffer(bins, 0, staging, 0, HIST_BINS * 4)
    this.device.queue.submit([encoder.finish()])

    await staging.mapAsync(MAP_READ)
    const copy = new Uint32Array(staging.getMappedRange().slice(0))
    staging.unmap()
    return copy
  }

  destroy(): void {
    this.binsBuffer?.destroy?.()
    this.histStaging?.destroy?.()
    this.reduceBuffer?.destroy?.()
    this.reduceStaging?.destroy?.()
    this.histPipeline = null
    this.downsamplePipeline = null
    this.blurPipeline = null
    this.reducePipeline = null
    this.binsBuffer = null
    this.histStaging = null
    this.reduceBuffer = null
    this.reduceStaging = null
  }
}
