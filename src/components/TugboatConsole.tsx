// =============================================================================
// TUGBOAT CONSOLE — Twin-prop virtual hardware console
// Dual draggable throttle levers + amber LED RPM readouts.
// Renders only when operationMode === 'tugboat'.
// =============================================================================

import { useRef, useCallback, useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { TYPOGRAPHY } from './DesignSystem'

// =============================================================================
// CONSTANTS
// =============================================================================

const SLIDER_HEIGHT = 180  // px — the draggable track height
const RPM_MAX = 100

// =============================================================================
// AMBER 7-SEGMENT LED DISPLAY
// Renders a numeric value with a classic amber-on-dark appearance.
// =============================================================================

function LedDisplay({ value, label }: { value: number; label: string }) {
  const absVal = Math.abs(Math.round(value))
  const sign = value >= 0 ? '+' : '−'
  const digits = absVal.toString().padStart(3, '0')

  const ledStyle: React.CSSProperties = {
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '3px',
    color: '#ff9500',
    textShadow: '0 0 8px #ff950099, 0 0 16px #ff950055',
    background: '#0a0600',
    border: '1px solid #3a2200',
    borderRadius: '4px',
    padding: '4px 8px',
    minWidth: '72px',
    textAlign: 'center',
    display: 'block',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    color: '#ff950088',
    textAlign: 'center',
    marginTop: '3px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={ledStyle}>
        {sign}{digits}
      </span>
      <span style={labelStyle}>{label} RPM</span>
    </div>
  )
}

// =============================================================================
// SINGLE THROTTLE LEVER
// Vertical slider that maps drag distance to -100..100 RPM.
// =============================================================================

interface ThrottleLeverProps {
  label: string
  side: 'port' | 'starboard'
  value: number          // -100..100
  onChange: (val: number) => void
  accentColor: string
}

function ThrottleLever({ label, side, value, onChange, accentColor }: ThrottleLeverProps) {
  const isDraggingRef = useRef(false)
  const dragStartYRef = useRef(0)
  const dragStartValRef = useRef(0)
  // Local state only for re-rendering the knob position (pointer-driven)
  const [displayValue, setDisplayValue] = useState(value)

  // Keep display value in sync when store value changes externally
  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDraggingRef.current = true
    dragStartYRef.current = e.clientY
    dragStartValRef.current = displayValue
  }, [displayValue])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    const dy = dragStartYRef.current - e.clientY   // up = positive
    const delta = (dy / SLIDER_HEIGHT) * 2 * RPM_MAX
    const next = Math.max(-RPM_MAX, Math.min(RPM_MAX, dragStartValRef.current + delta))
    setDisplayValue(next)
    onChange(next)
  }, [onChange])

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  // Double-click to zero the lever
  const handleDoubleClick = useCallback(() => {
    setDisplayValue(0)
    onChange(0)
  }, [onChange])

  // Knob position: center of track = 0 RPM
  // Positive RPM → knob moves UP, negative → DOWN
  const knobTop = SLIDER_HEIGHT / 2 - (displayValue / RPM_MAX) * (SLIDER_HEIGHT / 2)
  // clamp
  const knobTopClamped = Math.max(0, Math.min(SLIDER_HEIGHT - 24, knobTop))

  // Fill color: green for forward, red for reverse
  const isForward = displayValue >= 0
  const fillHeight = Math.abs(displayValue / RPM_MAX) * (SLIDER_HEIGHT / 2)
  const fillTop = isForward
    ? SLIDER_HEIGHT / 2 - fillHeight
    : SLIDER_HEIGHT / 2

  const trackStyle: React.CSSProperties = {
    position: 'relative',
    width: '36px',
    height: `${SLIDER_HEIGHT}px`,
    background: '#0d0d0d',
    borderRadius: '6px',
    border: `1px solid #333`,
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
    cursor: 'ns-resize',
    userSelect: 'none',
    touchAction: 'none',
  }

  const fillStyle: React.CSSProperties = {
    position: 'absolute',
    left: '4px',
    right: '4px',
    top: `${fillTop}px`,
    height: `${fillHeight}px`,
    background: isForward
      ? `linear-gradient(180deg, ${accentColor}cc, ${accentColor}44)`
      : 'linear-gradient(180deg, #ff444488, #ff222244)',
    borderRadius: '3px',
    transition: 'none',
    pointerEvents: 'none',
  }

  const knobStyle: React.CSSProperties = {
    position: 'absolute',
    left: '0',
    right: '0',
    top: `${knobTopClamped}px`,
    height: '24px',
    background: 'linear-gradient(180deg, #cccccc, #888888)',
    border: '1px solid #555',
    borderRadius: '4px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  }

  // Notch lines on the knob
  const notchStyle: React.CSSProperties = {
    width: '18px',
    height: '2px',
    background: 'rgba(0,0,0,0.4)',
    borderRadius: '1px',
    boxShadow: '0 3px 0 rgba(0,0,0,0.3)',
  }

  // Center-line indicator (zero marker)
  const zeroMarkerStyle: React.CSSProperties = {
    position: 'absolute',
    left: '-6px',
    right: '-6px',
    top: `${SLIDER_HEIGHT / 2 - 1}px`,
    height: '2px',
    background: '#555',
    borderRadius: '1px',
    pointerEvents: 'none',
  }

  // Side label
  const isPort = side === 'port'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Channel label */}
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '3px',
          color: accentColor,
          textTransform: 'uppercase' as const,
          textShadow: `0 0 6px ${accentColor}88`,
        }}
      >
        {label}
      </div>

      {/* LED display */}
      <LedDisplay value={displayValue} label={isPort ? 'PORT' : 'STBD'} />

      {/* Track + knob */}
      <div
        style={trackStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        title="Drag to set RPM · Double-click to zero"
      >
        <div style={zeroMarkerStyle} />
        <div style={fillStyle} />
        <div style={knobStyle}>
          <div style={notchStyle} />
        </div>
        {/* Scale ticks */}
        {[-75, -50, -25, 0, 25, 50, 75].map((tick) => {
          const tickTop = SLIDER_HEIGHT / 2 - (tick / RPM_MAX) * (SLIDER_HEIGHT / 2)
          return (
            <div
              key={tick}
              style={{
                position: 'absolute',
                right: tick === 0 ? '-12px' : '-8px',
                top: `${tickTop - 1}px`,
                width: tick === 0 ? '10px' : '6px',
                height: '1px',
                background: tick === 0 ? '#888' : '#444',
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* FWD / REV labels */}
        <div
          style={{
            position: 'absolute',
            left: '-22px',
            top: '4px',
            fontSize: '8px',
            color: accentColor,
            fontWeight: 700,
            letterSpacing: '1px',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          FWD
        </div>
        <div
          style={{
            position: 'absolute',
            left: '-22px',
            bottom: '4px',
            fontSize: '8px',
            color: '#ff6644',
            fontWeight: 700,
            letterSpacing: '1px',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          REV
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// STATUS INDICATOR ROW
// Small amber LEDs indicating engine state.
// =============================================================================

function EngineStatusRow({ portRpm, starboardRpm }: { portRpm: number; starboardRpm: number }) {
  const dotStyle = (active: boolean, color: string): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: active ? color : '#1a1a1a',
    boxShadow: active ? `0 0 6px ${color}` : 'none',
    border: `1px solid ${active ? color : '#333'}`,
    transition: 'all 0.15s ease',
  })

  const portActive = Math.abs(portRpm) > 5
  const starboardActive = Math.abs(starboardRpm) > 5
  const differential = Math.abs(portRpm - starboardRpm) > 15

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '6px 10px',
        background: 'rgba(0,0,0,0.4)',
        borderRadius: '4px',
        border: '1px solid #222',
      }}
    >
      <div style={dotStyle(portActive, '#00d4aa')} title="Port engine" />
      <div style={{ fontSize: '8px', color: '#444', letterSpacing: '1px' }}>◆</div>
      <div style={dotStyle(differential, '#ff9500')} title="Differential thrust" />
      <div style={{ fontSize: '8px', color: '#444', letterSpacing: '1px' }}>◆</div>
      <div style={dotStyle(starboardActive, '#00d4aa')} title="Starboard engine" />
    </div>
  )
}

// =============================================================================
// MAIN TUGBOAT CONSOLE
// =============================================================================

export default function TugboatConsole() {
  const operationMode = useGameStore((s) => s.operationMode)
  const tugboatState = useGameStore((s) => s.tugboatState)
  const updateTugboatState = useGameStore((s) => s.updateTugboatState)

  const portRpm = tugboatState.portEngineRpm ?? 0
  const starboardRpm = tugboatState.starboardEngineRpm ?? 0

  if (operationMode !== 'tugboat') return null

  const handlePortChange = (val: number) => {
    updateTugboatState({ portEngineRpm: val })
  }

  const handleStarboardChange = (val: number) => {
    updateTugboatState({ starboardEngineRpm: val })
  }

  // -------------------------------------------------------------------------
  // CHASSIS
  // -------------------------------------------------------------------------

  const chassisStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 110,
    fontFamily: TYPOGRAPHY.fontFamilyMono,
    // Matte black metal
    background: 'linear-gradient(160deg, #1c1c1c 0%, #111111 60%, #0d0d0d 100%)',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '16px 20px 14px',
    boxShadow:
      '0 8px 32px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    // Hardware recess texture
    backgroundImage:
      'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
    minWidth: '180px',
  }

  const titleBarStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderBottom: '1px solid #2a2a2a',
    paddingBottom: '10px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '3px',
    color: '#555',
    textTransform: 'uppercase' as const,
  }

  const leverRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: '28px',
    alignItems: 'flex-start',
    padding: '4px 0',
  }

  const hintStyle: React.CSSProperties = {
    fontSize: '8px',
    color: '#333',
    letterSpacing: '1px',
    textAlign: 'center',
  }

  return (
    <div style={chassisStyle}>
      {/* Title bar */}
      <div style={titleBarStyle}>
        <span style={{ fontSize: '10px', color: '#ff9500', opacity: 0.6 }}>⬡</span>
        <span style={titleStyle}>Twin Prop Control</span>
        <span style={{ fontSize: '10px', color: '#ff9500', opacity: 0.6 }}>⬡</span>
      </div>

      {/* Dual throttle levers */}
      <div style={leverRowStyle}>
        <ThrottleLever
          label="Port"
          side="port"
          value={portRpm}
          onChange={handlePortChange}
          accentColor="#00d4aa"
        />
        <ThrottleLever
          label="Stbd"
          side="starboard"
          value={starboardRpm}
          onChange={handleStarboardChange}
          accentColor="#00aaff"
        />
      </div>

      {/* Engine status indicators */}
      <EngineStatusRow portRpm={portRpm} starboardRpm={starboardRpm} />

      {/* Usage hint */}
      <span style={hintStyle}>drag ↕ · dbl-click to zero</span>
    </div>
  )
}
