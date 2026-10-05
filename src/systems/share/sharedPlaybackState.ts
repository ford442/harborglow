import { create } from 'zustand'
import type { ShipType } from '../../store/gameStoreDomainTypes'

// =============================================================================
// SHARED PLAYBACK STATE — tiny standalone store (no game-store imports) so the
// persistence layer can check it without pulling in the share/valibot modules.
// While `active`, nothing may write the player's save.
// =============================================================================

type ShareVerification = 'none' | 'pending' | 'match' | 'mismatch'

export interface SharedPlaybackState {
  active: boolean
  shipType: ShipType | null
  /** Result of comparing the final sim hash against the document's. */
  verification: ShareVerification
  expectedHash: string | null
  actualHash: string | null
  /** While set, the sim holds at this tick so its hash can be compared. */
  verifyAtTick: number | null
}

const IDLE: SharedPlaybackState = {
  active: false,
  shipType: null,
  verification: 'none',
  expectedHash: null,
  actualHash: null,
  verifyAtTick: null,
}

export const useSharedPlayback = create<SharedPlaybackState>(() => IDLE)

export const isSharedPlaybackActive = (): boolean => useSharedPlayback.getState().active

export function beginSharedPlayback(
  shipType: ShipType,
  verify: { hash: string; ticks: number } | null,
): void {
  useSharedPlayback.setState({
    active: true,
    shipType,
    verification: verify ? 'pending' : 'none',
    expectedHash: verify?.hash ?? null,
    actualHash: null,
    verifyAtTick: verify?.ticks ?? null,
  })
}

export function finishVerification(actualHash: string): void {
  const { expectedHash } = useSharedPlayback.getState()
  useSharedPlayback.setState({
    actualHash,
    verification: expectedHash === actualHash ? 'match' : 'mismatch',
    verifyAtTick: null,
  })
}

export function endSharedPlayback(): void {
  useSharedPlayback.setState(IDLE)
}
