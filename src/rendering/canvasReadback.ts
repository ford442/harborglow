import type { Renderer as FiberRenderer } from '@react-three/fiber';
import { GPU_BUFFER_USAGE, GPU_MAP_MODE_READ, GPU_TEXTURE_USAGE } from './canvasSurface';

/**
 * WebGPU swapchain readback for screenshots (`?screenshot=1`, Playwright, agents).
 *
 * `preserveDrawingBuffer` is a WebGL-era flag and does nothing here. A WebGPU
 * canvas texture is only valid until the current task yields and the frame is
 * presented; after that `getCurrentTexture()` hands back a fresh, empty texture.
 * So the copy is encoded inside R3F's after-render tick (same rAF callback as
 * the render) and only the map is awaited.
 */

export class CanvasReadbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CanvasReadbackError';
  }
}

export interface CanvasPixels {
  width: number;
  height: number;
  /** Swapchain format the bytes were read from (before BGRA → RGBA swap). */
  format: string;
  /** Tightly packed RGBA8, top row first, no row padding. */
  data: Uint8Array;
}

type ReadbackTexture = {
  width: number;
  height: number;
  usage: number;
  format: string;
};

type ReadbackBuffer = {
  mapAsync: (mode: number) => Promise<void>;
  getMappedRange: () => ArrayBuffer;
  unmap: () => void;
  destroy?: () => void;
};

type ReadbackDevice = {
  createBuffer: (desc: { size: number; usage: number; label?: string }) => ReadbackBuffer;
  createCommandEncoder: () => {
    copyTextureToBuffer: (src: unknown, dst: unknown, size: unknown) => void;
    finish: () => unknown;
  };
  queue: { submit: (buffers: unknown[]) => void };
};

type ReadbackRenderer = {
  domElement?: { getContext: (type: 'webgpu') => unknown };
  backend?: { device?: ReadbackDevice | null };
};

/** Runs `callback` once, right after the next frame's render, in the same task. */
export type AfterRenderScheduler = (callback: () => void) => void;

export interface ReadCanvasPixelsOptions {
  afterRender?: AfterRenderScheduler;
  /** Reject if no frame renders in time (e.g. `frameloop="demand"` with nothing invalidated). */
  timeoutMs?: number;
  /**
   * Write alpha = 255 (default true). The harbor swapchain is `alphaMode: 'opaque'`,
   * so the compositor ignores alpha and the stored byte is not what was shown.
   */
  opaque?: boolean;
}

const defaultAfterRender: AfterRenderScheduler = (callback) => {
  void import('@react-three/fiber').then(({ addAfterEffect }) => {
    const unsubscribe = addAfterEffect(() => {
      unsubscribe();
      callback();
    });
  });
};

const COPY_BYTES_PER_ROW_ALIGNMENT = 256;

/**
 * Reads the harbor canvas as it was presented on the next rendered frame.
 * Returns null when there is no live WebGPU renderer (probe failed / device lost).
 * Throws `CanvasReadbackError` when the swapchain was configured without COPY_SRC.
 */
export async function readScreenshotPixelsAsync(
  renderer: FiberRenderer,
  options: ReadCanvasPixelsOptions = {}
): Promise<CanvasPixels | null> {
  const live = renderer as unknown as ReadbackRenderer;
  const device = live.backend?.device;
  const canvas = live.domElement;
  if (!device || !canvas) return null;

  const afterRender = options.afterRender ?? defaultAfterRender;
  const timeoutMs = options.timeoutMs ?? 5000;

  const pending = await new Promise<{
    buffer: ReadbackBuffer;
    texture: ReadbackTexture;
    bytesPerRow: number;
  } | null>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new CanvasReadbackError(`no frame rendered within ${timeoutMs}ms`)),
      timeoutMs
    );
    afterRender(() => {
      clearTimeout(timer);
      try {
        resolve(encodeSwapchainCopy(device, canvas));
      } catch (err) {
        reject(err);
      }
    });
  });
  if (!pending) return null;

  const { buffer, texture, bytesPerRow } = pending;
  try {
    await buffer.mapAsync(GPU_MAP_MODE_READ);
    const mapped = new Uint8Array(buffer.getMappedRange());
    const data = unpadRows(mapped, texture.width, texture.height, bytesPerRow);
    buffer.unmap();
    normalizeToRgba(data, texture.format.startsWith('bgra'), options.opaque ?? true);
    return { width: texture.width, height: texture.height, format: texture.format, data };
  } finally {
    buffer.destroy?.();
  }
}

function encodeSwapchainCopy(
  device: ReadbackDevice,
  canvas: NonNullable<ReadbackRenderer['domElement']>
) {
  const ctx = canvas.getContext('webgpu') as { getCurrentTexture?: () => ReadbackTexture } | null;
  if (!ctx || typeof ctx.getCurrentTexture !== 'function') return null;

  const texture = ctx.getCurrentTexture();
  if ((texture.usage & GPU_TEXTURE_USAGE.COPY_SRC) === 0) {
    throw new CanvasReadbackError(
      `swapchain texture usage 0x${texture.usage.toString(16)} lacks COPY_SRC; ` +
        'configure the canvas with HARBOR_CANVAS_USAGE (see docs/RENDERER.md)'
    );
  }
  if (!/^(rgba|bgra)8unorm(-srgb)?$/.test(texture.format)) {
    throw new CanvasReadbackError(`unsupported swapchain format ${texture.format}`);
  }

  const bytesPerRow =
    Math.ceil((texture.width * 4) / COPY_BYTES_PER_ROW_ALIGNMENT) * COPY_BYTES_PER_ROW_ALIGNMENT;
  const buffer = device.createBuffer({
    label: 'harborglow-canvas-readback',
    size: bytesPerRow * texture.height,
    usage: GPU_BUFFER_USAGE.MAP_READ | GPU_BUFFER_USAGE.COPY_DST,
  });
  const encoder = device.createCommandEncoder();
  encoder.copyTextureToBuffer(
    { texture },
    { buffer, bytesPerRow },
    { width: texture.width, height: texture.height, depthOrArrayLayers: 1 }
  );
  device.queue.submit([encoder.finish()]);
  return { buffer, texture, bytesPerRow };
}

function unpadRows(src: Uint8Array, width: number, height: number, bytesPerRow: number): Uint8Array {
  const rowBytes = width * 4;
  const out = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    out.set(src.subarray(y * bytesPerRow, y * bytesPerRow + rowBytes), y * rowBytes);
  }
  return out;
}

function normalizeToRgba(data: Uint8Array, bgra: boolean, opaque: boolean): void {
  if (!bgra && !opaque) return;
  for (let i = 0; i < data.length; i += 4) {
    if (bgra) {
      const b = data[i];
      data[i] = data[i + 2];
      data[i + 2] = b;
    }
    if (opaque) data[i + 3] = 255;
  }
}
