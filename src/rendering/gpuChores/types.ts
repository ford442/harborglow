/** Job names aligned with image_video_effects #1106. */
export const GPU_CHORE_JOBS = {
  luma_histogram_bt709: 'luma_histogram_bt709',
  downsample_2d: 'downsample_2d',
  separable_blur: 'separable_blur',
  reduce: 'reduce',
} as const

export type GpuChoreJobName = (typeof GPU_CHORE_JOBS)[keyof typeof GPU_CHORE_JOBS]

export type GpuChoreBackend = 'webgpu' | 'wasm' | 'js' | 'off'
export type GpuChoreJobStatus = 'webgpu' | 'wasm' | 'js' | 'skipped'

export interface GpuChoresBreadcrumb {
  killSwitch: boolean
  backend: GpuChoreBackend
  deviceAdopted: boolean
  lastError: string | null
  jobs: Record<GpuChoreJobName, GpuChoreJobStatus>
  meters: { mean: number; max: number } | null
}

export const HIST_BINS = 256
export const BT709_LUMA = { r: 0.2126, g: 0.7152, b: 0.0722 } as const
export const METER_WIDTH = 64
export const METER_HEIGHT = 36
export const EXPOSURE_MIN = 0.6
export const EXPOSURE_MAX = 1.6
export const EXPOSURE_TARGET_LUMA = 0.18
export const IMAGE_WORKGROUP = [8, 8, 1] as const
export const REDUCE_WORKGROUP = [64, 1, 1] as const

/** Structural WebGPU device — never constructed here; adopted from Three. */
export interface GpuDeviceLike {
  createShaderModule: (desc: { code: string }) => GpuShaderModuleLike
  createComputePipeline: (desc: Record<string, unknown>) => GpuComputePipelineLike
  createBuffer: (desc: Record<string, unknown>) => GpuBufferLike
  createTexture: (desc: Record<string, unknown>) => GpuTextureLike
  createBindGroup: (desc: Record<string, unknown>) => GpuBindGroupLike
  createCommandEncoder: () => GpuCommandEncoderLike
  queue: GpuQueueLike
}

export interface GpuShaderModuleLike {
  label?: string
}

export interface GpuComputePipelineLike {
  getBindGroupLayout: (index: number) => unknown
}

export interface GpuBufferLike {
  mapAsync: (mode: number) => Promise<void>
  getMappedRange: () => ArrayBuffer
  unmap: () => void
  destroy?: () => void
}

export interface GpuTextureLike {
  width?: number
  height?: number
  createView: (desc?: Record<string, unknown>) => unknown
  destroy?: () => void
}

export interface GpuBindGroupLike {
  label?: string
}

export interface GpuCommandEncoderLike {
  beginComputePass: (desc?: Record<string, unknown>) => GpuComputePassLike
  copyBufferToBuffer: (
    src: GpuBufferLike,
    srcOffset: number,
    dst: GpuBufferLike,
    dstOffset: number,
    size: number,
  ) => void
  finish: () => unknown
}

export interface GpuComputePassLike {
  setPipeline: (pipeline: GpuComputePipelineLike) => void
  setBindGroup: (index: number, group: GpuBindGroupLike) => void
  dispatchWorkgroups: (x: number, y?: number, z?: number) => void
  end: () => void
}

export interface GpuQueueLike {
  submit: (cmds: unknown[]) => void
  writeBuffer: (buffer: GpuBufferLike, offset: number, data: BufferSource) => void
}

export interface AdoptComputeDeviceInput {
  backend?: {
    isWebGPUBackend?: boolean
    device?: GpuDeviceLike | null
  } | null
}

export function defaultGpuChoresBreadcrumb(
  overrides: Partial<GpuChoresBreadcrumb> = {},
): GpuChoresBreadcrumb {
  return {
    killSwitch: false,
    backend: 'off',
    deviceAdopted: false,
    lastError: null,
    jobs: {
      luma_histogram_bt709: 'skipped',
      downsample_2d: 'skipped',
      separable_blur: 'skipped',
      reduce: 'skipped',
    },
    meters: null,
    ...overrides,
  }
}
