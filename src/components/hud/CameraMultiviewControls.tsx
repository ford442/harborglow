// =============================================================================
// CAMERA MULTIVIEW CONTROLS - Camera view toggles
// =============================================================================

import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import {
  cameraControlsContainerStyle,
  cameraToggleButtonStyle,
  cameraPanelStyle,
  cameraPanelHeaderStyle,
  cameraButtonsStyle,
  cameraButtonStyle,
  cameraButtonIconStyle,
  cameraButtonLabelStyle,
  cameraFeedsStyle,
  cameraFeedPreviewStyle,
  cameraFeedHeaderStyle,
  cameraFeedLabelStyle,
  cameraFeedStatusStyle,
  cameraFeedPlaceholderStyle,
} from './styles'

export default function CameraMultiviewControls() {
  const multiviewMode = useGameStore(state => state.multiviewMode)
  const setMultiviewMode = useGameStore(state => state.setMultiviewMode)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const cameras = [
    { id: 'single', label: 'Main', icon: '📺' },
    { id: 'quad', label: 'Quad', icon: '🎬' },
  ] as const
  
  return (
    <div style={{
      ...cameraControlsContainerStyle,
      transform: isExpanded ? 'translateX(0)' : 'translateX(calc(100% - 50px))',
    }}>
      <button 
        style={cameraToggleButtonStyle}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>◀</span>
      </button>
      
      <div style={cameraPanelStyle}>
        <div style={cameraPanelHeaderStyle}>Camera Views</div>
        
        <div style={cameraButtonsStyle}>
          {cameras.map(cam => (
            <button
              key={cam.id}
              style={{
                ...cameraButtonStyle,
                background: multiviewMode === cam.id ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.05)',
                borderColor: multiviewMode === cam.id ? '#00d4aa' : 'rgba(255,255,255,0.1)',
              }}
              onClick={() => setMultiviewMode(cam.id as 'single' | 'quad')}
            >
              <span style={cameraButtonIconStyle}>{cam.icon}</span>
              <span style={cameraButtonLabelStyle}>{cam.label}</span>
            </button>
          ))}
        </div>
        
        <div style={cameraFeedsStyle}>
          <CameraFeedPreview label="Crane Cab" icon="🎮" color="#00d4aa" active />
          <CameraFeedPreview label="Hook Cam" icon="🏗️" color="#ff9500" />
          <CameraFeedPreview label="Drone" icon="🚁" color="#00bfff" />
          <CameraFeedPreview label="Underwater" icon="🌊" color="#00aaff" />
        </div>
      </div>
    </div>
  )
}

function CameraFeedPreview({ 
  label, 
  icon, 
  color, 
  active 
}: { 
  label: string; 
  icon: string; 
  color: string;
  active?: boolean;
}) {
  return (
    <div style={{
      ...cameraFeedPreviewStyle,
      borderColor: active ? color : 'rgba(255,255,255,0.1)',
      boxShadow: active ? `0 0 10px ${color}40` : 'none',
    }}>
      <div style={{
        ...cameraFeedHeaderStyle,
        background: active ? `${color}20` : 'transparent',
      }}>
        <span style={{ fontSize: '12px' }}>{icon}</span>
        <span style={cameraFeedLabelStyle}>{label}</span>
        <span style={{
          ...cameraFeedStatusStyle,
          background: active ? '#00ff00' : '#333',
          boxShadow: active ? '0 0 6px #00ff00' : 'none',
        }} />
      </div>
      <div style={{
        ...cameraFeedPlaceholderStyle,
        background: `linear-gradient(135deg, ${color}10, transparent)`,
      }}>
        {icon}
      </div>
    </div>
  )
}
