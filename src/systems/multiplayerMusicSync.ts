// =============================================================================
// MULTIPLAYER MUSIC SYNC — Start/stop local Tone.js tracks from network patches
// =============================================================================

import { useGameStore } from '../store/useGameStore';
import { musicSystem } from './musicSystem';
import { lightingSystem } from './lightingSystem';

/**
 * Diff musicPlaying records from a network patch and drive local playback.
 * Spectators generate audio locally; no audio bytes cross the wire.
 */
export function syncSpectatorMusic(
    prev: Record<string, boolean>,
    next: Record<string, boolean>,
): void {
    const store = useGameStore.getState();
    const allShipIds = new Set([...Object.keys(prev), ...Object.keys(next)]);

    for (const shipId of allShipIds) {
        const wasPlaying = prev[shipId] ?? false;
        const isPlaying = next[shipId] ?? false;
        if (wasPlaying === isPlaying) continue;

        const ship = store.ships.find((s) => s.id === shipId);
        if (!ship) continue;

        if (isPlaying) {
            void musicSystem.startMusic(ship.type);
            lightingSystem.startHarborShow(shipId, ship.type);
        } else {
            musicSystem.stopMusic(ship.type);
        }
    }
}
