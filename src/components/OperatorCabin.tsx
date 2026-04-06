// =============================================================================
// OPERATOR CABIN - 4-Camera Multiview Control Panel
// Default view: Clean glassmorphism panels with live camera feeds
// Press 'C' to toggle Immersive Cab Mode (first-person)
// =============================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { useGameStore, ShipType } from '../store/useGameStore'
import { useAudioData } from '../systems/audioVisualSync'
import { GLASSMORPHISM, SHIP_COLORS } from './DesignSystem'
import { moonSystem, MoonPhaseName, MOON_PHASES } from '../systems/moonSystem'
import { trafficSystem, TrafficShip, useDockedShip } from '../systems/trafficSystem'
import { swaySystem, useSwaySystem } from '../systems/swaySystem'
import { weatherSystem, useWeatherSystem, WeatherType } from '../systems/weatherSystem'
import { useEconomySystem } from '../systems/economySystem'

// =============================================================================
// TYPES
// =============================================================================

export type CabinViewMode = 'multiview' | 'immersive'

interface CameraFeedConfig {
  id: string
  title: string
  subtitle: string
  icon: string
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  accentColor: string
  gridArea: string
}

// =============================================================================
// MAIN OPERATOR CABIN COMPONENT
// =============================================================================

export interface OperatorCabinUIProps {
  onOpenTraining?: () => void
}

export function OperatorCabinUI({ onOpenTraining }: OperatorCabinUIProps = {}) {
  const viewMode = useGameStore(state => state.cabinViewMode)
  const setCabinViewMode = useGameStore(state => state.setCabinViewMode)
  const currentShip = useGameStore(state => 
    state.ships.find(s => s.id === state.currentShipId)
  )
  const gameMode = useGameStore(state => state.gameMode)
  
  // Toggle view mode with 'C' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        setCabinViewMode(viewMode === 'multiview' ? 'immersive' : 'multiview')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, setCabinViewMode])
  
  const shipColor = currentShip ? SHIP_COLORS[currentShip.type as keyof typeof SHIP_COLORS]?.primary || '#00d4aa' : '#00d4aa'
  
  return (
    <div style={cabinContainerStyle}>
      {/* Mode Toggle Button */}
      <button
        style={modeToggleStyle}
        onClick={() => setCabinViewMode(viewMode === 'multiview' ? 'immersive' : 'multiview')}
      >
        <span style={{ fontSize: '16px' }}>
          {viewMode === 'multiview' ? '🎮' : '📺'}
        </span>
        <span style={{ fontSize: '11px', fontWeight: 600 }}>
          {viewMode === 'multiview' ? 'IMMERSE' : 'PANELS'}
        </span>
        <kbd style={keyHintStyle}>C</kbd>
      </button>
      
      {/* Training Button */}
      {gameMode === 'sandbox' && onOpenTraining && (
        <button
          style={trainingButtonStyle}
          onClick={onOpenTraining}
        >
          <span style={{ fontSize: '16px' }}>🎓</span>
          <span style={{ fontSize: '11px', fontWeight: 600 }}>TRAIN</span>
        </button>
      )}
      
      {/* 4-Camera Multiview Grid */}
      {viewMode === 'multiview' && (
        <div style={multiviewGridStyle}>
          {/* Main - Crane Cab POV */}
          <CameraPanel
            config={{
              id: 'crane',
              title: 'CRANE CAB',
              subtitle: 'PRIMARY POV',
              icon: '🎮',
              position: [18, 24, 8],
              target: [0, 5, 0],
              fov: 60,
              accentColor: shipColor,
              gridArea: 'main'
            }}
            isMain
          />
          
          {/* Hook Cam */}
          <CameraPanel
            config={{
              id: 'hook',
              title: 'HOOK CAM',
              subtitle: 'SPREADER VIEW',
              icon: '🏗️',
              position: [0, 5, 0],
              target: [0, -5, 0],
              fov: 75,
              accentColor: '#ff9500',
              gridArea: 'hook'
            }}
          />
          
          {/* Drone Overview */}
          <CameraPanel
            config={{
              id: 'drone',
              title: 'DRONE',
              subtitle: 'AERIAL OVERVIEW',
              icon: '🚁',
              position: [40, 25, 40],
              target: [0, 0, 0],
              fov: 50,
              accentColor: '#00bfff',
              gridArea: 'drone'
            }}
          />
          
          {/* Underwater Cam */}
          <CameraPanel
            config={{
              id: 'underwater',
              title: 'UNDERWATER',
              subtitle: 'DEEP CAM',
              icon: '🌊',
              position: [0, -8, 20],
              target: [0, -2, 0],
              fov: 70,
              accentColor: '#00aaff',
              gridArea: 'underwater'
            }}
          />
        </div>
      )}
      
      {/* Operator Status Panel */}
      <OperatorStatusPanel />
      
      {/* Monitor Bezel Overlay Effect */}
      <div style={bezelOverlayStyle}>
        <div style={scanlineStyle} />
      </div>
    </div>
  )
}

// =============================================================================
// CAMERA PANEL COMPONENT
// =============================================================================

interface CameraPanelProps {
  config: CameraFeedConfig
  isMain?: boolean
}

function CameraPanel({ config, isMain }: CameraPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioData = useAudioData()
  const craneState = useGameStore(state => ({
    spreaderPos: state.spreaderPos,
    rotation: state.craneRotation ?? 0.2,
    height: state.craneHeight ?? 15.5,
  }))
  const ships = useGameStore(state => state.ships)
  const currentShip = useGameStore(state => 
    state.ships.find(s => s.id === state.currentShipId)
  )
  
  // Simulate camera feed with canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let animationId: number
    
    const render = () => {
      const width = canvas.width
      const height = canvas.height
      
      // Clear
      ctx.fillStyle = '#0a1628'
      ctx.fillRect(0, 0, width, height)
      
      // Draw simulated scene based on camera type
      switch (config.id) {
        case 'crane':
          drawCraneCabView(ctx, width, height, craneState, currentShip, audioData)
          break
        case 'hook':
          drawHookView(ctx, width, height, craneState, audioData)
          break
        case 'drone':
          drawDroneView(ctx, width, height, ships, currentShip, audioData)
          break
        case 'underwater':
          drawUnderwaterView(ctx, width, height, currentShip, audioData)
          break
      }
      
      // Add scanlines
      drawScanlines(ctx, width, height)
      
      animationId = requestAnimationFrame(render)
    }
    
    render()
    
    return () => cancelAnimationFrame(animationId)
  }, [config.id, craneState, currentShip, ships, audioData])
  
  return (
    <div
      style={{
        ...panelStyle,
        gridArea: config.gridArea,
        borderColor: `${config.accentColor}40`,
        boxShadow: `inset 0 0 30px ${config.accentColor}15, 0 4px 20px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Monitor Bezel */}
      <div style={bezelStyle}>
        {/* Header */}
        <div
          style={{
            ...panelHeaderStyle,
            background: `linear-gradient(90deg, ${config.accentColor}25, transparent)`,
            borderBottom: `1px solid ${config.accentColor}30`,
          }}
        >
          <span style={{ fontSize: isMain ? '16px' : '14px' }}>{config.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: isMain ? '12px' : '10px', 
              fontWeight: 700, 
              color: '#fff', 
              letterSpacing: '1px' 
            }}>
              {config.title}
            </div>
            <div style={{ 
              fontSize: isMain ? '10px' : '8px', 
              color: config.accentColor, 
              letterSpacing: '0.5px' 
            }}>
              {config.subtitle}
            </div>
          </div>
          <div style={recIndicatorStyle} />
        </div>
        
        {/* Camera Feed Canvas */}
        <div style={feedContainerStyle}>
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'contrast(1.1) saturate(0.9)',
            }}
          />
          
          {/* Crosshair overlay for hook cam */}
          {config.id === 'hook' && (
            <div style={crosshairStyle}>
              <div style={crosshairHStyle} />
              <div style={crosshairVStyle} />
              <div style={targetCircleStyle} />
            </div>
          )}
          
          {/* Depth indicator for underwater */}
          {config.id === 'underwater' && (
            <div style={depthIndicatorStyle}>
              <span style={{ fontSize: '10px', color: '#00aaff' }}>12m</span>
            </div>
          )}
        </div>
        
        {/* Corner Accents */}
        <div style={{ ...cornerAccentStyle, top: 0, left: 0, background: config.accentColor }} />
        <div style={{ ...cornerAccentVStyle, top: 0, left: 0, background: config.accentColor }} />
        <div style={{ ...cornerAccentStyle, bottom: 0, right: 0, background: config.accentColor }} />
        <div style={{ ...cornerAccentVStyle, bottom: 0, right: 0, background: config.accentColor }} />
      </div>
    </div>
  )
}

// =============================================================================
// ECONOMY METRICS COMPONENT
// =============================================================================

function EconomyMetrics({ credits, reputation }: { credits: number; reputation: number }) {
  // Calculate reputation tier color
  const getRepColor = (rep: number) => {
    if (rep >= 7500) return '#ffd700' // Legendary
    if (rep >= 5000) return '#a855f7' // Expert
    if (rep >= 3000) return '#ff4757' // Veteran
    if (rep >= 1500) return '#ff9500' // Operator
    if (rep >= 500) return '#4a9eff'  // Apprentice
    return '#888888' // Novice
  }

  const repColor = getRepColor(reputation)
  const repProgress = (reputation / 1000) * 100

  return (
    <div style={economyMetricsStyle}>
      <div style={creditDisplayStyle}>
        <span style={currencyIconStyle}>💰</span>
        <span style={creditAmountStyle}>{credits.toLocaleString()}</span>
        <span style={hcLabelStyle}>HC</span>
      </div>
      
      <div style={reputationDisplayStyle}>
        <div style={repHeaderStyle}>
          <span style={{ fontSize: '10px', color: '#888' }}>Port Reputation</span>
          <span style={{ fontSize: '11px', color: repColor, fontWeight: 600 }}>
            {reputation}/1000
          </span>
        </div>
        <div style={repBarContainerStyle}>
          <div 
            style={{
              ...repBarFillStyle,
              width: `${repProgress}%`,
              background: `linear-gradient(90deg, ${repColor}80, ${repColor})`
            }} 
          />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// OPERATOR STATUS PANEL
// =============================================================================

function OperatorStatusPanel() {
  const currentShip = useGameStore(state => 
    state.ships.find(s => s.id === state.currentShipId)
  )
  const { credits, reputation } = useEconomySystem()
  const installedUpgrades = useGameStore(state => state.installedUpgrades)
  const craneState = useGameStore(state => state.spreaderPos)
  const twistlockEngaged = useGameStore(state => state.twistlockEngaged)
  const [moonState, setMoonState] = useState(moonSystem.getState())
  const dockedTrafficShip = useDockedShip()
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [deadlineStatus, setDeadlineStatus] = useState<'normal' | 'warning' | 'urgent' | 'critical'>('normal')
  const swayState = useSwaySystem()
  const weather = useWeatherSystem()
  
  // Subscribe to moon system updates
  useEffect(() => {
    return moonSystem.subscribe(setMoonState)
  }, [])
  
  // Update deadline countdown
  useEffect(() => {
    if (!dockedTrafficShip) {
      setTimeRemaining(0)
      return
    }
    
    const updateDeadline = () => {
      const remaining = trafficSystem.getTimeRemaining(dockedTrafficShip.id)
      const status = trafficSystem.getDeadlineStatus(dockedTrafficShip.id)
      setTimeRemaining(remaining)
      setDeadlineStatus(status)
    }
    
    updateDeadline()
    const interval = setInterval(updateDeadline, 1000) // Update every second
    
    return () => clearInterval(interval)
  }, [dockedTrafficShip])
  
  // Get weather icon and warning
  const getWeatherIcon = (type: WeatherType) => {
    const icons: Record<WeatherType, string> = {
      clear: '✨', golden_hour: '🌅', fog: '🌫️', rain: '🌧️', storm: '⛈️'
    }
    return icons[type]
  }
  
  const getWeatherWarning = (type: WeatherType): string | null => {
    if (type === 'storm') return '⚠️ HIGH WIND - Increased Sway'
    if (type === 'rain') return '🌧️ Rain - Moderate Sway'
    if (type === 'fog') return '🌫️ Fog - Reduced Visibility'
    return null
  }
  
  const moonConfig = MOON_PHASES[moonState.phase]
  
  if (!currentShip) {
    return (
      <div style={statusPanelStyle}>
        <div style={{ color: '#888', fontSize: '12px' }}>No Ship Selected</div>
        {/* Moon Phase - Always Visible */}
        <MoonPhaseIndicator phase={moonState.phase} config={moonConfig} tideHeight={moonState.tideHeight} />
      </div>
    )
  }
  
  const shipUpgrades = installedUpgrades.filter(u => u.shipId === currentShip.id)
  const totalUpgrades = dockedTrafficShip?.upgradesRequired || 8
  const progress = Math.round((shipUpgrades.length / totalUpgrades) * 100)
  const shipColor = SHIP_COLORS[currentShip.type as keyof typeof SHIP_COLORS]?.primary || '#00d4aa'
  
  // Deadline color based on urgency
  const deadlineColor = {
    normal: '#00d4aa',
    warning: '#ff9500',
    urgent: '#ff4757',
    critical: '#ff0000'
  }[deadlineStatus]
  
  return (
    <div style={statusPanelStyle}>
      {/* Economy Metrics */}
      <EconomyMetrics credits={credits} reputation={reputation} />
      
      {/* Ship Info */}
      <div style={statusHeaderStyle}>
        <div style={shipIconStyle(shipColor)}>
          {currentShip.type === 'cruise' ? '🚢' : 
           currentShip.type === 'container' ? '📦' : 
           currentShip.type === 'tanker' ? '🛢️' : '⚓'}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
            {currentShip.name || currentShip.type}
          </div>
          <div style={{ fontSize: '10px', color: '#888' }}>
            ID: {currentShip.id.slice(-6)}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div style={progressContainerStyle}>
        <div style={progressLabelStyle}>
          <span>Upgrade Progress</span>
          <span style={{ color: shipColor }}>{progress}%</span>
        </div>
        <div style={progressTrackStyle}>
          <div 
            style={{
              ...progressFillStyle,
              width: `${progress}%`,
              background: shipColor,
              boxShadow: `0 0 10px ${shipColor}60`,
            }}
          />
        </div>
      </div>
      
      {/* Crane Status */}
      <div style={craneStatusStyle}>
        <div style={statusItemStyle}>
          <span style={{ color: '#888' }}>Height</span>
          <span style={{ color: '#00d4aa', fontFamily: 'monospace' }}>
            {craneState.y.toFixed(1)}m
          </span>
        </div>
        <div style={statusItemStyle}>
          <span style={{ color: '#888' }}>Lock</span>
          <span style={{ color: twistlockEngaged ? '#00ff00' : '#ff4757' }}>
            {twistlockEngaged ? '● LOCKED' : '○ OPEN'}
          </span>
        </div>
      </div>
      
      {/* Sway & Stability Indicator */}
      <SwayIndicator 
        stability={swayState.stability} 
        magnitude={swayState.magnitude} 
        tension={swayState.tension}
        gustActive={swayState.gustActive}
        gustWarning={swayState.gustWarning}
      />
      
      {/* Weather & Environmental Status */}
      <WeatherIndicator 
        type={weather.type} 
        icon={getWeatherIcon(weather.type)}
        windSpeed={weather.windSpeed}
        warning={getWeatherWarning(weather.type)}
      />
      
      {/* Moon Phase Indicator */}
      <MoonPhaseIndicator phase={moonState.phase} config={moonConfig} tideHeight={moonState.tideHeight} />
    </div>
  )
}

// =============================================================================
// MOON PHASE INDICATOR COMPONENT
// =============================================================================

interface MoonPhaseIndicatorProps {
  phase: MoonPhaseName
  config: { name: string; icon: string }
  tideHeight: number
}

function MoonPhaseIndicator({ phase, config, tideHeight }: MoonPhaseIndicatorProps) {
  // Get tide description
  const getTideDesc = (height: number) => {
    if (height > 0.5) return 'Spring High'
    if (height > 0.2) return 'High'
    if (height > -0.2) return 'Mid'
    if (height > -0.5) return 'Low'
    return 'Spring Low'
  }
  
  return (
    <div style={moonPhaseContainerStyle}>
      <div style={moonPhaseHeaderStyle}>
        <span style={moonIconStyle}>{config.icon}</span>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>
            {config.name}
          </div>
          <div style={{ fontSize: '9px', color: '#888' }}>
            {getTideDesc(tideHeight)} Tide
          </div>
        </div>
      </div>
      
      {/* Tide Indicator Bar */}
      <div style={tideBarContainerStyle}>
        <div style={{
          ...tideBarFillStyle,
          width: `${((tideHeight + 1) / 2) * 100}%`,
          background: tideHeight > 0 ? '#00d4aa' : '#ff9500'
        }} />
      </div>
      
      {/* Effect indicators */}
      <div style={moonEffectsStyle}>
        {phase === 'new_moon' && <span style={effectBadgeStyle('#00d4aa')}>✨ Bio+</span>}
        {phase === 'full_moon' && <span style={effectBadgeStyle('#ff9500')}>🐋 Wildlife+</span>}
        {(phase === 'first_quarter' || phase === 'last_quarter') && <span style={effectBadgeStyle('#888')}>🌊 Neap</span>}
      </div>
    </div>
  )
}

const moonPhaseContainerStyle: React.CSSProperties = {
  marginTop: '12px',
  padding: '10px',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)'
}

const moonPhaseHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '8px'
}

const moonIconStyle: React.CSSProperties = {
  fontSize: '20px'
}

const tideBarContainerStyle: React.CSSProperties = {
  height: '4px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '2px',
  overflow: 'hidden',
  marginBottom: '8px'
}

const tideBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.5s ease'
}

const moonEffectsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap'
}

const effectBadgeStyle = (color: string): React.CSSProperties => ({
  fontSize: '9px',
  padding: '2px 6px',
  background: `${color}20`,
  borderRadius: '4px',
  color,
  border: `1px solid ${color}40`
})

// =============================================================================
// SWAY INDICATOR COMPONENT
// =============================================================================

interface SwayIndicatorProps {
  stability: number
  magnitude: number
  tension: number
  gustActive?: boolean
  gustWarning?: boolean
}

function SwayIndicator({ stability, magnitude, tension, gustActive, gustWarning }: SwayIndicatorProps) {
  // Get color based on stability
  const getStabilityColor = () => {
    if (gustWarning) return '#ff0000'
    if (stability > 0.8) return '#00d4aa'
    if (stability > 0.5) return '#ff9500'
    return '#ff4757'
  }
  
  // Get label
  const getStabilityLabel = () => {
    if (gustWarning) return 'WIND GUST!'
    if (stability > 0.9) return 'Stable'
    if (stability > 0.7) return 'Moderate'
    if (stability > 0.4) return 'Unstable'
    return 'DANGER'
  }
  
  return (
    <div style={swayContainerStyle}>
      <div style={swayHeaderStyle}>
        <span style={{ fontSize: '10px', color: '#888' }}>Stability</span>
        <span style={{ 
          fontSize: '11px', 
          fontWeight: 600, 
          color: getStabilityColor(),
          fontFamily: 'monospace',
          animation: gustWarning ? 'pulse 0.3s infinite' : 'none'
        }}>
          {Math.round(stability * 100)}% - {getStabilityLabel()}
        </span>
      </div>
      
      {/* Stability Bar */}
      <div style={stabilityBarContainerStyle}>
        <div style={{
          ...stabilityBarFillStyle,
          width: `${stability * 100}%`,
          background: getStabilityColor(),
          boxShadow: gustWarning ? '0 0 12px #ff0000' : `0 0 8px ${getStabilityColor()}60`,
          animation: gustWarning ? 'pulse 0.3s infinite' : 'none'
        }} />
      </div>
      
      {/* Gust Warning */}
      {gustWarning && (
        <div style={{ 
          fontSize: '9px', 
          color: '#ff0000',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600,
          animation: 'pulse 0.3s infinite'
        }}>
          <span>💨</span>
          <span>STRONG GUST - HOLD POSITION!</span>
        </div>
      )}
      
      {/* Sway Magnitude Warning (only show if no gust) */}
      {!gustWarning && magnitude > 0.5 && (
        <div style={{ 
          fontSize: '9px', 
          color: magnitude > 0.7 ? '#ff4757' : '#ff9500',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>⚠️</span>
          <span>High Sway - Install Speed Reduced</span>
        </div>
      )}
      
      {/* Tension Indicator */}
      <div style={tensionIndicatorStyle}>
        <span style={{ fontSize: '9px', color: '#888' }}>Cable</span>
        <div style={tensionBarContainerStyle}>
          <div style={{
            ...tensionBarFillStyle,
            width: `${tension * 100}%`,
            background: tension > 0.8 ? '#ff4757' : tension > 0.5 ? '#ff9500' : '#00d4aa'
          }} />
        </div>
      </div>
    </div>
  )
}

const swayContainerStyle: React.CSSProperties = {
  marginTop: '12px',
  padding: '10px',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)'
}

const swayHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px'
}

const stabilityBarContainerStyle: React.CSSProperties = {
  height: '6px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '3px',
  overflow: 'hidden'
}

const stabilityBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '3px',
  transition: 'width 0.2s ease'
}

const tensionIndicatorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '8px'
}

const tensionBarContainerStyle: React.CSSProperties = {
  flex: 1,
  height: '3px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '2px',
  overflow: 'hidden'
}

const tensionBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.3s ease'
}

// =============================================================================
// WEATHER INDICATOR COMPONENT
// =============================================================================

interface WeatherIndicatorProps {
  type: WeatherType
  icon: string
  windSpeed: number
  warning: string | null
}

function WeatherIndicator({ type, icon, windSpeed, warning }: WeatherIndicatorProps) {
  return (
    <div style={weatherContainerStyle}>
      <div style={weatherHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{icon}</span>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>
              {type.replace('_', ' ').toUpperCase()}
            </div>
            <div style={{ fontSize: '9px', color: '#888' }}>
              Wind: {Math.round(windSpeed)} m/s
            </div>
          </div>
        </div>
      </div>
      
      {warning && (
        <div style={weatherWarningStyle}>
          <span>{warning}</span>
        </div>
      )}
    </div>
  )
}

const weatherContainerStyle: React.CSSProperties = {
  marginTop: '12px',
  padding: '10px',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)'
}

const weatherHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const weatherWarningStyle: React.CSSProperties = {
  marginTop: '8px',
  padding: '6px 8px',
  background: 'rgba(255,71,87,0.2)',
  borderRadius: '4px',
  fontSize: '9px',
  color: '#ff4757',
  border: '1px solid rgba(255,71,87,0.4)',
  fontWeight: 600
}

// =============================================================================
// CANVAS RENDERING HELPERS
// =============================================================================

function drawCraneCabView(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  craneState: any,
  ship: any,
  audioData: any
) {
  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#0d1a2e')
  gradient.addColorStop(0.5, '#1a2a40')
  gradient.addColorStop(1, '#0d1520')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  
  // Ship silhouette
  if (ship) {
    ctx.fillStyle = '#1a2a35'
    ctx.fillRect(w * 0.3, h * 0.6, w * 0.4, h * 0.2)
    
    // Ship lights pulsing to music
    const pulse = 1 + audioData.bass * 0.5
    ctx.fillStyle = `rgba(0, 212, 170, ${0.5 * pulse})`
    ctx.beginPath()
    ctx.arc(w * 0.35, h * 0.65, 4 * pulse, 0, Math.PI * 2)
    ctx.fill()
  }
  
  // Crane structure
  ctx.strokeStyle = '#2a3a45'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(w * 0.1, h)
  ctx.lineTo(w * 0.15, h * 0.3)
  ctx.lineTo(w * 0.85, h * 0.3)
  ctx.lineTo(w * 0.9, h)
  ctx.stroke()
  
  // Spreader position indicator
  const spreaderX = w * 0.5 + (craneState.spreaderPos.x / 30) * w * 0.3
  const spreaderY = h * 0.4 + ((15 - craneState.spreaderPos.y) / 15) * h * 0.3
  
  ctx.strokeStyle = '#00d4aa'
  ctx.lineWidth = 2
  ctx.strokeRect(spreaderX - 15, spreaderY - 10, 30, 20)
  
  // Cable line
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(w * 0.5, h * 0.3)
  ctx.lineTo(spreaderX, spreaderY - 10)
  ctx.stroke()
}

function drawHookView(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  craneState: any,
  audioData: any
) {
  // Dark background
  ctx.fillStyle = '#0a0a15'
  ctx.fillRect(0, 0, w, h)
  
  // Target area below
  const gradient = ctx.createLinearGradient(0, h * 0.5, 0, h)
  gradient.addColorStop(0, '#0d1520')
  gradient.addColorStop(1, '#1a2a35')
  ctx.fillStyle = gradient
  ctx.fillRect(0, h * 0.5, w, h * 0.5)
  
  // Spreader beam
  ctx.fillStyle = '#3a4a55'
  ctx.fillRect(w * 0.3, h * 0.2, w * 0.4, 8)
  
  // Twistlock indicators
  const locked = craneState.twistlockEngaged
  ctx.fillStyle = locked ? '#00ff00' : '#ff4757'
  ctx.fillRect(w * 0.32, h * 0.22, 8, 12)
  ctx.fillRect(w * 0.66, h * 0.22, 8, 12)
  
  // Container corner guides
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)'
  ctx.setLineDash([5, 5])
  ctx.strokeRect(w * 0.25, h * 0.6, w * 0.5, h * 0.25)
  ctx.setLineDash([])
  
  // Music reactivity - pulsing alignment guides
  const pulse = audioData.bass * 10
  ctx.strokeStyle = `rgba(0, 212, 170, ${0.3 + audioData.bass * 0.3})`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(w * 0.5, h * 0.3 - pulse)
  ctx.lineTo(w * 0.5, h * 0.3 + pulse)
  ctx.stroke()
}

function drawDroneView(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  ships: any[],
  currentShip: any,
  audioData: any
) {
  // Aerial view background
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#0d1a2e')
  gradient.addColorStop(1, '#1a3a50')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  
  // Water
  ctx.fillStyle = '#0d2535'
  ctx.fillRect(0, h * 0.4, w, h * 0.6)
  
  // Dock
  ctx.fillStyle = '#2a3a45'
  ctx.fillRect(w * 0.2, h * 0.35, w * 0.6, h * 0.1)
  
  // Ships
  ships.forEach((ship, i) => {
    const x = w * (0.3 + i * 0.2)
    const y = h * 0.45
    const color = SHIP_COLORS[ship.type as keyof typeof SHIP_COLORS]?.primary || '#00d4aa'
    
    // Ship body
    ctx.fillStyle = '#1a2a35'
    ctx.fillRect(x - 20, y - 8, 40, 16)
    
    // Ship glow
    const pulse = 1 + audioData.mid * 0.3
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 3 * pulse, 0, Math.PI * 2)
    ctx.fill()
  })
  
  // Drone flight path indicator
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.5, w * 0.35, h * 0.3, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawUnderwaterView(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  ship: any,
  audioData: any
) {
  // Deep blue gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#051525')
  gradient.addColorStop(1, '#0a2040')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  
  // God rays from above
  for (let i = 0; i < 5; i++) {
    const rayGradient = ctx.createLinearGradient(w * (0.2 + i * 0.15), 0, w * (0.2 + i * 0.15), h * 0.6)
    rayGradient.addColorStop(0, 'rgba(0, 170, 255, 0.15)')
    rayGradient.addColorStop(1, 'transparent')
    ctx.fillStyle = rayGradient
    ctx.fillRect(w * (0.15 + i * 0.15), 0, w * 0.08, h * 0.7)
  }
  
  // Ship hull glow from lights
  if (ship) {
    const pulse = 1 + audioData.bass * 0.4
    const shipGradient = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.3)
    shipGradient.addColorStop(0, `rgba(0, 212, 170, ${0.3 * pulse})`)
    shipGradient.addColorStop(1, 'transparent')
    ctx.fillStyle = shipGradient
    ctx.fillRect(0, 0, w, h)
  }
  
  // Bubbles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  for (let i = 0; i < 20; i++) {
    const x = (i * 37) % w
    const y = (i * 23 + Date.now() * 0.02) % h
    ctx.beginPath()
    ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawScanlines(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 2)
  }
}

// =============================================================================
// STYLES
// =============================================================================

const cabinContainerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
}

const modeToggleStyle: React.CSSProperties = {
  position: 'absolute',
  top: '24px',
  right: '24px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  border: GLASSMORPHISM.border,
  borderRadius: GLASSMORPHISM.borderRadiusSmall,
  color: '#fff',
  cursor: 'pointer',
  pointerEvents: 'auto',
  transition: 'all 0.2s ease',
  boxShadow: GLASSMORPHISM.boxShadow,
}

const keyHintStyle: React.CSSProperties = {
  padding: '2px 6px',
  background: 'rgba(0,212,170,0.2)',
  border: '1px solid rgba(0,212,170,0.4)',
  borderRadius: '4px',
  fontSize: '10px',
  fontFamily: 'monospace',
  color: '#00d4aa',
}

const trainingButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '24px',
  right: '140px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  background: 'rgba(0, 100, 212, 0.2)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(74, 158, 255, 0.4)',
  borderRadius: '8px',
  color: '#4a9eff',
  cursor: 'pointer',
  pointerEvents: 'auto',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
}

// Economy Metrics Styles
const economyMetricsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '12px',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: '10px',
  border: '1px solid rgba(255,215,0,0.2)',
  marginBottom: '12px'
}

const creditDisplayStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  justifyContent: 'center'
}

const currencyIconStyle: React.CSSProperties = {
  fontSize: '20px'
}

const creditAmountStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#ffd700',
  fontFamily: 'monospace',
  textShadow: '0 0 10px rgba(255,215,0,0.5)'
}

const hcLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#ffd700',
  opacity: 0.8
}

const reputationDisplayStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
}

const repHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const repBarContainerStyle: React.CSSProperties = {
  height: '4px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '2px',
  overflow: 'hidden'
}

const repBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.3s ease'
}

const multiviewGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gridTemplateRows: '1fr 1fr',
  gridTemplateAreas: `
    "main hook"
    "main drone"
    "main underwater"
  `,
  gap: '16px',
  width: 'min(95vw, 1400px)',
  height: 'min(90vh, 800px)',
  pointerEvents: 'auto',
}

const panelStyle: React.CSSProperties = {
  position: 'relative',
  borderRadius: '12px',
  overflow: 'hidden',
  background: 'rgba(10, 15, 30, 0.85)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  display: 'flex',
  flexDirection: 'column',
}

const bezelStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  padding: '3px',
  background: '#1a1a1a',
  borderRadius: '10px',
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
}

const recIndicatorStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#ff4444',
  boxShadow: '0 0 6px #ff4444',
  animation: 'pulse 1.5s ease-in-out infinite',
}

const feedContainerStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '0 0 8px 8px',
  background: '#000',
}

const crosshairStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
}

const crosshairHStyle: React.CSSProperties = {
  position: 'absolute',
  width: '30px',
  height: '1px',
  background: 'rgba(255, 149, 0, 0.6)',
  left: '-15px',
  top: '0',
}

const crosshairVStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '30px',
  background: 'rgba(255, 149, 0, 0.6)',
  left: '0',
  top: '-15px',
}

const targetCircleStyle: React.CSSProperties = {
  position: 'absolute',
  width: '40px',
  height: '40px',
  border: '1px dashed rgba(255, 215, 0, 0.4)',
  borderRadius: '50%',
  left: '-20px',
  top: '-20px',
}

const depthIndicatorStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '10px',
  right: '10px',
  padding: '4px 8px',
  background: 'rgba(0,0,0,0.5)',
  borderRadius: '4px',
}

const cornerAccentStyle: React.CSSProperties = {
  position: 'absolute',
  width: '24px',
  height: '2px',
}

const cornerAccentVStyle: React.CSSProperties = {
  position: 'absolute',
  width: '2px',
  height: '24px',
}

const statusPanelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '24px',
  left: '24px',
  width: '260px',
  padding: '16px',
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  border: GLASSMORPHISM.border,
  borderRadius: GLASSMORPHISM.borderRadius,
  boxShadow: GLASSMORPHISM.boxShadow,
  pointerEvents: 'auto',
}

const statusHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '12px',
}

const shipIconStyle = (color: string): React.CSSProperties => ({
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `${color}20`,
  borderRadius: '10px',
  border: `2px solid ${color}40`,
  fontSize: '20px',
})

const progressContainerStyle: React.CSSProperties = {
  marginBottom: '12px',
}

const progressLabelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '11px',
  color: '#888',
  marginBottom: '4px',
}

const progressTrackStyle: React.CSSProperties = {
  height: '6px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '3px',
  overflow: 'hidden',
}

const progressFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '3px',
  transition: 'width 0.3s ease',
}

const craneStatusStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  paddingTop: '12px',
  borderTop: '1px solid rgba(255,255,255,0.1)',
}

const statusItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  fontSize: '11px',
}

const bezelOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 101,
  background: `
    radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.3) 100%),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.03) 2px,
      rgba(0,0,0,0.03) 4px
    )
  `,
}

const scanlineStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '2px',
  background: 'rgba(255,255,255,0.03)',
  animation: 'scanline 8s linear infinite',
}
