/**
 * Reports active renderer backend to the module-level rendererState store.
 * Must live inside <Canvas> (uses useThree).
 * Also triggers global exposure for agents/Playwright (window + canvas dataset).
 */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import {
  detectActiveBackend,
  getRendererDisplayName,
  isWebGpuNavigatorAvailable,
  updateRendererDiagnostics,
} from './rendererState';
import { exposeRenderer } from './rendererConfig';
import { readRendererCapabilities, type ConfigurableRenderer } from './rendererDefaults';
import type { RendererContextOptions, RendererPreference } from './types';

export interface RendererDiagnosticsMonitorProps {
  preference: RendererPreference;
  /** Options requested when the renderer was created (App owns them). */
  contextOptions?: RendererContextOptions | null;
}

export default function RendererDiagnosticsMonitor({
  preference,
  contextOptions = null,
}: RendererDiagnosticsMonitorProps) {
  const { gl } = useThree();

  useEffect(() => {
    const activeBackend = detectActiveBackend(gl as any);
    const displayName = getRendererDisplayName(preference, activeBackend);
    const capabilities = readRendererCapabilities(gl as unknown as ConfigurableRenderer);

    updateRendererDiagnostics({
      preference,
      activeBackend,
      rendererName: displayName,
      webgpuAvailable: isWebGpuNavigatorAvailable(),
      initialized: true,
      contextOptions,
      capabilities,
    });

    // Expose for external tooling / CI / agents (canvas may be obtained via gl.domElement)
    const canvas = (gl as any).domElement as HTMLCanvasElement | undefined;
    exposeRenderer(canvas || null, preference, activeBackend, { contextOptions, capabilities });
  }, [gl, preference, contextOptions]);

  return null;
}
