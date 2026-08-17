export {
  createGameRenderer,
  resolveContextOptions,
  DEFAULT_CONTEXT_OPTIONS,
} from './createRenderer';
export type { GameRendererOptions } from './createRenderer';
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
  WebgpuRequiredError,
} from './webgpuProbe';
export type {
  WebgpuProbePublic,
  WebgpuProbeOutcome,
  WebgpuProbeBrowser,
  WebgpuProbeAdapterInfo,
  WebgpuProbeCompute,
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
export { default as WireframeDebug } from './WireframeDebug';
export {
  adoptComputeDevice,
  getGpuChoreSession,
  getGpuChoresBreadcrumb,
  GPU_CHORE_JOBS,
} from './gpuChores';
export type { GpuChoresBreadcrumb, GpuChoreBackend } from './gpuChores';
