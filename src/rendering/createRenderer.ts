import * as THREE from 'three';
import type { RendererPreference } from './types';

export interface GameRendererOptions {
  preference: RendererPreference;
  antialias?: boolean;
  powerPreference?: WebGLPowerPreference;
  stencil?: boolean;
  depth?: boolean;
}

/**
 * Creates the Three.js renderer for the <Canvas> (R3F).
 *
 * - `webgpu`: WebGPURenderer (lazy loaded from 'three/webgpu'); falls back internally to WebGL2 when WebGPU unavailable.
 * - `webgl`:  Pure WebGLRenderer — stable reference for visual debugging, GLSL inspection, agent/Playwright pixel reads, and porting work.
 *
 * R3F's gl function form receives the canvas element; we construct the renderer targeting it explicitly.
 */
export async function createGameRenderer(
  canvas: HTMLCanvasElement,
  options: GameRendererOptions
): Promise<THREE.WebGLRenderer> {
  const {
    preference,
    antialias = true,
    powerPreference = 'high-performance',
    stencil = false,
    depth = true,
  } = options;

  if (preference === 'webgl') {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias,
      powerPreference,
      stencil,
      depth,
    });
    return renderer;
  }

  // WebGPU path (primary). Lazy import keeps the main bundle smaller until needed.
  // Use the examples/jsm path because three 0.160 package.json exports map does not expose "three/webgpu" directly.
  const mod = await import('three/examples/jsm/renderers/webgpu/WebGPURenderer.js');
  const WebGPURendererCtor = (mod as any).WebGPURenderer || (mod as any).default || (mod as any);
  const renderer = new WebGPURendererCtor({
    canvas,
    antialias,
    // When WebGPU device cannot be created, three's WebGPURenderer falls back to a WebGL2 backend automatically.
    forceWebGL: false,
  });
  await renderer.init();
  // R3F expects something with .render, .setSize, domElement etc. WebGPURenderer satisfies this at runtime.
  return renderer as unknown as THREE.WebGLRenderer;
}
