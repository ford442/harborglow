// =============================================================================
// TOP BAR - Ship info and quick actions
// =============================================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore, Ship, ShipType } from '../../store/useGameStore'
import { getAudioAnalysisData } from '../../systems/audioVisualSync'
import { SHIP_COLORS } from '../DesignSystem'
import {
  topBarStyle,
  shipSelectorContainerStyle,
  currentShipBadgeStyle,
  shipTypeIconStyle,
  shipInfoStyle,
  shipNameStyle,
  shipIdStyle,
  dropdownArrowStyle,
  noShipStyle,
  shipListStyle,
  shipListItemStyle,
  activeIndicatorStyle,
  cameraPillBaseStyle,
} from './styles'

interface TopBarProps {
  currentShip?: Ship
  ships: Ship[]
}

export default function TopBar({ currentShip, ships }: TopBarProps) {
  const currentShipId = useGameStore(state => state.currentShipId)
  const setCurrentShip = useGameStore(state => state.setCurrentShip)
  const cameraMode = useGameStore(state => state.cameraMode)
  const musicPlaying = useGameStore(state => state.musicPlaying)
  const [showShipList, setShowShipList] = useState(false)
  const [displayCameraMode, setDisplayCameraMode] = useState(cameraMode)
  const [pillPhase, setPillPhase] = useState<'idle' | 'exit' | 'enter'>('idle')
  const prevCameraModeRef = useRef(cameraMode)
  const pillLabelRef = useRef<HTMLSpanElement>(null)
  const waveformRef = useRef<HTMLDivElement>(null)
  const waveformBarsRef = useRef<Array<HTMLSpanElement | null>>([])

  const isMusicActive = currentShip ? musicPlaying.get(currentShip.id) : false
  
  const formatCameraMode = (mode: string): string => {
    return mode
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  useEffect(() => {
    if (cameraMode === prevCameraModeRef.current) return
    setPillPhase('exit')
    const exitTimer = window.setTimeout(() => {
      setDisplayCameraMode(cameraMode)
      setPillPhase('enter')
      prevCameraModeRef.current = cameraMode
      window.setTimeout(() => setPillPhase('idle'), 180)
    }, 90)

    return () => window.clearTimeout(exitTimer)
  }, [cameraMode])

  useEffect(() => {
    if (!isMusicActive || !waveformRef.current) return

    let rafId = 0
    const bars = waveformBarsRef.current
    const update = () => {
      const waveform = getAudioAnalysisData().waveform
      if (bars.length > 0) {
        const samplesPerBar = Math.max(1, Math.floor(waveform.length / bars.length))
        bars.forEach((bar, index) => {
          if (!bar) return
          let sum = 0
          const start = index * samplesPerBar
          const end = Math.min(waveform.length, start + samplesPerBar)
          for (let i = start; i < end; i++) sum += Math.abs(waveform[i] || 0)
          const amp = sum / Math.max(1, end - start)
          bar.style.height = `${Math.max(4, 4 + amp * 34)}px`
          bar.style.opacity = `${0.35 + amp * 0.65}`
        })
      }
      rafId = window.requestAnimationFrame(update)
    }

    rafId = window.requestAnimationFrame(update)
    return () => window.cancelAnimationFrame(rafId)
  }, [isMusicActive])

  const cameraLabel = useMemo(() => formatCameraMode(displayCameraMode), [displayCameraMode])
  
  const shipColors: Record<ShipType, string> = {
    cruise: '#ff6b9d',
    container: '#00d4aa',
    tanker: '#ff9500',
    bulk: '#8b4513',
    lng: '#00bfff',
    roro: '#9b59b6',
    research: '#2ecc71',
    droneship: '#34495e',
    ferry: '#00cc88',
    trawler: '#cc8833',
    horizon: '#3388cc',
  }
  
  return (
    <div style={topBarStyle}>
      <div style={shipSelectorContainerStyle}>
        {currentShip ? (
          <div 
            style={{
              ...currentShipBadgeStyle,
              borderColor: shipColors[currentShip.type],
              boxShadow: `0 0 20px ${shipColors[currentShip.type]}30`,
            }}
            onClick={() => setShowShipList(!showShipList)}
          >
            <span style={shipTypeIconStyle}>
              {currentShip.type === 'cruise' ? '🚢' : 
               currentShip.type === 'container' ? '📦' : 
               currentShip.type === 'tanker' ? '🛢️' : '⚓'}
            </span>
            <div style={shipInfoStyle}>
              <span style={shipNameStyle}>
                {currentShip.type.charAt(0).toUpperCase() + currentShip.type.slice(1)}
              </span>
              <span style={shipIdStyle}>
                {currentShip.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <span style={dropdownArrowStyle}>▼</span>
          </div>
        ) : (
          <div style={noShipStyle}>No ship selected</div>
        )}
        
        {showShipList && ships.length > 0 && (
          <div style={shipListStyle}>
            {ships.map(ship => (
              <div
                key={ship.id}
                style={{
                  ...shipListItemStyle,
                  background: ship.id === currentShipId ? 'rgba(0,212,170,0.2)' : undefined,
                }}
                onClick={() => {
                  setCurrentShip(ship.id)
                  setShowShipList(false)
                }}
              >
                <span>{ship.type}</span>
                {ship.id === currentShipId && (
                  <span style={activeIndicatorStyle}>●</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Camera Mode Indicator */}
      <div
        style={{
          ...cameraPillBaseStyle,
          maxWidth: isMusicActive ? '260px' : '168px',
          border: `1px solid ${isMusicActive ? '#00d4aa40' : 'rgba(255,255,255,0.1)'}`,
          color: isMusicActive ? '#00d4aa' : '#888',
          animation: isMusicActive ? 'camera-pill-pulse 2s ease-in-out infinite' : 'none',
          boxShadow: isMusicActive ? '0 0 12px #00d4aa40' : 'none',
          overflow: 'hidden',
          transition: 'max-width 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, color 0.25s ease',
        }}
      >
        <span style={{ fontSize: '12px' }}>📷</span>
        <span
          ref={pillLabelRef}
          style={{
            animation: pillPhase === 'exit'
              ? 'camera-pill-exit 0.09s ease-in forwards'
              : pillPhase === 'enter'
                ? 'camera-pill-enter 0.18s ease-out'
                : 'none',
          }}
        >
          {cameraLabel}
        </span>
        {isMusicActive && (
          <div
            ref={waveformRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              marginLeft: '6px',
              height: '18px',
            }}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <span
                key={index}
                ref={(el) => {
                  waveformBarsRef.current[index] = el
                }}
                style={{
                  width: '4px',
                  height: '6px',
                  borderRadius: '999px',
                  background: 'linear-gradient(180deg, #00ffff, #00d4aa)',
                  boxShadow: '0 0 6px rgba(0,212,170,0.45)',
                  opacity: 0.6,
                  transition: 'height 0.05s linear, opacity 0.05s linear',
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes camera-pill-pulse {
          0%, 100% { box-shadow: 0 0 12px #00d4aa40; }
          50% { box-shadow: 0 0 20px #00d4aa80; }
        }
        @keyframes camera-pill-enter {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes camera-pill-exit {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
