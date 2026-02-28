import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'
import { musicSystem } from '../systems/musicSystem'

// =============================================================================
// LYRICS DISPLAY COMPONENT
// Shows synchronized lyrics above the current ship with fade animations
// =============================================================================

export default function LyricsDisplay() {
    const [currentLyrics, setCurrentLyrics] = useState('')
    const [previousLyrics, setPreviousLyrics] = useState('')
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [showBandName, setShowBandName] = useState(false)
    
    const currentShipId = useGameStore((state) => state.currentShipId)
    const ships = useGameStore((state) => state.ships)
    const lyricsSize = useGameStore((state) => state.lyricsSize)
    const musicPlaying = useGameStore((state) => state.musicPlaying)

    const lastLyricRef = useRef('')
    const currentShip = ships.find(ship => ship.id === currentShipId)

    // Track lyric changes and animate transitions
    useEffect(() => {
        if (!currentShip) {
            setCurrentLyrics('')
            setPreviousLyrics('')
            setShowBandName(false)
            return
        }

        // Show band name briefly when music starts
        if (musicPlaying.get(currentShip.id) && !showBandName) {
            setShowBandName(true)
            setTimeout(() => setShowBandName(false), 4000)
        }

        const interval = setInterval(() => {
            const lyric = musicSystem.getCurrentLyric(currentShip.type)
            
            if (lyric && lyric !== lastLyricRef.current) {
                // Transition animation
                setIsTransitioning(true)
                setPreviousLyrics(lastLyricRef.current)
                
                setTimeout(() => {
                    setCurrentLyrics(lyric)
                    lastLyricRef.current = lyric
                    setIsTransitioning(false)
                }, 150)
            }
        }, 50) // Frequent updates for tight sync

        return () => clearInterval(interval)
    }, [currentShip, musicPlaying, showBandName])

    if (!currentShip) return null

    const isMusicPlaying = musicPlaying.get(currentShip.id)
    const bandInfo = musicSystem.getBandInfo(currentShip.type)

    return (
        <div style={containerStyle}>
            {/* Band name display (briefly shown when music starts) */}
            {showBandName && isMusicPlaying && (
                <div style={{
                    ...bandNameStyle,
                    fontSize: `${lyricsSize * 0.6}px`,
                    animation: 'bandNamePulse 4s ease-out forwards'
                }}>
                    <span style={{ opacity: 0.6 }}>♪ </span>
                    {bandInfo.name}
                    <span style={{ opacity: 0.6 }}> ♪</span>
                </div>
            )}

            {/* Lyrics display */}
            <div style={lyricsContainerStyle}>
                {/* Previous lyrics (fading out) */}
                {isTransitioning && previousLyrics && (
                    <div style={{
                        ...lyricTextStyle,
                        fontSize: `${lyricsSize}px`,
                        opacity: 0,
                        transform: 'translateY(-20px) scale(0.9)',
                        transition: 'all 0.15s ease-out',
                        position: 'absolute'
                    }}>
                        {previousLyrics}
                    </div>
                )}
                
                {/* Current lyrics (fading in) */}
                {currentLyrics && (
                    <div style={{
                        ...lyricTextStyle,
                        fontSize: `${lyricsSize}px`,
                        opacity: isTransitioning ? 0 : 1,
                        transform: isTransitioning ? 'translateY(20px) scale(1.1)' : 'translateY(0) scale(1)',
                        transition: 'all 0.15s ease-out',
                        textShadow: isMusicPlaying 
                            ? `0 0 ${lyricsSize / 3}px ${getShipTypeColor(currentShip.type)}, 0 0 ${lyricsSize}px ${getShipTypeColor(currentShip.type)}`
                            : '2px 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        {currentLyrics}
                    </div>
                )}
            </div>

            {/* Genre tag (subtle) */}
            {isMusicPlaying && currentLyrics && (
                <div style={{
                    ...genreTagStyle,
                    fontSize: `${lyricsSize * 0.35}px`,
                }}>
                    {bandInfo.genre}
                </div>
            )}
        </div>
    )
}

// =============================================================================
// HELPERS
// =============================================================================

function getShipTypeColor(type: string): string {
    const colors: Record<string, string> = {
        cruise: '#ff6b9d',
        container: '#00d4aa',
        tanker: '#ff9500'
    }
    return colors[type] || '#ffffff'
}

// =============================================================================
// STYLES
// =============================================================================

const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '25%',
    left: '50%',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
}

const lyricsContainerStyle: React.CSSProperties = {
    position: 'relative',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
}

const lyricTextStyle: React.CSSProperties = {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    letterSpacing: '1px',
    whiteSpace: 'nowrap',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
}

const bandNameStyle: React.CSSProperties = {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    padding: '8px 24px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: '30px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)'
}

const genreTagStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    fontWeight: 'normal'
}

// Inject keyframe animations
const styleSheet = document.createElement('style')
styleSheet.textContent = `
    @keyframes bandNamePulse {
        0% { 
            opacity: 0; 
            transform: scale(0.8) translateY(10px); 
        }
        15% { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
        }
        85% { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
        }
        100% { 
            opacity: 0; 
            transform: scale(0.9) translateY(-10px); 
        }
    }
    
    @keyframes lyricGlow {
        0%, 100% { text-shadow: 0 0 10px currentColor; }
        50% { text-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
    }
`
document.head.appendChild(styleSheet)
