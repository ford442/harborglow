import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { ShipType, CameraMode, useGameStore } from '../../store/useGameStore';
import { useAudioData } from '../../systems/audioVisualSync';
import { GLASSMORPHISM, SHIP_COLORS } from '../DesignSystem';
import { TrafficShip, trafficSystem, useDockedShip } from '../../systems/trafficSystem';
import { drawCraneCabView, drawHookView, drawDroneView, drawUnderwaterView, drawScanlines } from './canvasDrawers';
import { moonSystem, MoonPhaseName, MOON_PHASES } from '../../systems/moonSystem';
import { swaySystem, useSwaySystem } from '../../systems/swaySystem';
import { weatherSystem, useWeatherSystem, WeatherType } from '../../systems/weatherSystem';
import { useEconomySystem } from '../../systems/economySystem';
import { ShipSpawner } from '../../systems/shipSpawner';
import { useCompletionGlow } from '../../hooks/useCompletionGlow';
import { CameraPanel, CameraFeedConfig, EconomyMetrics, HarborSilhouette, SpawnCTAButton, OperatorStatusPanel, MoonPhaseIndicator, SwayIndicator, WeatherIndicator } from './panels';
import * as styles from './styles';

export interface OperatorCabinUIProps {
  onOpenTraining?: () => void
}

export function OperatorCabinUI({ onOpenTraining }: OperatorCabinUIProps = {}) {
  const viewMode = useGameStore((state: any) => state.cabinViewMode)
  const setCabinViewMode = useGameStore((state: any) => state.setCabinViewMode)
  const currentShip = useGameStore((state: any) =>
    state.ships.find((s: any) => s.id === state.currentShipId)
  )
  const gameMode = useGameStore((state: any) => state.gameMode)
  const cameraMode = useGameStore((state: any) => state.cameraMode)

  // Toggle view mode with 'C' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        setCabinViewMode(viewMode === 'multiview' ? 'immersive' : 'multiview')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, setCabinViewMode])

  const shipColor = currentShip ? SHIP_COLORS[currentShip.type as keyof typeof SHIP_COLORS]?.primary || '#00d4aa' : '#00d4aa'
  const glow = useCompletionGlow()

  return (
    <div style={{ ...styles.cabinContainerStyle, ...(glow || {}) }}>
      {/* Mode Toggle Button */}
      <button
        style={styles.modeToggleStyle}
        onClick={() => setCabinViewMode(viewMode === 'multiview' ? 'immersive' : 'multiview')}
      >
        <span style={{ fontSize: '16px' }}>
          {viewMode === 'multiview' ? '🎮' : '📺'}
        </span>
        <span style={{ fontSize: '11px', fontWeight: 600 }}>
          {viewMode === 'multiview' ? 'IMMERSE' : 'PANELS'}
        </span>
        <kbd style={styles.keyHintStyle}>C</kbd>
      </button>

      {/* Training Button */}
      {gameMode === 'sandbox' && onOpenTraining && (
        <button
          style={styles.trainingButtonStyle}
          onClick={onOpenTraining}
        >
          <span style={{ fontSize: '16px' }}>🎓</span>
          <span style={{ fontSize: '11px', fontWeight: 600 }}>TRAIN</span>
        </button>
      )}

      {/* 4-Camera Multiview Grid */}
      {viewMode === 'multiview' && (
        <div style={styles.multiviewGridStyle}>
          {/* Main - Crane Cab POV */}
          <CameraPanel
            config={{
              id: 'crane',
              title: 'CRANE CAB',
              subtitle: 'PRIMARY POV',
              icon: '🎮',
              position: [18, 24, 8],
              target: [0, 5, 0],
              fov: 60,
              accentColor: shipColor,
              gridArea: 'main'
            }}
            isMain
            cameraMode={cameraMode}
          />

          {/* Hook Cam */}
          <CameraPanel
            config={{
              id: 'hook',
              title: 'HOOK CAM',
              subtitle: 'SPREADER VIEW',
              icon: '🏗️',
              position: [0, 5, 0],
              target: [0, -5, 0],
              fov: 75,
              accentColor: '#ff9500',
              gridArea: 'hook'
            }}
            cameraMode={cameraMode}
          />

          {/* Drone Overview */}
          <CameraPanel
            config={{
              id: 'drone',
              title: 'DRONE',
              subtitle: 'AERIAL OVERVIEW',
              icon: '🚁',
              position: [40, 25, 40],
              target: [0, 0, 0],
              fov: 50,
              accentColor: '#00bfff',
              gridArea: 'drone'
            }}
            cameraMode={cameraMode}
          />

          {/* Underwater Cam */}
          <CameraPanel
            config={{
              id: 'underwater',
              title: 'UNDERWATER',
              subtitle: 'DEEP CAM',
              icon: '🌊',
              position: [0, -8, 20],
              target: [0, -2, 0],
              fov: 70,
              accentColor: '#00aaff',
              gridArea: 'underwater'
            }}
            cameraMode={cameraMode}
          />
        </div>
      )}

      {/* Operator Status Panel */}
      <OperatorStatusPanel />

      {/* Monitor Bezel Overlay Effect */}
      <div style={styles.bezelOverlayStyle}>
        <div style={styles.scanlineStyle} />
      </div>
    </div>
  )
}

// =============================================================================
// CAMERA PANEL COMPONENT
// =============================================================================

interface CameraPanelProps {
  config: CameraFeedConfig
  isMain?: boolean
  cameraMode: CameraMode
}
