import { describe, expect, it, vi } from 'vitest'
import type { Renderer as FiberRenderer } from '@react-three/fiber'
import { CanvasReadbackError, readScreenshotPixelsAsync } from '../canvasReadback'
import { GPU_BUFFER_USAGE, GPU_TEXTURE_USAGE, HARBOR_CANVAS_USAGE } from '../canvasSurface'

const immediate = (cb: () => void) => cb()

/** 2×2 swapchain: BGRA pixels with row padding to 256 bytes, as copyTextureToBuffer lays them out. */
function makeRenderer({ usage = HARBOR_CANVAS_USAGE, format = 'bgra8unorm' } = {}) {
  const width = 2
  const height = 2
  const texture = { width, height, usage, format }
  const mapped = new Uint8Array(256 * height)
  // row 0: (B,G,R,A) = (1,2,3,4), (5,6,7,8); row 1: (9,10,11,12), (13,14,15,16)
  mapped.set([1, 2, 3, 4, 5, 6, 7, 8], 0)
  mapped.set([9, 10, 11, 12, 13, 14, 15, 16], 256)
  const buffer = {
    mapAsync: vi.fn(async () => undefined),
    getMappedRange: vi.fn(() => mapped.buffer),
    unmap: vi.fn(),
    destroy: vi.fn(),
  }
  const encoder = { copyTextureToBuffer: vi.fn(), finish: vi.fn(() => ({})) }
  const device = {
    createBuffer: vi.fn(() => buffer),
    createCommandEncoder: vi.fn(() => encoder),
    queue: { submit: vi.fn() },
  }
  const getCurrentTexture = vi.fn(() => texture)
  const renderer = {
    backend: { device },
    domElement: { getContext: vi.fn(() => ({ getCurrentTexture })) },
  } as unknown as FiberRenderer
  return { renderer, device, encoder, buffer, getCurrentTexture }
}

describe('readScreenshotPixelsAsync', () => {
  it('copies the swapchain texture and returns unpadded, opaque RGBA', async () => {
    const { renderer, device, encoder, buffer } = makeRenderer()
    const pixels = await readScreenshotPixelsAsync(renderer, { afterRender: immediate })

    expect(device.createBuffer).toHaveBeenCalledWith(
      expect.objectContaining({ size: 512, usage: GPU_BUFFER_USAGE.MAP_READ | GPU_BUFFER_USAGE.COPY_DST }),
    )
    expect(encoder.copyTextureToBuffer).toHaveBeenCalledWith(
      expect.objectContaining({ texture: expect.anything() }),
      expect.objectContaining({ bytesPerRow: 256 }),
      { width: 2, height: 2, depthOrArrayLayers: 1 },
    )
    expect(pixels).toMatchObject({ width: 2, height: 2, format: 'bgra8unorm' })
    expect([...pixels!.data]).toEqual([3, 2, 1, 255, 7, 6, 5, 255, 11, 10, 9, 255, 15, 14, 13, 255])
    expect(buffer.unmap).toHaveBeenCalled()
    expect(buffer.destroy).toHaveBeenCalled()
  })

  it('reads the texture inside the after-render callback, not before', async () => {
    const { renderer, getCurrentTexture } = makeRenderer()
    let fire: (() => void) | null = null
    const pending = readScreenshotPixelsAsync(renderer, { afterRender: (cb) => { fire = cb } })
    await Promise.resolve()
    expect(getCurrentTexture).not.toHaveBeenCalled()
    fire!()
    await expect(pending).resolves.not.toBeNull()
    expect(getCurrentTexture).toHaveBeenCalledTimes(1)
  })

  it('rejects with a clear error when the swapchain lacks COPY_SRC', async () => {
    const { renderer, device } = makeRenderer({ usage: GPU_TEXTURE_USAGE.RENDER_ATTACHMENT })
    await expect(readScreenshotPixelsAsync(renderer, { afterRender: immediate })).rejects.toBeInstanceOf(
      CanvasReadbackError,
    )
    expect(device.createBuffer).not.toHaveBeenCalled()
  })

  it('returns null without a live WebGPU device', async () => {
    const renderer = { domElement: {}, backend: { device: null } } as unknown as FiberRenderer
    await expect(readScreenshotPixelsAsync(renderer, { afterRender: immediate })).resolves.toBeNull()
  })

  it('times out when no frame renders', async () => {
    const { renderer } = makeRenderer()
    await expect(
      readScreenshotPixelsAsync(renderer, { afterRender: () => {}, timeoutMs: 5 }),
    ).rejects.toThrow(/no frame rendered/)
  })
})
