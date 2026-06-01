import { useMemo } from 'react'
import { useGameStore } from '../../store/useGameStore'

const INTERACTION_RANGE = 12
const PROXIMITY_RANGE = 22

const SHIP_TYPE_LABELS: Record<string, string> = {
    mega_cruise: 'Mega Cruise Liner',
    container_vessel: 'Container Vessel',
    oil_tanker: 'Oil Tanker',
    bulk_carrier: 'Bulk Carrier',
    lng: 'LNG Carrier',
    roro: 'RoRo Vessel',
    research: 'Research Ship',
    droneship: 'Droneship',
}

export default function DockWalkHUD() {
    const walkingPosition = useGameStore(s => s.walkingPosition)
    const ships = useGameStore(s => s.ships)
    const installedUpgrades = useGameStore(s => s.installedUpgrades)

    const { nearestShip, nearestDist, shipUpgradeCount, isFullyUpgraded } = useMemo(() => {
        let nearest = null
        let nearestDist = Infinity
        for (const ship of ships) {
            if (ship.isDocked === false) continue
            const dx = walkingPosition[0] - ship.position[0]
            const dz = walkingPosition[2] - ship.position[2]
            const dist = Math.sqrt(dx * dx + dz * dz)
            if (dist < nearestDist) {
                nearestDist = dist
                nearest = ship
            }
        }
        const upgradeCount = nearest
            ? installedUpgrades.filter(u => u.shipId === nearest.id).length
            : 0
        const totalPoints = nearest?.attachmentPoints.length ?? 0
        const fullyUpgraded = nearest != null && totalPoints > 0 && upgradeCount >= totalPoints
        return { nearestShip: nearest, nearestDist, shipUpgradeCount: upgradeCount, isFullyUpgraded: fullyUpgraded }
    }, [walkingPosition, ships, installedUpgrades])

    const isNearShip = nearestDist <= PROXIMITY_RANGE
    const isInInteractionRange = nearestDist <= INTERACTION_RANGE

    return (
        <>
            {/* Crosshair */}
            <div style={crosshairStyle} />

            {/* Controls hint strip */}
            <div style={controlsHintStyle}>
                <Hint k="WASD" label="Move" />
                <Sep />
                <Hint k="Space" label="Jump" />
                <Sep />
                <Hint k="Shift" label="Sprint" />
                <Sep />
                <Hint k="F" label="Enter Cab" />
                <Sep />
                <Hint k="Q" label="Return to Crane" />
            </div>

            {/* Ship proximity card */}
            {isNearShip && nearestShip && (
                <div style={proximityCardStyle}>
                    <div style={shipNameStyle}>
                        {nearestShip.name ?? SHIP_TYPE_LABELS[nearestShip.type] ?? nearestShip.type}
                    </div>
                    <div style={shipTypeStyle}>{SHIP_TYPE_LABELS[nearestShip.type] ?? nearestShip.type}</div>
                    <div style={rigsBarStyle}>
                        <div style={rigsLabelStyle}>
                            Light Rigs: {shipUpgradeCount} / {nearestShip.attachmentPoints.length}
                        </div>
                        <div style={rigsTrackStyle}>
                            {Array.from({ length: nearestShip.attachmentPoints.length }).map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        ...rigPipStyle,
                                        background: i < shipUpgradeCount
                                            ? 'rgba(80, 200, 255, 0.9)'
                                            : 'rgba(255,255,255,0.18)',
                                        boxShadow: i < shipUpgradeCount
                                            ? '0 0 6px rgba(80,200,255,0.7)'
                                            : 'none',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    {isFullyUpgraded && (
                        <div style={fullyUpgradedBadgeStyle}>✦ Fully Upgraded</div>
                    )}
                </div>
            )}

            {/* E-key interaction prompt */}
            {isInInteractionRange && isFullyUpgraded && (
                <div style={interactionPromptStyle}>
                    Press <kbd style={kbdStyle}>E</kbd> to trigger light show
                </div>
            )}
        </>
    )
}

function Hint({ k, label }: { k: string; label: string }) {
    return (
        <span style={hintItemStyle}>
            <kbd style={kbdStyle}>{k}</kbd>
            <span style={{ marginLeft: 5, color: 'rgba(200,220,255,0.75)' }}>{label}</span>
        </span>
    )
}

function Sep() {
    return <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 6px' }}>·</span>
}

const crosshairStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 6,
    height: 6,
    marginLeft: -3,
    marginTop: -3,
    borderRadius: '50%',
    border: '1.5px solid rgba(255,255,255,0.7)',
    background: 'rgba(255,255,255,0.15)',
    pointerEvents: 'none',
    zIndex: 20,
}

const controlsHintStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 18,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(8,14,24,0.62)',
    border: '1px solid rgba(100,160,255,0.25)',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 12,
    fontFamily: '"JetBrains Mono", monospace',
    color: 'rgba(200,220,255,0.8)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 20,
}

const hintItemStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
}

const kbdStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.35)',
    background: 'rgba(255,255,255,0.1)',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 11,
    color: '#d0e8ff',
    lineHeight: '1.4',
}

const proximityCardStyle: React.CSSProperties = {
    position: 'absolute',
    left: 24,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(8,14,28,0.82)',
    border: '1px solid rgba(80,180,255,0.38)',
    borderRadius: 10,
    padding: '12px 16px',
    minWidth: 180,
    pointerEvents: 'none',
    zIndex: 20,
}

const shipNameStyle: React.CSSProperties = {
    color: '#c0e0ff',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.4px',
    marginBottom: 2,
}

const shipTypeStyle: React.CSSProperties = {
    color: 'rgba(160,200,255,0.55)',
    fontSize: 11,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
}

const rigsBarStyle: React.CSSProperties = {
    marginBottom: 6,
}

const rigsLabelStyle: React.CSSProperties = {
    color: 'rgba(180,210,255,0.7)',
    fontSize: 11,
    marginBottom: 5,
}

const rigsTrackStyle: React.CSSProperties = {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
}

const rigPipStyle: React.CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: 2,
    transition: 'background 0.3s, box-shadow 0.3s',
}

const fullyUpgradedBadgeStyle: React.CSSProperties = {
    color: '#50c8ff',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.6px',
    textShadow: '0 0 8px rgba(80,200,255,0.6)',
    marginTop: 6,
}

const interactionPromptStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    bottom: 68,
    transform: 'translateX(-50%)',
    color: '#f2f6ff',
    background: 'rgba(12, 18, 28, 0.82)',
    border: '1px solid rgba(80, 200, 255, 0.55)',
    borderRadius: 8,
    padding: '9px 16px',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.3px',
    pointerEvents: 'none',
    textShadow: '0 0 10px rgba(80,200,255,0.4)',
    zIndex: 20,
}
