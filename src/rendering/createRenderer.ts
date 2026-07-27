import * as THREE from 'three';
import { configureRendererDefaults, type RendererDefaultsOptions } from './rendererDefaults';
import type { RendererContextOptions, RendererPreference } from './types';

export interface GameRendererOptions extends RendererDefaultsOptions {
  preference: RendererPreference;
  antialias?: boolean;
  alpha?: boolean;
  premultipliedAlpha?: boolean;
  /** Keep the drawing buffer readable after present — required for canvas screenshots. */
  preserveDrawingBuffer?: boolean;
  powerPreference?: WebGLPowerPreference;
  stencil?: boolean;
  depth?: boolean;
  logarithmicDepthBuffer?: boolean;
  failIfMajorPerformanceCaveat?: boolean;
}

/** Context defaults. See the option matrix in `docs/RENDERER.md` for per-backend support. */
export const DEFAULT_CONTEXT_OPTIONS: RendererContextOptions = {
  antialias: true,
  alpha: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  powerPreference: 'high-performance',
  stencil: false,
  // Depth must stay on: god-rays / DOF / SSAO sample the depth buffer.
  depth: true,
  // Log depth breaks depth-texture reads in the post stack; keep it off unless z-fighting demands it.
  logarithmicDepthBuffer: false,
  failIfMajorPerformanceCaveat: false,
};

/** Merges caller options over the defaults into a fully-resolved, inspectable set. */
export function resolveContextOptions(options: Partial<GameRendererOptions>): RendererContextOptions {
  return {
    antialias: options.antialias ?? DEFAULT_CONTEXT_OPTIONS.antialias,
    alpha: options.alpha ?? DEFAULT_CONTEXT_OPTIONS.alpha,
    premultipliedAlpha: options.premultipliedAlpha ?? DEFAULT_CONTEXT_OPTIONS.premultipliedAlpha,
    preserveDrawingBuffer:
      options.preserveDrawingBuffer ?? DEFAULT_CONTEXT_OPTIONS.preserveDrawingBuffer,
    powerPreference: options.powerPreference ?? DEFAULT_CONTEXT_OPTIONS.powerPreference,
    stencil: options.stencil ?? DEFAULT_CONTEXT_OPTIONS.stencil,
    depth: options.depth ?? DEFAULT_CONTEXT_OPTIONS.depth,
    logarithmicDepthBuffer:
      options.logarithmicDepthBuffer ?? DEFAULT_CONTEXT_OPTIONS.logarithmicDepthBuffer,
    failIfMajorPerformanceCaveat:
      options.failIfMajorPerformanceCaveat ?? DEFAULT_CONTEXT_OPTIONS.failIfMajorPerformanceCaveat,
  };
}

/**
 * Constructor parameters actually consumed by three r160's WebGPU/WebGL backends.
 *
 * `@types/three@0.158` types the JSM `WebGPURenderer` constructor with only
 * `{ canvas, antialias, sampleCount }`, but `WebGPUBackend` forwards
 * `powerPreference` / `requiredLimits` to `requestAdapter()` and `WebGPURenderer`
 * reads `forceWebGL`. This interface documents the real contract so the call site
 * stays typed instead of reaching for `any` / `@ts-ignore`.
 */
export interface WebGPURendererParameters {
  canvas?: HTMLCanvasElement;
  antialias?: boolean;
  sampleCount?: number;
  powerPreference?: WebGLPowerPreference;
  forceWebGL?: boolean;
  requiredLimits?: Record<string, number>;
}

/** A constructed WebGPURenderer, presented to R3F through the WebGLRenderer-shaped surface it expects. */
export type WebGPURendererLike = THREE.WebGLRenderer & { init: () => Promise<void> };

type WebGPURendererCtor = new (parameters: WebGPURendererParameters) => WebGPURendererLike;

/**
 * Creates the Three.js renderer for the <Canvas> (R3F).
 *
 * - `webgpu`: WebGPURenderer (lazy loaded); falls back internally to WebGL2 when WebGPU unavailable.
 * - `webgl`:  Pure WebGLRenderer — stable reference for visual debugging, GLSL inspection, agent/Playwright pixel reads, and porting work.
 *
 * Both paths run through `configureRendererDefaults` so color space, tone mapping
 * and shadows are identical regardless of backend.
 *
 * R3F's gl function form receives the canvas element; we construct the renderer targeting it explicitly.
 */
export async function createGameRenderer(
  canvas: HTMLCanvasElement,
  options: GameRendererOptions
): Promise<THREE.WebGLRenderer> {
  const ctx = resolveContextOptions(options);
  const defaults: RendererDefaultsOptions = {
    toneMapping: options.toneMapping,
    toneMappingExposure: options.toneMappingExposure,
    shadows: options.shadows,
    clearColor: options.clearColor,
    clearAlpha: options.clearAlpha ?? (ctx.alpha ? 0 : 1),
  };

  if (options.preference === 'webgl') {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: ctx.antialias,
      alpha: ctx.alpha,
      premultipliedAlpha: ctx.premultipliedAlpha,
      preserveDrawingBuffer: ctx.preserveDrawingBuffer,
      powerPreference: ctx.powerPreference,
      stencil: ctx.stencil,
      depth: ctx.depth,
      logarithmicDepthBuffer: ctx.logarithmicDepthBuffer,
      failIfMajorPerformanceCaveat: ctx.failIfMajorPerformanceCaveat,
    });
    configureRendererDefaults(renderer, defaults);
    return renderer;
  }

  // WebGPU path (primary). Lazy import keeps the main bundle smaller until needed.
  // Use the examples/jsm path because three 0.160 package.json exports map does not expose "three/webgpu" directly.
  const mod = await import('three/examples/jsm/renderers/webgpu/WebGPURenderer.js');
  const WebGPURendererCtor = mod.default as unknown as WebGPURendererCtor;
  // Only antialias/sampleCount/powerPreference reach the WebGPU backend in r160;
  // stencil/depth/alpha/preserveDrawingBuffer are no-ops there (see docs/RENDERER.md).
  const renderer = new WebGPURendererCtor({
    canvas,
    antialias: ctx.antialias,
    powerPreference: ctx.powerPreference,
    // When WebGPU device cannot be created, three's WebGPURenderer falls back to a WebGL2 backend automatically.
    forceWebGL: false,
  });
  await renderer.init();
  configureRendererDefaults(renderer, defaults);
  // R3F expects something with .render, .setSize, domElement etc. WebGPURenderer satisfies this at runtime.
  return renderer;
}
