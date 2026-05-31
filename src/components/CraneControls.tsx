import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useGameStore } from '../store/useGameStore'
import { useCranePhysics } from './controls/useCranePhysics'
import { useMusicPulse } from '../hooks/useMusicPulse'
import JoystickControl from './controls/JoystickControl'

// =============================================================================
// INTERACTIVE CRANE CONTROLS — HarborGlow
// Rich tactile crane control panel with neon-styled controls and
// music-reactive pulsing. Physics loop lives in useCranePhysics.
// =============================================================================

// ─── Neon color palette ─────────────────────────────────────────────────────
const NEON = {
  cyan: '#00d4aa',
  blue: '#00bfff',
  magenta: '#ff6b9d',
  amber: '#ff9500',
  red: '#ff3b30',
} as const

// ─── Hover tooltip for keyboard shortcuts ───────────────────────────────────
function HoverHint({ keys, label, children }: { keys: string[]; label: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false)
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <div style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'rgba(10, 15, 30, 0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        border: '1px solid rgba(0, 212, 170, 0.3)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        fontSize: '11px',
        fontFamily: '"JetBrains Mono", monospace',
        color: '#00d4aa',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.15s ease-out',
        zIndex: 50,
      }}>
        {keys.map((k, i) => (
          <>
            <kbd key={k} style={{
              padding: '2px 6px',
              background: 'rgba(0,212,170,0.15)',
              border: '1px solid rgba(0,212,170,0.4)',
              borderRadius: '4px',
              fontSize: '10px',
              color: '#00d4aa',
            }}>{k}</kbd>
            {i < keys.length - 1 && <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>}
          </>
        ))}
        <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: '4px' }}>{label}</span>
      </div>
    </div>
  )
}

// ─── Reusable read-only slider display ──────────────────────────────────────
interface ReadOnlySliderProps {
  label: string
  value: number
  min: number
  max: number
  displayValue: string
  color: string
  pulse: number
  isActive?: boolean
  hintKeys?: string[]
  hintLabel?: string
  showHintText?: boolean
}

function ReadOnlySlider({ label, value, min, max, displayValue, color, pulse, isActive, hintKeys, hintLabel, showHintText }: ReadOnlySliderProps) {
  const [hovered, setHovered] = useState(false)
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  const pulseBoost = pulse > 0.5 ? 1 + (pulse - 0.5) * 0.6 : 1
  const glowColor = `${color}${hovered || isActive ? '80' : '40'}`

  return (
    <div
      className="relative rounded-lg p-2 transition-all duration-200"
      style={{
        border: `1px solid ${hovered ? color : 'transparent'}`,
        boxShadow: hovered || isActive ? `0 0 12px ${color}30, inset 0 0 8px ${color}15` : 'none',
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex justify-between items-center mb-1.5">
        <span
          className="text-[10px] uppercase tracking-wider font-semibold transition-colors duration-200"
          style={{ color: hovered ? color : '#9ca3af' }}
        >
          {label}
        </span>
        <div className="flex items-center">
          <span
            className="text-xs font-mono font-bold tabular-nums transition-colors duration-200"
            style={{ color, textShadow: `0 0 ${6 * pulseBoost}px ${color}` }}
          >
            {displayValue}
          </span>
          {hintKeys && (
            <HoverHint keys={hintKeys} label={hintLabel || ''}>
              <span style={{ fontSize: '10px', opacity: 0.4, cursor: 'help', marginLeft: '4px' }}>⌨️</span>
            </HoverHint>
          )}
        </div>
      </div>

      {/* Track */}
      <div className="relative h-2 bg-gray-800 rounded-full overflow-visible">
        {/* Fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-75"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: `0 0 ${8 * pulseBoost}px ${color}`,
          }}
        />
        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-gray-900 transition-all duration-75"
          style={{
            left: `calc(${pct}% - 6px)`,
            backgroundColor: color,
            boxShadow: `0 0 ${10 * pulseBoost}px ${color}, 0 0 4px ${color}`,
          }}
        />
      </div>

      {showHintText && hintKeys && hintLabel && (
        <div style={{
          marginTop: '6px',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.45)',
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          {hintLabel}: {hintKeys.join(' / ')}
        </div>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function InteractiveCraneControls() {
  const boothTier = useGameStore(state => state.boothTier)
  const isArctic = boothTier === 3
  const bpm = useGameStore(state => state.bpm)
  const pulse = useMusicPulse(bpm)
  const [showHints, setShowHints] = useState(true)
  const [showAllHints, setShowAllHints] = useState(false)
  const gamepadConnectedRef = useRef(false)
  const [gamepadConnected, setGamepadConnected] = useState(false)

  const {
    cableDepth,
    loadTension,
    trolleyPosition,
    spreaderRotation,
    twistlockEngaged,
    isMoving,
    winchSpeed,
    setWinchSpeed,
    heaterActive,
    iceBuildup,
    weather,
  } = useGameStore(state => ({
    cableDepth: state.cableDepth,
    loadTension: state.loadTension,
    trolleyPosition: state.trolleyPosition,
    spreaderRotation: state.spreaderRotation,
    twistlockEngaged: state.twistlockEngaged,
    isMoving: state.isMoving,
    winchSpeed: state.winchSpeed,
    setWinchSpeed: state.setWinchSpeed,
    heaterActive: state.heaterActive,
    iceBuildup: state.iceBuildup,
    weather: state.weather,
  }))

  const {
    leftStick,
    rightStick,
    shake,
    handleJoystickStart,
    handleJoystickMove,
    handleJoystickEnd,
    toggleTwistlock,
  } = useCranePhysics(isArctic)

  const leftGripHeat = heaterActive ? 0.6 + leftStick.intensity * 0.4 : 0
  const rightGripHeat = heaterActive ? 0.6 + rightStick.intensity * 0.4 : 0

  // Ice level factoring in heater and weather
  const currentIceBuildup =
    weather === 'storm' && !heaterActive ? 0.5 :
    weather === 'rain' && !heaterActive ? 0.3 :
    heaterActive ? Math.max(0, iceBuildup - 0.1) :
    iceBuildup

  // ─── Winch speed interaction ────────────────────────────────────────────────
  const [winchHover, setWinchHover] = useState(false)
  const [winchActive, setWinchActive] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('harborglow_hints_seen') === 'true'
    setShowHints(!seen)
    if (!seen) {
      const timer = window.setTimeout(() => {
        setShowHints(false)
        localStorage.setItem('harborglow_hints_seen', 'true')
      }, 3000)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [])

  useEffect(() => {
    const updateGamepad = () => {
      const hasGamepad = Array.from(navigator.getGamepads?.() || []).some(Boolean)
      gamepadConnectedRef.current = hasGamepad
      setGamepadConnected(hasGamepad)
    }

    updateGamepad()
    window.addEventListener('gamepadconnected', updateGamepad)
    window.addEventListener('gamepaddisconnected', updateGamepad)
    return () => {
      window.removeEventListener('gamepadconnected', updateGamepad)
      window.removeEventListener('gamepaddisconnected', updateGamepad)
    }
  }, [])

  const hintKeys = (keys: string[], hintType?: 'trolley' | 'cable' | 'rotate' | 'winch' | 'twistlock') => {
    if (!gamepadConnectedRef.current) return keys
    if (hintType === 'winch') return ['LT', 'RT']
    if (hintType === 'rotate') return ['RS']
    if (hintType === 'trolley') return ['LSX']
    if (hintType === 'cable') return ['LSY']
    if (hintType === 'twistlock') return ['A']
    return keys
  }

  const handleWinchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWinchSpeed(parseFloat(e.target.value))
  }, [setWinchSpeed])

  // ─── Rotation normalization ─────────────────────────────────────────────────
  let rotDeg = (spreaderRotation * 180) / Math.PI
  rotDeg = ((rotDeg + 180) % 360) - 180
  if (rotDeg < -180) rotDeg += 360

  // ─── Music-reactive outer glow ──────────────────────────────────────────────
  const pulseBoost = pulse > 0.5 ? 1 + (pulse - 0.5) * 1.2 : 1

  // ─── Standard (non-Arctic) control panel ────────────────────────────────────
  if (!isArctic) {
    return (
      <div
        className="absolute bottom-4 right-4 z-10 select-none"
        style={{
          filter: pulse > 0.5 ? `brightness(${0.95 + pulseBoost * 0.1})` : undefined,
        }}
      >
        <div
          className="bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-xl p-4 min-w-[280px] transition-all duration-150"
          style={{
            boxShadow: pulse > 0.5
              ? `0 0 ${24 * pulseBoost}px rgba(0,212,170,0.15), 0 0 ${48 * pulseBoost}px rgba(0,191,255,0.08), inset 0 0 ${16 * pulseBoost}px rgba(255,255,255,0.03)`
              : '0 0 20px rgba(0,0,0,0.4), inset 0 0 12px rgba(255,255,255,0.02)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
              🏗️ Crane Operator Panel
            </div>
            {isMoving && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]" />
                <span className="text-[9px] text-green-400 uppercase tracking-wider font-semibold">Active</span>
              </div>
            )}
          </div>

          <div className="space-y-3 mb-4">
            {/* Boom Extension */}
            <ReadOnlySlider
              label="Boom Extension"
              value={trolleyPosition}
              min={0}
              max={1}
              displayValue={`${(trolleyPosition * 100).toFixed(0)}%`}
              color={NEON.cyan}
              pulse={pulse}
              isActive={isMoving}
              hintKeys={hintKeys(['↑', '↓'], 'trolley')}
              hintLabel="Trolley"
              showHintText={showHints || showAllHints}
            />

            {/* Hook Height */}
            <ReadOnlySlider
              label="Hook Height"
              value={cableDepth}
              min={0}
              max={50}
              displayValue={`${cableDepth.toFixed(1)}m`}
              color={NEON.blue}
              pulse={pulse}
              isActive={isMoving}
              hintKeys={hintKeys(['W', 'S'], 'cable')}
              hintLabel="Cable"
              showHintText={showHints || showAllHints}
            />

            {/* Swing / Rotation */}
            <ReadOnlySlider
              label="Swing"
              value={rotDeg}
              min={-180}
              max={180}
              displayValue={`${rotDeg.toFixed(0)}°`}
              color={NEON.magenta}
              pulse={pulse}
              isActive={isMoving}
              hintKeys={hintKeys(['←', '→'], 'rotate')}
              hintLabel="Rotate"
              showHintText={showHints || showAllHints}
            />

            {/* Winch Speed — interactive */}
            <div
              className="relative rounded-lg p-2 transition-all duration-200"
              style={{
                border: `1px solid ${winchHover || winchActive ? NEON.amber : 'transparent'}`,
                boxShadow: winchHover || winchActive ? `0 0 12px ${NEON.amber}30, inset 0 0 8px ${NEON.amber}15` : 'none',
                transform: winchActive ? 'scale(1.02)' : 'scale(1)',
              }}
              onMouseEnter={() => setWinchHover(true)}
              onMouseLeave={() => setWinchHover(false)}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span
                  className="text-[10px] uppercase tracking-wider font-semibold transition-colors duration-200"
                  style={{ color: winchHover ? NEON.amber : '#9ca3af' }}
                >
                  Winch Speed
                </span>
                <div className="flex items-center">
                  <span
                    className="text-xs font-mono font-bold tabular-nums transition-colors duration-200"
                    style={{ color: NEON.amber, textShadow: `0 0 ${6 * pulseBoost}px ${NEON.amber}` }}
                  >
                    {winchSpeed.toFixed(1)}x
                  </span>
                  <HoverHint keys={['+', '-']} label="Speed">
                    <span style={{ fontSize: '10px', opacity: 0.4, cursor: 'help', marginLeft: '4px' }}>⌨️</span>
                  </HoverHint>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Interactive slider */}
                <div className="relative flex-1 h-2 bg-gray-800 rounded-full">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-75"
                    style={{
                      width: `${(winchSpeed / 2) * 100}%`,
                      backgroundColor: NEON.amber,
                      boxShadow: `0 0 ${8 * pulseBoost}px ${NEON.amber}`,
                    }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={winchSpeed}
                    onChange={handleWinchChange}
                    onMouseDown={() => setWinchActive(true)}
                    onMouseUp={() => setWinchActive(false)}
                    onTouchStart={() => setWinchActive(true)}
                    onTouchEnd={() => setWinchActive(false)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ zIndex: 10 }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-gray-900 pointer-events-none transition-all duration-75"
                    style={{
                      left: `calc(${(winchSpeed / 2) * 100}% - 6px)`,
                      backgroundColor: NEON.amber,
                      boxShadow: `0 0 ${10 * pulseBoost}px ${NEON.amber}, 0 0 4px ${NEON.amber}`,
                    }}
                  />
                </div>

                {/* Tension bar */}
                <div className="w-16 flex flex-col items-end gap-0.5">
                  <span
                    className="text-[9px] font-mono font-bold tabular-nums"
                    style={{ color: loadTension > 30 ? NEON.red : '#9ca3af' }}
                  >
                    {loadTension.toFixed(1)}t
                  </span>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-100"
                      style={{
                        width: `${(loadTension / 50) * 100}%`,
                        backgroundColor: loadTension > 30 ? NEON.red : loadTension > 20 ? NEON.amber : '#4ade80',
                        boxShadow: loadTension > 30 ? `0 0 6px ${NEON.red}` : 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Twistlock Button */}
          <HoverHint keys={['Space']} label="Toggle">
            <button
              onClick={toggleTwistlock}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                twistlockEngaged
                  ? 'bg-green-600/90 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                  : 'bg-gray-700/80 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {twistlockEngaged ? '🔒 Twistlock Engaged' : '🔓 Twistlock Disengaged'}
            </button>
          </HoverHint>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: '"JetBrains Mono", monospace' }}>
              {showHints || showAllHints ? 'Hints visible' : 'Hints hidden'}
            </div>
            <button
              onClick={() => setShowAllHints((value) => !value)}
              style={{
                padding: '3px 8px',
                borderRadius: '999px',
                border: '1px solid rgba(0,212,170,0.35)',
                background: 'rgba(0,212,170,0.08)',
                color: '#00d4aa',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              [?]
            </button>
          </div>

          {/* Keyboard hints */}
          {(showHints || showAllHints) && (
          <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-gray-500 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NEON.cyan, boxShadow: `0 0 4px ${NEON.cyan}` }} />
              <kbd className="px-1 rounded bg-gray-800 border border-gray-700 text-[9px]">{gamepadConnected ? 'LSX' : '↑'}</kbd>
              <kbd className="px-1 rounded bg-gray-800 border border-gray-700 text-[9px]">{gamepadConnected ? '' : '↓'}</kbd>
              <span>Trolley</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NEON.blue, boxShadow: `0 0 4px ${NEON.blue}` }} />
              <kbd className="px-1 rounded bg-gray-800 border border-gray-700 text-[9px]">{gamepadConnected ? 'LSY' : 'W'}</kbd>
              <kbd className="px-1 rounded bg-gray-800 border border-gray-700 text-[9px]">{gamepadConnected ? '' : 'S'}</kbd>
              <span>Cable</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NEON.magenta, boxShadow: `0 0 4px ${NEON.magenta}` }} />
              <kbd className="px-1 rounded bg-gray-800 border border-gray-700 text-[9px]">{gamepadConnected ? 'RS' : '←'}</kbd>
              <kbd className="px-1 rounded bg-gray-800 border border-gray-700 text-[9px]">{gamepadConnected ? '' : '→'}</kbd>
              <span>Rotate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NEON.amber, boxShadow: `0 0 4px ${NEON.amber}` }} />
              <kbd className="px-1 rounded bg-gray-800 border border-gray-700 text-[9px]">{gamepadConnected ? 'LT' : '+'}</kbd>
              <kbd className="px-1 rounded bg-gray-800 border border-gray-700 text-[9px]">{gamepadConnected ? 'RT' : '-'}</kbd>
              <span>Speed</span>
            </span>
            <span className="flex items-center gap-1.5 col-span-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22c55e', boxShadow: '0 0 4px #22c55e' }} />
              <kbd className="px-1 rounded bg-gray-800 border border-gray-700 text-[9px]">Space</kbd>
              <span>Toggle</span>
            </span>
          </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Arctic Tier 3 Command Booth Interface ───────────────────────────────────
  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}
    >
      <JoystickControl
        side="left"
        label="X/Z Move"
        stick={leftStick}
        gripHeat={leftGripHeat}
        heaterActive={heaterActive}
        onStart={handleJoystickStart}
        onMove={handleJoystickMove}
        onEnd={handleJoystickEnd}
      />

      <JoystickControl
        side="right"
        label="Y/Rot"
        stick={rightStick}
        gripHeat={rightGripHeat}
        heaterActive={heaterActive}
        onStart={handleJoystickStart}
        onMove={handleJoystickMove}
        onEnd={handleJoystickEnd}
      />

      {/* Center Control Panel */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center gap-4 bg-gray-900/90 backdrop-blur-md border border-cyan-500/30 rounded-xl px-6 py-3">
          {/* Twistlock Button */}
          <button
            onClick={toggleTwistlock}
            className={`relative px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              twistlockEngaged
                ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(0,255,0,0.5)]'
                : 'bg-red-600 text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]'
            }`}
          >
            <span className="relative z-10">{twistlockEngaged ? '🔒 LOCKED' : '🔓 UNLOCKED'}</span>
            {currentIceBuildup > 0.1 && (
              <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,${currentIceBuildup * 0.3}) 0%, transparent 50%)`,
                  backdropFilter: `blur(${currentIceBuildup * 2}px)`,
                }}
              />
            )}
          </button>

          {/* Load Indicator */}
          <div className="w-32">
            <div className="flex justify-between text-[10px] text-cyan-400 mb-1">
              <span>LOAD</span>
              <span className={loadTension > 30 ? 'text-red-400' : ''}>{loadTension.toFixed(1)}t</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  loadTension > 30 ? 'bg-red-500 animate-pulse' : loadTension > 20 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${(loadTension / 50) * 100}%` }}
              />
            </div>
          </div>

          {/* Cable Depth */}
          <div className="w-24">
            <div className="flex justify-between text-[10px] text-cyan-400 mb-1">
              <span>DEPTH</span>
              <span>{cableDepth.toFixed(0)}m</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${(cableDepth / 50) * 100}%` }}
              />
            </div>
          </div>

          {isMoving && (
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#00ff00]" />
          )}
        </div>
      </div>

      {/* Frost overlay for Arctic feel */}
      {currentIceBuildup > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, rgba(200,220,255,${currentIceBuildup * 0.1}) 0%, transparent 50%)`,
            backdropFilter: `blur(${currentIceBuildup}px)`,
          }}
        />
      )}
    </div>
  )
}
