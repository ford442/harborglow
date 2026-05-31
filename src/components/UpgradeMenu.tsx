import React, { useState, useEffect, useCallback } from 'react'
import { useGameStore, Ship, selectUpgradeProgress, ShipType } from '../store/useGameStore'
import { musicSystem } from '../systems/musicSystem'
import { lightingSystem } from '../systems/lightingSystem'
import { triggerUpgradeCinematic } from '../systems/cinematicSystem'
import { UPGRADE_CONFIGS, shipTypeLabels, shipTypeColors } from './upgrade/upgradeConfigs'
import { ParticleBurst, ShipFullyUpgradedCelebration, useUpgradeSounds } from './VisualFeedback'
import { useCompletionGlow } from '../hooks/useCompletionGlow'

// =============================================================================
// UPGRADE MENU COMPONENT - Phase 7-8 Polish
// Enhanced with particle effects and celebrations
// =============================================================================

export default function UpgradeMenu() {
    const currentShipId = useGameStore((state) => state.currentShipId)
    const ships = useGameStore((state) => state.ships)
    const installedUpgrades = useGameStore((state) => state.installedUpgrades)
    const installUpgrade = useGameStore((state) => state.installUpgrade)
    const setMusicPlaying = useGameStore((state) => state.setMusicPlaying)
    const setSpectatorTarget = useGameStore((state) => state.setSpectatorTarget)
    const upgradeShipVersion = useGameStore((state) => state.upgradeShipVersion)
    const cranePosition = useGameStore(state => state.spreaderPos)
    const highlightedUpgradePart = useGameStore(state => state.highlightedUpgradePart)
    const setHighlightedUpgradePart = useGameStore(state => state.setHighlightedUpgradePart)
    const pendingAutoInstall = useGameStore(state => state.pendingAutoInstall)
    const setPendingAutoInstall = useGameStore(state => state.setPendingAutoInstall)

    const [installing, setInstalling] = useState<string | null>(null)
    const [showBandReveal, setShowBandReveal] = useState(false)
    const [bandName, setBandName] = useState('')
    const [isUpgradingVersion, setIsUpgradingVersion] = useState(false)
    const [showFlash, setShowFlash] = useState(false)
    const [showV2Notification, setShowV2Notification] = useState(false)
    
    // Visual feedback states
    const [particleBurst, setParticleBurst] = useState<{
        active: boolean
        position: [number, number, number]
        color: string
    }>({ active: false, position: [0, 0, 0], color: '#00d4aa' })
    
    const [showCelebration, setShowCelebration] = useState(false)
    const [lastInstalled, setLastInstalled] = useState<string | null>(null)
    
    const { playInstallSound, playCelebrationSound } = useUpgradeSounds()

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

        if (allInstalled && !showBandReveal && !showCelebration) {
            // Trigger celebration
            setShowCelebration(true)
            playCelebrationSound()
            
            const bandInfo = musicSystem.getBandInfo(currentShip.type)
            setBandName(bandInfo.name)
            setShowBandReveal(true)

            triggerUpgradeCinematic(currentShip.type, currentShip.id)
        }
    }, [installedUpgrades, currentShip, showBandReveal, playCelebrationSound, showCelebration])

    // Listen for sequencer-driven band-name hide cue
    useEffect(() => {
        const onHide = () => setShowBandReveal(false)
        window.addEventListener('cinematicHideBandName', onHide)
        return () => window.removeEventListener('cinematicHideBandName', onHide)
    }, [])

    // Poll for auto-install completion
    useEffect(() => {
        if (!pendingAutoInstall || !currentShip) return

        const isInstalled = installedUpgrades.some(
            u => u.shipId === pendingAutoInstall.shipId && u.partName === pendingAutoInstall.partName
        )

        if (isInstalled) {
            setInstalling(null)
            setLastInstalled(pendingAutoInstall.partName)
            setHighlightedUpgradePart(null)
            setPendingAutoInstall(null)

            // Hide particle burst after animation
            setTimeout(() => {
                setParticleBurst(prev => ({ ...prev, active: false }))
            }, 1000)
        }
    }, [installedUpgrades, pendingAutoInstall, currentShip, setHighlightedUpgradePart, setPendingAutoInstall])

    // Clear highlight when menu unmounts or current ship changes
    useEffect(() => {
        return () => {
            setHighlightedUpgradePart(null)
        }
    }, [currentShipId, setHighlightedUpgradePart])

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
    const shipColor = shipTypeColors[currentShip.type]

    const handleSelectUpgrade = (partName: string) => {
        // If already navigating to this one, do nothing
        if (pendingAutoInstall?.partName === partName) return
        setHighlightedUpgradePart(partName)
    }

    const handleInstall = async (partName: string) => {
        // Clear any previous pending
        setHighlightedUpgradePart(null)
        setInstalling(partName)
        
        // Play install sound
        await playInstallSound()
        
        // Trigger particle burst at crane position
        setParticleBurst({
            active: true,
            position: [cranePosition.x, cranePosition.y, cranePosition.z],
            color: shipColor,
        })
        
        // Start auto-pilot instead of fake delay
        setPendingAutoInstall({ shipId: currentShip.id, partName })
    }

    const handleStructuralOverhaul = async () => {
        if (!currentShip?.isDocked) return
        if (isUpgradingVersion) return

        setIsUpgradingVersion(true)

        try {
            const currentVersion = currentShip?.version || '1.0'
            await upgradeShipVersion(currentShip.id)

            setShowFlash(true)
            setTimeout(() => setShowFlash(false), 500)

            if (currentVersion === '1.5') {
                musicSystem.triggerClimax(currentShip.type)
                lightingSystem.startHarborShow(currentShip.id, currentShip.type)
                setShowV2Notification(true)
                setTimeout(() => setShowV2Notification(false), 5000)
            }
        } finally {
            setIsUpgradingVersion(false)
        }
    }

    const glow = useCompletionGlow()

    const currentVersion = currentShip?.version || '1.0'
    const versionMap: Record<string, string> = { '1.0': '1.5', '1.5': '2.0', '2.0': '2.0' }
    const nextVersion = versionMap[currentVersion]
    const isMaxVersion = currentVersion === '2.0'

    const isNavigating = (partName: string) =>
        pendingAutoInstall?.shipId === currentShip.id && pendingAutoInstall?.partName === partName

    const isHighlighted = (partName: string) =>
        highlightedUpgradePart === partName && !isNavigating(partName)

    return (
        <>
            {/* Main Upgrade Menu */}
            <div style={{ ...menuContainerStyle, ...(glow || {}) }}>
                <div style={{
                    borderBottom: `2px solid ${shipColor}`,
                    paddingBottom: '8px',
                    marginBottom: '12px'
                }}>
                    <h3 style={{ margin: 0, color: shipColor }}>
                        {shipTypeLabels[currentShip.type]}
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>
                            ID: {currentShip.id.slice(-6)}
                        </p>
                        <p style={{
                            margin: 0,
                            fontSize: '11px',
                            color: isMaxVersion ? '#ffd700' : '#aaa',
                            fontWeight: isMaxVersion ? 'bold' : 'normal'
                        }}>
                            {isMaxVersion ? '⭐ v' : 'v'}{currentVersion}
                        </p>
                    </div>
                    {!currentShip.isDocked && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#ff6b6b' }}>
                            ⚠️ Ship is at sea - upgrades unavailable
                        </p>
                    )}
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
                            backgroundColor: shipColor,
                            boxShadow: `0 0 10px ${shipColor}60`,
                        }} />
                    </div>
                </div>

                {/* Available upgrades list */}
                {availableUpgrades.length > 0 ? (
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#888' }}>
                            🏗️ Crane pickup and place:
                        </p>
                        {availableUpgrades.map(option => {
                            const navigating = isNavigating(option.partName)
                            const highlighted = isHighlighted(option.partName)
                            const justInstalled = lastInstalled === option.partName && !navigating

                            return (
                                <div
                                    key={option.partName}
                                    style={{
                                        ...upgradeRowStyle,
                                        borderColor: navigating
                                            ? shipColor
                                            : highlighted
                                                ? '#00ffff'
                                                : '#444',
                                        boxShadow: navigating
                                            ? `0 0 15px ${shipColor}60, inset 0 0 10px ${shipColor}20`
                                            : highlighted
                                                ? '0 0 12px #00ffff40, inset 0 0 8px #00ffff20'
                                                : 'none',
                                        cursor: navigating || !currentShip.isDocked ? 'default' : 'pointer',
                                        opacity: navigating || !currentShip.isDocked ? 0.7 : 1,
                                    }}
                                >
                                    {/* Clickable area for selection */}
                                    <div
                                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                                        onClick={() => {
                                            if (!navigating && currentShip.isDocked) {
                                                handleSelectUpgrade(option.partName)
                                            }
                                        }}
                                    >
                                        <span style={{ fontWeight: 'bold', color: navigating ? shipColor : highlighted ? '#00ffff' : '#ddd' }}>
                                            {navigating
                                                ? '🚡 Navigating Crane...'
                                                : justInstalled
                                                    ? '✓ Installed'
                                                    : highlighted
                                                        ? `👁 ${option.label}`
                                                        : `⚡ ${option.label}`}
                                        </span>
                                        <span style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                                            {option.description}
                                        </span>
                                    </div>

                                    {/* Install button — separate from row click */}
                                    {!navigating && !justInstalled && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (currentShip.isDocked) {
                                                    handleInstall(option.partName)
                                                }
                                            }}
                                            disabled={!currentShip.isDocked}
                                            style={{
                                                ...installButtonStyle,
                                                opacity: currentShip.isDocked ? 1 : 0.4,
                                                cursor: currentShip.isDocked ? 'pointer' : 'not-allowed',
                                            }}
                                        >
                                            Install
                                        </button>
                                    )}

                                    {navigating && (
                                        <span style={installingSpinnerStyle} />
                                    )}

                                    {justInstalled && (
                                        <span style={{ fontSize: '16px', color: '#00ff88' }}>✓</span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p style={{
                            margin: 0,
                            color: shipColor,
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            ✨ All Systems Online! ✨
                        </p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#888' }}>
                            Band: {musicSystem.getBandInfo(currentShip.type).name}
                        </p>

                        {currentShip.isDocked && !isMaxVersion && (
                            <button
                                onClick={handleStructuralOverhaul}
                                disabled={isUpgradingVersion}
                                style={{
                                    ...structuralOverhaulButtonStyle,
                                    opacity: isUpgradingVersion ? 0.7 : 1,
                                    cursor: isUpgradingVersion ? 'wait' : 'pointer',
                                    animation: isUpgradingVersion ? 'none' : 'pulse 2s infinite',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px' }}>
                                        {isUpgradingVersion ? '🔧 UPGRADING...' : '⚡ FULL STRUCTURAL OVERHAUL'}
                                    </span>
                                    <span style={{ fontSize: '10px', marginTop: '4px', opacity: 0.9 }}>
                                        {isUpgradingVersion
                                            ? 'Transforming hull architecture...'
                                            : `v${currentVersion} → v${nextVersion}`}
                                    </span>
                                </div>
                            </button>
                        )}

                        {isMaxVersion && (
                            <div style={{
                                marginTop: '12px',
                                padding: '8px',
                                background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.05))',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,215,0,0.3)'
                            }}>
                                <span style={{ fontSize: '11px', color: '#ffd700' }}>
                                    🏆 MAXIMUM STRUCTURAL INTEGRITY ACHIEVED
                                </span>
                            </div>
                        )}
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

            {/* Particle Burst Effect */}
            <ParticleBurst
                position={particleBurst.position}
                color={particleBurst.color}
                active={particleBurst.active}
            />

            {/* Ship Fully Upgraded Celebration */}
            {currentShip && (
                <ShipFullyUpgradedCelebration
                    shipName={currentShip.name || shipTypeLabels[currentShip.type]}
                    shipType={currentShip.type}
                    active={showCelebration}
                    onComplete={() => setShowCelebration(false)}
                />
            )}

            {/* Flash Effect Overlay */}
            {showFlash && <div style={flashOverlayStyle} />}

            {/* V2.0 Overhaul Notification */}
            {showV2Notification && (
                <div style={v2NotificationStyle}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                        🎆 V2.0 OVERHAUL SYNC SHOW ACTIVATED! 🎆
                    </div>
                    <div style={{ fontSize: '16px', opacity: 0.9 }}>
                        All LEDs, funnels, deck lights pulsing to the beat!
                    </div>
                    <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>
                        Harbor-wide light + music spectacle in progress...
                    </div>
                </div>
            )}

            {/* Upgrade Complete Banner */}
            {showBandReveal && currentShip && (
                <div style={upgradeCompleteBannerStyle}>
                    <div style={bannerGlowLineStyle} />
                    <div style={bannerContentStyle}>
                        <div style={bannerLabelStyle}>UPGRADE COMPLETE</div>
                        <div style={bannerBandNameStyle}>{bandName}</div>
                        <div style={bannerGenreStyle}>{musicSystem.getBandInfo(currentShip.type).genre}</div>
                        <button
                            style={watchLightShowButtonStyle}
                            onClick={() => {
                                useGameStore.getState().setSpectatorTarget(currentShip.id)
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #00d4aa, #00ffb8)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 212, 170, 0.15)' }}
                        >
                            ✨ Watch Light Show
                        </button>
                    </div>
                    <div style={bannerGlowLineStyle} />
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.02); }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes banner-slide-down {
                    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>
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
    height: '6px',
    backgroundColor: '#333',
    borderRadius: '3px',
    overflow: 'hidden'
}

const progressBarFillStyle: React.CSSProperties = {
    height: '100%',
    transition: 'width 0.5s ease',
    borderRadius: '3px'
}

const upgradeRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
}

const installButtonStyle: React.CSSProperties = {
    marginLeft: '8px',
    padding: '6px 12px',
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    border: '1px solid rgba(0, 212, 170, 0.4)',
    borderRadius: '6px',
    color: '#00d4aa',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
}

const installingSpinnerStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderTopColor: 'currentColor',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
}

const structuralOverhaulButtonStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    margin: '16px 0 0 0',
    padding: '16px 12px',
    background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
    border: '2px solid #ffcc00',
    borderRadius: '12px',
    color: '#000',
    fontSize: '13px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
    textShadow: '0 1px 0 rgba(255,255,255,0.3)'
}

const flashOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffd700',
    opacity: 0.3,
    pointerEvents: 'none',
    zIndex: 9999,
    animation: 'flash 0.5s ease-out'
}

const v2NotificationStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'linear-gradient(135deg, rgba(255,0,128,0.95), rgba(128,0,255,0.95))',
    padding: '40px 60px',
    borderRadius: '20px',
    border: '3px solid #ff00ff',
    color: '#fff',
    textAlign: 'center',
    zIndex: 10000,
    pointerEvents: 'none',
    animation: 'pulseIn 0.5s ease-out, glow 2s infinite',
    boxShadow: '0 0 60px rgba(255,0,255,0.6), inset 0 0 30px rgba(255,255,255,0.2)'
}

const upgradeCompleteBannerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 150,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 32px',
    background: 'rgba(10, 15, 30, 0.92)',
    backdropFilter: 'blur(16px)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 212, 170, 0.4)',
    boxShadow: '0 0 40px rgba(0,212,170,0.2), 0 8px 32px rgba(0,0,0,0.5)',
    animation: 'banner-slide-down 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
}

const bannerGlowLineStyle: React.CSSProperties = {
    width: '100%',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, #00d4aa, transparent)',
    opacity: 0.6,
}

const bannerContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
}

const bannerLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '3px',
    color: '#00d4aa',
    textTransform: 'uppercase',
}

const bannerBandNameStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '1px',
    textShadow: '0 0 20px rgba(0,212,170,0.5)',
}

const bannerGenreStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
}

const watchLightShowButtonStyle: React.CSSProperties = {
    marginTop: '10px',
    padding: '10px 24px',
    background: 'rgba(0, 212, 170, 0.15)',
    border: '1px solid rgba(0, 212, 170, 0.5)',
    borderRadius: '8px',
    color: '#00d4aa',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
}
