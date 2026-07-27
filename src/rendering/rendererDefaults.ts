/**
 * Shared color / tone-mapping / shadow configuration for BOTH renderer backends.
 *
 * Three's `WebGLRenderer` and the WebGPU `Renderer` base class do not ship the
 * same defaults (notably `toneMapping` and `shadowMap.type`), which is the main
 * source of the dual-backend parity drift `docs/RENDERER.md` warns about.
 * Every renderer HarborGlow creates goes through `configureRendererDefaults`
 * so the two paths start from an identical look.
 */

import * as THREE from 'three';
import type { RendererCapabilities, ShadowQuality } from './types';

/** Structural view of the parts of a renderer we configure. Covers WebGLRenderer and WebGPURenderer. */
export interface ConfigurableRenderer {
  outputColorSpace?: string;
  toneMapping?: THREE.ToneMapping;
  toneMappingExposure?: number;
  shadowMap?: { enabled: boolean; type: THREE.ShadowMapType | null };
  setClearColor?: (color: THREE.ColorRepresentation, alpha?: number) => void;
  getContext?: () => unknown;
  getMaxAnisotropy?: () => number;
  capabilities?: { maxTextureSize?: number; getMaxAnisotropy?: () => number };
  backend?: { adapter?: { info?: Record<string, string> } };
}

export interface RendererDefaultsOptions {
  toneMapping?: THREE.ToneMapping;
  toneMappingExposure?: number;
  /** Quality-preset aware shadow tier. */
  shadows?: ShadowQuality;
  /** Harbor fog colour; kept consistent with the scene background. */
  clearColor?: THREE.ColorRepresentation;
  clearAlpha?: number;
}

const SHADOW_MAP_TYPES: Record<Exclude<ShadowQuality, 'off'>, THREE.ShadowMapType> = {
  basic: THREE.BasicShadowMap,
  pcf: THREE.PCFShadowMap,
  soft: THREE.PCFSoftShadowMap,
};

/** Defaults applied when the caller does not override them. */
export const RENDERER_DEFAULTS: Required<Omit<RendererDefaultsOptions, 'clearColor'>> & {
  clearColor: THREE.ColorRepresentation;
} = {
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.0,
  shadows: 'soft',
  // Night-harbor fog base; individual scenes still set their own background/fog.
  clearColor: 0x0a0f14,
  clearAlpha: 1,
};

/**
 * Applies color space, tone mapping, shadows and clear colour to a renderer.
 * Every write is guarded so a backend that lacks a field is simply skipped
 * rather than throwing (WebGPURenderer's `shadowMap` is a compat shim).
 */
export function configureRendererDefaults(
  renderer: ConfigurableRenderer,
  options: RendererDefaultsOptions = {}
): void {
  const {
    toneMapping = RENDERER_DEFAULTS.toneMapping,
    toneMappingExposure = RENDERER_DEFAULTS.toneMappingExposure,
    shadows = RENDERER_DEFAULTS.shadows,
    clearColor = RENDERER_DEFAULTS.clearColor,
    clearAlpha = RENDERER_DEFAULTS.clearAlpha,
  } = options;

  // Linear working space with sRGB output — identical on both backends.
  THREE.ColorManagement.enabled = true;
  if ('outputColorSpace' in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  if ('toneMapping' in renderer) {
    renderer.toneMapping = toneMapping;
    renderer.toneMappingExposure = toneMappingExposure;
  }

  if (renderer.shadowMap) {
    renderer.shadowMap.enabled = shadows !== 'off';
    if (shadows !== 'off') {
      renderer.shadowMap.type = SHADOW_MAP_TYPES[shadows];
    }
  }

  if (typeof renderer.setClearColor === 'function') {
    renderer.setClearColor(clearColor, clearAlpha);
  }
}

/**
 * THREE shadow map type for a tier ('off' keeps the soft type but the map disabled).
 * Exported so R3F's `<Canvas shadows={...}>` prop can be kept in sync with
 * `configureRendererDefaults` — R3F re-applies shadow settings after gl creation.
 */
export function shadowMapTypeForQuality(shadows: ShadowQuality): THREE.ShadowMapType {
  return shadows === 'off' ? THREE.PCFSoftShadowMap : SHADOW_MAP_TYPES[shadows];
}

/** Maps the game's quality preset onto a shadow tier. */
export function shadowQualityForPreset(preset: string): ShadowQuality {
  switch (preset) {
    case 'low':
      return 'basic';
    case 'medium':
      return 'pcf';
    case 'high':
    case 'cinema':
      return 'soft';
    default:
      return 'soft';
  }
}

/**
 * Reads GPU limits / adapter info back from a live renderer.
 * Everything is optional-chained: WebGPURenderer exposes a different surface
 * than WebGLRenderer, and neither is guaranteed under a software rasterizer.
 */
export function readRendererCapabilities(renderer: ConfigurableRenderer): RendererCapabilities {
  const caps: RendererCapabilities = {
    maxTextureSize: null,
    maxAnisotropy: null,
    preserveDrawingBuffer: null,
    adapterInfo: null,
  };

  try {
    if (typeof renderer.capabilities?.maxTextureSize === 'number') {
      caps.maxTextureSize = renderer.capabilities.maxTextureSize;
    }

    if (typeof renderer.getMaxAnisotropy === 'function') {
      caps.maxAnisotropy = renderer.getMaxAnisotropy();
    } else if (typeof renderer.capabilities?.getMaxAnisotropy === 'function') {
      caps.maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    }

    const ctx = typeof renderer.getContext === 'function' ? renderer.getContext() : null;
    const glCtx = ctx as WebGL2RenderingContext | null;
    if (glCtx && typeof glCtx.getContextAttributes === 'function') {
      const attrs = glCtx.getContextAttributes();
      if (attrs) caps.preserveDrawingBuffer = attrs.preserveDrawingBuffer === true;
      if (caps.maxTextureSize === null && typeof glCtx.getParameter === 'function') {
        caps.maxTextureSize = glCtx.getParameter(glCtx.MAX_TEXTURE_SIZE) ?? null;
      }
    }

    const info = renderer.backend?.adapter?.info;
    if (info) {
      caps.adapterInfo = {
        vendor: info.vendor,
        architecture: info.architecture,
        device: info.device,
        description: info.description,
      };
    }
  } catch {
    // Diagnostics must never break rendering.
  }

  return caps;
}
