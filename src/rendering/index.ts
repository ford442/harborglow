export {
  createGameRenderer,
  resolveContextOptions,
  DEFAULT_CONTEXT_OPTIONS,
} from './createRenderer';
export type { GameRendererOptions } from './createRenderer';
export { readScreenshotPixelsAsync, CanvasReadbackError } from './canvasReadback';
export type { CanvasPixels, ReadCanvasPixelsOptions, AfterRenderScheduler } from './canvasReadback';
export {
  HARBOR_CANVAS_USAGE,
  HARBOR_CANVAS_ALPHA_MODE,
  canvasAlphaModeFor,
  GPU_TEXTURE_USAGE,
} from './canvasSurface';
export type { CanvasSurfaceConfig, CanvasAlphaMode } from './canvasSurface';
export {
  configureRendererDefaults,
  readRendererCapabilities,
  shadowQualityForPreset,
  shadowMapTypeForQuality,
  RENDERER_DEFAULTS,
} from './rendererDefaults';
export type { ConfigurableRenderer, RendererDefaultsOptions } from './rendererDefaults';
export {
  parseRendererPreference,
  parseScreenshotMode,
  parseNoGpuCompute,
  persistRendererPreference,
  syncRendererPreferenceToUrl,
  exposeRenderer,
  isRendererPreference,
} from './rendererConfig';
export {
  getRendererDiagnostics,
  subscribeRendererDiagnostics,
  detectActiveBackend,
  isWebGpuNavigatorAvailable,
  getRendererDisplayName,
} from './rendererState';
export { runStorageTextureComputeProbe } from './computeDiagnostics';
export {
  runWebgpuBootProbe,
  getWebgpuProbe,
  publishWebgpuProbe,
  resetWebgpuProbe,
  detectBrowserBrand,
  wasForceGlRequested,
  toWebgpuProbePublic,
  onWebgpuDeviceLost,
  reportWebgpuDeviceLost,
  WebgpuRequiredError,
} from './webgpuProbe';
export type {
  WebgpuProbePublic,
  WebgpuProbeOutcome,
  WebgpuProbeBrowser,
  WebgpuProbeAdapterInfo,
  WebgpuProbeCompute,
  WebgpuDeviceLostInfo,
} from './webgpuProbe';
export type {
  ActiveRendererBackend,
  ComputeProbeStatus,
  RendererCapabilities,
  RendererContextOptions,
  RendererDiagnostics,
  RendererPreference,
  ShadowQuality,
} from './types';
export { default as RendererDiagnosticsMonitor } from './RendererDiagnosticsMonitor';
export { default as FrameBudgetMonitor } from './FrameBudgetMonitor';
export { CommitProfiler } from './CommitProfiler';
export { default as WireframeDebug } from './WireframeDebug';
export {
  adoptComputeDevice,
  getGpuChoreSession,
  getGpuChoresBreadcrumb,
  GPU_CHORE_JOBS,
} from './gpuChores';
export type { GpuChoresBreadcrumb, GpuChoreBackend } from './gpuChores';
