import { GLASSMORPHISM } from '../DesignSystem';
import React from 'react';
// =============================================================================
// STYLES
// =============================================================================

export const cabinContainerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
}

export const modeToggleStyle: React.CSSProperties = {
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

export const keyHintStyle: React.CSSProperties = {
  padding: '2px 6px',
  background: 'rgba(0,212,170,0.2)',
  border: '1px solid rgba(0,212,170,0.4)',
  borderRadius: '4px',
  fontSize: '10px',
  fontFamily: 'monospace',
  color: '#00d4aa',
}

export const trainingButtonStyle: React.CSSProperties = {
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
export const economyMetricsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '12px',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: '10px',
  border: '1px solid rgba(255,215,0,0.2)',
  marginBottom: '12px'
}

export const creditDisplayStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  justifyContent: 'center'
}

export const currencyIconStyle: React.CSSProperties = {
  fontSize: '20px'
}

export const creditAmountStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#ffd700',
  fontFamily: 'monospace',
  textShadow: '0 0 10px rgba(255,215,0,0.5)'
}

export const hcLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#ffd700',
  opacity: 0.8
}

export const reputationDisplayStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
}

export const repHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

export const repBarContainerStyle: React.CSSProperties = {
  height: '4px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '2px',
  overflow: 'hidden'
}

export const repBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.3s ease'
}

export const multiviewGridStyle: React.CSSProperties = {
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

export const panelStyle: React.CSSProperties = {
  position: 'relative',
  borderRadius: '12px',
  overflow: 'hidden',
  background: 'rgba(10, 15, 30, 0.85)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  display: 'flex',
  flexDirection: 'column',
}

export const bezelStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  padding: '3px',
  background: '#1a1a1a',
  borderRadius: '10px',
}

export const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
}

export const recIndicatorStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#ff4444',
  boxShadow: '0 0 6px #ff4444',
  animation: 'pulse 1.5s ease-in-out infinite',
}

export const feedContainerStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '0 0 8px 8px',
  background: '#000',
}

export const crosshairStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
}

export const crosshairHStyle: React.CSSProperties = {
  position: 'absolute',
  width: '30px',
  height: '1px',
  background: 'rgba(255, 149, 0, 0.6)',
  left: '-15px',
  top: '0',
}

export const crosshairVStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '30px',
  background: 'rgba(255, 149, 0, 0.6)',
  left: '0',
  top: '-15px',
}

export const targetCircleStyle: React.CSSProperties = {
  position: 'absolute',
  width: '40px',
  height: '40px',
  border: '1px dashed rgba(255, 215, 0, 0.4)',
  borderRadius: '50%',
  left: '-20px',
  top: '-20px',
}

export const depthIndicatorStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '10px',
  right: '10px',
  padding: '4px 8px',
  background: 'rgba(0,0,0,0.5)',
  borderRadius: '4px',
}

export const cornerAccentStyle: React.CSSProperties = {
  position: 'absolute',
  width: '24px',
  height: '2px',
}

export const cornerAccentVStyle: React.CSSProperties = {
  position: 'absolute',
  width: '2px',
  height: '24px',
}

export const statusPanelStyle: React.CSSProperties = {
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

export const statusHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '12px',
}

export const shipIconStyle = (color: string): React.CSSProperties => ({
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

export const progressContainerStyle: React.CSSProperties = {
  marginBottom: '12px',
}

export const progressLabelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '11px',
  color: '#888',
  marginBottom: '4px',
}

export const progressTrackStyle: React.CSSProperties = {
  height: '6px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '3px',
  overflow: 'hidden',
}

export const progressFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '3px',
  transition: 'width 0.3s ease',
}

export const craneStatusStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  paddingTop: '12px',
  borderTop: '1px solid rgba(255,255,255,0.1)',
}

export const statusItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  fontSize: '11px',
}

export const bezelOverlayStyle: React.CSSProperties = {
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

export const scanlineStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '2px',
  background: 'rgba(255,255,255,0.03)',
  animation: 'scanline 8s linear infinite',
}
