import type { Renderer as FiberRenderer } from '@react-three/fiber';
import { canvasAlphaModeFor } from './canvasSurface';
import { configureRendererDefaults, type RendererDefaultsOptions } from './rendererDefaults';
import type { RendererContextOptions, RendererPreference } from './types';
import {
  getWebgpuProbe,
  onWebgpuDeviceLost,
  publishWebgpuProbe,
  reportWebgpuDeviceLost,
  WebgpuRequiredError,
} from './webgpuProbe';

export interface GameRendererOptions extends RendererDefaultsOptions {
  preference: RendererPreference;
  antialias?: boolean;
  alpha?: boolean;
  /** Ignored: derived from `alpha` (WebGPU `alphaMode`). Kept for diagnostics shape. */
  premultipliedAlpha?: boolean;
  /** WebGL-era flag; a WebGPU no-op. Screenshots use `readScreenshotPixelsAsync`. */
  preserveDrawingBuffer?: boolean;
  stencil?: boolean;
  depth?: boolean;
  logarithmicDepthBuffer?: boolean;
}

/** Context defaults. See the option matrix in `docs/RENDERER.md` for per-backend support. */
export const DEFAULT_CONTEXT_OPTIONS: RendererContextOptions = {
  antialias: true,
  // Opaque harbor → swapchain `alphaMode: 'opaque'`. See "Canvas surface" in docs/RENDERER.md.
  alpha: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  stencil: false,
  // Depth must stay on: god-rays / DOF / SSAO sample the depth buffer.
  depth: true,
  // Log depth breaks depth-texture reads in the post stack; keep it off unless z-fighting demands it.
  logarithmicDepthBuffer: false,
};

/**
 * Merges caller options over the defaults into a fully-resolved, inspectable set.
 * `premultipliedAlpha` is not an input: it reports what WebGPU will do, which is
 * premultiplied exactly when `alpha` is on.
 */
export function resolveContextOptions(options: Partial<GameRendererOptions>): RendererContextOptions {
  const alpha = options.alpha ?? DEFAULT_CONTEXT_OPTIONS.alpha;
  return {
    antialias: options.antialias ?? DEFAULT_CONTEXT_OPTIONS.antialias,
    alpha,
    premultipliedAlpha: canvasAlphaModeFor(alpha) === 'premultiplied',
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
  setAnimationLoop?: (callback: null) => void;
  onDeviceLost?: (info: { message?: string; reason?: string | null }) => void;
  _onDeviceLost?: (info: unknown) => void;
  _isDeviceLost?: boolean;
};

/**
 * Creates the Three.js WebGPU renderer for the R3F &lt;Canvas&gt;.
 *
 * WebGPU is required. The boot probe owns the GPUDevice; this factory passes
 * that device into WebGPURenderer so Three does not request a second one.
 * A WebGL2 fallback (explicit WebGLRenderer or Three's getFallback) is not
 * returned — dispose and throw instead.
 *
 * On device loss the renderer is disposed here (R3F's unmount never calls
 * `gl.dispose()`); GameShell then replaces the `<Canvas>` with the overlay.
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

  const expectedAlphaMode = canvasAlphaModeFor(ctx.alpha);
  if (probe.canvas && probe.canvas.alphaMode !== expectedAlphaMode) {
    console.warn(
      `🖥️ probe validated alphaMode '${probe.canvas.alphaMode}' but the renderer will configure ` +
        `'${expectedAlphaMode}' (alpha: ${ctx.alpha}); see docs/RENDERER.md "Canvas surface"`
    );
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

  // Three's backend also watches device.lost; route it through the one probe path
  // (idempotent with the probe's own watcher) instead of only setting _isDeviceLost.
  disposable.onDeviceLost = (info) => {
    reportWebgpuDeviceLost({
      reason: info?.reason || 'unknown',
      message: info?.message || 'Device lost',
    });
  };
  const unsubscribe = onWebgpuDeviceLost(() => {
    unsubscribe();
    disposeLostRenderer(disposable);
  });

  configureRendererDefaults(renderer, defaults);
  return renderer;
}

function disposeLostRenderer(renderer: DisposableRenderer): void {
  // Any render R3F issues before the Canvas unmounts early-returns on this flag.
  renderer._isDeviceLost = true;
  renderer.setAnimationLoop?.(null);
  try {
    renderer.dispose?.();
  } catch (err) {
    // Disposing GPU resources on a lost device can throw; the renderer is dead either way.
    console.warn('🖥️ dispose after device loss threw', err);
  }
}
