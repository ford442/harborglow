// =============================================================================
// TUGBOAT HUD - Speed, wind, objectives, and storm timer
// =============================================================================

import { useGameStore } from '../../store/useGameStore'
import { useStormSystem } from '../../systems/StormSystem'
import { createGlassPanelStyles, createButtonStyles, GLASSMORPHISM, TYPOGRAPHY } from '../DesignSystem'

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
// MAIN TUGBOAT HUD
// =============================================================================

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

        <StormTimer
          timeRemaining={stormState.duration - stormState.elapsed}
          totalDuration={stormState.duration}
        />

        <ObjectivesPanel />
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
    </div>
  )
}
