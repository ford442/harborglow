import { useEffect, useState } from 'react'
import {
  getRendererDiagnostics,
  subscribeRendererDiagnostics,
  type RendererDiagnostics,
} from '../rendering'

/**
 * WebGPUWarning / RendererStatus — shows a top banner when:
 *   - WebGPU is unavailable in the browser (original behavior)
 *   - The active renderer is the WebGL2 debug fallback (either forced via ?renderer=webgl or because WebGPU init fell back)
 *
 * This component now subscribes to the shared renderer diagnostics (populated by
 * RendererDiagnosticsMonitor inside the Canvas) so it accurately reflects the
 * current backend even after live switches.
 *
 * The banner is intentionally non-interactive (pointer-events-none) so it never
 * blocks crane / HUD controls. It is useful for agents, Playwright traces, and
 * manual visual debugging sessions.
 */
export default function WebGPUWarning() {
  const [diagnostics, setDiagnostics] = useState<RendererDiagnostics>(() => getRendererDiagnostics())

  useEffect(() => {
    const unsub = subscribeRendererDiagnostics(() => {
      setDiagnostics({ ...getRendererDiagnostics() })
    })
    // Initial sync in case the monitor has already fired
    setDiagnostics({ ...getRendererDiagnostics() })
    return unsub
  }, [])

  const usingWebGL = diagnostics.activeBackend === 'webgl' || diagnostics.preference === 'webgl'
  const noWebGPU = typeof navigator !== 'undefined' && !('gpu' in navigator)

  // Always show when forced to WebGL debug path, or when WebGPU genuinely missing.
  const shouldShow = usingWebGL || noWebGPU
  if (!shouldShow) return null

  const isForcedDebug = diagnostics.preference === 'webgl'
  const isInternalFallback = diagnostics.activeBackend === 'webgl2-fallback'

  let message = ''
  if (isForcedDebug) {
    message = '🛠️ WebGL2 debug renderer active (via ?renderer=webgl / Leva / localStorage). Shared scene state is identical; use for visual inspection, shader parity checks, and agent-assisted debugging.'
  } else if (isInternalFallback) {
    message = '⚠️ WebGPURenderer fell back to WebGL2 backend. Some advanced features may be limited.'
  } else if (noWebGPU) {
    message = '⚠️ WebGPU not detected — running in WebGL fallback mode. For the best experience use Chrome 121+, Edge 121+, or Firefox Nightly.'
  } else {
    message = '🛠️ WebGL2 renderer active.'
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="bg-yellow-900/80 border-b border-yellow-600/60 px-4 py-1.5 text-center">
        <p className="text-xs text-yellow-300">
          {message}
          <span className="ml-2 opacity-70">
            (active: {diagnostics.rendererName})
          </span>
        </p>
      </div>
    </div>
  )
}
