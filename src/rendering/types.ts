/** Requested renderer backend via URL param or debug UI. */
export type RendererPreference = 'webgl' | 'webgpu';

/** Actual GPU backend after initialization (WebGPURenderer may fall back to WebGL2). */
export type ActiveRendererBackend = 'webgl' | 'webgl2-fallback' | 'webgpu';

/** Shadow map quality tier. Maps onto a THREE shadow map type in configureRendererDefaults. */
export type ShadowQuality = 'off' | 'basic' | 'pcf' | 'soft';

/**
 * Context creation options requested for the renderer.
 *
 * Not every flag is honoured by every backend — see the option matrix in
 * `docs/RENDERER.md`. The resolved values are recorded in diagnostics so tools
 * can tell what was *asked for* even when a backend silently ignores it.
 */
export interface RendererContextOptions {
  antialias: boolean;
  alpha: boolean;
  premultipliedAlpha: boolean;
  /** Required for reliable canvas.toDataURL() screenshots (Playwright / agents). */
  preserveDrawingBuffer: boolean;
  powerPreference: WebGLPowerPreference;
  stencil: boolean;
  depth: boolean;
  logarithmicDepthBuffer: boolean;
  failIfMajorPerformanceCaveat: boolean;
}

/** GPU limits / adapter info read back after the renderer is live. */
export interface RendererCapabilities {
  maxTextureSize: number | null;
  maxAnisotropy: number | null;
  /** Whether the live context actually kept the drawing buffer (WebGL only; null when unknown). */
  preserveDrawingBuffer: boolean | null;
  /** WebGPU adapter info when exposed by the browser. */
  adapterInfo: {
    vendor?: string;
    architecture?: string;
    device?: string;
    description?: string;
  } | null;
}

export interface RendererDiagnostics {
  preference: RendererPreference;
  activeBackend: ActiveRendererBackend;
  rendererName: string;
  webgpuAvailable: boolean;
  /** False until RendererDiagnosticsMonitor reports the first real backend (gl is created via an async factory). */
  initialized: boolean;
  /** Options requested at context creation time (null before the renderer is built). */
  contextOptions: RendererContextOptions | null;
  /** Limits/adapter info read back from the live renderer (null before init). */
  capabilities: RendererCapabilities | null;
}
