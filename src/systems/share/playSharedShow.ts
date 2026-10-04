import type { ShowDocument } from '../../schemas/showDocument'
import { useGameStore, type Ship } from '../../store/useGameStore'
import { lightingSystem } from '../lightingSystem'
import { musicSystem } from '../music'
import { ShipSpawner } from '../shipSpawner'
import { applyReplayInput } from '../sim/applyInput'
import { simScheduler } from '../sim/FixedStepScheduler'
import { resetDeterministicSystems } from '../sim/headless'
import { beginSharedPlayback } from './sharedPlaybackState'

// =============================================================================
// PLAY SHARED SHOW — boot a decoded ShowDocument into spectator playback.
// Never touches the viewer's save: sharedPlaybackState gates scheduleSave, and
// this deliberately avoids resetGame() (which calls clearSave()).
// =============================================================================

const DEFAULT_SEED = 1
/** setSpectatorTarget ends after `duration` seconds; an hour reads as "persistent". */
const SPECTATOR_SECONDS = 3600

/**
 * Start playing `doc`. Returns a disposer. Call after a user gesture so the
 * audio context can start (the splash click provides it).
 */
export function startSharedPlayback(doc: ShowDocument): () => void {
  // Must be first: blocks autosave before any store mutation below.
  beginSharedPlayback(doc.shipType, doc.sim ? { hash: doc.sim.hash, ticks: doc.sim.ticks } : null)

  const store = useGameStore.getState()
  store.setOperationMode('crane')

  if (doc.inputLog && doc.sim) {
    simScheduler.loadReplay(
      { version: 1, seed: doc.sim.seed, dt: doc.sim.dt, inputs: doc.inputLog },
      (entry) => applyReplayInput(entry),
    )
  } else {
    simScheduler.reset(DEFAULT_SEED)
  }
  resetDeterministicSystems({ preserveStoreMode: true })

  lightingSystem.setShowOverride({ v: 2, id: doc.shipType, loopBeats: doc.loopBeats, cues: doc.cues })

  let started = false
  const startFor = (ship: Ship) => {
    if (started) return
    started = true
    const s = useGameStore.getState()
    s.setCurrentShip(ship.id)
    lightingSystem.startHarborShow(ship.id, doc.shipType)
    s.setMusicPlaying(ship.id, true)
    void musicSystem.startMusic(doc.shipType)
    s.setSpectatorTarget(ship.id, SPECTATOR_SECONDS)
  }

  // With a performance, the input log spawns the ship (and any state the hash
  // depends on); without one we spawn it ourselves.
  if (!doc.inputLog) startFor(ShipSpawner.spawnShip(doc.shipType))

  const unsubscribe = useGameStore.subscribe((state) => {
    if (started) return
    const ship = state.ships.find((s) => s.type === doc.shipType)
    if (ship) startFor(ship)
  })

  return () => {
    unsubscribe()
    lightingSystem.setShowOverride(null)
    musicSystem.stopMusic(doc.shipType)
  }
}
