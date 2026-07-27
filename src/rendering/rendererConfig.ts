import type { RendererCapabilities, RendererContextOptions, RendererPreference } from './types';

const STORAGE_KEY = 'harborglow.renderer.preference';
const VALID: RendererPreference[] = ['webgl', 'webgpu'];

export function parseRendererPreference(search = window.location.search): RendererPreference {
  const raw = new URLSearchParams(search).get('renderer');
  if (raw === 'webgl' || raw === 'webgpu') return raw;

  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'webgl' || stored === 'webgpu') return stored;
    } catch {
      // ignore storage failures (private mode etc)
    }
  }

  // Default: WebGPU path (auto-falls back to WebGL2 when unavailable inside WebGPURenderer).
  return 'webgpu';
}

export function isRendererPreference(value: string): value is RendererPreference {
  return (VALID as string[]).includes(value);
}

export function syncRendererPreferenceToUrl(preference: RendererPreference): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  params.set('renderer', preference);
  const next = params.toString();
  window.history.replaceState({}, '', `${window.location.pathname}?${next}`);
}

export function persistRendererPreference(preference: RendererPreference): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // ignore storage failures
  }
  syncRendererPreferenceToUrl(preference);
}

/**
 * Screenshot mode forces `preserveDrawingBuffer: true` so `canvas.toDataURL()` /
 * Playwright pixel reads return the last rendered frame instead of a blank buffer.
 *
 * Enabled by `?screenshot=1`, `?preserveDrawingBuffer=1`, or a Playwright/headless UA.
 */
export function parseScreenshotMode(search = typeof window === 'undefined' ? '' : window.location.search): boolean {
  const params = new URLSearchParams(search);
  const truthy = (raw: string | null) => raw === '1' || raw === 'true';
  if (truthy(params.get('screenshot')) || truthy(params.get('preserveDrawingBuffer'))) return true;

  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    if (/Playwright|HeadlessChrome/i.test(ua)) return true;
    if ((navigator as any).webdriver === true) return true;
  }
  return false;
}

export interface ExposeRendererDetails {
  contextOptions?: RendererContextOptions | null;
  capabilities?: RendererCapabilities | null;
}

/**
 * Apply canvas data attributes and window hints for Playwright / agents / debug.
 */
export function exposeRenderer(
  canvas: HTMLCanvasElement | null,
  preference: RendererPreference,
  activeBackend: string,
  details: ExposeRendererDetails = {}
): void {
  if (typeof window !== 'undefined') {
    (window as any).currentRenderer = preference;
    (window as any).harborglowRenderer = {
      preference,
      activeBackend,
      contextOptions: details.contextOptions ?? null,
      capabilities: details.capabilities ?? null,
    };
  }
  if (canvas) {
    canvas.dataset.renderer = preference;
    canvas.dataset.activeBackend = activeBackend;
    canvas.dataset.webglVersion = activeBackend.includes('webgl') ? '2' : '';
    if (details.contextOptions) {
      canvas.dataset.preserveDrawingBuffer = String(details.contextOptions.preserveDrawingBuffer);
    }
  }
}
