// =============================================================================
// TOP BAR - Ship info and quick actions
// =============================================================================

import { useState } from 'react'
import { useGameStore, Ship, ShipType } from '../../store/useGameStore'
import { SHIP_COLORS } from '../DesignSystem'
import {
  topBarStyle,
  shipSelectorContainerStyle,
  currentShipBadgeStyle,
  shipTypeIconStyle,
  shipInfoStyle,
  shipNameStyle,
  shipIdStyle,
  dropdownArrowStyle,
  noShipStyle,
  shipListStyle,
  shipListItemStyle,
  activeIndicatorStyle,
  cameraPillBaseStyle,
} from './styles'

interface TopBarProps {
  currentShip?: Ship
  ships: Ship[]
}

export default function TopBar({ currentShip, ships }: TopBarProps) {
  const currentShipId = useGameStore(state => state.currentShipId)
  const setCurrentShip = useGameStore(state => state.setCurrentShip)
  const cameraMode = useGameStore(state => state.cameraMode)
  const musicPlaying = useGameStore(state => state.musicPlaying)
  const [showShipList, setShowShipList] = useState(false)
  
  const isMusicActive = currentShip ? musicPlaying.get(currentShip.id) : false
  
  const formatCameraMode = (mode: string): string => {
    return mode
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  
  const shipColors: Record<ShipType, string> = {
    cruise: '#ff6b9d',
    container: '#00d4aa',
    tanker: '#ff9500',
    bulk: '#8b4513',
    lng: '#00bfff',
    roro: '#9b59b6',
    research: '#2ecc71',
    droneship: '#34495e',
    ferry: '#00cc88',
    trawler: '#cc8833',
    horizon: '#3388cc',
  }
  
  return (
    <div style={topBarStyle}>
      <div style={shipSelectorContainerStyle}>
        {currentShip ? (
          <div 
            style={{
              ...currentShipBadgeStyle,
              borderColor: shipColors[currentShip.type],
              boxShadow: `0 0 20px ${shipColors[currentShip.type]}30`,
            }}
            onClick={() => setShowShipList(!showShipList)}
          >
            <span style={shipTypeIconStyle}>
              {currentShip.type === 'cruise' ? '🚢' : 
               currentShip.type === 'container' ? '📦' : 
               currentShip.type === 'tanker' ? '🛢️' : '⚓'}
            </span>
            <div style={shipInfoStyle}>
              <span style={shipNameStyle}>
                {currentShip.type.charAt(0).toUpperCase() + currentShip.type.slice(1)}
              </span>
              <span style={shipIdStyle}>
                {currentShip.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <span style={dropdownArrowStyle}>▼</span>
          </div>
        ) : (
          <div style={noShipStyle}>No ship selected</div>
        )}
        
        {showShipList && ships.length > 0 && (
          <div style={shipListStyle}>
            {ships.map(ship => (
              <div
                key={ship.id}
                style={{
                  ...shipListItemStyle,
                  background: ship.id === currentShipId ? 'rgba(0,212,170,0.2)' : undefined,
                }}
                onClick={() => {
                  setCurrentShip(ship.id)
                  setShowShipList(false)
                }}
              >
                <span>{ship.type}</span>
                {ship.id === currentShipId && (
                  <span style={activeIndicatorStyle}>●</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Camera Mode Indicator */}
      <div
        style={{
          ...cameraPillBaseStyle,
          border: `1px solid ${isMusicActive ? '#00d4aa40' : 'rgba(255,255,255,0.1)'}`,
          color: isMusicActive ? '#00d4aa' : '#888',
          animation: isMusicActive ? 'camera-pill-pulse 2s ease-in-out infinite' : 'none',
          boxShadow: isMusicActive ? '0 0 12px #00d4aa40' : 'none',
        }}
      >
        <span style={{ fontSize: '12px' }}>📷</span>
        <span>{formatCameraMode(cameraMode)}</span>
      </div>
      
      <style>{`
        @keyframes camera-pill-pulse {
          0%, 100% { box-shadow: 0 0 12px #00d4aa40; }
          50% { box-shadow: 0 0 20px #00d4aa80; }
        }
      `}</style>
    </div>
  )
}
