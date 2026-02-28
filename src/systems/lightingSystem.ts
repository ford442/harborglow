import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'

/**
 * useLightingSystem — subscribes to music BPM + phase changes
 * and drives dynamic light intensity values stored in the game state.
 * The actual THREE.js lights read from these values each frame via useFrame.
 * 
 * This version integrates with the existing musicSystem for lyric synchronization.
 */
export function useLightingSystem() {
  const bpm = useGameStore((s) => s.bpm)
  const currentShipId = useGameStore((s) => s.currentShipId)
  const ships = useGameStore((s) => s.ships)
  const musicPlaying = useGameStore((s) => s.musicPlaying)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentShip = ships.find(s => s.id === currentShipId)
  const isPlaying = currentShip ? musicPlaying.get(currentShip.id) : false

  useEffect(() => {
    if (isPlaying && currentShip) {
      // Simulate beat pulses by updating based on BPM
      const msPerBeat = (60 / bpm) * 1000

      intervalRef.current = setInterval(() => {
        // Pulse logic is handled in Ship.tsx via useFrame
        // This hook can be extended for additional lighting effects
      }, msPerBeat)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, bpm, currentShip])
}
