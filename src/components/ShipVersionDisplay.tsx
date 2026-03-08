import { useGameStore } from '../store/useGameStore'

const weatherEmojis: Record<string, string> = {
    clear: '☀️',
    rain: '🌧️',
    fog: '🌫️',
    storm: '⛈️'
}

export default function ShipVersionDisplay() {
    const currentShip = useGameStore(state => state.ships.find(s => s.id === state.currentShipId))
    const weather = useGameStore(state => state.weather)
    
    if (!currentShip) return null
    
    const version = currentShip.version || '1.0'
    const isDocked = currentShip.isDocked !== false
    
    return (
        <div style={{
            position: 'absolute',
            top: 80,
            right: 20,
            background: 'rgba(0,0,0,0.7)',
            padding: '10px 15px',
            borderRadius: '8px',
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            border: '1px solid rgba(255,255,255,0.2)'
        }}>
            <div>🚢 {currentShip.name}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                v{version} {isDocked ? '⚓ Docked' : '⛵ At Sea'}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                {weatherEmojis[weather]} {weather.charAt(0).toUpperCase() + weather.slice(1)}
            </div>
        </div>
    )
}
