// =============================================================================
// OCEAN — quality-gated FFT ocean (ADR 0001 Phase C)
//
// `low` / `medium` keep the Gerstner sum in WaveSystem + gerstnerTsl.
// `high` swaps in a 128² Phillips/IFFT field shared by the shader and by every
// CPU height query. See docs/systems/OCEAN_FFT.md.
// =============================================================================

import type { QualityPreset } from '../../store/gameStoreTypes'
import { getSim } from '../sim/SimContext'

export { fft2d, getFftPlan, Fft1D } from './fft2d'
export {
  OceanFFTField,
  DEFAULT_OCEAN_FFT_CONFIG,
  GRAVITY,
  type OceanFFTConfig,
} from './OceanFFTField'

/**
 * Grid resolution per quality preset; 0 means "stay on Gerstner".
 *
 * `cinema` (256²) is not a preset the store models yet — when it lands, add the
 * row here and nothing else changes. A 256² CPU transform costs ~17 ms, so it
 * is gated on the GPU butterfly path (PR 2) rather than shipped on the CPU.
 */
export const OCEAN_FFT_SIZE_BY_QUALITY: Record<QualityPreset, number> = {
  low: 0,
  medium: 0,
  high: 128,
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
