import { updateRendererDiagnostics } from '../rendererState'
import { defaultGpuChoresBreadcrumb, type GpuChoresBreadcrumb } from './types'

let current = defaultGpuChoresBreadcrumb()

export function getGpuChoresBreadcrumb(): Readonly<GpuChoresBreadcrumb> {
  return current
}

/**
 * Publish helper telemetry onto the existing renderer diagnostics +
 * window.harborglowRenderer / canvas.dataset so agents can read degrade
 * reasons without introspecting WebGPU.
 */
export function publishGpuChoresBreadcrumb(
  partial: Partial<Omit<GpuChoresBreadcrumb, 'jobs'>> & {
    jobs?: Partial<GpuChoresBreadcrumb['jobs']>
  },
  canvas?: HTMLCanvasElement | null,
): GpuChoresBreadcrumb {
  current = {
    ...current,
    ...partial,
    jobs: { ...current.jobs, ...(partial.jobs ?? {}) },
  }

  updateRendererDiagnostics({ gpuChores: current })

  if (typeof window !== 'undefined') {
    const prev = ((window as unknown as { harborglowRenderer?: Record<string, unknown> }).harborglowRenderer) ?? {}
    ;(window as unknown as { harborglowRenderer: Record<string, unknown> }).harborglowRenderer = {
      ...prev,
      gpuChores: current,
    }
  }

  if (canvas) {
    canvas.dataset.gpuChoresBackend = current.backend
    canvas.dataset.gpuChoresKillSwitch = current.killSwitch ? '1' : '0'
  }

  return current
}

export function resetGpuChoresBreadcrumb(): void {
  current = defaultGpuChoresBreadcrumb()
}
