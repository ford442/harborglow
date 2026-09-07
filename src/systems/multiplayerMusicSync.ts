import { useGameStore, selectIsShipFullyUpgraded } from '../store/useGameStore'
import { musicSystem } from './musicSystem'
import { lightingSystem } from './lightingSystem'
import { getSim } from './sim/SimContext'

/**
 * Start/stop local Tone.js from sim-driven store flags.
 * Transport offset is simTime so host and spectator share the beat, not wall clock.
 */
export function maybeStartShipMusic(shipId: string): void {
  const store = useGameStore.getState()
  const ship = store.ships.find((s) => s.id === shipId)
  if (!ship) return
  if (!selectIsShipFullyUpgraded(store, shipId)) return
  if (store.musicPlaying.get(shipId)) return

  store.setMusicPlaying(shipId, true)
  lightingSystem.startHarborShow(shipId, ship.type)
  void musicSystem.startMusic(ship.type, getSim().simTime)
}

export function syncLocalMusicFromStore(): void {
  const store = useGameStore.getState()
  for (const ship of store.ships) {
    if (selectIsShipFullyUpgraded(store, ship.id) && !store.musicPlaying.get(ship.id)) {
      maybeStartShipMusic(ship.id)
    }
  }
}
