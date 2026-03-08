import ShipSpawner from './ShipSpawner'
import UpgradeMenu from './UpgradeMenu'
import LyricsDisplay from './LyricsDisplay'
import ShipVersionDisplay from './ShipVersionDisplay'
import CraneControls from './CraneControls'

export default function HUD() {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 100
        }}>
            <ShipSpawner />
            <UpgradeMenu />
            <LyricsDisplay />
            <ShipVersionDisplay />
            <CraneControls />
            
            {/* Crane Dashboard Hotkey Hint */}
            <div style={{
                position: 'absolute',
                bottom: 4,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#888',
                fontFamily: 'monospace'
            }}>
                <span style={{ color: '#00ff88' }}>[TAB]</span> = toggle 4th monitor
            </div>
        </div>
    )
}
