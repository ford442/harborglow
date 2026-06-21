import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useGameStore, Ship, selectUpgradeProgress, ShipType } from '../store/useGameStore'
import { musicSystem } from '../systems/musicSystem'
import { lightingSystem } from '../systems/lightingSystem'
import { triggerUpgradeCinematic } from '../systems/cinematicSystem'
import { UPGRADE_CONFIGS, shipTypeLabels, shipTypeColors } from './upgrade/upgradeConfigs'
import { ParticleBurst, ShipFullyUpgradedCelebration, useUpgradeSounds } from './VisualFeedback'
import { useCompletionGlow } from '../hooks/useCompletionGlow'
import { useMusicPulse } from '../hooks/useMusicPulse'
import * as THREE from 'three'
import { getSceneCamera } from '../utils/sceneCamera'
import { AvailableUpgradesList } from './upgrade/AvailableUpgradesList'
import { optimizeQueueOrder, projectWorldToScreen, formatPartLabel } from './upgrade/utils'
import {
    menuContainerStyle,
    progressBarBgStyle,
    progressBarFillStyle,
    upgradeRowStyle,
    installButtonStyle,
    installingSpinnerStyle,
    structuralOverhaulButtonStyle,
    flashOverlayStyle,
    v2NotificationStyle,
    upgradeCompleteBannerStyle,
    bannerGlowLineStyle,
    bannerContentStyle,
    bannerLabelStyle,
    bannerBandNameStyle,
    bannerGenreStyle,
    watchLightShowButtonStyle,
    confettiPieceStyle,
    queueStatusStyle,
    queueStatusTextStyle,
    queueAbortButtonStyle,
    queueProgressBarBgStyle,
    queueProgressBarFillStyle,
    queueCheckboxStyle,
    queueButtonStyle,
    queuePreviewOverlayStyle
} from './upgrade/styles'

export default function UpgradeMenu() {
    const currentShipId = useGameStore((state) => state.currentShipId)
    const ships = useGameStore((state) => state.ships)
    const currentShip = ships.find((ship: any) => ship.id === currentShipId)

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

    return <UpgradeMenuInner currentShip={currentShip} />
}

function UpgradeMenuInner({ currentShip }: { currentShip: any }) {
    const currentShipId = currentShip.id
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
    const installQueue = useGameStore(state => state.installQueue)
    const installQueueIndex = useGameStore(state => state.installQueueIndex)
    const isQueueRunning = useGameStore(state => state.isQueueRunning)
    const isQueuePaused = useGameStore(state => state.isQueuePaused)
    const queuePausedShipId = useGameStore(state => state.queuePausedShipId)
    const queuePausedAt = useGameStore(state => state.queuePausedAt)
    const setInstallQueue = useGameStore(state => state.setInstallQueue)
    const abortInstallQueue = useGameStore(state => state.abortInstallQueue)

    const [installing, setInstalling] = useState<string | null>(null)
    const [showBandReveal, setShowBandReveal] = useState(false)
    const [bandName, setBandName] = useState('')
    const [isUpgradingVersion, setIsUpgradingVersion] = useState(false)
    const [showFlash, setShowFlash] = useState(false)
    const [showV2Notification, setShowV2Notification] = useState(false)
    const [typedBandName, setTypedBandName] = useState('')
    const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; hue: number; duration: number; x: number; y: number; rot: number }>>([])
    
    // Visual feedback states
    const [particleBurst, setParticleBurst] = useState<{
        active: boolean
        position: [number, number, number]
        color: string
    }>({ active: false, position: [0, 0, 0], color: '#00d4aa' })
    
    const [showCelebration, setShowCelebration] = useState(false)
    const [lastInstalled, setLastInstalled] = useState<string | null>(null)
    const [selectedForQueue, setSelectedForQueue] = useState<Set<string>>(new Set())
    
    const { playInstallSound, playCelebrationSound } = useUpgradeSounds()
    const bpm = useGameStore((state) => state.bpm)
    const musicPulse = useMusicPulse(bpm)

    useEffect(() => {
        setSelectedForQueue(new Set())
    }, [currentShipId])

    // Track when all upgrades are complete for cinematic reveal
    useEffect(() => {
        if (!currentShip) {
            setShowBandReveal(false)
            return
        }

        const shipUpgrades = installedUpgrades.filter((u: any) => u.shipId === currentShip.id)
        const totalUpgrades = UPGRADE_CONFIGS[currentShip.type as ShipType].length
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

    useEffect(() => {
        if (!showBandReveal) {
            setTypedBandName('')
            setConfetti([])
            return
        }

        let index = 0
        const interval = window.setInterval(() => {
            index += 1
            setTypedBandName(bandName.slice(0, index))
            if (index >= bandName.length) {
                window.clearInterval(interval)
            }
        }, 60)

        return () => window.clearInterval(interval)
    }, [bandName, showBandReveal])

    useEffect(() => {
        if (!showBandReveal) return
        const burst = Array.from({ length: 48 }, (_, id) => ({
            id,
            left: 50 + (Math.random() - 0.5) * 26,
            delay: Math.random() * 0.2,
            hue: 160 + Math.floor(Math.random() * 120),
            duration: 1.4 + Math.random() * 0.8,
            x: (Math.random() - 0.5) * 80,
            y: (Math.random() - 0.5) * 24,
            rot: (Math.random() - 0.5) * 220,
        }))
        setConfetti(burst)
        const timer = window.setTimeout(() => setConfetti([]), 2000)
        return () => window.clearTimeout(timer)
    }, [showBandReveal])

    // Listen for sequencer-driven band-name hide cue
    useEffect(() => {
        const onHide = () => setShowBandReveal(false)
        window.addEventListener('cinematicHideBandName', onHide)
        return () => window.removeEventListener('cinematicHideBandName', onHide)
    }, [])

    // Poll for auto-install completion
    const activeAutoInstall = isQueueRunning
        ? installQueue[installQueueIndex] ?? null
        : pendingAutoInstall

    useEffect(() => {
        if (!activeAutoInstall || !currentShip) return

        const isInstalled = installedUpgrades.some(
            (u: any) => u.shipId === activeAutoInstall.shipId && u.partName === activeAutoInstall.partName
        )

        if (isInstalled) {
            setInstalling(null)
            setLastInstalled(activeAutoInstall.partName)
            setHighlightedUpgradePart(null)
            if (!isQueueRunning) {
                setPendingAutoInstall(null)
            }

            // Hide particle burst after animation
            setTimeout(() => {
                setParticleBurst(prev => ({ ...prev, active: false }))
            }, 1000)
        }
    }, [activeAutoInstall, installedUpgrades, currentShip, isQueueRunning, setHighlightedUpgradePart, setPendingAutoInstall])

    // Clear highlight when menu unmounts or current ship changes
    useEffect(() => {
        return () => {
            setHighlightedUpgradePart(null)
        }
    }, [currentShipId, setHighlightedUpgradePart])

    const currentVersion = currentShip.version || '1.0'
    const isMaxVersion = currentVersion === '2.0'
    const upgradeOptions = UPGRADE_CONFIGS[currentShip.type as ShipType]
    const shipUpgrades = installedUpgrades.filter((u: any) => u.shipId === currentShip.id)
    const installedPartNames = new Set(shipUpgrades.map((u: any) => u.partName))
    const availableUpgrades = upgradeOptions.filter((opt: any) => !installedPartNames.has(opt.partName))
    const progress = (shipUpgrades.length / upgradeOptions.length) * 100
    const shipColor = shipTypeColors[currentShip.type as ShipType]
    const queueableUpgrades = availableUpgrades.filter((opt: any) => selectedForQueue.has(opt.partName))

    useEffect(() => {
        setSelectedForQueue((current) => {
            const valid = new Set(availableUpgrades.map((option: any) => option.partName))
            const next = new Set([...current].filter((partName) => valid.has(partName)))
            if (next.size === current.size) {
                let matches = true
                next.forEach((partName) => {
                    if (!current.has(partName)) matches = false
                })
                if (matches) return current
            }
            return next
        })
    }, [availableUpgrades])

    const queuePreviewPoints = useMemo(() => {
        if (queueableUpgrades.length < 2 || !currentShip) return []
        const camera = getSceneCamera()
        if (!camera) return []

        const start = new THREE.Vector3(cranePosition.x, cranePosition.y, cranePosition.z)
        const resolved = queueableUpgrades
            .map((option: any) => {
                const point = currentShip.attachmentPoints.find((item: any) => item.partName === option.partName)
                if (!point) return null
                return {
                    shipId: currentShip.id,
                    partName: option.partName,
                    worldPos: new THREE.Vector3(
                        currentShip.position[0] + point.position[0],
                        currentShip.position[1] + point.position[1],
                        currentShip.position[2] + point.position[2]
                    ),
                }
            })
            .filter((item: any): item is { shipId: string; partName: string; worldPos: THREE.Vector3 } => Boolean(item))

        const ordered = optimizeQueueOrder(resolved, start)
        return ordered
            .map((item: any) => {
                const point = resolved.find((resolvedItem: any) => resolvedItem.partName === item.partName)
                return point?.worldPos ?? null
            })
            .filter((item: any): item is THREE.Vector3 => Boolean(item))
            .map((point: any) => projectWorldToScreen(point, camera))
            .filter((point: any): point is { x: number; y: number } => Boolean(point))
    }, [cranePosition.x, cranePosition.y, cranePosition.z, currentShip, queueableUpgrades])

    const glow = useCompletionGlow()

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

    const handleSelectUpgrade = (partName: string) => {
        if (pendingAutoInstall?.partName === partName) return
        setHighlightedUpgradePart(partName)
    }

    const handleInstall = async (partName: string) => {
        setHighlightedUpgradePart(null)
        setInstalling(partName)
        await playInstallSound()
        setParticleBurst({
            active: true,
            position: [cranePosition.x, cranePosition.y, cranePosition.z],
            color: shipColor,
        })
        setPendingAutoInstall({ shipId: currentShip.id, partName })
    }

    const handleStructuralOverhaul = async () => {
        if (!currentShip.isDocked) return
        if (isUpgradingVersion) return

        setIsUpgradingVersion(true)

        try {
            const currentVersion = currentShip.version || '1.0'
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

    const versionMap: Record<string, string> = { '1.0': '1.5', '1.5': '2.0', '2.0': '2.0' }
    const nextVersion = versionMap[currentVersion]
    const genrePulseDuration = Math.max(0.45, 60 / bpm)

    const isNavigating = (partName: string) =>
        activeAutoInstall?.shipId === currentShip.id && activeAutoInstall?.partName === partName

    const isHighlighted = (partName: string) =>
        highlightedUpgradePart === partName && !isNavigating(partName)

    const toggleQueueSelection = (partName: string) => {
        setSelectedForQueue((current) => {
            const next = new Set(current)
            if (next.has(partName)) {
                next.delete(partName)
            } else {
                next.add(partName)
            }
            return next
        })
    }

    const startQueue = () => {
        if (selectedForQueue.size === 0 || !currentShip) return

        const parts = Array.from(selectedForQueue)
            .map((partName) => {
                const point = currentShip.attachmentPoints.find((p: any) => p.partName === partName)
                if (!point) return null
                return {
                    shipId: currentShip.id,
                    partName,
                    worldPos: new THREE.Vector3(
                        currentShip.position[0] + point.position[0],
                        currentShip.position[1] + point.position[1],
                        currentShip.position[2] + point.position[2]
                    ),
                }
            })
            .filter((item: any): item is { shipId: string; partName: string; worldPos: THREE.Vector3 } => Boolean(item))

        if (parts.length === 0) return

        const orderedQueue = optimizeQueueOrder(
            parts,
            new THREE.Vector3(cranePosition.x, cranePosition.y, cranePosition.z)
        )

        setInstalling(orderedQueue[0]?.partName ?? null)
        setHighlightedUpgradePart(null)
        setPendingAutoInstall(null)
        setInstallQueue(orderedQueue)
        setSelectedForQueue(new Set())
    }

    return (
        <>
            {isQueueRunning && (
                <div style={queueStatusStyle}>
                    <div style={queueStatusTextStyle}>
                        {isQueuePaused
                            ? `Waiting for ship ${queuePausedShipId?.slice(-6) || ''}...`
                            : `Installing ${Math.min(installQueueIndex + 1, installQueue.length)} of ${installQueue.length} — ${formatPartLabel(activeAutoInstall?.partName || 'Pending')}`}
                    </div>
                    <button
                        onClick={abortInstallQueue}
                        style={queueAbortButtonStyle}
                        aria-label="Abort install queue"
                    >
                        ✕
                    </button>
                    <div style={queueProgressBarBgStyle}>
                        <div
                            style={{
                                ...queueProgressBarFillStyle,
                                width: `${installQueue.length === 0 ? 0 : (installQueueIndex / installQueue.length) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            <div style={{ ...menuContainerStyle, ...(glow || {}) }}>
                <div style={{
                    borderBottom: `2px solid ${shipColor}`,
                    paddingBottom: '8px',
                    marginBottom: '12px'
                }}>
                    <h3 style={{ margin: 0, color: shipColor }}>
                        {shipTypeLabels[currentShip.type as ShipType]}
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

                <AvailableUpgradesList
                    availableUpgrades={availableUpgrades}
                    isNavigating={isNavigating}
                    isHighlighted={isHighlighted}
                    lastInstalled={lastInstalled}
                    selectedForQueue={selectedForQueue}
                    shipColor={shipColor}
                    installing={installing}
                    onSelectUpgrade={handleSelectUpgrade}
                    onInstall={handleInstall}
                    onToggleQueueSelection={toggleQueueSelection}
                    activeAutoInstallPartName={activeAutoInstall?.partName}
                />

                {availableUpgrades.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '16px 0',
                        color: shipColor,
                        fontSize: '13px',
                        fontWeight: 'bold',
                        animation: 'pulse 2s infinite'
                    }}>
                        {isMaxVersion ? (
                            <>
                                ✨ Hull Integrity Maximum ✨<br/>
                                <span style={{ fontSize: '10px', color: '#aaa', fontWeight: 'normal' }}>
                                    All modifications complete
                                </span>
                            </>
                        ) : (
                            <>
                                ✨ All Parts Installed ✨<br/>
                                <span style={{ fontSize: '10px', color: '#aaa', fontWeight: 'normal' }}>
                                    Ready for Structural Overhaul
                                </span>
                            </>
                        )}
                    </div>
                )}

                {queueableUpgrades.length > 1 && (
                    <button
                        onClick={startQueue}
                        disabled={isQueueRunning || !!activeAutoInstall}
                        style={{
                            ...queueButtonStyle,
                            opacity: isQueueRunning || !!activeAutoInstall ? 0.5 : 1,
                            cursor: isQueueRunning || !!activeAutoInstall ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Start Queue ({selectedForQueue.size} items)
                    </button>
                )}

                {!isMaxVersion && availableUpgrades.length === 0 && currentShip.isDocked && (
                    <button
                        onClick={handleStructuralOverhaul}
                        disabled={isUpgradingVersion}
                        style={structuralOverhaulButtonStyle}
                    >
                        {isUpgradingVersion ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <div style={installingSpinnerStyle} />
                                <span>Refitting Hull...</span>
                            </div>
                        ) : (
                            <>
                                🛠️ Perform Structural Overhaul<br/>
                                <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.8 }}>
                                    Upgrade to v{nextVersion}
                                </span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {queuePreviewPoints.length > 1 && (
                <svg style={queuePreviewOverlayStyle}>
                    <polyline
                        points={queuePreviewPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke="rgba(0, 212, 170, 0.5)"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                    />
                    {queuePreviewPoints.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="4"
                            fill="rgba(0, 212, 170, 0.8)"
                        />
                    ))}
                </svg>
            )}

            {showFlash && <div style={flashOverlayStyle} />}

            {showV2Notification && (
                <div style={v2NotificationStyle}>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '32px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        🚀 VERSION 2.0 UNLOCKED! 🚀
                    </h2>
                    <p style={{ margin: 0, fontSize: '18px', opacity: 0.9 }}>
                        Maximum performance achieved.<br/>Harbor Light Show activated!
                    </p>
                </div>
            )}

            {showBandReveal && (
                <div style={{
                    ...upgradeCompleteBannerStyle,
                    borderColor: shipColor,
                    boxShadow: `0 0 40px ${shipColor}30, 0 8px 32px rgba(0,0,0,0.5)`
                }}>
                    <div style={bannerGlowLineStyle} />

                    <div style={bannerContentStyle}>
                        <span style={bannerLabelStyle}>Installation Complete</span>
                        <div style={{
                            ...bannerBandNameStyle,
                            textShadow: `0 0 20px ${shipColor}80`
                        }}>
                            {typedBandName}
                            <span style={{
                                opacity: typedBandName.length === bandName.length ? 0 : 1,
                                animation: 'blink 1s step-end infinite'
                            }}>_</span>
                        </div>
                        {typedBandName.length === bandName.length && (
                            <span style={{
                                ...bannerGenreStyle,
                                animation: `genrePulse ${genrePulseDuration}s ease-in-out infinite alternate`
                            }}>
                                {musicSystem.getBandInfo(currentShip.type).genre}
                            </span>
                        )}
                    </div>

                    <div style={bannerGlowLineStyle} />

                    {typedBandName.length === bandName.length && (
                        <button
                            style={{
                                ...watchLightShowButtonStyle,
                                borderColor: `${shipColor}80`,
                                color: shipColor
                            }}
                            onClick={() => {
                                setSpectatorTarget(currentShip.id, 10)
                                setMusicPlaying(currentShip.id, true)
                                setShowBandReveal(false)
                            }}
                        >
                            Watch Live Set
                        </button>
                    )}

                    {confetti.map(c => (
                        <div key={c.id} style={{
                            ...confettiPieceStyle,
                            left: `${c.left}%`,
                            top: '50%',
                            backgroundColor: `hsl(${c.hue}, 100%, 60%)`,
                            animationDelay: `${c.delay}s`,
                            animationDuration: `${c.duration}s`,
                            transform: `translate(${c.x}px, ${c.y}px) rotate(${c.rot}deg)`
                        }} />
                    ))}
                </div>
            )}

            <ParticleBurst
                active={particleBurst.active}
                position={particleBurst.position}
                color={particleBurst.color}
            />

            <ShipFullyUpgradedCelebration
                active={showCelebration}
                shipName={currentShip.id}
                shipType={currentShip.type}
                onComplete={() => setShowCelebration(false)}
            />
        </>
    )
}
