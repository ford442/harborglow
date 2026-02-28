import { useState } from 'react'
import { ShipSpawner as ShipSpawnerSystem } from '../systems/shipSpawner'
import { ShipType, useGameStore } from '../store/useGameStore'

// =============================================================================
// SHIP SPAWNER UI COMPONENT
// Buttons to spawn each of the three vessel types
// =============================================================================

interface ShipTypeConfig {
    type: ShipType
    label: string
    shortLabel: string
    description: string
    color: string
    icon: string
}

const SHIP_TYPES: ShipTypeConfig[] = [
    {
        type: 'cruise',
        label: 'Mega Cruise Liner',
        shortLabel: 'Cruise',
        description: '"Ocean Symphony" - Orchestral music + choir',
        color: '#ff6b9d',
        icon: '🚢'
    },
    {
        type: 'container',
        label: 'Ultra Container Vessel',
        shortLabel: 'Container',
        description: '"Neon Stack" - Future bass / Techno beats',
        color: '#00d4aa',
        icon: '⬛'
    },
    {
        type: 'tanker',
        label: 'VLCC Oil Tanker',
        shortLabel: 'Tanker',
        description: '"Flame Runner" - Industrial dubstep',
        color: '#ff9500',
        icon: '⛽'
    }
]

export default function ShipSpawnerComponent() {
    const [spawning, setSpawning] = useState<ShipType | null>(null)
    const ships = useGameStore((state) => state.ships)

    const handleSpawn = (type: ShipType) => {
        setSpawning(type)
        
        // Simulate spawning delay
        setTimeout(() => {
            ShipSpawnerSystem.spawnShip(type)
            setSpawning(null)
        }, 500)
    }

    // Count ships of each type
    const shipCounts = {
        cruise: ships.filter(s => s.type === 'cruise').length,
        container: ships.filter(s => s.type === 'container').length,
        tanker: ships.filter(s => s.type === 'tanker').length
    }

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <span style={{ fontSize: '18px' }}>🌊</span>
                <span style={{ fontWeight: 'bold', letterSpacing: '1px' }}>
                    HarborGlow
                </span>
                <span style={{ fontSize: '18px' }}>✨</span>
            </div>
            
            <div style={buttonsContainerStyle}>
                {SHIP_TYPES.map((shipType) => (
                    <button
                        key={shipType.type}
                        onClick={() => handleSpawn(shipType.type)}
                        disabled={spawning !== null}
                        style={{
                            ...buttonStyle,
                            borderColor: shipType.color,
                            backgroundColor: spawning === shipType.type 
                                ? `${shipType.color}30` 
                                : 'rgba(0,0,0,0.7)',
                            opacity: spawning && spawning !== shipType.type ? 0.5 : 1,
                            cursor: spawning ? 'wait' : 'pointer'
                        }}
                    >
                        <div style={buttonContentStyle}>
                            <span style={{ fontSize: '24px' }}>{shipType.icon}</span>
                            <div style={buttonTextStyle}>
                                <span style={{ 
                                    fontWeight: 'bold', 
                                    fontSize: '13px',
                                    color: shipType.color
                                }}>
                                    {spawning === shipType.type ? 'Spawning...' : `Spawn ${shipType.shortLabel}`}
                                </span>
                                <span style={{ 
                                    fontSize: '10px', 
                                    color: '#888',
                                    marginTop: '2px'
                                }}>
                                    {shipType.description}
                                </span>
                            </div>
                            {shipCounts[shipType.type] > 0 && (
                                <span style={{
                                    ...countBadgeStyle,
                                    backgroundColor: shipType.color
                                }}>
                                    {shipCounts[shipType.type]}
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Ship count summary */}
            <div style={summaryStyle}>
                <span style={{ color: '#666', fontSize: '11px' }}>
                    Total vessels in harbor: <strong style={{ color: '#fff' }}>{ships.length}</strong>
                </span>
            </div>
        </div>
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #333',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
    minWidth: '240px'
}

const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #333',
    color: '#fff',
    fontSize: '16px'
}

const buttonsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
}

const buttonStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '12px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    border: '2px solid',
    borderRadius: '8px',
    color: '#fff',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    position: 'relative'
}

const buttonContentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
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
    fontWeight: 'bold',
    color: '#000'
}

const summaryStyle: React.CSSProperties = {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #333',
    textAlign: 'center'
}
