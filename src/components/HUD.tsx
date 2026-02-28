import ShipSpawner from './ShipSpawner'
import UpgradeMenu from './UpgradeMenu'
import LyricsDisplay from './LyricsDisplay'

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
        </div>
    )
}
