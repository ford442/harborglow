import React from 'react'
import type { Ship, ShipType } from '../../store/useGameStore'
import type { SpectatorCameraConfig } from './types'

export function SpectatorOverlay({ ship, remainingTime }: { ship?: Ship; remainingTime: number }) {
    if (!ship) return null

    const labels: Record<ShipType, string> = {
        cruise: 'Ocean Symphony',
        container: 'Neon Stack',
        tanker: 'Flame Runner',
        bulk: 'Iron Mountain',
        lng: 'Cryo Titan',
        roro: 'Vehicle Voyager',
        research: 'Deep Discoverer',
        droneship: 'Of Course I Still Love You',
        ferry: 'Harbour Light',
        trawler: 'Saltwater',
        horizon: 'Meridian'
    }

    const colors: Record<ShipType, string> = {
        cruise: '#ff6b9d',
        container: '#00d4aa',
        tanker: '#ff9500',
        bulk: '#8b4513',
        lng: '#00ffff',
        roro: '#ff6b35',
        research: '#4169e1',
        droneship: '#ffffff',
        ferry: '#00cc88',
        trawler: '#cc8833',
        horizon: '#3388cc'
    }

    return (
        <>
            <div style={{
                position: 'absolute',
                top: '80px',
                left: '20px',
                background: 'rgba(0,0,0,0.7)',
                padding: '12px 20px',
                borderRadius: '8px',
                border: `2px solid ${colors[ship.type]}`,
                pointerEvents: 'none',
                zIndex: 100
            }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    Spectator Drone
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors[ship.type], marginTop: '4px' }}>
                    {labels[ship.type]}
                </div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                    Auto-return in {remainingTime.toFixed(1)}s
                </div>
            </div>

            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100px',
                height: '100px',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 50
            }}>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '4px',
                    height: '4px',
                    backgroundColor: colors[ship.type],
                    borderRadius: '50%'
                }} />
            </div>
        </>
    )
}


export function updateSpectatorCamera(config: SpectatorCameraConfig) {
    const { spectatorState, ships, delta, spectatorAngleRef, cameraMode, orbitControlsRef } = config

    if (spectatorState.isActive && spectatorState.targetShipId) {
        const targetShip = ships.find(s => s.id === spectatorState.targetShipId)
        if (targetShip) {
            spectatorAngleRef.current += delta * 0.3
        }
    } else if (cameraMode === 'orbit' && orbitControlsRef.current) {
        orbitControlsRef.current.update()
    }
}
