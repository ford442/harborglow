import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { DEFAULT_CONTEXT_OPTIONS, resolveContextOptions } from '../createRenderer';
import {
  configureRendererDefaults,
  readRendererCapabilities,
  shadowMapTypeForQuality,
  shadowQualityForPreset,
  type ConfigurableRenderer,
} from '../rendererDefaults';
import { parseScreenshotMode, parseNoGpuCompute, parseRendererPreference } from '../rendererConfig';
import { runStorageTextureComputeProbe } from '../computeDiagnostics';

/** Minimal stand-in for either backend — configureRendererDefaults is structural by design. */
function makeFakeRenderer(overrides: Partial<ConfigurableRenderer> = {}) {
  const clear: { color: THREE.ColorRepresentation | null; alpha: number | null } = {
    color: null,
    alpha: null,
  };
  const renderer: ConfigurableRenderer = {
    outputColorSpace: THREE.LinearSRGBColorSpace,
    toneMapping: THREE.NoToneMapping,
    toneMappingExposure: 1,
    shadowMap: { enabled: false, type: null },
    setClearColor: (color, alpha = 1) => {
      clear.color = color;
      clear.alpha = alpha;
    },
    ...overrides,
  };
  return { renderer, clear };
}

describe('resolveContextOptions', () => {
  it('returns the documented defaults when nothing is passed', () => {
    expect(resolveContextOptions({})).toEqual(DEFAULT_CONTEXT_OPTIONS);
  });

  it('keeps depth on and log depth off (post stack reads the depth buffer)', () => {
    const opts = resolveContextOptions({});
    expect(opts.depth).toBe(true);
    expect(opts.logarithmicDepthBuffer).toBe(false);
  });

  it('honours explicit overrides, including falsey ones', () => {
    const opts = resolveContextOptions({
      antialias: false,
      alpha: true,
      preserveDrawingBuffer: true,
      stencil: true,
    });
    expect(opts.antialias).toBe(false);
    expect(opts.alpha).toBe(true);
    expect(opts.preserveDrawingBuffer).toBe(true);
    expect(opts.stencil).toBe(true);
    // Untouched keys still fall back to defaults.
    expect(opts.depth).toBe(DEFAULT_CONTEXT_OPTIONS.depth);
  });
});

describe('configureRendererDefaults', () => {
  it('applies sRGB output, ACES tone mapping and soft shadows', () => {
    const { renderer, clear } = makeFakeRenderer();
    configureRendererDefaults(renderer);

    expect(THREE.ColorManagement.enabled).toBe(true);
    expect(renderer.outputColorSpace).toBe(THREE.SRGBColorSpace);
    expect(renderer.toneMapping).toBe(THREE.ACESFilmicToneMapping);
    expect(renderer.shadowMap?.enabled).toBe(true);
    expect(renderer.shadowMap?.type).toBe(THREE.PCFSoftShadowMap);
    expect(clear.alpha).toBe(1);
  });

  it('disables the shadow map for the off tier', () => {
    const { renderer } = makeFakeRenderer();
    configureRendererDefaults(renderer, { shadows: 'off' });
    expect(renderer.shadowMap?.enabled).toBe(false);
  });

  it('respects caller overrides', () => {
    const { renderer, clear } = makeFakeRenderer();
    configureRendererDefaults(renderer, {
      toneMapping: THREE.NoToneMapping,
      toneMappingExposure: 1.4,
      shadows: 'basic',
      clearColor: 0x112233,
      clearAlpha: 0,
    });
    expect(renderer.toneMapping).toBe(THREE.NoToneMapping);
    expect(renderer.toneMappingExposure).toBe(1.4);
    expect(renderer.shadowMap?.type).toBe(THREE.BasicShadowMap);
    expect(clear.color).toBe(0x112233);
    expect(clear.alpha).toBe(0);
  });

  it('is safe on a backend that lacks shadowMap / setClearColor (WebGPU shim variance)', () => {
    const bare: ConfigurableRenderer = { outputColorSpace: THREE.LinearSRGBColorSpace };
    expect(() => configureRendererDefaults(bare)).not.toThrow();
    expect(bare.outputColorSpace).toBe(THREE.SRGBColorSpace);
  });

  it('produces the same result for both backends given the same options', () => {
    const a = makeFakeRenderer().renderer;
    const b = makeFakeRenderer({ getMaxAnisotropy: () => 16 }).renderer;
    configureRendererDefaults(a);
    configureRendererDefaults(b);
    expect(a.outputColorSpace).toBe(b.outputColorSpace);
    expect(a.toneMapping).toBe(b.toneMapping);
    expect(a.shadowMap?.type).toBe(b.shadowMap?.type);
  });
});

describe('shadow quality mapping', () => {
  it('maps quality presets to shadow tiers', () => {
    expect(shadowQualityForPreset('low')).toBe('basic');
    expect(shadowQualityForPreset('medium')).toBe('pcf');
    expect(shadowQualityForPreset('high')).toBe('soft');
    expect(shadowQualityForPreset('cinema')).toBe('soft');
    expect(shadowQualityForPreset('nonsense')).toBe('soft');
  });

  it('maps tiers to THREE shadow map types', () => {
    expect(shadowMapTypeForQuality('basic')).toBe(THREE.BasicShadowMap);
    expect(shadowMapTypeForQuality('pcf')).toBe(THREE.PCFShadowMap);
    expect(shadowMapTypeForQuality('soft')).toBe(THREE.PCFSoftShadowMap);
    expect(shadowMapTypeForQuality('off')).toBe(THREE.PCFSoftShadowMap);
  });
});

describe('readRendererCapabilities', () => {
  it('reads WebGL-style capabilities and context attributes', () => {
    const caps = readRendererCapabilities({
      capabilities: { maxTextureSize: 8192, getMaxAnisotropy: () => 16 },
      getContext: () => ({
        getContextAttributes: () => ({ preserveDrawingBuffer: true }),
      }),
    } as unknown as ConfigurableRenderer);

    expect(caps.maxTextureSize).toBe(8192);
    expect(caps.maxAnisotropy).toBe(16);
    expect(caps.preserveDrawingBuffer).toBe(true);
  });

  it('reads WebGPU adapter info and the renderer-level anisotropy getter', () => {
    const caps = readRendererCapabilities({
      getMaxAnisotropy: () => 8,
      backend: {
        isWebGPUBackend: true,
        adapter: { info: { vendor: 'acme', architecture: 'gpu-1' } },
        device: { features: { has: (feature: string) => feature === 'float32-filterable' } },
      },
    } as unknown as ConfigurableRenderer);

    expect(caps.maxAnisotropy).toBe(8);
    expect(caps.computeShaders).toBe(true);
    expect(caps.float32Filterable).toBe(true);
    expect(caps.adapterInfo?.vendor).toBe('acme');
    expect(caps.adapterInfo?.architecture).toBe('gpu-1');
  });

  it('never throws on a renderer that exposes nothing', () => {
    const caps = readRendererCapabilities({});
    expect(caps).toEqual({
      maxTextureSize: null,
      maxAnisotropy: null,
      computeShaders: null,
      float32Filterable: null,
      preserveDrawingBuffer: null,
      adapterInfo: null,
    });
  });
});

describe('runStorageTextureComputeProbe', () => {
  it('waits for a real compute submission before reporting passed', async () => {
    let submitted = false;
    const result = await runStorageTextureComputeProbe({
      computeAsync: async (computeNode) => {
        submitted = computeNode.isComputeNode;
      },
    });

    expect(submitted).toBe(true);
    expect(result).toBe('passed');
  });

  it('reports unsupported when the renderer has no compute queue', async () => {
    await expect(runStorageTextureComputeProbe({})).resolves.toBe('unsupported');
  });

  it('reports failed when the backend rejects the submission', async () => {
    await expect(
      runStorageTextureComputeProbe({
        computeAsync: async () => {
          throw new Error('compute unavailable');
        },
      }),
    ).resolves.toBe('failed');
  });
});

describe('parseScreenshotMode', () => {
  it('is off by default', () => {
    expect(parseScreenshotMode('')).toBe(false);
  });

  it('is enabled by ?screenshot=1 or ?preserveDrawingBuffer=1', () => {
    expect(parseScreenshotMode('?screenshot=1')).toBe(true);
    expect(parseScreenshotMode('?screenshot=true')).toBe(true);
    expect(parseScreenshotMode('?preserveDrawingBuffer=1')).toBe(true);
    expect(parseScreenshotMode('?screenshot=0')).toBe(false);
  });
});

describe('parseNoGpuCompute', () => {
  it('is off by default and enabled by ?no_gpu_compute=1', () => {
    expect(parseNoGpuCompute('')).toBe(false);
    expect(parseNoGpuCompute('?no_gpu_compute=1')).toBe(true);
    expect(parseNoGpuCompute('?no_gpu_compute=true')).toBe(true);
  });
});

describe('parseRendererPreference', () => {
  it('always returns webgpu even when ?renderer=webgl is set', () => {
    expect(parseRendererPreference('')).toBe('webgpu');
    expect(parseRendererPreference('?renderer=webgl')).toBe('webgpu');
    expect(parseRendererPreference('?renderer=webgpu')).toBe('webgpu');
  });
});
