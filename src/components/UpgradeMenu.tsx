import { useState, useEffect } from 'react'
import { useGameStore, ShipType } from '../store/useGameStore'
import { musicSystem } from '../systems/musicSystem'

// =============================================================================
// UPGRADE MENU COMPONENT
// Shows ship-specific upgrade options and handles crane-snap installation
// =============================================================================

interface UpgradeOption {
    partName: string
    label: string
    description: string
}

const UPGRADE_CONFIGS: Record<ShipType, UpgradeOption[]> = {
    cruise: [
        { partName: 'balcony1', label: 'Port Fore Balcony', description: 'LED rail lighting' },
        { partName: 'balcony2', label: 'Starboard Fore Balcony', description: 'LED rail lighting' },
        { partName: 'balcony3', label: 'Port Mid Balcony', description: 'Ambient deck lights' },
        { partName: 'balcony4', label: 'Starboard Mid Balcony', description: 'Ambient deck lights' },
        { partName: 'balcony5', label: 'Port Aft Balcony', description: 'Sunset accent lights' },
        { partName: 'balcony6', label: 'Starboard Aft Balcony', description: 'Sunset accent lights' },
        { partName: 'funnel', label: 'Giant Funnel Array', description: 'Smokestack light show' },
        { partName: 'stern', label: 'Stern Water-Curtain', description: 'Aqua light projection' },
    ],
    container: [
        { partName: 'stack1', label: 'Forward Stack Array', description: 'Container top floodlights' },
        { partName: 'stack2', label: 'Forward-Mid Stack', description: 'Stack accent lighting' },
        { partName: 'stack3', label: 'Center Stack Array', description: 'Main mast beacons' },
        { partName: 'stack4', label: 'Aft-Mid Stack', description: 'Cargo bay illumination' },
        { partName: 'stack5', label: 'Aft Stack Array', description: 'Stern cargo lights' },
        { partName: 'top1', label: 'Fore Mast Array', description: 'Rotating searchlight' },
        { partName: 'top2', label: 'Center Mast Array', description: 'LED billboard array' },
        { partName: 'top3', label: 'Aft Mast Array', description: 'Navigation beacon' },
        { partName: 'side1', label: 'Port Hull LED Wall', description: 'Full side LED billboard' },
        { partName: 'side2', label: 'Starboard Hull LED Wall', description: 'Full side LED billboard' },
    ],
    tanker: [
        { partName: 'flare', label: 'Flare Stack Projector', description: 'Flame-effect light show' },
        { partName: 'rail1', label: 'Fore Deck Rails', description: 'Safety rail lighting' },
        { partName: 'rail2', label: 'Mid Deck Rails', description: 'Walkway illumination' },
        { partName: 'rail3', label: 'Aft Deck Rails', description: 'Perimeter floodlights' },
        { partName: 'rail4', label: 'Bridge Wing Rails', description: 'Navigation rail lights' },
        { partName: 'hull1', label: 'Bow Hull Wash', description: 'Underwater projection' },
        { partName: 'hull2', label: 'Stern Hull Wash', description: 'Wake illumination' },
        { partName: 'hull3', label: 'Port Hull Array', description: 'Side floodlighting' },
    ]
}

export default function UpgradeMenu() {
    const currentShipId = useGameStore((state) => state.currentShipId)
    const ships = useGameStore((state) => state.ships)
    const installedUpgrades = useGameStore((state) => state.installedUpgrades)
    const installUpgrade = useGameStore((state) => state.installUpgrade)
    const setMusicPlaying = useGameStore((state) => state.setMusicPlaying)
    const setSpectatorTarget = useGameStore((state) => state.setSpectatorTarget)

    const [installing, setInstalling] = useState<string | null>(null)
    const [showBandReveal, setShowBandReveal] = useState(false)
    const [bandName, setBandName] = useState('')

    const currentShip = ships.find(ship => ship.id === currentShipId)

    // Track when all upgrades are complete for cinematic reveal
    useEffect(() => {
        if (!currentShip) {
            setShowBandReveal(false)
            return
        }

        const shipUpgrades = installedUpgrades.filter(u => u.shipId === currentShip.id)
        const totalUpgrades = UPGRADE_CONFIGS[currentShip.type].length
        const allInstalled = shipUpgrades.length >= totalUpgrades

        if (allInstalled && !showBandReveal) {
            // Trigger band reveal cinematic
            const bandInfo = musicSystem.getBandInfo(currentShip.type)
            setBandName(bandInfo.name)
            setShowBandReveal(true)
            
            // Start music
            musicSystem.startMusic(currentShip.type)
            setMusicPlaying(currentShip.id, true)
            
            // Trigger spectator drone after 3 seconds
            setTimeout(() => {
                setSpectatorTarget(currentShip.id)
            }, 3000)

            // Hide band reveal after 8 seconds
            setTimeout(() => {
                setShowBandReveal(false)
            }, 8000)
        }
    }, [installedUpgrades, currentShip, showBandReveal, setMusicPlaying, setSpectatorTarget])

    if (!currentShip) {
        return (
            <div style={menuContainerStyle}>
                <h3 style={{ margin: '0 0 10px 0', color: '#aaa' }}>No Ship Selected</h3>
                <p style={{ color: '#888', fontSize: '12px' }}>
                    Spawn a ship using the buttons above
                </p>
            </div>
        )
    }

    const upgradeOptions = UPGRADE_CONFIGS[currentShip.type]
    const shipUpgrades = installedUpgrades.filter(u => u.shipId === currentShip.id)
    const installedPartNames = new Set(shipUpgrades.map(u => u.partName))
    const availableUpgrades = upgradeOptions.filter(opt => !installedPartNames.has(opt.partName))
    const progress = (shipUpgrades.length / upgradeOptions.length) * 100

    const handleInstall = (partName: string) => {
        setInstalling(partName)
        
        // Simulate crane pickup and placement animation time
        setTimeout(() => {
            installUpgrade(currentShip.id, partName)
            setInstalling(null)
        }, 1500)
    }

    const shipTypeLabels: Record<ShipType, string> = {
        cruise: 'Mega Cruise Liner',
        container: 'Ultra Container Vessel',
        tanker: 'VLCC Oil Tanker'
    }

    const shipTypeColors: Record<ShipType, string> = {
        cruise: '#ff6b9d',
        container: '#00d4aa',
        tanker: '#ff9500'
    }

    return (
        <>
            {/* Main Upgrade Menu */}
            <div style={menuContainerStyle}>
                <div style={{ 
                    borderBottom: `2px solid ${shipTypeColors[currentShip.type]}`,
                    paddingBottom: '8px',
                    marginBottom: '12px'
                }}>
                    <h3 style={{ margin: 0, color: shipTypeColors[currentShip.type] }}>
                        {shipTypeLabels[currentShip.type]}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#888' }}>
                        ID: {currentShip.id.slice(-6)}
                    </p>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: '#aaa',
                        marginBottom: '4px'
                    }}>
                        <span>Upgrade Progress</span>
                        <span>{shipUpgrades.length} / {upgradeOptions.length}</span>
                    </div>
                    <div style={progressBarBgStyle}>
                        <div style={{
                            ...progressBarFillStyle,
                            width: `${progress}%`,
                            backgroundColor: shipTypeColors[currentShip.type]
                        }} />
                    </div>
                </div>

                {/* Available upgrades list */}
                {availableUpgrades.length > 0 ? (
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#888' }}>
                            🏗️ Crane pickup and place:
                        </p>
                        {availableUpgrades.map(option => (
                            <button
                                key={option.partName}
                                onClick={() => handleInstall(option.partName)}
                                disabled={installing === option.partName}
                                style={{
                                    ...buttonStyle,
                                    opacity: installing === option.partName ? 0.6 : 1,
                                    cursor: installing === option.partName ? 'wait' : 'pointer',
                                    borderColor: installing === option.partName ? shipTypeColors[currentShip.type] : '#555'
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <span style={{ fontWeight: 'bold' }}>
                                        {installing === option.partName ? '⏳ Installing...' : `⚡ ${option.label}`}
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                                        {option.description}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p style={{ 
                            margin: 0, 
                            color: shipTypeColors[currentShip.type],
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            ✨ All Systems Online! ✨
                        </p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#888' }}>
                            Band: {musicSystem.getBandInfo(currentShip.type).name}
                        </p>
                    </div>
                )}

                {/* Installed summary */}
                {shipUpgrades.length > 0 && availableUpgrades.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #333' }}>
                        <p style={{ margin: 0, fontSize: '10px', color: '#666' }}>
                            Installed: {shipUpgrades.map(u => {
                                const opt = upgradeOptions.find(o => o.partName === u.partName)
                                return opt?.label || u.partName
                            }).slice(0, 3).join(', ')}
                            {shipUpgrades.length > 3 && ` +${shipUpgrades.length - 3} more`}
                        </p>
                    </div>
                )}
            </div>

            {/* Band Reveal Cinematic Overlay */}
            {showBandReveal && (
                <div style={cinematicOverlayStyle}>
                    <div style={cinematicContentStyle}>
                        <p style={{ margin: 0, fontSize: '18px', color: '#aaa', letterSpacing: '4px' }}>
                            TONIGHT'S ONBOARD BAND
                        </p>
                        <h1 style={{ 
                            margin: '20px 0', 
                            fontSize: '48px',
                            background: `linear-gradient(45deg, ${currentShip ? shipTypeColors[currentShip.type] : '#fff'}, #fff)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 0 40px rgba(255,255,255,0.3)'
                        }}>
                            {bandName}
                        </h1>
                        <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
                            {currentShip && musicSystem.getBandInfo(currentShip.type).genre}
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}

// =============================================================================
// STYLES
// =============================================================================

const menuContainerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    background: 'rgba(0,0,0,0.9)',
    padding: '16px',
    borderRadius: '12px',
    pointerEvents: 'auto',
    width: '280px',
    maxHeight: '400px',
    overflow: 'hidden',
    border: '1px solid #333',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)'
}

const progressBarBgStyle: React.CSSProperties = {
    height: '4px',
    backgroundColor: '#333',
    borderRadius: '2px',
    overflow: 'hidden'
}

const progressBarFillStyle: React.CSSProperties = {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '2px'
}

const buttonStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    margin: '6px 0',
    padding: '10px 12px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid #444',
    borderRadius: '8px',
    color: '#ddd',
    fontSize: '12px',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
}

const cinematicOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 2000,
    animation: 'fadeIn 0.5s ease-out'
}

const cinematicContentStyle: React.CSSProperties = {
    textAlign: 'center',
    animation: 'slideUp 0.8s ease-out',
    textTransform: 'uppercase'
}

// Add keyframe animations via inline style injection
const styleSheet = document.createElement('style')
styleSheet.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`
document.head.appendChild(styleSheet)
