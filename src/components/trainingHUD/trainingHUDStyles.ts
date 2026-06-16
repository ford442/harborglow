import React from 'react';

// =============================================================================
// STYLES
// =============================================================================

export const hudContainerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 150,
  display: 'flex',
  flexDirection: 'column',
  padding: '20px',
  fontFamily: 'Inter, system-ui, sans-serif'
}

export const topBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 20px',
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  pointerEvents: 'auto'
}

export const moduleInfoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}

export const trainingBadgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: 'linear-gradient(135deg, #00d4aa30, #00a88430)',
  border: '1px solid rgba(0,212,170,0.4)',
  borderRadius: '6px',
  fontSize: '10px',
  fontWeight: 700,
  color: '#00d4aa',
  letterSpacing: '1px'
}

export const moduleTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#fff'
}

export const centerInfoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '24px'
}

export const timerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px'
}

export const counterStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  minWidth: '80px'
}

export const counterBarStyle: React.CSSProperties = {
  width: '100%',
  height: '4px',
  background: '#333',
  borderRadius: '2px',
  overflow: 'hidden'
}

export const counterFillStyle: React.CSSProperties = {
  height: '100%',
  background: 'linear-gradient(90deg, #00d4aa, #00a884)',
  borderRadius: '2px',
  transition: 'width 0.3s'
}

export const rightControlsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px'
}

export const pauseButtonStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px',
  fontSize: '16px',
  cursor: 'pointer',
  pointerEvents: 'auto',
  transition: 'all 0.2s',
  ':hover': {
    background: 'rgba(255,255,255,0.2)'
  }
} as React.CSSProperties

export const exitButtonStyle: React.CSSProperties = {
  ...pauseButtonStyle,
  color: '#ff4757',
  borderColor: 'rgba(255,71,87,0.3)',
  ':hover': {
    background: 'rgba(255,71,87,0.2)'
  }
} as React.CSSProperties

export const objectivePanelStyle: React.CSSProperties = {
  position: 'absolute',
  left: '20px',
  top: '80px',
  width: '260px',
  padding: '16px',
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  pointerEvents: 'auto'
}

export const panelTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: '12px',
  fontWeight: 600,
  color: '#fff',
  textTransform: 'uppercase',
  letterSpacing: '1px'
}

export const objectivesListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

export const objectiveRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '10px',
  borderRadius: '8px',
  transition: 'all 0.2s'
}

export const objectiveCheckStyle: React.CSSProperties = {
  width: '22px',
  height: '22px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 700,
  flexShrink: 0
}

export const objectiveTextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
}

export const metricsPanelStyle: React.CSSProperties = {
  position: 'absolute',
  right: '20px',
  top: '80px',
  width: '200px',
  padding: '16px',
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  pointerEvents: 'auto'
}

export const metricItemStyle: React.CSSProperties = {
  marginBottom: '12px'
}

export const metricHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '4px'
}

export const metricBarBgStyle: React.CSSProperties = {
  height: '4px',
  background: '#333',
  borderRadius: '2px',
  overflow: 'hidden'
}

export const metricBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.3s'
}

export const installProgressStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '12px',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  marginTop: '8px'
}

export const tutorialPanelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '500px',
  padding: '20px',
  background: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0,212,170,0.3)',
  borderRadius: '16px',
  pointerEvents: 'auto',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
}

export const tutorialHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '12px'
}

export const instructorIconStyle: React.CSSProperties = {
  fontSize: '32px'
}

export const instructorInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
}

export const instructorNameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#fff'
}

export const stepCounterStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#888'
}

export const tutorialContentStyle: React.CSSProperties = {
  marginBottom: '16px'
}

export const stepTitleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '16px',
  fontWeight: 600,
  color: '#00d4aa'
}

export const stepMessageStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#ccc',
  lineHeight: 1.5
}

export const actionHintStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '12px',
  padding: '10px',
  background: 'rgba(0,212,170,0.1)',
  border: '1px solid rgba(0,212,170,0.3)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#00d4aa'
}

export const actionIconStyle: React.CSSProperties = {
  fontSize: '16px',
  animation: 'pulse 1s infinite'
}

export const tutorialActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

export const skipTutorialStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px',
  color: '#888',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    color: '#fff',
    borderColor: 'rgba(255,255,255,0.4)'
  }
} as React.CSSProperties

export const nextStepStyle: React.CSSProperties = {
  padding: '10px 24px',
  background: 'linear-gradient(135deg, #00d4aa, #00a884)',
  border: 'none',
  borderRadius: '8px',
  color: '#000',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0,212,170,0.4)'
  }
} as React.CSSProperties

export const progressDotsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '6px',
  marginTop: '16px'
}

export const progressDotStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  transition: 'all 0.3s'
}

export const crosshairContainerStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none'
}

export const crosshairStyle: React.CSSProperties = {
  position: 'relative',
  width: '40px',
  height: '40px'
}

export const crosshairHStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: '1px',
  background: 'rgba(0,212,170,0.5)',
  transform: 'translateY(-50%)'
}

export const crosshairVStyle: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: 0,
  bottom: 0,
  width: '1px',
  background: 'rgba(0,212,170,0.5)',
  transform: 'translateX(-50%)'
}

export const crosshairCenterStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '4px',
  height: '4px',
  background: '#00d4aa',
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)'
}

export const alignmentGuidesStyle: React.CSSProperties = {
  position: 'absolute',
  width: '200px',
  height: '200px'
}

export const guideBaseStyle: React.CSSProperties = {
  position: 'absolute',
  width: '20px',
  height: '2px',
  background: 'rgba(255,255,255,0.2)'
}

export const guideTopStyle: React.CSSProperties = { ...guideBaseStyle, top: 0, left: '50%', transform: 'translateX(-50%)' }
export const guideBottomStyle: React.CSSProperties = { ...guideBaseStyle, bottom: 0, left: '50%', transform: 'translateX(-50%)' }
export const guideLeftStyle: React.CSSProperties = { ...guideBaseStyle, left: 0, top: '50%', transform: 'rotate(90deg) translateX(-50%)', transformOrigin: 'left center' }
export const guideRightStyle: React.CSSProperties = { ...guideBaseStyle, right: 0, top: '50%', transform: 'rotate(90deg) translateX(50%)', transformOrigin: 'right center' }

export const popupOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.5)',
  zIndex: 200,
  animation: 'fadeIn 0.3s'
}

export const popupStyle: React.CSSProperties = {
  padding: '32px 48px',
  background: 'rgba(0,0,0,0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0,212,170,0.4)',
  borderRadius: '16px',
  textAlign: 'center',
  animation: 'slideUp 0.3s'
}

export const popupIconStyle: React.CSSProperties = {
  fontSize: '48px',
  marginBottom: '12px'
}

export const popupTitleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '20px',
  fontWeight: 700,
  color: '#00d4aa'
}

export const popupTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#ccc'
}

export const pauseOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(5px)',
  zIndex: 300
}

export const pauseMenuStyle: React.CSSProperties = {
  padding: '40px 60px',
  background: 'rgba(10,15,26,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '20px',
  textAlign: 'center'
}

export const pauseTitleStyle: React.CSSProperties = {
  margin: '0 0 24px 0',
  fontSize: '28px',
  fontWeight: 700,
  color: '#fff'
}

export const pauseButtonsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}

export const resumeButtonStyle: React.CSSProperties = {
  padding: '14px 40px',
  background: 'linear-gradient(135deg, #00d4aa, #00a884)',
  border: 'none',
  borderRadius: '10px',
  color: '#000',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,212,170,0.4)'
  }
} as React.CSSProperties

export const restartButtonStyle: React.CSSProperties = {
  ...resumeButtonStyle,
  background: 'rgba(255,255,255,0.1)',
  color: '#fff'
} as React.CSSProperties

export const exitTrainingStyle: React.CSSProperties = {
  ...resumeButtonStyle,
  background: 'rgba(255,71,87,0.2)',
  border: '1px solid rgba(255,71,87,0.4)',
  color: '#ff4757'
} as React.CSSProperties

export const completionOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(10px)',
  zIndex: 300
}

export const completionScreenStyle: React.CSSProperties = {
  padding: '48px 64px',
  background: 'rgba(10,15,26,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '24px',
  textAlign: 'center',
  animation: 'scaleIn 0.3s'
}

export const rankDisplayStyle: React.CSSProperties = {
  fontSize: '120px',
  fontWeight: 800,
  lineHeight: 1,
  marginBottom: '16px'
}

export const completionTitleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '28px',
  fontWeight: 700,
  color: '#fff'
}

export const completionScoreStyle: React.CSSProperties = {
  margin: '0 0 24px 0',
  fontSize: '18px',
  color: '#00d4aa'
}

export const completionStatsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '16px',
  marginBottom: '32px'
}

export const statBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '16px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '12px'
}

export const completionActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  justifyContent: 'center'
}

export const completeButtonStyle: React.CSSProperties = {
  padding: '14px 32px',
  background: 'linear-gradient(135deg, #00d4aa, #00a884)',
  border: 'none',
  borderRadius: '10px',
  color: '#000',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s'
} as React.CSSProperties

export const retryButtonStyle: React.CSSProperties = {
  ...completeButtonStyle,
  background: 'rgba(255,255,255,0.1)',
  color: '#fff'
} as React.CSSProperties
