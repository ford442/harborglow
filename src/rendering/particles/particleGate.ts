// =============================================================================
// GPU PARTICLE GATE — when the TSL compute particle engine may run (#248)
//
// Particles dispatch through the renderer's own device (`renderer.compute`),
// so unlike the ocean FFT there is no device adoption here. Storage is plain
// storage buffers — no StorageTexture — so three #33147 (float32 StorageTexture
// without `float32-filterable`) does not apply. If a texture-backed field is
// ever added, AND `hasGpuFeature('float32-filterable')` onto this predicate or
// keep the texture at HalfFloat.
// =============================================================================

import { parseNoGpuCompute } from '../gpuChores/killSwitch'
import { getWebgpuProbe } from '../webgpuProbe'

export interface ParticleGpuRenderer {
  compute?: (computeNode: unknown, dispatchSize?: unknown) => unknown
  computeAsync?: (computeNode: unknown) => Promise<void>
  backend?: { isWebGPUBackend?: boolean } | null
}

/** `?particles=0` turns the particle engine off (A/B baseline for the bench). */
export function parseParticlesOff(
  search = typeof window === 'undefined' ? '' : window.location.search,
): boolean {
  const raw = new URLSearchParams(search).get('particles')
  return raw === '0' || raw === 'false' || raw === 'off'
}

export function canUseGpuParticles(renderer?: unknown, search?: string): boolean {
  if (parseNoGpuCompute(search) || parseParticlesOff(search)) return false
  if (getWebgpuProbe()?.compute !== 'passed') return false
  const gl = renderer as ParticleGpuRenderer | null | undefined
  if (!gl || gl.backend?.isWebGPUBackend !== true) return false
  return typeof gl.compute === 'function' && typeof gl.computeAsync === 'function'
}
