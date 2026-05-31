import { useEffect, useState, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// SPECTATOR TITLE CARD
// Cinematic "HARBORGLOW" overlay for spectator drone mode
// =============================================================================

export default function SpectatorTitleCard() {
  const spectatorState = useGameStore(state => state.spectatorState)
  const [isVisible, setIsVisible] = useState(false)
  const [opacity, setOpacity] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!spectatorState.isActive) {
      setIsVisible(false)
      setOpacity(0)
      return
    }

    const now = Date.now()
    const elapsed = now - spectatorState.startTime

    // Always restart the card when spectator mode triggers
    setIsVisible(true)
    setOpacity(0)

    const rafId = requestAnimationFrame(() => {
      setOpacity(1)
    })

    const fadeOutTimer = setTimeout(() => {
      setOpacity(0)
    }, Math.max(0, 4000 - elapsed))

    const hideTimer = setTimeout(() => {
      setIsVisible(false)
    }, Math.max(0, 5500 - elapsed))

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(fadeOutTimer)
      clearTimeout(hideTimer)
    }
  }, [spectatorState.isActive, spectatorState.startTime])

  if (!isVisible) return null

  return (
    <div
      ref={containerRef}
      style={{
        ...overlayStyle,
        opacity,
        transition: 'opacity 1.5s ease-out',
      }}
    >
      <div style={contentStyle}>
        <div style={lineStyle} />
        <h1 style={titleStyle}>HARBORGLOW</h1>
        <p style={subtitleStyle}>Light up the night</p>
        <div style={lineStyle} />
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  zIndex: 2000,
}

const contentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
}

const titleStyle: React.CSSProperties = {
  fontSize: '48px',
  fontWeight: 900,
  letterSpacing: '8px',
  textTransform: 'uppercase',
  fontFamily: '"Inter", system-ui, sans-serif',
  background: 'linear-gradient(135deg, #fff, #a0d8ff)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: '0 0 24px rgba(160, 216, 255, 0.35), 0 0 48px rgba(0, 212, 170, 0.15)',
  margin: 0,
  padding: 0,
  lineHeight: 1.1,
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  letterSpacing: '4px',
  textTransform: 'uppercase',
  fontFamily: '"Inter", system-ui, sans-serif',
  color: '#00d4aa',
  textShadow: '0 0 12px rgba(0, 212, 170, 0.4), 0 0 24px rgba(0, 212, 170, 0.2)',
  margin: 0,
  padding: 0,
}

const lineStyle: React.CSSProperties = {
  width: '80px',
  height: '1px',
  background: 'linear-gradient(90deg, #00d4aa, transparent)',
  opacity: 0.6,
}
