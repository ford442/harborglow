// =============================================================================
// FIXED-DT EXPORT — while an offline export is running, the live frame loop
// steps the sim by exactly one video frame instead of the wall-clock delta.
// =============================================================================

import { SIM_DT } from '../sim/SimContext'

let lockedDt: number | null = null

export function beginFixedDtExport(dt = SIM_DT): void {
  lockedDt = dt
}

export function endFixedDtExport(): void {
  lockedDt = null
}

export function isFixedDtExport(): boolean {
  return lockedDt !== null
}

export function exportFrameDelta(wallDelta: number): number {
  return lockedDt ?? wallDelta
}
