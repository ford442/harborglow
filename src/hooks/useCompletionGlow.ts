import { useGameStore, selectIsShipFullyUpgraded } from '../store/useGameStore'
import { useMusicPulse } from './useMusicPulse'

export interface CompletionGlowStyle {
  boxShadow: string
  borderColor: string
  transition: string
}

export function useCompletionGlow(): CompletionGlowStyle | null {
  const currentShipId = useGameStore((state) => state.currentShipId)
  const ships = useGameStore((state) => state.ships)
  const musicPlaying = useGameStore((state) => state.musicPlaying)
  const bpm = useGameStore((state) => state.bpm)

  const currentShip = ships.find((s) => s.id === currentShipId)
  const isFullyUpgraded = currentShip
    ? selectIsShipFullyUpgraded(useGameStore.getState(), currentShip.id)
    : false
  const isMusicPlaying = currentShip ? musicPlaying.get(currentShip.id) === true : false

  // useMusicPulse must run unconditionally on every render (Rules of Hooks);
  // the glow style itself is what we gate on the completion state.
  const pulse = useMusicPulse(bpm)

  if (!currentShip || !isFullyUpgraded || !isMusicPlaying) {
    return null
  }

  const pulseBoost = pulse > 0.3 ? 1 + pulse * 0.8 : 1

  return {
    boxShadow: `0 0 ${20 * pulseBoost}px rgba(0,212,170,0.25), 0 0 ${60 * pulseBoost}px rgba(0,191,255,0.12), inset 0 0 ${16 * pulseBoost}px rgba(0,212,170,0.08)`,
    borderColor: `rgba(0,212,170,${0.3 + pulse * 0.4})`,
    transition: 'all 0.15s ease-out',
  }
}
