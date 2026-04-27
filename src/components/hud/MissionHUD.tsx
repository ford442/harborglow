// =============================================================================
// MISSION HUD — HarborGlow Storm Rescue
// Shows active mission objectives, timer, and damage bar.
// =============================================================================

import { useGameStore } from '../../store/useGameStore'
import { createGlassPanelStyles, GLASSMORPHISM, TYPOGRAPHY } from '../DesignSystem'

// =============================================================================
// PROGRESS BAR
// =============================================================================

function ProgressBar({
  label,
  value,
  max,
  color,
  warningThreshold,
}: {
  label: string
  value: number
  max: number
  color: string
  warningThreshold?: number
}) {
  const ratio = Math.max(0, Math.min(1, value / max))
  const isWarning = warningThreshold !== undefined && ratio > warningThreshold

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span
          style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: isWarning ? '#ff4444' : '#fff' }}>
          {Math.ceil(value)}/{max}
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
            width: `${ratio * 100}%`,
            height: '100%',
            borderRadius: 2,
            background: isWarning ? 'linear-gradient(90deg, #ff4444, #ff8800)' : color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MissionHUD() {
  const activeMission = useGameStore((s) => s.activeMission)
  const money = useGameStore((s) => s.money)

  if (!activeMission || activeMission.status !== 'active') return null

  const timeRatio = activeMission.timeRemaining / activeMission.timeLimit
  const damageRatio = activeMission.damage / activeMission.maxDamage

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 110,
        fontFamily: TYPOGRAPHY.fontFamily,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          ...createGlassPanelStyles({ padding: '14px 20px', maxWidth: '360px' }),
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: '1px solid rgba(255, 100, 50, 0.3)',
          boxShadow: `${GLASSMORPHISM.boxShadow}, 0 0 30px rgba(255, 80, 0, 0.15)`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🆘</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ff7755' }}>
              Storm Rescue
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
              Guide the {activeMission.targetShipType} to safety
            </div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              padding: '4px 10px',
              borderRadius: '8px',
              background: 'rgba(0, 212, 170, 0.15)',
              border: '1px solid rgba(0, 212, 170, 0.3)',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#00d4aa' }}>
              ${money.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Timer */}
        <ProgressBar
          label="Time Remaining"
          value={activeMission.timeRemaining}
          max={activeMission.timeLimit}
          color="linear-gradient(90deg, #00d4aa, #0088ff)"
          warningThreshold={0.25}
        />

        {/* Damage */}
        <ProgressBar
          label="Hull Integrity"
          value={activeMission.maxDamage - activeMission.damage}
          max={activeMission.maxDamage}
          color="linear-gradient(90deg, #ff4444, #ff8800)"
          warningThreshold={0.3}
        />

        {/* Reward */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 10px',
            borderRadius: '8px',
            background: 'rgba(255, 200, 50, 0.1)',
            border: '1px solid rgba(255, 200, 50, 0.2)',
          }}
        >
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Reward</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffd700' }}>
            ${activeMission.reward.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
