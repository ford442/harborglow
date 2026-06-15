import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { ShipType, CameraMode, useGameStore } from '../../store/useGameStore';
import { useAudioData } from '../../systems/audioVisualSync';
import { GLASSMORPHISM, SHIP_COLORS } from '../DesignSystem';
import { TrafficShip, trafficSystem, useDockedShip } from '../../systems/trafficSystem';
import { drawCraneCabView, drawHookView, drawDroneView, drawUnderwaterView, drawScanlines } from './canvasDrawers';
import { moonSystem, MoonPhaseName, MOON_PHASES } from '../../systems/moonSystem';
import { swaySystem, useSwaySystem } from '../../systems/swaySystem';
import { weatherSystem, useWeatherSystem, WeatherType } from '../../systems/weatherSystem';
import { useEconomySystem } from '../../systems/economySystem';
import { ShipSpawner } from '../../systems/shipSpawner';
import { useCompletionGlow } from '../../hooks/useCompletionGlow';
import * as styles from './styles';


export interface CameraFeedConfig {
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

export interface CameraPanelProps {
  config: CameraFeedConfig
  isMain?: boolean
  cameraMode?: CameraMode
}
export function CameraPanel({ config, isMain, cameraMode }: CameraPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioData = useAudioData()
  const [hovered, setHovered] = useState(false)
  const [flashOpacity, setFlashOpacity] = useState(0)

  const panelIdToCameraMode: Record<string, CameraMode> = {
    'crane': 'crane-cockpit',
    'hook': 'crane-shoulder',
    'drone': 'ship-aerial',
    'underwater': 'ship-water',
  }

  const mappedMode = panelIdToCameraMode[config.id]
  const isActive = cameraMode === mappedMode

  const handleClick = () => {
    if (mappedMode) {
      useGameStore.getState().setCameraMode(mappedMode)
      setFlashOpacity(0.2)
      setTimeout(() => setFlashOpacity(0), 200)
    }
  }

  const craneState = useGameStore((state: any) => ({
    spreaderPos: state.spreaderPos,
    rotation: state.craneRotation ?? 0.2,
    height: state.craneHeight ?? 15.5,
  }))
  const ships = useGameStore((state: any) => state.ships)
  const currentShip = useGameStore((state: any) =>
    state.ships.find((s: any) => s.id === state.currentShipId)
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
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.panelStyle,
        gridArea: config.gridArea,
        borderColor: isActive ? '#00d4aa' : `${config.accentColor}40`,
        borderWidth: isActive ? '2px' : '1px',
        boxShadow: isActive
          ? `inset 0 0 30px #00d4aa20, 0 0 20px #00d4aa40, 0 4px 20px rgba(0,0,0,0.5)`
          : hovered
          ? `inset 0 0 30px ${config.accentColor}25, 0 0 16px ${config.accentColor}40, 0 4px 20px rgba(0,0,0,0.5)`
          : `inset 0 0 30px ${config.accentColor}15, 0 4px 20px rgba(0,0,0,0.5)`,
        cursor: 'pointer',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease',
        zIndex: hovered ? 10 : 1,
      }}
    >
      {/* Monitor Bezel */}
      <div style={styles.bezelStyle}>
        {/* Header */}
        <div
          style={{
            ...styles.panelHeaderStyle,
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
          <div style={styles.recIndicatorStyle} />
        </div>

        {/* Camera Feed Canvas */}
        <div style={styles.feedContainerStyle}>
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
            <div style={styles.crosshairStyle}>
              <div style={styles.crosshairHStyle} />
              <div style={styles.crosshairVStyle} />
              <div style={styles.targetCircleStyle} />
            </div>
          )}

          {/* Depth indicator for underwater */}
          {config.id === 'underwater' && (
            <div style={styles.depthIndicatorStyle}>
              <span style={{ fontSize: '10px', color: '#00aaff' }}>12m</span>
            </div>
          )}
        </div>

        {/* Corner Accents */}
        <div style={{ ...styles.cornerAccentStyle, top: 0, left: 0, background: config.accentColor }} />
        <div style={{ ...styles.cornerAccentVStyle, top: 0, left: 0, background: config.accentColor }} />
        <div style={{ ...styles.cornerAccentStyle, bottom: 0, right: 0, background: config.accentColor }} />
        <div style={{ ...styles.cornerAccentVStyle, bottom: 0, right: 0, background: config.accentColor }} />
      </div>

      {/* Click flash overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `rgba(255,255,255,${flashOpacity})`,
        pointerEvents: 'none',
        transition: 'opacity 0.2s ease',
        zIndex: 20,
        borderRadius: '12px',
      }} />
    </div>
  )
}

// =============================================================================
// ECONOMY METRICS COMPONENT
// =============================================================================

export function EconomyMetrics({ credits, reputation }: { credits: number; reputation: number }) {
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
    <div style={styles.economyMetricsStyle}>
      <div style={styles.creditDisplayStyle}>
        <span style={styles.currencyIconStyle}>💰</span>
        <span style={styles.creditAmountStyle}>{credits.toLocaleString()}</span>
        <span style={styles.hcLabelStyle}>HC</span>
      </div>

      <div style={styles.reputationDisplayStyle}>
        <div style={styles.repHeaderStyle}>
          <span style={{ fontSize: '10px', color: '#888' }}>Port Reputation</span>
          <span style={{ fontSize: '11px', color: repColor, fontWeight: 600 }}>
            {reputation}/1000
          </span>
        </div>
        <div style={styles.repBarContainerStyle}>
          <div
            style={{
              ...styles.repBarFillStyle,
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
// HARBOR SILHOUETTE - Empty state artwork
// =============================================================================

export function HarborSilhouette() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const stars = Array.from({ length: 30 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.6,
      size: Math.random() * 1.5 + 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5
    }))

    const render = (time: number) => {
      const w = canvas.width
      const h = canvas.height
      const t = time * 0.001

      // Background gradient (deep navy to black)
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#02040a')
      bg.addColorStop(0.5, '#0a1224')
      bg.addColorStop(1, '#0d1a2e')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Stars
      stars.forEach(star => {
        const twinkle = 0.4 + 0.6 * Math.sin(t * star.speed + star.phase)
        ctx.fillStyle = `rgba(200, 220, 255, ${twinkle})`
        ctx.beginPath()
        ctx.arc(star.x * w, star.y * h, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Water area
      const waterY = h * 0.65
      const waterGrad = ctx.createLinearGradient(0, waterY, 0, h)
      waterGrad.addColorStop(0, '#0a1a2e')
      waterGrad.addColorStop(1, '#020510')
      ctx.fillStyle = waterGrad
      ctx.fillRect(0, waterY, w, h - waterY)

      // Shimmering reflections
      for (let i = 0; i < 8; i++) {
        const y = waterY + (i + 1) * (h - waterY) / 9
        const shimmer = 0.15 + 0.1 * Math.sin(t * 2 + i * 1.3)
        const width = w * (0.3 + 0.4 * Math.sin(i * 0.7))
        const x = w * 0.5 + Math.sin(t * 0.5 + i) * w * 0.15 - width / 2
        ctx.fillStyle = `rgba(0, 180, 255, ${shimmer})`
        ctx.fillRect(x, y, width, 1)
      }

      // Dock silhouette
      ctx.fillStyle = '#050a12'
      ctx.fillRect(0, h - 20, w, 20)

      // Crane silhouette
      ctx.fillStyle = '#070f1a'
      // Crane base
      ctx.fillRect(w * 0.15, h - 45, 8, 25)
      // Crane arm
      ctx.beginPath()
      ctx.moveTo(w * 0.19, h - 45)
      ctx.lineTo(w * 0.19, h - 65)
      ctx.lineTo(w * 0.55, h - 58)
      ctx.lineTo(w * 0.55, h - 52)
      ctx.closePath()
      ctx.fill()
      // Crane cabin
      ctx.fillRect(w * 0.16, h - 50, 10, 8)

      // Small ship silhouette in distance
      ctx.fillStyle = '#080e18'
      ctx.beginPath()
      ctx.moveTo(w * 0.65, h - 22)
      ctx.lineTo(w * 0.75, h - 22)
      ctx.lineTo(w * 0.78, h - 18)
      ctx.lineTo(w * 0.63, h - 18)
      ctx.closePath()
      ctx.fill()

      // Lighthouse / dock light glow
      const lightX = w * 0.08
      const lightY = h - 35
      const glowPulse = 0.6 + 0.4 * Math.sin(t * 1.5)

      // Glow
      const glow = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, 25)
      glow.addColorStop(0, `rgba(0, 212, 170, ${0.4 * glowPulse})`)
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.fillRect(lightX - 25, lightY - 25, 50, 50)

      // Light point
      ctx.fillStyle = `rgba(0, 255, 200, ${glowPulse})`
      ctx.beginPath()
      ctx.arc(lightX, lightY, 2.5, 0, Math.PI * 2)
      ctx.fill()

      // Rotating lighthouse beam
      const beamAngle = t * 0.8
      ctx.save()
      ctx.translate(lightX, lightY)
      ctx.rotate(beamAngle)
      const beamGrad = ctx.createLinearGradient(0, 0, 60, 0)
      beamGrad.addColorStop(0, `rgba(0, 212, 170, ${0.25 * glowPulse})`)
      beamGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = beamGrad
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(60, -6)
      ctx.lineTo(60, 6)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={228}
      height={140}
      style={{
        width: '100%',
        height: '140px',
        borderRadius: '8px',
        display: 'block',
        marginBottom: '12px',
      }}
    />
  )
}

// =============================================================================
// SPAWN CTA BUTTON
// =============================================================================

export function SpawnCTAButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        width: '100%',
        padding: '14px 16px',
        background: 'linear-gradient(135deg, #00bcd4 0%, #0066ff 100%)',
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        pointerEvents: 'auto',
        transition: 'all 0.2s ease',
        boxShadow: hovered
          ? '0 0 24px rgba(0, 188, 212, 0.5), 0 4px 16px rgba(0, 102, 255, 0.4)'
          : '0 0 12px rgba(0, 188, 212, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3)',
        transform: pressed ? 'scale(0.97)' : hovered ? 'scale(1.03)' : 'scale(1)',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        marginBottom: '10px',
      }}
    >
      ⚓ Spawn Your First Vessel
    </button>
  )
}

// =============================================================================
// OPERATOR STATUS PANEL
// =============================================================================

export function OperatorStatusPanel() {
  const currentShip = useGameStore((state: any) =>
    state.ships.find((s: any) => s.id === state.currentShipId)
  )
  const { credits, reputation } = useEconomySystem()
  const installedUpgrades = useGameStore((state: any) => state.installedUpgrades)
  const craneState = useGameStore((state: any) => state.spreaderPos)
  const twistlockEngaged = useGameStore((state: any) => state.twistlockEngaged)
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
      <div style={styles.statusPanelStyle}>
        <HarborSilhouette />
        <SpawnCTAButton onClick={() => { ShipSpawner.spawnShip('cruise') }} />
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', color: '#666', lineHeight: '1.5' }}>
            Select a ship from the harbor menu above, or spawn one here to begin operations.
          </span>
        </div>
        {/* Moon Phase - Always Visible */}
        <MoonPhaseIndicator phase={moonState.phase} config={moonConfig} tideHeight={moonState.tideHeight} />
      </div>
    )
  }

  const shipUpgrades = installedUpgrades.filter((u: any) => u.shipId === currentShip.id)
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
    <div style={styles.statusPanelStyle}>
      {/* Economy Metrics */}
      <EconomyMetrics credits={credits} reputation={reputation} />

      {/* Ship Info */}
      <div style={styles.statusHeaderStyle}>
        <div style={{ fontSize: '24px', marginRight: '12px', color: shipColor }}>
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
      <div style={styles.progressContainerStyle}>
        <div style={styles.progressLabelStyle}>
          <span>Upgrade Progress</span>
          <span style={{ color: shipColor }}>{progress}%</span>
        </div>
        <div style={styles.progressTrackStyle}>
          <div
            style={{
              ...styles.progressFillStyle,
              width: `${progress}%`,
              background: shipColor,
              boxShadow: `0 0 10px ${shipColor}60`,
            }}
          />
        </div>
      </div>

      {/* Crane Status */}
      <div style={styles.craneStatusStyle}>
        <div style={styles.statusItemStyle}>
          <span style={{ color: '#888' }}>Height</span>
          <span style={{ color: '#00d4aa', fontFamily: 'monospace' }}>
            {craneState.y.toFixed(1)}m
          </span>
        </div>
        <div style={styles.statusItemStyle}>
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

export function MoonPhaseIndicator({ phase, config, tideHeight }: MoonPhaseIndicatorProps) {
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

export function SwayIndicator({ stability, magnitude, tension, gustActive, gustWarning }: SwayIndicatorProps) {
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

export function WeatherIndicator({ type, icon, windSpeed, warning }: WeatherIndicatorProps) {
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
