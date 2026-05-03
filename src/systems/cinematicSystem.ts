import { ShipType } from '../store/useGameStore'
import { sequencerSystem } from './sequencerSystem'
import { musicSystem } from './musicSystem'
import { lightingSystem } from './lightingSystem'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// CINEMATIC SYSTEM
// Encapsulates the upgrade-completion cinematic as Transport-locked cues.
// Replaces ad-hoc setTimeout with sequencerSystem.schedule() beat offsets.
// =============================================================================

/**
 * Trigger the full upgrade-completion cinematic for a ship.
 * All timed events are locked to the Tone.js Transport via sequencerSystem.
 *
 * @param shipType - The ship type (determines music track)
 * @param shipId   - The ship instance ID (determines lighting target / spectator)
 */
export function triggerUpgradeCinematic(shipType: ShipType, shipId: string): void {
  // Beat 0 — Immediate: music + harbor show + store flag
  musicSystem.startMusic(shipType)
  lightingSystem.startHarborShow(shipId, shipType)
  useGameStore.getState().setMusicPlaying(shipId, true)

  // Beat 4 — Spotlight pulse (dispatches event for reactive systems)
  sequencerSystem.schedule(4, () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cinematicSpotlightPulse', { detail: { shipType, shipId } })
      )
    }
  })

  // Beat 12 — Camera cut to spectator drone
  sequencerSystem.schedule(12, () => {
    useGameStore.getState().setSpectatorTarget(shipId)
  })

  // Beat 24 — Climax intensification
  sequencerSystem.schedule(24, () => {
    lightingSystem.triggerClimax(shipType)
  })

  // Beat 32 — Band-name hide cue (LyricsDisplay and UpgradeMenu can listen)
  sequencerSystem.schedule(32, () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cinematicHideBandName', { detail: { shipType, shipId } })
      )
    }
  })
}
