// =============================================================================
// CRANE CONTROL INDICATORS - Joystick-style visual feedback
// =============================================================================

import { useGameStore } from '../../store/useGameStore'
import {
  craneIndicatorsContainerStyle,
  craneIndicatorsPanelStyle,
  cranePanelHeaderStyle,
  craneMovingIndicatorStyle,
  joysticksRowStyle,
  joystickContainerStyle,
  joystickBaseStyle,
  joystickCrossHStyle,
  joystickCrossVStyle,
  joystickStickStyle,
  joystickDeadzoneStyle,
  joystickLabelStyle,
  telemetryContainerStyle,
  telemetryBarContainerStyle,
  telemetryBarHeaderStyle,
  telemetryBarLabelStyle,
  telemetryBarValueStyle,
  telemetryBarTrackStyle,
  telemetryBarFillStyle,
  twistlockIndicatorStyle,
  twistlockIconStyle,
  twistlockTextStyle,
} from './styles'

export default function CraneControlIndicators() {
  const {
    joystickLeft,
    joystickRight,
    spreaderPos,
    cableDepth,
    loadTension,
    twistlockEngaged,
    isMoving,
  } = useGameStore(state => ({
    joystickLeft: state.joystickLeft,
    joystickRight: state.joystickRight,
    spreaderPos: state.spreaderPos,
    cableDepth: state.cableDepth,
    loadTension: state.loadTension,
    twistlockEngaged: state.twistlockEngaged,
    isMoving: state.isMoving,
  }))
  
  return (
    <div style={craneIndicatorsContainerStyle}>
      <div style={craneIndicatorsPanelStyle}>
        <div style={cranePanelHeaderStyle}>
          <span>🎮</span>
          <span>Crane Controls</span>
          {isMoving && <span style={craneMovingIndicatorStyle}>MOVING</span>}
        </div>
        
        <div style={joysticksRowStyle}>
          <JoystickVisual 
            label="X/Z Move" 
            x={joystickLeft.x} 
            y={joystickLeft.y}
            color="#00d4aa"
          />
          
          <JoystickVisual 
            label="Y/Rotate" 
            x={joystickRight.x} 
            y={joystickRight.y}
            color="#ff9500"
          />
        </div>
        
        <div style={telemetryContainerStyle}>
          <TelemetryBar label="HEIGHT" value={spreaderPos.y} max={50} unit="m" color="#00bfff" />
          <TelemetryBar label="CABLE" value={cableDepth} max={50} unit="m" color="#00d4aa" />
          <TelemetryBar 
            label="LOAD" 
            value={loadTension} 
            max={50} 
            unit="t" 
            color={loadTension > 30 ? '#ff4757' : '#00d4aa'}
            warning={loadTension > 30}
          />
        </div>
        
        <div style={{
          ...twistlockIndicatorStyle,
          background: twistlockEngaged ? 'rgba(0,255,0,0.2)' : 'rgba(255,0,0,0.1)',
          borderColor: twistlockEngaged ? '#00ff00' : '#ff4757',
        }}>
          <span style={{
            ...twistlockIconStyle,
            color: twistlockEngaged ? '#00ff00' : '#ff4757',
          }}>
            {twistlockEngaged ? '🔒' : '🔓'}
          </span>
          <span style={twistlockTextStyle}>
            {twistlockEngaged ? 'LOCKED' : 'UNLOCKED'}
          </span>
        </div>
      </div>
    </div>
  )
}

function JoystickVisual({ label, x, y, color }: { label: string; x: number; y: number; color: string }) {
  const stickX = x * 25
  const stickY = -y * 25
  
  return (
    <div style={joystickContainerStyle}>
      <div style={joystickBaseStyle}>
        <div style={joystickCrossHStyle} />
        <div style={joystickCrossVStyle} />
        
        <div style={{
          ...joystickStickStyle,
          transform: `translate(${stickX}px, ${stickY}px)`,
          background: color,
          boxShadow: `0 0 15px ${color}80`,
        }} />
        
        <div style={joystickDeadzoneStyle} />
      </div>
      <span style={joystickLabelStyle}>{label}</span>
    </div>
  )
}

function TelemetryBar({ 
  label, 
  value, 
  max, 
  unit, 
  color,
  warning
}: { 
  label: string; 
  value: number; 
  max: number; 
  unit: string;
  color: string;
  warning?: boolean;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  return (
    <div style={telemetryBarContainerStyle}>
      <div style={telemetryBarHeaderStyle}>
        <span style={telemetryBarLabelStyle}>{label}</span>
        <span style={{
          ...telemetryBarValueStyle,
          color: warning ? '#ff4757' : color,
        }}>
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div style={telemetryBarTrackStyle}>
        <div style={{
          ...telemetryBarFillStyle,
          width: `${percentage}%`,
          background: color,
          boxShadow: warning ? '0 0 10px #ff4757' : `0 0 10px ${color}60`,
        }} />
      </div>
    </div>
  )
}
