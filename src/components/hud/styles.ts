// =============================================================================
// HUD STYLES - Shared styles for HUD components
// =============================================================================

import { GLASSMORPHISM } from '../DesignSystem'

export const hudContainerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 100,
  fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
}

// Top Bar styles
export const topBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: '16px',
  left: '16px',
  right: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  pointerEvents: 'auto',
}

export const shipSelectorContainerStyle: React.CSSProperties = {
  position: 'relative',
}

export const currentShipBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 16px',
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  borderRadius: GLASSMORPHISM.borderRadiusSmall,
  border: '2px solid transparent',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  pointerEvents: 'auto',
}

export const shipTypeIconStyle: React.CSSProperties = {
  fontSize: '24px',
}

export const shipInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}

export const shipNameStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#fff',
}

export const shipIdStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(255,255,255,0.5)',
  fontFamily: '"JetBrains Mono", monospace',
}

export const dropdownArrowStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'rgba(255,255,255,0.5)',
  marginLeft: '8px',
}

export const noShipStyle: React.CSSProperties = {
  padding: '10px 16px',
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  borderRadius: GLASSMORPHISM.borderRadiusSmall,
  fontSize: '14px',
  color: 'rgba(255,255,255,0.5)',
}

export const shipListStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: '8px',
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  borderRadius: GLASSMORPHISM.borderRadiusSmall,
  border: GLASSMORPHISM.border,
  overflow: 'hidden',
  zIndex: 100,
}

export const shipListItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#fff',
  transition: 'all 0.2s ease',
}

export const activeIndicatorStyle: React.CSSProperties = {
  color: '#00d4aa',
  fontSize: '10px',
}

// Time Display styles
export const timeDisplayContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '16px',
  right: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 16px',
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  borderRadius: GLASSMORPHISM.borderRadiusSmall,
  border: GLASSMORPHISM.border,
  pointerEvents: 'auto',
}

export const timeIconStyle: React.CSSProperties = {
  fontSize: '18px',
}

export const timeTextStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#fff',
  fontFamily: '"JetBrains Mono", monospace',
  minWidth: '70px',
}

export const phaseBadgeStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1px',
}

// Ship Status Panel styles
export const shipStatusPanelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '80px',
  left: '16px',
  width: '280px',
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  borderRadius: GLASSMORPHISM.borderRadius,
  border: GLASSMORPHISM.border,
  padding: '16px',
  pointerEvents: 'auto',
}

export const shipStatusHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
}

export const shipStatusIconStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
}

export const shipStatusTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(255,255,255,0.5)',
  textTransform: 'uppercase',
  letterSpacing: '1px',
}

export const shipStatusNameStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#fff',
}

export const upgradeProgressContainerStyle: React.CSSProperties = {
  marginBottom: '16px',
}

export const upgradeProgressHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '8px',
}

export const upgradeProgressLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(255,255,255,0.6)',
}

export const upgradeProgressValueStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#00d4aa',
}

export const upgradeCategoriesContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

export const upgradeCategoryStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

export const categoryIconStyle: React.CSSProperties = {
  fontSize: '14px',
  width: '20px',
}

export const categoryBarContainerStyle: React.CSSProperties = {
  flex: 1,
  height: '4px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '2px',
  overflow: 'hidden',
}

export const categoryBarStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.3s ease',
}

export const categoryLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'rgba(255,255,255,0.5)',
  width: '60px',
}

export const categoryCountStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'rgba(255,255,255,0.6)',
  fontFamily: '"JetBrains Mono", monospace',
}

// Camera Multiview Controls styles
export const cameraControlsContainerStyle: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  alignItems: 'center',
  transition: 'transform 0.3s ease',
  pointerEvents: 'auto',
}

export const cameraToggleButtonStyle: React.CSSProperties = {
  width: '40px',
  height: '80px',
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  border: GLASSMORPHISM.border,
  borderRight: 'none',
  borderRadius: '8px 0 0 8px',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
}

export const cameraPanelStyle: React.CSSProperties = {
  width: '200px',
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  border: GLASSMORPHISM.border,
  borderRadius: '0 0 0 8px',
  padding: '16px',
}

export const cameraPanelHeaderStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.6)',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '12px',
}

export const cameraButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '16px',
}

export const cameraButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  transition: 'all 0.2s ease',
}

export const cameraButtonIconStyle: React.CSSProperties = {
  fontSize: '16px',
}

export const cameraButtonLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

export const cameraFeedsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

export const cameraFeedPreviewStyle: React.CSSProperties = {
  padding: '8px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  transition: 'all 0.2s ease',
}

export const cameraFeedHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '6px',
  padding: '4px 6px',
  borderRadius: '4px',
}

export const cameraFeedLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'rgba(255,255,255,0.7)',
  flex: 1,
}

export const cameraFeedStatusStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
}

export const cameraFeedPlaceholderStyle: React.CSSProperties = {
  height: '40px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  opacity: 0.5,
}

// Crane Control Indicators styles
export const craneIndicatorsContainerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '120px',
  right: '16px',
  pointerEvents: 'auto',
}

export const craneIndicatorsPanelStyle: React.CSSProperties = {
  width: '220px',
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  borderRadius: GLASSMORPHISM.borderRadius,
  border: GLASSMORPHISM.border,
  padding: '16px',
}

export const cranePanelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.7)',
  textTransform: 'uppercase',
  letterSpacing: '1px',
}

export const craneMovingIndicatorStyle: React.CSSProperties = {
  marginLeft: 'auto',
  padding: '2px 6px',
  background: '#00d4aa',
  borderRadius: '4px',
  fontSize: '9px',
  fontWeight: 700,
  color: '#000',
  animation: 'pulse 1s infinite',
}

export const joysticksRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  marginBottom: '16px',
}

export const joystickContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
}

export const joystickBaseStyle: React.CSSProperties = {
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  background: 'rgba(0,0,0,0.3)',
  border: '2px solid rgba(255,255,255,0.2)',
  position: 'relative',
}

export const joystickCrossHStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '10%',
  right: '10%',
  height: '1px',
  background: 'rgba(255,255,255,0.2)',
  transform: 'translateY(-50%)',
}

export const joystickCrossVStyle: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '10%',
  bottom: '10%',
  width: '1px',
  background: 'rgba(255,255,255,0.2)',
  transform: 'translateX(-50%)',
}

export const joystickStickStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)',
  transition: 'transform 0.1s ease-out',
}

export const joystickDeadzoneStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  border: '1px dashed rgba(255,255,255,0.2)',
  transform: 'translate(-50%, -50%)',
}

export const joystickLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'rgba(255,255,255,0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

export const telemetryContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '12px',
}

export const telemetryBarContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

export const telemetryBarHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

export const telemetryBarLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  color: 'rgba(255,255,255,0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

export const telemetryBarValueStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  fontFamily: '"JetBrains Mono", monospace',
}

export const telemetryBarTrackStyle: React.CSSProperties = {
  height: '4px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '2px',
  overflow: 'hidden',
}

export const telemetryBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.2s ease, box-shadow 0.2s ease',
}

export const twistlockIndicatorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid',
  transition: 'all 0.2s ease',
}

export const twistlockIconStyle: React.CSSProperties = {
  fontSize: '16px',
}

export const twistlockTextStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1px',
}

// Hotkey Hints styles
export const hotkeyHintsContainerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '16px',
  left: '16px',
  display: 'flex',
  gap: '16px',
}

export const hotkeyHintStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

export const hotkeyKbdStyle: React.CSSProperties = {
  padding: '4px 8px',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 700,
  fontFamily: '"JetBrains Mono", monospace',
  color: '#fff',
}

export const hotkeyTextStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(255,255,255,0.5)',
}
