import { useState } from 'react'
import { ShipSpawner as ShipSpawnerSystem } from '../systems/shipSpawner'
import { ShipType, useGameStore } from '../store/useGameStore'
import { GLASSMORPHISM, SHIP_COLORS } from './DesignSystem'
import { RippleButton, SpawnSplash } from './InteractiveFeedback'

// =============================================================================
// PHASE 6: ENHANCED SHIP SPAWNER
// Glassmorphism panels, ripple effects, spawn animations
// =============================================================================

interface ShipTypeConfig {
  type: ShipType
  label: string
  shortLabel: string
  description: string
  musicStyle: string
  icon: string
}

const SHIP_TYPES: ShipTypeConfig[] = [
  {
    type: 'cruise',
    label: 'Mega Cruise Liner',
    shortLabel: 'Cruise',
    description: 'Orchestral music with choir synth',
    musicStyle: '"Ocean Symphony"',
    icon: '🚢'
  },
  {
    type: 'container',
    label: 'Ultra Container Vessel',
    shortLabel: 'Container',
    description: 'Future bass and techno beats',
    musicStyle: '"Neon Stack"',
    icon: '⬛'
  },
  {
    type: 'tanker',
    label: 'VLCC Oil Tanker',
    shortLabel: 'Tanker',
    description: 'Industrial dubstep and metal',
    musicStyle: '"Flame Runner"',
    icon: '⛽'
  },
  {
    type: 'bulk',
    label: 'Capesize Bulk Carrier',
    shortLabel: 'Bulk',
    description: 'Industrial metal and hard rock',
    musicStyle: '"Iron Mountain"',
    icon: '⛰️'
  },
  {
    type: 'lng',
    label: 'Q-Max LNG Carrier',
    shortLabel: 'LNG',
    description: 'Cryogenic ambient techno',
    musicStyle: '"Cryo Titan"',
    icon: '❄️'
  },
  {
    type: 'roro',
    label: 'Roll-on/Roll-off Ferry',
    shortLabel: 'Ro-Ro',
    description: 'Synthwave driving rock',
    musicStyle: '"Vehicle Voyager"',
    icon: '🚗'
  },
  {
    type: 'research',
    label: 'Research Vessel',
    shortLabel: 'Research',
    description: 'Scientific ambient soundscape',
    musicStyle: '"Deep Discoverer"',
    icon: '🔬'
  },
  {
    type: 'droneship',
    label: 'Space Recovery Drone Ship',
    shortLabel: 'Drone',
    description: 'Space ambient electronic',
    musicStyle: '"OCISLY"',
    icon: '🚀'
  }
]

export default function ShipSpawner() {
  const [spawning, setSpawning] = useState<ShipType | null>(null)
  const [showSplash, setShowSplash] = useState<ShipType | null>(null)
  const ships = useGameStore((state) => state.ships)

  const handleSpawn = (type: ShipType) => {
    setSpawning(type)
    setShowSplash(type)
    
    setTimeout(() => {
      ShipSpawnerSystem.spawnShip(type)
      setSpawning(null)
    }, 600)
    
    setTimeout(() => {
      setShowSplash(null)
    }, 1500)
  }

  // Count ships of each type
  const shipCounts = {
    cruise: ships.filter(s => s.type === 'cruise').length,
    container: ships.filter(s => s.type === 'container').length,
    tanker: ships.filter(s => s.type === 'tanker').length,
    bulk: ships.filter(s => s.type === 'bulk').length,
    lng: ships.filter(s => s.type === 'lng').length,
    roro: ships.filter(s => s.type === 'roro').length,
    research: ships.filter(s => s.type === 'research').length,
    droneship: ships.filter(s => s.type === 'droneship').length
  }

  return (
    <>
      <div style={containerStyle}>
        {/* Header with glass effect */}
        <div style={headerStyle}>
          <span style={{ fontSize: '20px', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}>🌊</span>
          <div style={{ textAlign: 'center' }}>
            <span style={{ 
              fontWeight: 800, 
              letterSpacing: '2px',
              fontSize: '15px',
              background: 'linear-gradient(135deg, #fff, #a0a0a0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              HARBOR GLOW
            </span>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', letterSpacing: '1px' }}>
              LIGHT UP THE NIGHT
            </div>
          </div>
          <span style={{ fontSize: '20px', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}>✨</span>
        </div>
        
        {/* Ship spawn buttons */}
        <div style={buttonsContainerStyle}>
          {SHIP_TYPES.map((shipType) => {
            const colors = SHIP_COLORS[shipType.type]
            const isSpawning = spawning === shipType.type
            
            return (
              <RippleButton
                key={shipType.type}
                onClick={() => handleSpawn(shipType.type)}
                disabled={spawning !== null}
                color={colors.primary}
                glowColor={colors.glow}
                size="md"
                fullWidth
                variant="secondary"
                loading={isSpawning}
                style={{
                  borderColor: `${colors.primary}50`,
                  background: `linear-gradient(135deg, rgba(0,0,0,0.6), ${colors.glow}20)`
                }}
              >
                <div style={buttonContentStyle}>
                  <span style={{ fontSize: '24px', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))' }}>
                    {shipType.icon}
                  </span>
                  
                  <div style={buttonTextStyle}>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '13px',
                      color: colors.primary,
                      letterSpacing: '0.5px'
                    }}>
                      {shipType.shortLabel}
                    </span>
                    <span style={{ 
                      fontSize: '10px', 
                      color: 'rgba(255,255,255,0.5)',
                      marginTop: '2px',
                      fontWeight: 400
                    }}>
                      {shipType.musicStyle}
                    </span>
                  </div>
                  
                  {shipCounts[shipType.type] > 0 && (
                    <span style={{
                      ...countBadgeStyle,
                      background: colors.gradient,
                      color: '#000',
                      boxShadow: `0 2px 8px ${colors.glow}`
                    }}>
                      {shipCounts[shipType.type]}
                    </span>
                  )}
                </div>
              </RippleButton>
            )
          })}
        </div>

        {/* Ship count summary */}
        <div style={summaryStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: ships.length > 0 ? '#00d4aa' : '#666',
              boxShadow: ships.length > 0 ? '0 0 8px #00d4aa' : 'none',
              transition: 'all 0.3s ease'
            }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 500 }}>
              {ships.length === 0 
                ? 'No vessels in harbor' 
                : `${ships.length} vessel${ships.length > 1 ? 's' : ''} docked`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Spawn splash effect */}
      {showSplash && <SpawnSplash shipType={showSplash} />}
    </>
  )
}

// =============================================================================
// STYLES
// =============================================================================

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '20px',
  left: '20px',
  pointerEvents: 'auto',
  background: GLASSMORPHISM.background,
  backdropFilter: GLASSMORPHISM.backdropFilter,
  WebkitBackdropFilter: GLASSMORPHISM.backdropFilter,
  padding: '20px',
  borderRadius: GLASSMORPHISM.borderRadius,
  border: GLASSMORPHISM.border,
  boxShadow: GLASSMORPHISM.boxShadow,
  minWidth: '260px',
  animation: 'slideUp 0.4s ease-out'
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '16px',
  paddingBottom: '16px',
  borderBottom: '1px solid rgba(255,255,255,0.1)'
}

const buttonsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
}

const buttonContentStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%'
}

const buttonTextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  flex: 1
}

const countBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '22px',
  height: '22px',
  borderRadius: '11px',
  fontSize: '11px',
  fontWeight: 800,
  transition: 'all 0.3s ease'
}

const summaryStyle: React.CSSProperties = {
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}
