import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'

/**
 * useLightingSystem — subscribes to music BPM + phase changes
 * and drives dynamic light intensity values stored in the game state.
 * The actual THREE.js lights read from these values each frame via useFrame.
 */
export function useLightingSystem() {
  const setPhase = useGameStore((s) => s.setPhase)
  const musicBPM = useGameStore((s) => s.musicBPM)
  const phase = useGameStore((s) => s.phase)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (phase === 'LIGHT_SHOW') {
      // Simulate beat pulses by updating lyric text at BPM
      const msPerBeat = (60 / musicBPM) * 1000
      let beatCount = 0

      const LYRICS = [
        '✨ HarborGlow shines tonight ✨',
        '🌊 Waves crash in the neon light',
        '🏗️ Cranes dance in the dark sky',
        '⚡ Electric dreams up so high',
        '🚢 The harbour comes alive!',
        '💡 Every beam a story',
        '🎵 Music fills the quay',
        '🌟 HarborGlow — here to stay',
      ]

      intervalRef.current = setInterval(() => {
        useGameStore.setState({ lyric: LYRICS[beatCount % LYRICS.length] })
        beatCount++
      }, msPerBeat * 2)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        useGameStore.setState({ lyric: '' })
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [phase, musicBPM])
}
