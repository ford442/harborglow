import type { Renderer as FiberRenderer } from '@react-three/fiber'
import { readScreenshotPixelsAsync, type CanvasPixels } from './canvasReadback'

export interface PosterCapture {
  width: number
  height: number
  format: string
  dataUrl: string
}

export function pixelsToPngDataUrl(pixels: CanvasPixels): string {
  const out = document.createElement('canvas')
  out.width = pixels.width
  out.height = pixels.height
  const image = new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)
  out.getContext('2d')?.putImageData(image, 0, 0)
  return out.toDataURL('image/png')
}

/** User-facing poster. Same swapchain readback as `harborglowDebug.captureCanvasPng`. */
export async function capturePosterPng(renderer: FiberRenderer | null): Promise<PosterCapture | null> {
  if (!renderer) return null
  const pixels = await readScreenshotPixelsAsync(renderer)
  if (!pixels) return null
  return {
    width: pixels.width,
    height: pixels.height,
    format: pixels.format,
    dataUrl: pixelsToPngDataUrl(pixels),
  }
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}
