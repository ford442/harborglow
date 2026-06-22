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
import type { RendererPreference } from './types';

export interface RendererDiagnosticsMonitorProps {
  preference: RendererPreference;
}

export default function RendererDiagnosticsMonitor({ preference }: RendererDiagnosticsMonitorProps) {
  const { gl } = useThree();

  useEffect(() => {
    const activeBackend = detectActiveBackend(gl as any);
    const displayName = getRendererDisplayName(preference, activeBackend);

    updateRendererDiagnostics({
      preference,
      activeBackend,
      rendererName: displayName,
      webgpuAvailable: isWebGpuNavigatorAvailable(),
      initialized: true,
    });

    // Expose for external tooling / CI / agents (canvas may be obtained via gl.domElement)
    const canvas = (gl as any).domElement as HTMLCanvasElement | undefined;
    exposeRenderer(canvas || null, preference, activeBackend);
  }, [gl, preference]);

  return null;
}
