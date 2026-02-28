import { useGameStore } from '../store/useGameStore'
import { musicSystem } from '../systems/musicSystem'
import { useEffect, useState } from 'react'

/**
 * LyricsOverlay — centred on-screen lyrics that appear during the light show.
 * Fades in/out with each new lyric line synced to the music BPM.
 */
export default function LyricsOverlay() {
  const currentShipId = useGameStore((s) => s.currentShipId)
  const ships = useGameStore((s) => s.ships)
  const musicPlaying = useGameStore((s) => s.musicPlaying)
  
  const [currentLyric, setCurrentLyric] = useState('')
  
  const currentShip = ships.find(s => s.id === currentShipId)
  const isPlaying = currentShip ? musicPlaying.get(currentShip.id) : false

  useEffect(() => {
    if (!currentShip || !isPlaying) {
      setCurrentLyric('')
      return
    }

    const interval = setInterval(() => {
      const lyric = musicSystem.getCurrentLyric(currentShip.type)
      setCurrentLyric(lyric)
    }, 100)

    return () => clearInterval(interval)
  }, [currentShip, isPlaying])

  if (!isPlaying || !currentLyric) return null

  return (
    <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none z-20">
      <div
        key={currentLyric} // re-trigger animation on each new lyric
        className="glass px-8 py-4 text-center max-w-xl"
        style={{
          animation: 'lyricFadeIn 0.4s ease-out',
          borderColor: 'rgba(0, 229, 255, 0.3)',
        }}
      >
        <p className="text-xl font-bold text-white" style={{ textShadow: '0 0 20px #00e5ff, 0 0 40px #00aaff' }}>
          {currentLyric}
        </p>
      </div>
      <style>{`
        @keyframes lyricFadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  )
}
