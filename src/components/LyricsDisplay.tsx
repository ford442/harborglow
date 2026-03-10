import { useState, useEffect, useMemo } from 'react'
import { useGameStore } from '../store/useGameStore'
import { musicSystem } from '../systems/musicSystem'
import { SHIP_COLORS } from './DesignSystem'

// =============================================================================
// PHASE 6.2: ENHANCED LYRICS DISPLAY
// Karaoke-style word highlighting, typography animations, visual spectacle
// =============================================================================

interface WordTiming {
  word: string
  startTime: number
  endTime: number
  emphasized: boolean
}

interface LyricLine {
  text: string
  words: WordTiming[]
  startTime: number
  endTime: number
}

export default function LyricsDisplay() {
  const [currentLine, setCurrentLine] = useState('')
  const [currentWords, setCurrentWords] = useState<WordTiming[]>([])
  const [activeWordIndex, setActiveWordIndex] = useState(-1)
  const [showBandName, setShowBandName] = useState(false)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])
  
  const currentShipId = useGameStore((state) => state.currentShipId)
  const ships = useGameStore((state) => state.ships)
  const lyricsSize = useGameStore((state) => state.lyricsSize)
  const bpm = useGameStore((state) => state.bpm)
  const musicPlaying = useGameStore((state) => state.musicPlaying)

  const currentShip = ships.find(ship => ship.id === currentShipId)
  const shipColors = currentShip ? SHIP_COLORS[currentShip.type] : SHIP_COLORS.cruise
  
  const isMusicPlaying = currentShip ? musicPlaying.get(currentShip.id) : false
  const bandInfo = currentShip ? musicSystem.getBandInfo(currentShip.type) : null

  // Parse lyrics into timed words
  const parseLyrics = useMemo(() => {
    return (text: string, bpm: number): LyricLine => {
      const words = text.split(' ')
      const beatDuration = 60 / bpm
      const wordDuration = beatDuration * 0.5
      
      let currentTime = 0
      const wordTimings: WordTiming[] = words.map((word, _i) => {
        const emphasized = word.length > 4 || word.includes('!') || word.includes('♪')
        const duration = wordDuration * (emphasized ? 1.5 : 1)
        
        const timing = {
          word: word.replace(/[!♪]/g, ''),
          startTime: currentTime,
          endTime: currentTime + duration,
          emphasized
        }
        
        currentTime += duration
        return timing
      })
      
      return {
        text,
        words: wordTimings,
        startTime: 0,
        endTime: currentTime
      }
    }
  }, [])

  // Show band name when music starts
  useEffect(() => {
    if (!currentShip) {
      setShowBandName(false)
      return
    }

    if (isMusicPlaying && !showBandName) {
      setShowBandName(true)
      setTimeout(() => setShowBandName(false), 4000)
    }
  }, [currentShip, isMusicPlaying, showBandName])

  // Update lyrics and word highlighting
  useEffect(() => {
    if (!currentShip) {
      setCurrentLine('')
      setCurrentWords([])
      setActiveWordIndex(-1)
      return
    }

    let animationFrame: number
    let startTime = Date.now()
    
    const updateLyrics = () => {
      const lyric = musicSystem.getCurrentLyric(currentShip.type)
      
      if (lyric && lyric !== currentLine) {
        const parsed = parseLyrics(lyric, bpm)
        setCurrentLine(lyric)
        setCurrentWords(parsed.words)
        startTime = Date.now()
        
        // Trigger particle burst on new line
        if (isMusicPlaying) {
          const newParticles = Array.from({ length: 8 }, (_, i) => ({
            id: Date.now() + i,
            x: 20 + Math.random() * 60,
            y: 40 + Math.random() * 20
          }))
          setParticles(newParticles)
          setTimeout(() => setParticles([]), 1000)
        }
      }
      
      // Calculate active word
      const elapsed = (Date.now() - startTime) / 1000
      const wordIndex = currentWords.findIndex(
        w => elapsed >= w.startTime && elapsed < w.endTime
      )
      
      if (wordIndex !== -1 && wordIndex !== activeWordIndex) {
        setActiveWordIndex(wordIndex)
      }
      
      animationFrame = requestAnimationFrame(updateLyrics)
    }
    
    animationFrame = requestAnimationFrame(updateLyrics)
    return () => cancelAnimationFrame(animationFrame)
  }, [currentShip, currentLine, currentWords, bpm, isMusicPlaying, activeWordIndex, parseLyrics])

  if (!currentShip) return null

  return (
    <div style={containerStyle}>
      {/* Background glow effect */}
      <div 
        style={{
          ...glowBackgroundStyle,
          background: `radial-gradient(ellipse at center, ${shipColors.glow} 0%, transparent 70%)`,
          opacity: isMusicPlaying ? 0.6 : 0.2
        }} 
      />
      
      {/* Floating particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            ...particleStyle,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: shipColors.primary,
            animation: 'particleFloat 1s ease-out forwards'
          }}
        />
      ))}
      
      {/* Band name reveal */}
      {showBandName && bandInfo && (
        <div style={bandNameContainerStyle}>
          <div 
            style={{
              ...bandNameStyle,
              background: shipColors.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {bandInfo.name}
          </div>
          <div style={genreStyle}>{bandInfo.genre}</div>
        </div>
      )}
      
      {/* Karaoke lyrics */}
      {currentLine && (
        <div 
          style={{
            ...lyricsContainerStyle,
            fontSize: `${lyricsSize}px`
          }}
        >
          <div style={wordsRowStyle}>
            {currentWords.map((wordTiming, index) => (
              <span
                key={index}
                style={{
                  ...wordStyle,
                  color: index <= activeWordIndex ? shipColors.primary : 'rgba(255,255,255,0.4)',
                  textShadow: index === activeWordIndex 
                    ? `0 0 ${lyricsSize / 2}px ${shipColors.primary}, 0 0 ${lyricsSize}px ${shipColors.glow}`
                    : 'none',
                  transform: index === activeWordIndex ? 'scale(1.1)' : 'scale(1)',
                  fontWeight: wordTiming.emphasized ? 800 : 600,
                  animation: index === activeWordIndex ? 'wordBounce 0.3s ease-out' : 'none'
                }}
              >
                {wordTiming.word}
                {index < currentWords.length - 1 && '\u00A0'}
              </span>
            ))}
          </div>
          
          {/* Progress bar under lyrics */}
          {isMusicPlaying && (
            <div style={lyricProgressContainerStyle}>
              <div 
                style={{
                  ...lyricProgressBarStyle,
                  width: `${((activeWordIndex + 1) / currentWords.length) * 100}%`,
                  background: shipColors.gradient
                }}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Beat indicator */}
      {isMusicPlaying && (
        <div style={beatIndicatorContainerStyle}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                ...beatBarStyle,
                background: shipColors.primary,
                animationDelay: `${i * 0.15}s`,
                animation: isMusicPlaying ? 'beatPulse 0.5s ease-in-out infinite' : 'none'
              }}
            />
          ))}
        </div>
      )}

      <style>{
        `
        @keyframes wordBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1.1); }
        }
        @keyframes particleFloat {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-50px) scale(0); opacity: 0; }
        }
        @keyframes beatPulse {
          0%, 100% { transform: scaleY(0.3); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        `
      }</style>
    </div>
  )
}

// =============================================================================
// STYLES
// =============================================================================

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '20%',
  left: '50%',
  transform: 'translateX(-50%)',
  pointerEvents: 'none',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  minWidth: '400px'
}

const glowBackgroundStyle: React.CSSProperties = {
  position: 'absolute',
  width: '600px',
  height: '300px',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  filter: 'blur(60px)',
  transition: 'opacity 0.5s ease',
  pointerEvents: 'none'
}

const particleStyle: React.CSSProperties = {
  position: 'absolute',
  width: '4px',
  height: '4px',
  borderRadius: '50%',
  pointerEvents: 'none'
}

const bandNameContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  animation: 'slideUp 0.6s ease-out, fadeOut 0.5s ease-in 3.5s forwards',
  padding: '16px 32px',
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.1)'
}

const bandNameStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 900,
  letterSpacing: '4px',
  textTransform: 'uppercase',
  fontFamily: '"Inter", system-ui, sans-serif'
}

const genreStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(255,255,255,0.6)',
  letterSpacing: '3px',
  textTransform: 'uppercase',
  marginTop: '8px'
}

const lyricsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  padding: '20px 40px',
  background: 'rgba(0,0,0,0.4)',
  backdropFilter: 'blur(30px) saturate(180%)',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
}

const wordsRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '0.3em',
  lineHeight: 1.4
}

const wordStyle: React.CSSProperties = {
  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'inline-block',
  fontFamily: '"Inter", system-ui, sans-serif',
  letterSpacing: '0.02em'
}

const lyricProgressContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '2px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '1px',
  overflow: 'hidden',
  marginTop: '8px'
}

const lyricProgressBarStyle: React.CSSProperties = {
  height: '100%',
  transition: 'width 0.1s linear',
  borderRadius: '1px'
}

const beatIndicatorContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  alignItems: 'flex-end',
  height: '20px'
}

const beatBarStyle: React.CSSProperties = {
  width: '4px',
  height: '100%',
  borderRadius: '2px',
  opacity: 0.6
}
