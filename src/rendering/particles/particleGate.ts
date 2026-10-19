// =============================================================================
// PARTICLE GPU GATE — when the TSL compute pool may run
//
// Adopt-only, same rule as the ocean FFT. `?no_gpu_compute=1` forces the
// layer off. `float32-filterable` is read from the probe and is not required:
// particle state lives in storage buffers, which are not sampled.
// =============================================================================

import { adoptComputeDevice, parseNoGpuCompute } from '../gpuChores'
import { getWebgpuProbe } from '../webgpuProbe'

const FLOAT32_FILTERABLE = 'float32-filterable'

export function hasFloat32Filterable(features: readonly string[] | undefined): boolean {
  return (features ?? []).includes(FLOAT32_FILTERABLE)
}

/**
 * True when the compute particle layer may dispatch.
 * Absence of `float32-filterable` does not turn the layer off.
 */
export function canUseGpuParticles(renderer?: unknown, search?: string): boolean {
  if (parseNoGpuCompute(search)) return false
  const probe = getWebgpuProbe()
  if (!probe || probe.compute !== 'passed') return false
  // Observed on purpose. A sampled float path would have to require this;
  // storage buffers stay enabled either way.
  hasFloat32Filterable(probe.grantedFeatures)
  const gl = renderer as Parameters<typeof adoptComputeDevice>[0] & {
    computeAsync?: unknown
  } | null
  if (!gl || typeof gl.computeAsync !== 'function') return false
  return adoptComputeDevice(gl) != null
}
