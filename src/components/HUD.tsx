// =============================================================================
// ENHANCED HUD - Phase 7-8 Polish
// Camera multiview, crane indicators, ship status panel
// =============================================================================

import { useEffect } from 'react'
import ShipSpawner from './ShipSpawner'
import UpgradeMenu from './UpgradeMenu'
import LyricsDisplay from './LyricsDisplay'
import ShipVersionDisplay from './ShipVersionDisplay'
import CraneControls from './CraneControls'
import { OperatorCabinUI } from './OperatorCabin'
import { useGameStore } from '../store/useGameStore'
import { injectDesignSystem } from './DesignSystem'
import DynamicEventNotifier from './DynamicEventNotifier'
import ReputationPanel from './ReputationPanel'
import CreditFeedback from './CreditFeedback'
import {
  TopBar,
  TimeDisplay,
  ShipStatusPanel,
  CameraMultiviewControls,
  CraneControlIndicators,
  HotkeyHints,
  ModeToggle,
  TugboatHUD,
  hudContainerStyle,
} from './hud'

export interface HUDProps {
  onOpenTraining?: () => void
}

export default function HUD({ onOpenTraining }: HUDProps = {}) {
  useEffect(() => {
    injectDesignSystem()
  }, [])

  const currentShipId = useGameStore(state => state.currentShipId)
  const ships = useGameStore(state => state.ships)
  const currentShip = ships.find(s => s.id === currentShipId)
  const gameMode = useGameStore(state => state.gameMode)
  
  return (
    <div style={hudContainerStyle}>
      <OperatorCabinUI onOpenTraining={onOpenTraining} />
      
      <ModeToggle />
      
      <TopBar currentShip={currentShip} ships={ships} />
      
      <TimeDisplay />
      
      <TugboatHUD />
      
      {currentShip && <ShipStatusPanel ship={currentShip} />}
      
      <CameraMultiviewControls />
      
      <CraneControlIndicators />
      
      <ShipSpawner />
      <UpgradeMenu />
      <LyricsDisplay />
      <ShipVersionDisplay />
      <CraneControls />
      
      <DynamicEventNotifier />
      
      <ReputationPanel />
      
      <CreditFeedback />
      
      <HotkeyHints />
    </div>
  )
}
