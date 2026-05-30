import type { ShipType, TugboatCareerStats } from '../store/useGameStore'
import { sequencerSystem } from './sequencerSystem'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// TUG CINEMATIC SYSTEM
// Objective-complete, win, and salvage cinematic sequences for tugboat mode.
// Mirrors the structure of cinematicSystem.ts but targets the tug + towed vessel.
// =============================================================================

export type TugCinematicType = 'objective' | 'win' | 'salvage'

export interface TugCinematicDetail {
  type: TugCinematicType
  /** Human-readable label for the objective / contract */
  label: string
  shipType: ShipType
  /** Career stats snapshot shown in the overlay */
  careerStats?: Partial<TugboatCareerStats>
}

/** Custom event name dispatched when a tug cinematic sequence starts */
export const TUG_CINEMATIC_START_EVENT = 'tugCinematicStart'
/** Custom event name dispatched when the overlay should be hidden */
export const TUG_CINEMATIC_END_EVENT = 'tugCinematicEnd'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function dispatch(eventName: string, detail: unknown): void {
  if (typeof globalThis.dispatchEvent === 'function') {
    globalThis.dispatchEvent(new CustomEvent(eventName, { detail }))
  }
}

/**
 * Core sequenced cinematic for tug manoeuvres.
 * Beat 0  — Spotlight pulse + overlay reveal
 * Beat 4  — Tug spectator drone activates
 * Beat 20 — Climax glow intensification
 * Beat 32 — Overlay hides, drone deactivates
 */
function runTugCinematic(detail: TugCinematicDetail): void {
  // Beat 0 — Immediate: overlay reveal
  dispatch(TUG_CINEMATIC_START_EVENT, detail)
  dispatch('tugCinematicSpotlightPulse', detail)

  // Beat 4 — Activate the tug spectator drone camera
  sequencerSystem.schedule(4, () => {
    useGameStore.getState().setTugSpectatorActive(true)
  })

  // Beat 20 — Glowing wake intensification cue
  sequencerSystem.schedule(20, () => {
    dispatch('tugCinematicClimax', detail)
  })

  // Beat 32 — End the drone and dismiss overlay
  sequencerSystem.schedule(32, () => {
    useGameStore.getState().setTugSpectatorActive(false)
    dispatch(TUG_CINEMATIC_END_EVENT, detail)
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Trigger a cinematic on a successful berth docking.
 *
 * @param shipType     - The type of the docked vessel
 * @param objectiveLabel - Human-readable berth name (e.g. "Berth Alpha")
 * @param careerStats  - Current career stats snapshot for the overlay
 */
export function triggerTugObjectiveCinematic(
  shipType: ShipType,
  objectiveLabel: string,
  careerStats?: Partial<TugboatCareerStats>,
): void {
  runTugCinematic({ type: 'objective', label: objectiveLabel, shipType, careerStats })
}

/**
 * Trigger the win cinematic when all 3 objectives are docked.
 *
 * @param careerStats - Final career stats for the commendation overlay
 */
export function triggerTugWinCinematic(careerStats: TugboatCareerStats): void {
  const detail: TugCinematicDetail = {
    type: 'win',
    label: 'All Berths Secured',
    shipType: 'container',
    careerStats,
  }

  // Beat 0 — overlay
  dispatch(TUG_CINEMATIC_START_EVENT, detail)
  dispatch('tugCinematicSpotlightPulse', detail)

  // Beat 4 — drone
  sequencerSystem.schedule(4, () => {
    useGameStore.getState().setTugSpectatorActive(true)
  })

  // Beat 20 — climax
  sequencerSystem.schedule(20, () => {
    dispatch('tugCinematicClimax', detail)
  })

  // Beat 40 — longer hold for win moment, then end
  sequencerSystem.schedule(40, () => {
    useGameStore.getState().setTugSpectatorActive(false)
    dispatch(TUG_CINEMATIC_END_EVENT, detail)
  })
}

/**
 * Trigger a cinematic on successful completion of a salvage contract.
 *
 * @param vesselLabel  - The vessel label from the contract (e.g. "Rustline Trawler 12")
 * @param shipType     - The vessel type
 * @param careerStats  - Career stats snapshot
 */
export function triggerSalvageCinematic(
  vesselLabel: string,
  shipType: ShipType,
  careerStats?: Partial<TugboatCareerStats>,
): void {
  runTugCinematic({ type: 'salvage', label: vesselLabel, shipType, careerStats })
}
