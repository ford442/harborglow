import { Rng } from './Rng'

/** Simulation timestep. All deterministic systems integrate at this rate. */
export const SIM_DT = 1 / 60

export interface SimContext {
  /** Deterministic PRNG. Never Math.random() in sim systems. */
  rng: Rng
  /** Monotonic simulation time in seconds, advanced only by the fixed-step scheduler. */
  simTime: number
  /** Fixed timestep in seconds (SIM_DT). */
  dt: number
  /** Frame ordinal since the last seed/reset. */
  tick: number
  /** Interpolation factor in [0, 1) for rendering between sim steps. */
  alpha: number
}

const DEFAULT_SEED = 0x48474c57

let current: SimContext = {
  rng: new Rng(DEFAULT_SEED),
  simTime: 0,
  dt: SIM_DT,
  tick: 0,
  alpha: 0,
}

export function getSim(): SimContext {
  return current
}

export function setSim(next: SimContext): void {
  current = next
}

/** Uniform [0, 1) from the active sim RNG. Drop-in for Math.random() in sim code. */
export function simRandom(): number {
  return current.rng.next()
}

/** Milliseconds since sim origin. Drop-in for Date.now() / performance.now() in sim code. */
export function simNowMs(): number {
  return current.simTime * 1000
}

export function createSimContext(seed: number): SimContext {
  return {
    rng: new Rng(seed),
    simTime: 0,
    dt: SIM_DT,
    tick: 0,
    alpha: 0,
  }
}
