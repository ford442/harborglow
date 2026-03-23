import React, { useState, useEffect } from 'react'
import { useGameStore } from '../../store/useGameStore'

// =============================================================================
// MONITOR FEED — Generic CRT monitor wrapper with scanlines, weather VFX,
// screen shake on heavy loads, and Arctic frosted-bezel styling.
// =============================================================================

export interface MonitorFeedProps {
  label: string
  camNumber: string
  active: boolean
  weather: string
  tier: number
  isOverhead?: boolean
  children: React.ReactNode
}

export default function MonitorFeed({
  label,
  camNumber,
  active,
  weather,
  tier,
  isOverhead = false,
  children,
}: MonitorFeedProps) {
  const isStormy = weather === 'storm' || weather === 'rain'
  const isArctic = tier === 3

  const loadTension = useGameStore(state => state.loadTension)
  const [shake, setShake] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!isArctic || loadTension <= 30) {
      setShake({ x: 0, y: 0 })
      return
    }

    const interval = setInterval(() => {
      const intensity = (loadTension - 30) / 20
      setShake({
        x: (Math.random() - 0.5) * intensity * 3,
        y: (Math.random() - 0.5) * intensity * 3,
      })
    }, 50)

    return () => clearInterval(interval)
  }, [isArctic, loadTension])

  return (
    <div
      className={`crane-monitor tier-${tier} ${active ? 'active' : ''} ${isStormy ? 'weather-distortion' : ''} ${isOverhead ? 'overhead' : ''} ${isArctic ? 'arctic-mode' : ''}`}
      style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}
    >
      {isArctic && <div className="frost-edge" />}

      <div className="monitor-bezel">
        {isArctic && <div className="arctic-led-accent" />}

        <div
          className="monitor-screen"
          style={{
            animation: isArctic && loadTension > 35 ? 'screen-flicker 0.1s infinite' : undefined,
          }}
        >
          {children}
          <div className="scanlines" />

          {isStormy && (
            <>
              <div className="rain-streaks" />
              <div className="static-noise" />
            </>
          )}

          {isArctic && weather === 'storm' && (
            <>
              <div className="snow-particles" />
              <div className="ice-static" />
            </>
          )}

          <div className="crt-flicker" />

          {isArctic && <div className="screen-reflection" />}
        </div>

        <div className="monitor-label">
          <span className="cam-id">{camNumber}</span>
          <span className="cam-desc">{label}</span>
        </div>

        <div className={`status-led ${active ? 'on' : 'off'} ${isArctic ? 'arctic' : ''}`} />
      </div>
    </div>
  )
}
