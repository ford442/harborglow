// =============================================================================
// OCEAN — quality-gated FFT ocean (ADR 0001 Phase C)
//
// `low` / `medium` keep the Gerstner sum in WaveSystem + gerstnerTsl.
// `high` swaps in a 128² Phillips/IFFT field shared by the shader and by every
// CPU height query. `cinema` is a GPU-only 256² ocean tier (not a store
// QualityPreset) selected via `?ocean=cinema` or the Water Leva folder.
// See docs/systems/OCEAN_FFT.md.
// =============================================================================

import type { QualityPreset } from '../../store/gameStoreTypes'
import { getSim } from '../sim/SimContext'

export { fft2d, fft2dR2C, fft2dC2R, getFftPlan, Fft1D } from './fft2d'
export { stockham2d } from './stockham2d'
export { canUseGpuOceanFft, parseOceanCinema } from './oceanGpuGate'
export type { OceanGpuRenderer } from './oceanGpuGate'
export {
  OceanFFTField,
  DEFAULT_OCEAN_FFT_CONFIG,
  GRAVITY,
  type OceanFFTConfig,
} from './OceanFFTField'

/** Store presets plus the ocean-only cinema tier. */
export type OceanFftTier = QualityPreset | 'cinema'

/**
 * Grid resolution per ocean tier; 0 means "stay on Gerstner".
 *
 * Cinema (256²) is GPU-only — never run that size on the JS CPU path.
 */
export const OCEAN_FFT_SIZE_BY_QUALITY: Record<OceanFftTier, number> = {
  low: 0,
  medium: 0,
  high: 128,
  cinema: 256,
}

/**
 * Resolve the live FFT grid size.
 *
 * Cinema is ignored on Gerstner tiers and falls back to 128 when the GPU gate
 * is closed, so a 256² CPU IFFT is never scheduled.
 */
export function resolveOceanFftSize(
  quality: QualityPreset,
  opts: { cinema?: boolean; gpu?: boolean } = {},
): number {
  const base = OCEAN_FFT_SIZE_BY_QUALITY[quality] ?? 0
  if (base === 0) return 0
  if (opts.cinema && opts.gpu) return OCEAN_FFT_SIZE_BY_QUALITY.cinema
  return OCEAN_FFT_SIZE_BY_QUALITY.high
}

/** Stream id for the ocean spectrum, so its draw never perturbs other systems. */
const OCEAN_RNG_STREAM = 0x0cea4

/**
 * Deterministic seed for the h̃₀ spectrum.
 *
 * `Rng.fork` derives an independent stream *without advancing* the sim RNG, so
 * building (or rebuilding) the ocean cannot shift the sim hash. Same sim seed ⇒
 * same ocean, which is what keeps replays reproducible.
 */
export function oceanFFTSeed(): number {
  return getSim().rng.fork(OCEAN_RNG_STREAM).nextUint32()
}
