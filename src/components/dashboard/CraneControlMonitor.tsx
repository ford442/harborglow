import { useMemo, type CSSProperties } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { useMusicPulse } from '../../hooks/useMusicPulse'

// =============================================================================
// CRANE CONTROL MONITOR — Read-only live panel for crane status displays.
// =============================================================================

type ControlRow = {
  label: string
  value: number
  display: string
  unit?: string
}

function formatSignedMeters(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}m`
}

export default function CraneControlMonitor() {
  const {
    trolleyPosition,
    cableDepth,
    spreaderPos,
    winchSpeed,
    twistlockEngaged,
    loadTension,
    bpm,
  } = useGameStore(state => ({
    trolleyPosition: state.trolleyPosition,
    cableDepth: state.cableDepth,
    spreaderPos: state.spreaderPos,
    winchSpeed: state.winchSpeed,
    twistlockEngaged: state.twistlockEngaged,
    loadTension: state.loadTension,
    bpm: state.bpm,
  }))

  const pulse = useMusicPulse(bpm)

  const glowAlpha = 0.32 + pulse * 0.46
  const glowColor = `rgba(0, 212, 170, ${glowAlpha})`

  const rows = useMemo<ControlRow[]>(
    () => [
      {
        label: 'BOOM EXT',
        value: trolleyPosition,
        display: `${(trolleyPosition * 100).toFixed(0)}%`,
      },
      {
        label: 'HOOK HT',
        value: Math.min(1, cableDepth / 50),
        display: `${cableDepth.toFixed(1)}m`,
      },
      {
        label: 'WINCH',
        value: Math.min(1, winchSpeed / 2),
        display: `${winchSpeed.toFixed(1)}x`,
      },
      {
        label: 'TENSION',
        value: Math.min(1, loadTension / 50),
        display: `${loadTension.toFixed(0)}t`,
      },
    ],
    [cableDepth, loadTension, trolleyPosition, winchSpeed],
  )

  const panelStyle: CSSProperties = {
    width: 512,
    height: 384,
    boxSizing: 'border-box',
    padding: 16,
    background: 'linear-gradient(180deg, #050a0f 0%, #06141c 100%)',
    color: '#dffef7',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    border: '1px solid rgba(0, 212, 170, 0.18)',
    boxShadow: `inset 0 0 18px rgba(0, 0, 0, 0.65), 0 0 ${18 + pulse * 20}px rgba(0, 212, 170, 0.12)`,
    textShadow: `0 0 8px ${glowColor}`,
    overflow: 'hidden',
  }

  return (
    <div style={panelStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 14,
          color: glowColor,
          fontSize: 11,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
        }}
      >
        <span>Crane Control - Live</span>
        <span>CAM 04</span>
      </div>

      <div style={{ marginBottom: 16, color: 'rgba(223, 254, 247, 0.52)', fontSize: 9, letterSpacing: '0.18em' }}>
        READ ONLY / NO TOUCH INPUT
      </div>

      <div style={{ display: 'grid', gap: 13 }}>
        {rows.map(row => (
          <div key={row.label}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
                fontSize: 10,
                color: 'rgba(0, 212, 170, 0.78)',
              }}
            >
              <span>{row.label}</span>
              <span>{row.display}</span>
            </div>
            <div
              style={{
                height: 7,
                background: 'rgba(0, 212, 170, 0.08)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(0, Math.min(1, row.value)) * 100}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: glowColor,
                  boxShadow: `0 0 ${8 + pulse * 10}px ${glowColor}`,
                  transition: 'width 0.08s linear',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          fontSize: 10,
          color: 'rgba(223, 254, 247, 0.68)',
        }}
      >
        <span>SWING {formatSignedMeters(spreaderPos.z)}</span>
        <span
          style={{
            color: twistlockEngaged ? '#00d4aa' : 'rgba(255, 255, 255, 0.38)',
            textShadow: twistlockEngaged ? '0 0 8px #00d4aa' : 'none',
          }}
        >
          TWISTLOCK {twistlockEngaged ? '● ENGAGED' : '○ OPEN'}
        </span>
      </div>
    </div>
  )
}
