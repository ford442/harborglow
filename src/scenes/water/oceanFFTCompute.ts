// =============================================================================
// OCEAN FFT COMPUTE — GPU Stockham IFFT → rgba16float displacement texture
//
// Adopt-only: the boot probe owns the GPUDevice. Butterflies run as raw WGSL
// on that device (one submit per Stockham stage, ping-pong storage buffers).
// A Three StorageTexture is allocated with renderer.computeAsync so the water
// material can sample it; the pack pass then writes that same GPUTexture.
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

export class OceanFFTCompute {
  readonly texture: THREE.StorageTexture
  readonly size: number

  private device: GpuDeviceLike | null = null
  private butterfly: GpuComputePipelineLike | null = null
  private pack: GpuComputePipelineLike | null = null
  private heightA: GpuBufferLike | null = null
  private heightB: GpuBufferLike | null = null
  private dispA: GpuBufferLike | null = null
  private dispB: GpuBufferLike | null = null
  private paramsBuf: GpuBufferLike | null = null
  private packParamsBuf: GpuBufferLike | null = null
  private destView: unknown = null
  private interleaved = new Float32Array(0)
  private paramsScratch = new ArrayBuffer(16)
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
      this.destView = gpuTex.createView()
      this.buildPipelines(device)
      this.allocated = true
      return true
    } catch (err) {
      this.fail(err instanceof Error ? err.message : String(err))
      return false
    }
  }

  /**
   * Upload the field's frequency-domain grids, IFFT on the GPU, pack Dx/h/Dz.
   * Submits without awaiting GPU completion (no frame stall, no mapAsync).
   */
  dispatch(field: OceanFFTField): boolean {
    if (!this.ready || !this.device || !this.butterfly || !this.pack) return false
    if (field.size !== this.size) {
      this.fail('field size changed; recreate OceanFFTCompute')
      return false
    }

    const device = this.device
    const n = this.size
    const cells = n * n
    const bytes = cells * 8
    if (this.interleaved.length < cells * 2) {
      this.interleaved = new Float32Array(cells * 2)
    }

    const { spectrumHRe, spectrumHIm, spectrumDRe, spectrumDIm } = field
    interleave(spectrumHRe, spectrumHIm, this.interleaved, cells)
    device.queue.writeBuffer(this.heightA!, 0, this.interleaved)
    interleave(spectrumDRe, spectrumDIm, this.interleaved, cells)
    device.queue.writeBuffer(this.dispA!, 0, this.interleaved)

    const logN = Math.log2(n)
    const groups = Math.ceil(n / OCEAN_FFT_WORKGROUP)

    let heightSrc = this.heightA!
    let heightDst = this.heightB!
    let dispSrc = this.dispA!
    let dispDst = this.dispB!

    // One submit per stage so the uniform buffer write is visible to that pass
    // only (a single encoder sharing one Params buffer would see the last stage).
    for (let axis = 0; axis < 2; axis++) {
      for (let stage = 0; stage < logN; stage++) {
        this.writeParams(n, stage, axis, 1)
        const encoder = device.createCommandEncoder()
        this.butterflyPass(encoder, heightSrc, heightDst, groups)
        this.butterflyPass(encoder, dispSrc, dispDst, groups)
        device.queue.submit([encoder.finish()])
        const hTmp = heightSrc
        heightSrc = heightDst
        heightDst = hTmp
        const dTmp = dispSrc
        dispSrc = dispDst
        dispDst = dTmp
      }
    }

    this.writePackParams(n, field.getConfig().amplitude, field.getConfig().choppiness)
    const packGroup = device.createBindGroup({
      layout: this.pack.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: heightSrc } },
        { binding: 1, resource: { buffer: dispSrc } },
        { binding: 2, resource: this.destView },
        { binding: 3, resource: { buffer: this.packParamsBuf } },
      ],
    })
    const packEncoder = device.createCommandEncoder()
    const packPass = packEncoder.beginComputePass()
    packPass.setPipeline(this.pack)
    packPass.setBindGroup(0, packGroup)
    packPass.dispatchWorkgroups(groups, groups, 1)
    packPass.end()
    device.queue.submit([packEncoder.finish()])
    return true
  }

  dispose(): void {
    this.heightA?.destroy?.()
    this.heightB?.destroy?.()
    this.dispA?.destroy?.()
    this.dispB?.destroy?.()
    this.paramsBuf?.destroy?.()
    this.packParamsBuf?.destroy?.()
    this.heightA = this.heightB = this.dispA = this.dispB = null
    this.paramsBuf = this.packParamsBuf = null
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

  private buildPipelines(device: GpuDeviceLike): void {
    const n = this.size
    const bytes = n * n * 8
    const storageUsage = BUF_STORAGE | BUF_COPY_DST
    this.heightA = device.createBuffer({ size: bytes, usage: storageUsage })
    this.heightB = device.createBuffer({ size: bytes, usage: storageUsage })
    this.dispA = device.createBuffer({ size: bytes, usage: storageUsage })
    this.dispB = device.createBuffer({ size: bytes, usage: storageUsage })
    this.paramsBuf = device.createBuffer({ size: 16, usage: BUF_UNIFORM | BUF_COPY_DST })
    this.packParamsBuf = device.createBuffer({ size: 16, usage: BUF_UNIFORM | BUF_COPY_DST })

    const butterflyMod = device.createShaderModule({ code: OCEAN_FFT_BUTTERFLY_WGSL })
    this.butterfly = device.createComputePipeline({
      layout: 'auto',
      compute: { module: butterflyMod, entryPoint: 'main' },
    })
    const packMod = device.createShaderModule({ code: OCEAN_FFT_PACK_WGSL })
    this.pack = device.createComputePipeline({
      layout: 'auto',
      compute: { module: packMod, entryPoint: 'main' },
    })
  }

  private writeParams(n: number, stage: number, axis: number, inverse: number): void {
    const u32 = new Uint32Array(this.paramsScratch)
    u32[0] = n
    u32[1] = stage
    u32[2] = axis
    u32[3] = inverse
    this.device!.queue.writeBuffer(this.paramsBuf!, 0, this.paramsScratch)
  }

  private writePackParams(n: number, amplitude: number, choppiness: number): void {
    const u32 = new Uint32Array(this.packScratch)
    const f32 = new Float32Array(this.packScratch)
    u32[0] = n
    f32[1] = amplitude
    f32[2] = choppiness
    u32[3] = 0
    this.device!.queue.writeBuffer(this.packParamsBuf!, 0, this.packScratch)
  }

  private butterflyPass(
    encoder: ReturnType<GpuDeviceLike['createCommandEncoder']>,
    src: GpuBufferLike,
    dst: GpuBufferLike,
    groups: number,
  ): void {
    const pipeline = this.butterfly!
    const group: GpuBindGroupLike = this.device!.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: src } },
        { binding: 1, resource: { buffer: dst } },
        { binding: 2, resource: { buffer: this.paramsBuf } },
      ],
    })
    const pass = encoder.beginComputePass()
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, group)
    pass.dispatchWorkgroups(groups, groups, 1)
    pass.end()
  }
}
