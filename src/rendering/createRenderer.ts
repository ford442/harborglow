import type { Renderer as FiberRenderer } from '@react-three/fiber';
import { configureRendererDefaults, type RendererDefaultsOptions } from './rendererDefaults';
import type { RendererContextOptions, RendererPreference } from './types';
import { getWebgpuProbe, publishWebgpuProbe, WebgpuRequiredError } from './webgpuProbe';

export interface GameRendererOptions extends RendererDefaultsOptions {
  preference: RendererPreference;
  antialias?: boolean;
  alpha?: boolean;
  premultipliedAlpha?: boolean;
  /** Keep the drawing buffer readable after present — required for canvas screenshots. */
  preserveDrawingBuffer?: boolean;
  stencil?: boolean;
  depth?: boolean;
  logarithmicDepthBuffer?: boolean;
}

/** Context defaults. See the option matrix in `docs/RENDERER.md` for per-backend support. */
export const DEFAULT_CONTEXT_OPTIONS: RendererContextOptions = {
  antialias: true,
  alpha: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  stencil: false,
  // Depth must stay on: god-rays / DOF / SSAO sample the depth buffer.
  depth: true,
  // Log depth breaks depth-texture reads in the post stack; keep it off unless z-fighting demands it.
  logarithmicDepthBuffer: false,
};

/** Merges caller options over the defaults into a fully-resolved, inspectable set. */
export function resolveContextOptions(options: Partial<GameRendererOptions>): RendererContextOptions {
  return {
    antialias: options.antialias ?? DEFAULT_CONTEXT_OPTIONS.antialias,
    alpha: options.alpha ?? DEFAULT_CONTEXT_OPTIONS.alpha,
    premultipliedAlpha: options.premultipliedAlpha ?? DEFAULT_CONTEXT_OPTIONS.premultipliedAlpha,
    preserveDrawingBuffer:
      options.preserveDrawingBuffer ?? DEFAULT_CONTEXT_OPTIONS.preserveDrawingBuffer,
    stencil: options.stencil ?? DEFAULT_CONTEXT_OPTIONS.stencil,
    depth: options.depth ?? DEFAULT_CONTEXT_OPTIONS.depth,
    logarithmicDepthBuffer:
      options.logarithmicDepthBuffer ?? DEFAULT_CONTEXT_OPTIONS.logarithmicDepthBuffer,
  };
}

type DisposableRenderer = FiberRenderer & {
  backend?: { isWebGPUBackend?: boolean };
  dispose?: () => void;
};

/**
 * Creates the Three.js WebGPU renderer for the R3F &lt;Canvas&gt;.
 *
 * WebGPU is required. The boot probe owns the GPUDevice; this factory passes
 * that device into WebGPURenderer so Three does not request a second one.
 * A WebGL2 fallback (explicit WebGLRenderer or Three's getFallback) is not
 * returned — dispose and throw instead.
 */
export async function createGameRenderer(
  canvas: HTMLCanvasElement,
  options: GameRendererOptions
): Promise<FiberRenderer> {
  const ctx = resolveContextOptions(options);
  const defaults: RendererDefaultsOptions = {
    toneMapping: options.toneMapping,
    toneMappingExposure: options.toneMappingExposure,
    shadows: options.shadows,
    clearColor: options.clearColor,
    clearAlpha: options.clearAlpha ?? (ctx.alpha ? 0 : 1),
  };

  const probe = getWebgpuProbe();
  if (probe && probe.ready) {
    await probe.ready;
  }
  if (!probe || !probe.ok || !probe.device) {
    throw new WebgpuRequiredError(probe?.reason ?? 'no-gpu');
  }

  const { WebGPURenderer } = await import('three/webgpu');
  const renderer = new WebGPURenderer({
    canvas,
    antialias: ctx.antialias,
    alpha: ctx.alpha,
    depth: ctx.depth,
    stencil: ctx.stencil,
    forceWebGL: false,
    device: probe.device as never,
  });

  await renderer.init();

  const disposable = renderer as unknown as DisposableRenderer;
  if (!disposable.backend?.isWebGPUBackend) {
    disposable.dispose?.();
    publishWebgpuProbe({
      ...probe,
      ok: false,
      device: null,
      reason: 'webgl2-fallback',
    });
    throw new WebgpuRequiredError('webgl2-fallback');
  }

  configureRendererDefaults(renderer, defaults);
  return renderer;
}

export async function readScreenshotPixelsAsync(
  renderer: FiberRenderer,
  width: number,
  height: number
): Promise<Uint8Array | null> {
  const anyRenderer = renderer as any;
  const ctx = anyRenderer.backend?.getContext?.() || anyRenderer.getContext?.();
  const device = anyRenderer.backend?.device;

  if (!ctx || !device || typeof ctx.getCurrentTexture !== 'function') return null;

  const texture = ctx.getCurrentTexture();
  if (!texture) return null;

  const bytesPerPixel = 4;
  const bytesPerRow = Math.ceil((width * bytesPerPixel) / 256) * 256;
  const bufferSize = bytesPerRow * height;

  const buffer = device.createBuffer({
    size: bufferSize,
    usage: 1 /* MAP_READ */ | 8 /* COPY_DST */
  });

  const encoder = device.createCommandEncoder();
  encoder.copyTextureToBuffer(
    { texture },
    { buffer, bytesPerRow },
    { width, height, depthOrArrayLayers: 1 }
  );
  device.queue.submit([encoder.finish()]);

  await buffer.mapAsync(1 /* READ */);
  const data = new Uint8Array(buffer.getMappedRange());
  const result = new Uint8Array(data);
  buffer.unmap();
  buffer.destroy();
  
  return result;
}
