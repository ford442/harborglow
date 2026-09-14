/**
 * The one swapchain contract shared by the boot probe, the renderer factory and
 * canvas readback. See "Canvas surface" in docs/RENDERER.md.
 *
 * Numeric flags (not the `GPUTextureUsage` globals) so this module loads under
 * vitest / SSR where WebGPU globals do not exist.
 */

export const GPU_TEXTURE_USAGE = {
  COPY_SRC: 0x01,
  COPY_DST: 0x02,
  TEXTURE_BINDING: 0x04,
  STORAGE_BINDING: 0x08,
  RENDER_ATTACHMENT: 0x10,
} as const

export const GPU_BUFFER_USAGE = {
  MAP_READ: 0x0001,
  COPY_DST: 0x0008,
} as const

export const GPU_MAP_MODE_READ = 0x0001

/**
 * Swapchain usage. Matches what Three r183's WebGPUBackend configures on the
 * harbor canvas; COPY_SRC is what makes `copyTextureToBuffer` from
 * `getCurrentTexture()` valid. COPY_DST is not needed — the post stack renders
 * into its own targets and presents with a render pass.
 */
export const HARBOR_CANVAS_USAGE = GPU_TEXTURE_USAGE.RENDER_ATTACHMENT | GPU_TEXTURE_USAGE.COPY_SRC

export type CanvasAlphaMode = 'opaque' | 'premultiplied'

/**
 * Three derives the WebGPU `alphaMode` from `alpha` alone
 * (`alpha ? 'premultiplied' : 'opaque'`); `premultipliedAlpha` is never read.
 */
export function canvasAlphaModeFor(alpha: boolean): CanvasAlphaMode {
  return alpha ? 'premultiplied' : 'opaque'
}

/** HarborGlow draws an opaque harbor; HUD / overlays are DOM, not canvas alpha. */
export const HARBOR_CANVAS_ALPHA_MODE: CanvasAlphaMode = canvasAlphaModeFor(false)

export interface CanvasSurfaceConfig {
  format: string
  alphaMode: CanvasAlphaMode
  usage: number
}
