// =============================================================================
// OCEAN GPU GATE — when the Tessendorf IFFT may run as WGSL compute
//
// Adopt-only: never requestAdapter / requestDevice. The boot probe owns the
// device; helpers adopt it. `?no_gpu_compute=1` forces the CPU/WASM ocean path
// (issue #219 — this flag is helpers-only for gpuChores, but the ocean FFT
// honours it as well).
// =============================================================================

import { adoptComputeDevice, parseNoGpuCompute } from '../../rendering/gpuChores'
import type { GpuDeviceLike } from '../../rendering/gpuChores/types'
import { getWebgpuProbe } from '../../rendering/webgpuProbe'

export interface OceanGpuRenderer {
  computeAsync?: (computeNode: unknown) => Promise<void>
  backend?: {
    isWebGPUBackend?: boolean
    device?: GpuDeviceLike | null
    get?: (resource: unknown) => unknown
  } | null
}

/**
 * True when high/cinema displacement IFFT may run on the GPU.
 *
 * `float32-filterable` is not required: the displacement texture stays
 * rgba16float (filterable in core WebGPU). If a future path filters a float32
 * texture, AND that feature onto this predicate.
 */
export function canUseGpuOceanFft(
  renderer?: unknown,
  search?: string,
): boolean {
  if (parseNoGpuCompute(search)) return false
  if (getWebgpuProbe()?.compute !== 'passed') return false
  const gl = renderer as OceanGpuRenderer | null | undefined
  if (!gl || typeof gl.computeAsync !== 'function') return false
  return adoptComputeDevice(gl) != null
}

/** URL opt-in for the 256² cinema ocean tier (`?ocean=cinema`). */
export function parseOceanCinema(
  search = typeof window === 'undefined' ? '' : window.location.search,
): boolean {
  return new URLSearchParams(search).get('ocean') === 'cinema'
}
