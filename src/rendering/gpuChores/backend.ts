import type { ComputeProbeStatus } from '../types'
import { getWebgpuProbe } from '../webgpuProbe'
import type { GpuChoreBackend, GpuDeviceLike } from './types'

export interface SelectChoreBackendOptions {
  killSwitch: boolean
  activeBackend: string
  computeProbe: ComputeProbeStatus
  device: GpuDeviceLike | null
  /** Image-helper WASM is additive; JS is the CI-guaranteed fallback. */
  wasmAvailable?: boolean
}

/**
 * Backend order: WebGPU (adopted device) → WASM → JS.
 * Kill switch and failed/unsupported compute probes skip WebGPU for helpers
 * only — FFT / god-rays keep their own gates.
 */
export function selectChoreBackend(options: SelectChoreBackendOptions): GpuChoreBackend {
  const fallback: GpuChoreBackend = options.wasmAvailable ? 'wasm' : 'js'

  if (options.killSwitch) return fallback
  if (getWebgpuProbe()?.ok === false) return fallback

  const webgpuReady =
    options.activeBackend === 'webgpu' &&
    options.computeProbe === 'passed' &&
    options.device != null

  if (webgpuReady) return 'webgpu'
  return fallback
}
