// =============================================================================
// OCEAN FFT COMPUTE — GPU Stockham IFFT → rgba16float displacement texture
//
// Adopt-only: the boot probe owns the GPUDevice. Butterflies run as raw WGSL
// on that device (ping-pong storage buffers). A Three StorageTexture is
// allocated with renderer.computeAsync so the water material can sample it;
// the pack pass then writes that same GPUTexture.
//
// Everything except the two spectrum uploads and the pack params is built
// once in init(): one uniform buffer per Stockham stage (params never change)
// and one bind group per stage, so dispatch() is a single encoder + submit.
//
// Hull probes keep reading OceanFFTField's CPU grid — this class never
// mapAsync's on the frame path.
// =============================================================================

import * as THREE from 'three/webgpu'
import { compute, Fn, instanceIndex, textureStore, uvec2, vec4 } from 'three/tsl'
import type { OceanFFTField } from '../../systems/ocean/OceanFFTField'
import { adoptComputeDevice, resolveGpuTexture } from '../../rendering/gpuChores'
import type {
  GpuBindGroupLike,
  GpuBufferLike,
  GpuComputePipelineLike,
  GpuDeviceLike,
} from '../../rendering/gpuChores/types'
import type { OceanGpuRenderer } from '../../systems/ocean/oceanGpuGate'
import {
  OCEAN_FFT_BUTTERFLY_WGSL,
  OCEAN_FFT_PACK_WGSL,
  OCEAN_FFT_WORKGROUP,
} from './oceanFftWgsl'

const BUF_COPY_DST = 0x0008
const BUF_STORAGE = 0x0080
const BUF_UNIFORM = 0x0040

function interleave(re: Float32Array, im: Float32Array, out: Float32Array, cells: number): void {
  for (let i = 0; i < cells; i++) {
    out[i * 2] = re[i]
    out[i * 2 + 1] = im[i]
  }
}

interface StagePass {
  height: GpuBindGroupLike
  disp: GpuBindGroupLike
}

export class OceanFFTCompute {
  readonly texture: THREE.StorageTexture
  readonly size: number

  private device: GpuDeviceLike | null = null
  private butterfly: GpuComputePipelineLike | null = null
  private pack: GpuComputePipelineLike | null = null
  private buffers: GpuBufferLike[] = []
  /** Stage 0 input; after an even number of stages the result is back here. */
  private heightA: GpuBufferLike | null = null
  private dispA: GpuBufferLike | null = null
  private packParamsBuf: GpuBufferLike | null = null
  private stages: StagePass[] = []
  private packGroup: GpuBindGroupLike | null = null
  private interleaved = new Float32Array(0)
  private packScratch = new ArrayBuffer(16)
  private initNode: unknown
  private allocated = false
  private failed = false
  warned = false

  constructor(size: number) {
    this.size = size
    const texture = new THREE.StorageTexture(size, size)
    texture.type = THREE.HalfFloatType
    texture.format = THREE.RGBAFormat
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    const storageTex = texture as THREE.StorageTexture & { mipmapsAutoUpdate: boolean }
    storageTex.mipmapsAutoUpdate = false
    texture.colorSpace = THREE.NoColorSpace
    texture.flipY = false
    texture.name = 'oceanFFTDisplacementGpu'
    this.texture = texture

    const writeInit = Fn(() => {
      const posX = instanceIndex.mod(size)
      const posY = instanceIndex.div(size)
      return textureStore(texture, uvec2(posX, posY), vec4(0, 0, 0, 1)).toWriteOnly()
    })
    this.initNode = compute(writeInit(), size * size, [64])
  }

  get ready(): boolean {
    return this.allocated && !this.failed
  }

  get failedToInit(): boolean {
    return this.failed
  }

  /**
   * Allocate the StorageTexture via computeAsync, then compile butterfly/pack
   * pipelines on the adopted device. Safe to call more than once.
   *
   * WGSL compile and pipeline validation errors are reported asynchronously,
   * never thrown, so resource creation runs inside error scopes. Without them
   * a bad shader would leave a flat texture while hull probes ride the CPU
   * waves — exactly the drift the buoyancy contract forbids.
   */
  async init(renderer: unknown): Promise<boolean> {
    if (this.failed) return false
    if (this.allocated) return true
    const gl = renderer as OceanGpuRenderer
    if (typeof gl.computeAsync !== 'function') {
      this.fail('renderer.computeAsync missing')
      return false
    }
    const device = adoptComputeDevice(gl)
    if (!device) {
      this.fail('no adopted GPUDevice')
      return false
    }
    this.device = device

    try {
      await gl.computeAsync(this.initNode)
      const gpuTex = resolveGpuTexture(
        { backend: gl.backend ?? undefined },
        this.texture,
      )
      if (!gpuTex) {
        this.fail('StorageTexture was not adopted by the WebGPU backend')
        return false
      }

      device.pushErrorScope?.('out-of-memory')
      device.pushErrorScope?.('validation')
      this.buildPipelines(device, gpuTex.createView())
      const validation = await device.popErrorScope?.()
      const oom = await device.popErrorScope?.()
      const error = validation ?? oom
      if (error) {
        this.fail(error.message)
        return false
      }

      this.allocated = true
      return true
    } catch (err) {
      this.fail(err instanceof Error ? err.message : String(err))
      return false
    }
  }

  /**
   * Upload the field's frequency-domain grids, IFFT on the GPU, pack Dx/h/Dz.
   * One submit, not awaited (no frame stall, no mapAsync).
   */
  dispatch(field: OceanFFTField): boolean {
    const device = this.device
    const butterfly = this.butterfly
    const pack = this.pack
    if (!this.ready || !device || !butterfly || !pack || !this.packGroup) return false
    if (field.size !== this.size) {
      this.fail('field size changed; recreate OceanFFTCompute')
      return false
    }

    const cells = this.size * this.size
    if (this.interleaved.length < cells * 2) {
      this.interleaved = new Float32Array(cells * 2)
    }

    const { spectrumHRe, spectrumHIm, spectrumDRe, spectrumDIm } = field
    interleave(spectrumHRe, spectrumHIm, this.interleaved, cells)
    device.queue.writeBuffer(this.heightA!, 0, this.interleaved)
    interleave(spectrumDRe, spectrumDIm, this.interleaved, cells)
    device.queue.writeBuffer(this.dispA!, 0, this.interleaved)
    const { amplitude, choppiness } = field.getConfig()
    this.writePackParams(amplitude, choppiness)

    const groups = Math.ceil(this.size / OCEAN_FFT_WORKGROUP)
    const encoder = device.createCommandEncoder()
    const pass = encoder.beginComputePass()
    pass.setPipeline(butterfly)
    for (const stage of this.stages) {
      pass.setBindGroup(0, stage.height)
      pass.dispatchWorkgroups(groups, groups, 1)
      pass.setBindGroup(0, stage.disp)
      pass.dispatchWorkgroups(groups, groups, 1)
    }
    pass.setPipeline(pack)
    pass.setBindGroup(0, this.packGroup)
    pass.dispatchWorkgroups(groups, groups, 1)
    pass.end()
    device.queue.submit([encoder.finish()])
    return true
  }

  dispose(): void {
    for (const buffer of this.buffers) buffer.destroy?.()
    this.buffers = []
    this.heightA = this.dispA = this.packParamsBuf = null
    this.stages = []
    this.packGroup = null
    this.butterfly = this.pack = null
    this.device = null
    this.allocated = false
    this.texture.dispose()
  }

  private fail(message: string): void {
    this.failed = true
    this.allocated = false
    if (!this.warned) {
      this.warned = true
      console.warn('[oceanFFT] GPU path disabled:', message)
    }
  }

  private createBuffer(device: GpuDeviceLike, size: number, usage: number): GpuBufferLike {
    const buffer = device.createBuffer({ size, usage })
    this.buffers.push(buffer)
    return buffer
  }

  private buildPipelines(device: GpuDeviceLike, destView: unknown): void {
    const n = this.size
    const logN = Math.log2(n)
    const bytes = n * n * 8
    const storageUsage = BUF_STORAGE | BUF_COPY_DST
    const heightA = this.createBuffer(device, bytes, storageUsage)
    const heightB = this.createBuffer(device, bytes, storageUsage)
    const dispA = this.createBuffer(device, bytes, storageUsage)
    const dispB = this.createBuffer(device, bytes, storageUsage)
    this.heightA = heightA
    this.dispA = dispA
    this.packParamsBuf = this.createBuffer(device, 16, BUF_UNIFORM | BUF_COPY_DST)

    const butterflyMod = device.createShaderModule({ code: OCEAN_FFT_BUTTERFLY_WGSL })
    const butterfly = device.createComputePipeline({
      layout: 'auto',
      compute: { module: butterflyMod, entryPoint: 'main' },
    })
    const packMod = device.createShaderModule({ code: OCEAN_FFT_PACK_WGSL })
    const pack = device.createComputePipeline({
      layout: 'auto',
      compute: { module: packMod, entryPoint: 'main' },
    })
    this.butterfly = butterfly
    this.pack = pack

    // Rows (axis 0) then columns (axis 1), matching stockham2d. Step k reads
    // A and writes B when k is even, so after 2·log2(N) steps the result is
    // back in A — which is what the pack group binds.
    const layout = butterfly.getBindGroupLayout(0)
    const stageParams = new Uint32Array(4)
    this.stages = []
    for (let axis = 0; axis < 2; axis++) {
      for (let stage = 0; stage < logN; stage++) {
        const params = this.createBuffer(device, 16, BUF_UNIFORM | BUF_COPY_DST)
        stageParams[0] = n
        stageParams[1] = stage
        stageParams[2] = axis
        stageParams[3] = 1 // inverse
        device.queue.writeBuffer(params, 0, stageParams)

        const even = this.stages.length % 2 === 0
        const group = (src: GpuBufferLike, dst: GpuBufferLike) =>
          device.createBindGroup({
            layout,
            entries: [
              { binding: 0, resource: { buffer: src } },
              { binding: 1, resource: { buffer: dst } },
              { binding: 2, resource: { buffer: params } },
            ],
          })
        this.stages.push({
          height: even ? group(heightA, heightB) : group(heightB, heightA),
          disp: even ? group(dispA, dispB) : group(dispB, dispA),
        })
      }
    }

    this.packGroup = device.createBindGroup({
      layout: pack.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: heightA } },
        { binding: 1, resource: { buffer: dispA } },
        { binding: 2, resource: destView },
        { binding: 3, resource: { buffer: this.packParamsBuf } },
      ],
    })
  }

  private writePackParams(amplitude: number, choppiness: number): void {
    const u32 = new Uint32Array(this.packScratch)
    const f32 = new Float32Array(this.packScratch)
    u32[0] = this.size
    f32[1] = amplitude
    f32[2] = choppiness
    u32[3] = 0
    this.device!.queue.writeBuffer(this.packParamsBuf!, 0, this.packScratch)
  }
}
