/**
 * GPU-compute kill switch (`?no_gpu_compute=1` or `true`).
 *
 * gpuChores image helpers honour this flag. Issue #219 also uses it to force
 * the ocean FFT onto the CPU/WASM path; god-rays keep their own gates.
 */
export function parseNoGpuCompute(
  search = typeof window === 'undefined' ? '' : window.location.search,
): boolean {
  const params = new URLSearchParams(search)
  const raw = params.get('no_gpu_compute')
  return raw === '1' || raw === 'true'
}
