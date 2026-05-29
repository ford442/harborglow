// =============================================================================
// TUGBOAT HUD - Speed, wind, objectives, and storm timer
// =============================================================================

import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { useStormSystem } from '../../systems/StormSystem'
import { towLineState } from '../../systems/TowLineSystem'
import { useScreenShake } from '../../hooks/useScreenShake'
import { createGlassPanelStyles, createButtonStyles, GLASSMORPHISM, TYPOGRAPHY } from '../DesignSystem'
import AcousticArray from '../AcousticArray'
import SalvageDispatchModal from './SalvageDispatchModal'

// =============================================================================
// BEAUFORT SCALE
// =============================================================================

function getBeaufortDescription(intensity: number): string {
  if (intensity < 0.2) return 'Calm'
  if (intensity < 0.4) return 'Breezy'
  if (intensity < 0.6) return 'Strong breeze'
  if (intensity < 0.8) return 'Gale'
  return 'Storm'
}

// =============================================================================
// SPEED GAUGE
// =============================================================================

function SpeedGauge({ speed }: { speed: number }) {
  const maxSpeed = 15
  const percentage = Math.min(100, (speed / maxSpeed) * 100)
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={6} />
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="#00d4aa"
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
          {speed.toFixed(1)}
        </span>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>kts</span>
      </div>
    </div>
  )
}

// =============================================================================
// WIND INDICATOR
// =============================================================================

function WindIndicator({ intensity, direction }: { intensity: number; direction: number }) {
  const beaufort = getBeaufortDescription(intensity)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${direction}rad)`,
          transition: 'transform 0.5s ease',
        }}
      >
        <span style={{ fontSize: '20px', color: '#ff9500' }}>➤</span>
      </div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{beaufort}</div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
          {(intensity * 25).toFixed(1)} m/s
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// STORM TIMER
// =============================================================================

function StormTimer({ timeRemaining, totalDuration }: { timeRemaining: number; totalDuration: number }) {
  const progress = Math.max(0, Math.min(1, timeRemaining / totalDuration))
  const isCritical = timeRemaining < 30

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Storm Peak
        </span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: isCritical ? '#ff4444' : '#fff' }}>
          {Math.ceil(timeRemaining)}s
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            borderRadius: 2,
            background: isCritical
              ? 'linear-gradient(90deg, #ff4444, #ff8800)'
              : 'linear-gradient(90deg, #00d4aa, #0088ff)',
            transition: 'width 0.5s ease, background 0.5s ease',
          }}
        />
      </div>
    </div>
  )
}

// =============================================================================
// OBJECTIVES PANEL
// =============================================================================

function ObjectivesPanel() {
  const objectives = useGameStore((s) => s.tugboatObjectives)
  const dockedCount = useGameStore((s) => s.tugboatDockedCount)

  if (objectives.length === 0) {
    return (
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
        Waiting for ships...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Dock {dockedCount}/{objectives.length} Ships
      </div>
      {objectives.map((obj) => (
        <div
          key={obj.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '8px',
            background: obj.completed ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255,255,255,0.05)',
            border: obj.completed ? '1px solid rgba(0, 212, 170, 0.3)' : '1px solid transparent',
            transition: 'all 0.3s ease',
            opacity: obj.completed ? 0.7 : 1,
          }}
        >
          <span style={{ fontSize: '14px' }}>
            {obj.completed ? '✅' : '⚓'}
          </span>
          <span style={{ fontSize: '12px', color: obj.completed ? '#00d4aa' : '#fff' }}>
            {obj.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// SHEAR INDICATOR
// Arrow + magnitude bar showing the current environmental shear vector.
// Color shifts yellow → orange → red as shear magnitude grows.
// =============================================================================

function ShearIndicator({
  windShear,
  currentDrift,
}: {
  windShear: number
  currentDrift: [number, number]
}) {
  const driftMag = Math.sqrt(currentDrift[0] ** 2 + currentDrift[1] ** 2)
  const combinedMag = Math.max(windShear, Math.min(1, driftMag * 0.2))

  if (combinedMag < 0.02) return null

  // Arrow direction from current drift vector
  const driftAngle = Math.atan2(currentDrift[0], currentDrift[1])

  const color = combinedMag < 0.3
    ? '#ffee44'
    : combinedMag < 0.65
      ? '#ff8800'
      : '#ff3300'

  const label = combinedMag < 0.3
    ? 'LIGHT SHEAR'
    : combinedMag < 0.65
      ? 'MOD SHEAR'
      : 'HEAVY SHEAR'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 10px',
        borderRadius: '8px',
        background: `rgba(${combinedMag > 0.65 ? '80,20,0' : '40,30,0'},0.7)`,
        border: `1px solid ${color}44`,
      }}
    >
      {/* Rotating arrow */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: `2px solid ${color}88`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${driftAngle}rad)`,
          transition: 'transform 0.4s ease',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '14px', color, lineHeight: 1 }}>↑</span>
      </div>

      <div style={{ minWidth: 80 }}>
        <div style={{ fontSize: '9px', color, fontWeight: 700, letterSpacing: '1px', marginBottom: 3 }}>
          {label}
        </div>
        {/* Magnitude bar */}
        <div
          style={{
            width: '100%',
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, combinedMag * 100)}%`,
              height: '100%',
              borderRadius: 2,
              background: color,
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        </div>
      </div>

      <div style={{ fontSize: '10px', color: `${color}cc`, fontFamily: TYPOGRAPHY.fontFamilyMono, flexShrink: 0 }}>
        {Math.round(combinedMag * 100)}%
      </div>
    </div>
  )
}

// =============================================================================
// TOW CABLE HUD
// Shows a tension gauge (0–100 %) when a tow line is active.
// The gauge DOM element is updated via requestAnimationFrame — no React state,
// no 60 fps re-renders.  Screen shake triggers once on cable snap.
// =============================================================================

function TowCableHUD() {
  const towLineAttached = useGameStore((s) => s.towLineAttached)
  const towLineSnapped  = useGameStore((s) => s.towLineSnapped)
  const { triggerCableSnapShake, shake } = useScreenShake()

  const gaugeRef    = useRef<HTMLDivElement>(null)
  const labelRef    = useRef<HTMLSpanElement>(null)
  const rafRef      = useRef<number | null>(null)
  const snappedPrev = useRef(false)

  // RAF loop — updates gauge + detects snap for screen shake
  useEffect(() => {
    if (!towLineAttached) return

    const update = () => {
      if (gaugeRef.current && labelRef.current) {
        const t   = Math.min(1, Math.max(0, towLineState.tension))
        const pct = (t * 100).toFixed(0)
        gaugeRef.current.style.width = `${t * 100}%`
        const color = t < 0.5 ? '#00d4aa' : t < 0.75 ? '#ff8800' : '#ff3300'
        gaugeRef.current.style.background = color
        gaugeRef.current.style.boxShadow  = t > 0.75
          ? `0 0 8px ${color}88`
          : 'none'
        labelRef.current.textContent = `${pct}%`
        labelRef.current.style.color = color
      }

      if (towLineState.snapFlag && !snappedPrev.current) {
        triggerCableSnapShake()
        snappedPrev.current = true
      }
      if (!towLineState.snapFlag) {
        snappedPrev.current = false
      }

      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [towLineAttached, triggerCableSnapShake])

  // Snap shake also fires when the store flag is set (covers cases where the
  // RAF loop may not have caught the one-frame towLineState.snapFlag window)
  useEffect(() => {
    if (towLineSnapped) triggerCableSnapShake()
  }, [towLineSnapped, triggerCableSnapShake])

  if (!towLineAttached) return null

  return (
    <div
      style={{
        transform: `translate(${shake.x * 10}px, ${shake.y * 10}px)`,
        transition: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {/* Header row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
          }}>
            ⛓ Tow Tension
          </span>
          <span
            ref={labelRef}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#00d4aa',
              fontFamily: TYPOGRAPHY.fontFamilyMono,
              letterSpacing: '0.5px',
            }}
          >
            0%
          </span>
        </div>

        {/* Gauge track */}
        <div
          style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            ref={gaugeRef}
            style={{
              width: '0%',
              height: '100%',
              borderRadius: 3,
              background: '#00d4aa',
              transition: 'none',
            }}
          />
        </div>

        {/* Red-zone label */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '4px',
          marginTop: '-2px',
        }}>
          <span style={{ fontSize: '8px', color: 'rgba(255,100,0,0.5)', letterSpacing: '0.5px' }}>
            ▲ SNAP ZONE
          </span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN TUGBOAT HUD
// =============================================================================

// =============================================================================
// CAVITATION WARNING BANNER (secondary HUD indicator)
// Appears top-centre when either prop is cavitating, giving the player a
// clear heads-up overlay even when the hardware console is off-screen.
// =============================================================================

function CavitationWarningBanner({
  portCav,
  starboardCav,
  intensity,
}: {
  portCav: boolean
  starboardCav: boolean
  intensity: number
}) {
  if (!portCav && !starboardCav) return null

  const both = portCav && starboardCav
  const severe = intensity > 0.78
  const label = both ? 'BOTH PROPS' : portCav ? 'PORT PROP' : 'STBD PROP'

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: severe ? 'rgba(60, 20, 0, 0.92)' : 'rgba(40, 25, 0, 0.88)',
        border: `1px solid ${severe ? '#ff9500' : '#cc6600'}`,
        borderRadius: '6px',
        padding: '6px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        animation: severe ? 'cav-hud-blink 180ms steps(2, end) infinite' : 'none',
        pointerEvents: 'none',
        zIndex: 106,
      }}
    >
      <span style={{ fontSize: '14px' }}>⚠</span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono,
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '2.5px',
          color: '#ffcc33',
          textShadow: '0 0 6px #ff950066',
          textTransform: 'uppercase',
        }}
      >
        CAVITATION — {label}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.fontFamilyMono,
          fontSize: '10px',
          color: '#ff9500aa',
          letterSpacing: '1px',
        }}
      >
        {Math.round(intensity * 100)}%
      </span>
      <style>{`@keyframes cav-hud-blink { 50% { border-color: #ffcc33; background: rgba(80,30,0,0.95); } }`}</style>
    </div>
  )
}

export default function TugboatHUD() {
  const operationMode = useGameStore((s) => s.operationMode)
  const tugboatState = useGameStore((s) => s.tugboatState)
  const setOperationMode = useGameStore((s) => s.setOperationMode)
  const stormState = useStormSystem()

  if (operationMode !== 'tugboat') return null

  const speed = Math.sqrt(
    tugboatState.velocity[0] ** 2 +
    tugboatState.velocity[2] ** 2
  ) * 1.944 // m/s to knots

  const portCav = tugboatState.portCavitating ?? false
  const starboardCav = tugboatState.starboardCavitating ?? false
  const cavIntensity = tugboatState.cavitationIntensity ?? 0
  const windShear = tugboatState.windShear ?? 0
  const currentDrift = tugboatState.currentDrift ?? [0, 0]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 105,
        fontFamily: TYPOGRAPHY.fontFamily,
      }}
    >
      {/* Top-centre cavitation warning banner */}
      <CavitationWarningBanner
        portCav={portCav}
        starboardCav={starboardCav}
        intensity={cavIntensity}
      />

      {/* Bottom-left panel */}
      <div
        style={{
          ...createGlassPanelStyles({ padding: '16px', maxWidth: '280px' }),
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <SpeedGauge speed={speed} />
          <WindIndicator
            intensity={stormState.intensity}
            direction={stormState.windDirection}
          />
        </div>

        {/* Environmental shear indicator — only visible when shear is active */}
        <ShearIndicator windShear={windShear} currentDrift={currentDrift} />

        <StormTimer
          timeRemaining={stormState.duration - stormState.elapsed}
          totalDuration={stormState.duration}
        />

        <ObjectivesPanel />

        {/* Tow cable tension gauge — visible only when tow line is attached */}
        <TowCableHUD />

        <AcousticArray />
      </div>

      {/* Return button */}
      <button
        onClick={() => setOperationMode('crane')}
        style={{
          ...createButtonStyles({ variant: 'secondary', size: 'sm', fullWidth: false }),
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          pointerEvents: 'auto',
          gap: '6px',
        }}
      >
        <span>↩</span>
        <span>Return to Crane</span>
      </button>

      <SalvageDispatchModal />
    </div>
  )
}
