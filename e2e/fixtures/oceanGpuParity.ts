// Browser-side harness for e2e/ocean-gpu-parity.spec.ts. Loaded through a Vite
// dev server, so it can import src/ directly. Runs the real OceanFFTCompute on
// a raw WebGPU device (standing in for the probe-adopted one) and compares its
// displacement texture against the CPU OceanFFTField grid hull probes read.

import { OceanFFTField } from '../../src/systems/ocean/OceanFFTField'
import { OceanFFTCompute } from '../../src/scenes/water/oceanFFTCompute'

export interface OceanGpuParityResult {
  adapter: boolean
  initOk: boolean
  dispatched: boolean
  deviceErrors: string[]
  maxAbsHeight: number
  maxErrHeight: number
  maxErrDisp: number
}

function decodeHalf(u: number): number {
  const sign = u & 0x8000 ? -1 : 1
  const exponent = (u >> 10) & 0x1f
  const fraction = u & 0x3ff
  if (exponent === 0) return sign * 2 ** -14 * (fraction / 1024)
  if (exponent === 31) return fraction ? Number.NaN : sign * Infinity
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024)
}

const EMPTY: OceanGpuParityResult = {
  adapter: false,
  initOk: false,
  dispatched: false,
  deviceErrors: [],
  maxAbsHeight: 0,
  maxErrHeight: Number.NaN,
  maxErrDisp: Number.NaN,
}

/**
 * @param breakWgsl rename the WGSL entry point so pipeline creation fails —
 *   init() must notice the async validation error and refuse the GPU path.
 */
export async function runOceanGpuParity(
  size: number,
  time: number,
  breakWgsl = false,
): Promise<OceanGpuParityResult> {
  const adapter = await navigator.gpu?.requestAdapter()
  if (!adapter) return EMPTY
  const device = await adapter.requestDevice()
  const deviceErrors: string[] = []
  device.addEventListener('uncapturederror', (e) => {
    deviceErrors.push((e as GPUUncapturedErrorEvent).error.message)
  })
  if (breakWgsl) {
    const create = device.createShaderModule.bind(device)
    device.createShaderModule = (desc) => create({ ...desc, code: desc.code.replace('fn main', 'fn main_broken') })
  }

  const texture = device.createTexture({
    size: [size, size],
    format: 'rgba16float',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
  })
  // Minimal WebGPURenderer shape: computeAsync allocation is simulated by
  // handing back our own GPUTexture from backend.get().
  const renderer = {
    computeAsync: async () => {},
    backend: { isWebGPUBackend: true, device, get: () => ({ texture }) },
  }

  const field = new OceanFFTField({ size })
  field.update(time)
  const gpu = new OceanFFTCompute(size)
  const initOk = await gpu.init(renderer)
  const dispatched = gpu.dispatch(field)
  await device.queue.onSubmittedWorkDone()
  if (!dispatched) {
    return { ...EMPTY, adapter: true, initOk, dispatched, deviceErrors }
  }

  const bytesPerRow = Math.ceil((size * 8) / 256) * 256
  const readback = device.createBuffer({
    size: bytesPerRow * size,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  })
  const encoder = device.createCommandEncoder()
  encoder.copyTextureToBuffer({ texture }, { buffer: readback, bytesPerRow }, [size, size])
  device.queue.submit([encoder.finish()])
  await readback.mapAsync(GPUMapMode.READ)
  const texels = new Uint16Array(readback.getMappedRange())

  let maxAbsHeight = 0
  let maxErrHeight = 0
  let maxErrDisp = 0
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const i = row * size + col
      const o = (row * bytesPerRow + col * 8) / 2
      const dx = decodeHalf(texels[o])
      const h = decodeHalf(texels[o + 1])
      const dz = decodeHalf(texels[o + 2])
      maxAbsHeight = Math.max(maxAbsHeight, Math.abs(field.heights[i]))
      maxErrHeight = Math.max(maxErrHeight, Math.abs(h - field.heights[i]))
      maxErrDisp = Math.max(
        maxErrDisp,
        Math.abs(dx - field.displacementX[i]),
        Math.abs(dz - field.displacementZ[i]),
      )
    }
  }
  readback.unmap()
  gpu.dispose()
  device.destroy()
  return { adapter: true, initOk, dispatched, deviceErrors, maxAbsHeight, maxErrHeight, maxErrDisp }
}
