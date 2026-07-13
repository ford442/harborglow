import { ShipType } from '../store/useGameStore'
import { sequencerSystem } from './sequencerSystem'
import { musicSystem } from './musicSystem'
import { lightingSystem } from './lightingSystem'
import { ambientMarineLifeSystem } from './ambientMarineLifeSystem'
import { useGameStore } from '../store/useGameStore'
import { getCutawayPlan } from './cutaways'
import { CutawayAction } from './cutaways/types'

// =============================================================================
// CINEMATIC SYSTEM
// Encapsulates the upgrade-completion cinematic as Transport-locked cues.
// Replaces ad-hoc setTimeout with sequencerSystem.schedule() beat offsets.
// =============================================================================

function dispatchCinematicEvent(
  name: 'cinematicSpotlightPulse' | 'cinematicHideBandName',
  shipType: ShipType,
  shipId: string
): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name, { detail: { shipType, shipId } }))
  }
}

function executeCutawayAction(
  action: CutawayAction,
  shipType: ShipType,
  shipId: string
): void {
  const store = useGameStore.getState()

  switch (action.type) {
    case 'camera_mode':
      store.setCameraMode(action.mode)
      break
    case 'spectator_drone':
      store.setSpectatorTarget(shipId, action.duration)
      break
    case 'climax':
      lightingSystem.triggerClimax(shipType)
      break
    case 'spotlight_pulse':
      dispatchCinematicEvent('cinematicSpotlightPulse', shipType, shipId)
      break
    case 'hide_band_name':
      dispatchCinematicEvent('cinematicHideBandName', shipType, shipId)
      break
  }
}

/**
 * Trigger the full upgrade-completion cinematic for a ship.
 * All timed events are locked to the Tone.js Transport via sequencerSystem.
 *
 * @param shipType - The ship type (determines music track and cutaway plan)
 * @param shipId   - The ship instance ID (determines lighting target / spectator)
 */
export function triggerUpgradeCinematic(shipType: ShipType, shipId: string): void {
  // Beat 0 — immediate: music + harbor show + store flag (not part of per-ship plan)
  musicSystem.startMusic(shipType)
  lightingSystem.startHarborShow(shipId, shipType)
  useGameStore.getState().setMusicPlaying(shipId, true)

  // Trigger the ambient bioluminescent finale: jellies + plankton converge on the ship
  const ship = useGameStore.getState().ships.find((s) => s.id === shipId)
  if (ship) {
    ambientMarineLifeSystem.triggerBioluminescentFinale(shipId, ship.position)
  }

  for (const cue of getCutawayPlan(shipType)) {
    sequencerSystem.schedule(cue.beat, () => {
      executeCutawayAction(cue.action, shipType, shipId)
    })
  }
}
