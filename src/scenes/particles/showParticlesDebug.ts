// =============================================================================
// showParticles debug counter — window.harborglowDebug.showParticles
//
// `harborglowDebug` is only created in screenshot mode (GameShell), so this
// attaches to it when present and never creates it: production pages stay clean.
// The stats object is mutated in place every frame by GpuParticleLayer.
// =============================================================================

export interface ShowParticlesStats {
  /** Ring capacity for the current quality tier. */
  budget: number
  /** Estimated live particles (see aliveEstimate.ts). */
  alive: number
  /** Show-emitter bindings playing right now. */
  emitters: number
}

type DebugHost = { harborglowDebug?: { showParticles?: ShowParticlesStats } }

/** Attach (or with `null`, detach) `stats`. Cheap; safe to call every few frames. */
export function publishShowParticlesDebug(stats: ShowParticlesStats | null): void {
  if (typeof window === 'undefined') return
  const debug = (window as unknown as DebugHost).harborglowDebug
  if (!debug) return
  if (stats) {
    if (debug.showParticles !== stats) debug.showParticles = stats
  } else {
    delete debug.showParticles
  }
}
