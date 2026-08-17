/**
 * Helper-only kill switch. Does not gate ocean FFT or GLSL god-rays.
 *
 * Enabled by `?no_gpu_compute=1` or `?no_gpu_compute=true`.
 */
export function parseNoGpuCompute(
  search = typeof window === 'undefined' ? '' : window.location.search,
): boolean {
  const params = new URLSearchParams(search)
  const raw = params.get('no_gpu_compute')
  return raw === '1' || raw === 'true'
}
