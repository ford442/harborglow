// =============================================================================
// HARBOR FESTIVAL — three ships back-to-back as a light-show setlist (#253)
//
// Each act: a ship arrives → the player installs every rig → its show plays →
// a short intermission → the next act. Everything advances on the sim tick
// (accumulated dt and lightingSystem's sim-time show end), never wall clock,
// so a festival replays identically from the input log.
// =============================================================================

import { useGameStore, selectIsShipFullyUpgraded, type ShipType } from '../../store/useGameStore'
import { ShipSpawner } from '../shipSpawner'
import { lightingSystem } from '../lightingSystem'
import { maybeStartShipMusic } from '../multiplayerMusicSync'

/** The three native V2 factory shows, in running order. */
export const FESTIVAL_SETLIST: readonly ShipType[] = ['cruise', 'fireboat', 'icebreaker']

/** Seconds between one act's show ending and the next ship arriving. */
export const FESTIVAL_INTERMISSION_S = 4
/** A show that never reports its end (e.g. replaced by an imported show) is cut after this. */
export const FESTIVAL_MAX_SHOW_S = 120
export const FESTIVAL_CREDITS_PER_ACT = 300
export const FESTIVAL_FULL_SETLIST_BONUS = 600
export const FESTIVAL_REPUTATION_PER_ACT = 10

export type FestivalPhase =
  | 'idle'
  /** Act ship is in the harbor; waiting for the player to install every rig. */
  | 'awaitingRigs'
  /** Act ship's show is playing. */
  | 'playing'
  | 'intermission'
  | 'complete'

export interface FestivalSnapshot {
  phase: FestivalPhase
  setlist: readonly ShipType[]
  /** 0-based index into setlist of the current (or last) act. */
  actIndex: number
  /** Ship spawned for the current act. */
  shipId: string | null
  actsPlayed: number
  /** Acts whose ship left the harbor before its show played. */
  actsMissed: number
  /** Credits paid at the end (0 until complete). */
  rewardCredits: number
}

type Listener = () => void

export class HarborFestival {
  private state: FestivalSnapshot = HarborFestival.idleState()
  private phaseElapsed = 0
  private listeners = new Set<Listener>()

  private static idleState(): FestivalSnapshot {
    return {
      phase: 'idle',
      setlist: FESTIVAL_SETLIST,
      actIndex: 0,
      shipId: null,
      actsPlayed: 0,
      actsMissed: 0,
      rewardCredits: 0,
    }
  }

  /** A festival is running (complete and idle are not). */
  isActive(): boolean {
    return this.state.phase !== 'idle' && this.state.phase !== 'complete'
  }

  /** Immutable snapshot; a new object on every change (useSyncExternalStore-safe). */
  getSnapshot(): FestivalSnapshot {
    return this.state
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Start a festival; false when one is already running or the setlist is empty. */
  start(setlist: readonly ShipType[] = FESTIVAL_SETLIST): boolean {
    if (this.isActive() || setlist.length === 0) return false
    this.state = { ...HarborFestival.idleState(), setlist: [...setlist] }
    console.log(`🎪 Harbor Festival — setlist: ${setlist.join(' → ')}`)
    this.beginAct(0)
    return true
  }

  /** Cancel a running festival. Ships already spawned stay in the harbor. */
  stop(): void {
    if (!this.isActive()) return
    console.log('🎪 Harbor Festival cancelled')
    this.set({ phase: 'idle', shipId: null })
  }

  reset(): void {
    this.state = HarborFestival.idleState()
    this.phaseElapsed = 0
    this.emit()
  }

  update(dt: number): void {
    if (!this.isActive()) return
    this.phaseElapsed += dt
    const { phase, shipId } = this.state

    if (phase === 'awaitingRigs') {
      const store = useGameStore.getState()
      if (!shipId || !store.ships.some((s) => s.id === shipId)) {
        this.nextAct({ actsMissed: this.state.actsMissed + 1 })
        return
      }
      if (selectIsShipFullyUpgraded(store, shipId)) {
        // No-op when the install path already started it (musicPlaying is set).
        maybeStartShipMusic(shipId)
        this.set({ phase: 'playing' })
      }
      return
    }

    if (phase === 'playing') {
      const show = lightingSystem.getCurrentShow()
      const showOver = !lightingSystem.isShowActive() || show.shipId !== shipId
      if (showOver || this.phaseElapsed >= FESTIVAL_MAX_SHOW_S) {
        this.set({ phase: 'intermission', actsPlayed: this.state.actsPlayed + 1 })
      }
      return
    }

    if (phase === 'intermission' && this.phaseElapsed >= FESTIVAL_INTERMISSION_S) {
      this.nextAct({})
    }
  }

  private nextAct(patch: Partial<FestivalSnapshot>): void {
    const next = this.state.actIndex + 1
    if (next < this.state.setlist.length) {
      this.state = { ...this.state, ...patch }
      this.beginAct(next)
    } else {
      this.finish(patch)
    }
  }

  private beginAct(actIndex: number): void {
    const type = this.state.setlist[actIndex]
    const ship = ShipSpawner.spawnShip(type)
    useGameStore.getState().setCurrentShip(ship.id)
    console.log(`🎪 Act ${actIndex + 1}/${this.state.setlist.length}: ${ship.name} (${type}) takes the stage`)
    this.set({ phase: 'awaitingRigs', actIndex, shipId: ship.id })
  }

  private finish(patch: Partial<FestivalSnapshot>): void {
    const actsPlayed = patch.actsPlayed ?? this.state.actsPlayed
    const fullSetlist = actsPlayed === this.state.setlist.length
    const rewardCredits = actsPlayed * FESTIVAL_CREDITS_PER_ACT + (fullSetlist ? FESTIVAL_FULL_SETLIST_BONUS : 0)
    const store = useGameStore.getState()
    if (rewardCredits > 0) store.addHarborCredits(rewardCredits, 'harbor_festival')
    if (actsPlayed > 0) store.addReputation(actsPlayed * FESTIVAL_REPUTATION_PER_ACT)
    console.log(`🎪 Harbor Festival complete — ${actsPlayed}/${this.state.setlist.length} shows, +${rewardCredits} HC`)
    this.set({ ...patch, phase: 'complete', shipId: null, rewardCredits })
  }

  private set(patch: Partial<FestivalSnapshot>): void {
    if (patch.phase !== undefined && patch.phase !== this.state.phase) this.phaseElapsed = 0
    this.state = { ...this.state, ...patch }
    this.emit()
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener())
  }
}
