import React from 'react'
import { useGameStore } from '../store/useGameStore'

/**
 * LyricsOverlay — centred on-screen lyrics that appear during the light show.
 * Fades in/out with each new lyric line synced to the music BPM.
 */
export default function LyricsOverlay() {
  const lyric = useGameStore((s) => s.lyric)
  const phase = useGameStore((s) => s.phase)

  if (phase !== 'LIGHT_SHOW' || !lyric) return null

  return (
    <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none z-20">
      <div
        key={lyric} // re-trigger animation on each new lyric
        className="glass px-8 py-4 text-center max-w-xl"
        style={{
          animation: 'lyricFadeIn 0.4s ease-out',
          borderColor: 'rgba(0, 229, 255, 0.3)',
        }}
      >
        <p className="text-xl font-bold text-white" style={{ textShadow: '0 0 20px #00e5ff, 0 0 40px #00aaff' }}>
          {lyric}
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
