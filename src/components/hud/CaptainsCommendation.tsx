// =============================================================================
// CAPTAIN'S COMMENDATION — Tug cinematic overlay
// Glassmorphism reward screen shown on objective complete, win, or salvage.
// Listens for tugCinematicStart / tugCinematicEnd window events.
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { TYPOGRAPHY, GLASSMORPHISM } from '../DesignSystem'
import type { TugCinematicDetail } from '../../systems/tugCinematicSystem'
import { TUG_CINEMATIC_START_EVENT, TUG_CINEMATIC_END_EVENT } from '../../systems/tugCinematicSystem'

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  objective: "BERTH SECURED",
  win:       "MISSION COMPLETE",
  salvage:   "SALVAGE COMPLETE",
}

const TYPE_ICONS: Record<string, string> = {
  objective: "⚓",
  win:       "🏆",
  salvage:   "🛟",
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 210,
  pointerEvents: 'none',
  fontFamily: TYPOGRAPHY.fontFamily,
}

const panelStyle: React.CSSProperties = {
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  WebkitBackdropFilter: GLASSMORPHISM.backdropFilter,
  border: '1px solid rgba(0, 212, 170, 0.35)',
  borderRadius: '16px',
  padding: '32px 40px',
  maxWidth: '420px',
  width: '90%',
  textAlign: 'center',
  boxShadow: '0 0 40px rgba(0, 212, 170, 0.2), 0 0 80px rgba(192, 0, 255, 0.1)',
  animation: 'commendationPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
}

const iconStyle: React.CSSProperties = {
  fontSize: '56px',
  marginBottom: '12px',
  display: 'block',
  animation: 'commendationFloat 2.4s ease-in-out infinite',
}

const titleStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '3px',
  color: '#00d4aa',
  textTransform: 'uppercase' as const,
  marginBottom: '6px',
  textShadow: '0 0 14px #00d4aa88',
}

const labelStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 800,
  color: '#ffffff',
  marginBottom: '4px',
  textShadow: '0 0 20px rgba(192, 0, 255, 0.6)',
}

const subLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'rgba(255,255,255,0.6)',
  marginBottom: '20px',
}

const statRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-around',
  gap: '12px',
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid rgba(255,255,255,0.08)',
}

const statItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: '4px',
}

const statValueStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: '#00d4aa',
}

const statLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  color: 'rgba(255,255,255,0.45)',
  textTransform: 'uppercase' as const,
}

const droneTagStyle: React.CSSProperties = {
  marginTop: '14px',
  fontSize: '10px',
  letterSpacing: '2px',
  color: 'rgba(192, 0, 255, 0.7)',
  fontFamily: TYPOGRAPHY.fontFamilyMono ?? TYPOGRAPHY.fontFamily,
  textTransform: 'uppercase' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CaptainsCommendation() {
  const [detail, setDetail] = useState<TugCinematicDetail | null>(null)
  const [visible, setVisible] = useState(false)

  const handleStart = useCallback((e: Event) => {
    const ev = e as CustomEvent<TugCinematicDetail>
    setDetail(ev.detail)
    setVisible(true)
  }, [])

  const handleEnd = useCallback(() => {
    setVisible(false)
  }, [])

  useEffect(() => {
    globalThis.addEventListener(TUG_CINEMATIC_START_EVENT, handleStart as EventListener)
    globalThis.addEventListener(TUG_CINEMATIC_END_EVENT, handleEnd as EventListener)
    return () => {
      globalThis.removeEventListener(TUG_CINEMATIC_START_EVENT, handleStart as EventListener)
      globalThis.removeEventListener(TUG_CINEMATIC_END_EVENT, handleEnd as EventListener)
    }
  }, [handleStart, handleEnd])

  if (!visible || !detail) return null

  const typeLabel = TYPE_LABELS[detail.type] ?? "COMMENDATION"
  const icon = TYPE_ICONS[detail.type] ?? "⚓"
  const stats = detail.careerStats

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <span style={iconStyle}>{icon}</span>

        <div style={titleStyle}>Captain's Commendation</div>
        <div style={labelStyle}>{detail.label}</div>
        <div style={subLabelStyle}>{typeLabel}</div>

        {stats && (
          <div style={statRowStyle}>
            {stats.totalTonsAssisted !== undefined && (
              <div style={statItemStyle}>
                <span style={statValueStyle}>{stats.totalTonsAssisted.toLocaleString()}</span>
                <span style={statLabelStyle}>Tons Assisted</span>
              </div>
            )}
            {stats.cleanTows !== undefined && (
              <div style={statItemStyle}>
                <span style={statValueStyle}>{stats.cleanTows}</span>
                <span style={statLabelStyle}>Clean Tows</span>
              </div>
            )}
            {stats.nightRescues !== undefined && (
              <div style={statItemStyle}>
                <span style={statValueStyle}>{stats.nightRescues}</span>
                <span style={statLabelStyle}>Night Rescues</span>
              </div>
            )}
          </div>
        )}

        <div style={droneTagStyle}>
          <span>◉</span>
          <span>Tug Spectator Drone Active</span>
        </div>
      </div>

      <style>{`
        @keyframes commendationPop {
          0%   { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes commendationFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}
