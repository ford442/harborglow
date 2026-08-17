import type { AdoptComputeDeviceInput, GpuDeviceLike } from './types'

/**
 * Adopt the GPUDevice Three.js already created during WebGPURenderer.init().
 * Never calls navigator.gpu.requestAdapter() / requestDevice() — a second
 * device is the Chrome/Edge flake that takes the harbor down.
 */
export function adoptComputeDevice(renderer: AdoptComputeDeviceInput | null | undefined): GpuDeviceLike | null {
  const backend = renderer?.backend
  if (!backend?.isWebGPUBackend) return null
  return backend.device ?? null
}

/**
 * Best-effort resolve of a Three texture's GPUTexture on the adopted device.
 * Returns null when the backend is WebGL or the texture was never uploaded.
 */
export function resolveGpuTexture(
  renderer: { backend?: { get?: (resource: unknown) => unknown } } | null | undefined,
  texture: unknown,
): { createView: (desc?: Record<string, unknown>) => unknown; width?: number; height?: number } | null {
  if (!renderer?.backend || typeof renderer.backend.get !== 'function' || texture == null) {
    return null
  }
  try {
    const data = renderer.backend.get(texture)
    if (!data || typeof data !== 'object') return null
    const record = data as { texture?: { createView?: unknown; width?: number; height?: number }; createView?: unknown; width?: number; height?: number }
    const candidate = record.texture && typeof record.texture.createView === 'function' ? record.texture : record
    if (typeof candidate.createView !== 'function') return null
    return candidate as { createView: (desc?: Record<string, unknown>) => unknown; width?: number; height?: number }
  } catch {
    return null
  }
}
