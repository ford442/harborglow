import { useEffect, useState } from 'react'
import ShipSpawner from './ShipSpawner'
import UpgradeMenu from './UpgradeMenu'
import LyricsDisplay from './LyricsDisplay'
import SpectatorTitleCard from './SpectatorTitleCard'
import ShipVersionDisplay from './ShipVersionDisplay'
import CraneControls from './CraneControls'
import { OperatorCabinUI } from './OperatorCabin'
import { useGameStore } from '../store/useGameStore'
import { injectDesignSystem } from './DesignSystem'
import DynamicEventNotifier from './DynamicEventNotifier'
import ReputationPanel from './ReputationPanel'
import CreditFeedback from './CreditFeedback'
import HarborShop, { HarborShopButton } from './HarborShop'
import TugboatConsole from './TugboatConsole'
import TugboatWelcomeHandler from './TugboatWelcomeHandler'
import {
  TopBar,
  TimeDisplay,
  ShipStatusPanel,
  CameraMultiviewControls,
  CraneControlIndicators,
  HotkeyHints,
  ModeToggle,
  TugboatHUD,
  WaveHeightDebug,
  MissionHUD,
  CraneObjectiveHUD,
  CraneWelcomeHandler,
  RewardAnimation,
  DockWalkHUD,
  hudContainerStyle,
} from './hud'

export interface HUDProps {
  onOpenTraining?: () => void
}

export default function HUD({ onOpenTraining }: HUDProps = {}) {
  const [shopOpen, setShopOpen] = useState(false)

  useEffect(() => {
    injectDesignSystem()
  }, [])

  const currentShipId = useGameStore(state => state.currentShipId)
  const ships = useGameStore(state => state.ships)
  const currentShip = ships.find(s => s.id === currentShipId)
  const operationMode = useGameStore(state => state.operationMode)
  const cameraMode = useGameStore(state => state.cameraMode)
  const walkingPosition = useGameStore(state => state.walkingPosition)
  const walkingSpawnPoint = useGameStore(state => state.walkingSpawnPoint)
  const beginWalkingFromCab = useGameStore(state => state.beginWalkingFromCab)
  const returnToCraneFromWalking = useGameStore(state => state.returnToCraneFromWalking)

  const isCraneMode = operationMode === 'crane'
  const isWalkingMode = operationMode === 'walking'
  const canLeaveCab = isCraneMode && cameraMode === 'crane-cockpit'

  const dx = walkingPosition[0] - walkingSpawnPoint[0]
  const dz = walkingPosition[2] - walkingSpawnPoint[2]
  const canEnterCab = isWalkingMode && Math.sqrt(dx * dx + dz * dz) <= 4.2

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.key.toLowerCase() !== 'f') return
      const activeTag = document.activeElement?.tagName
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return
      if (canLeaveCab) {
        beginWalkingFromCab()
        return
      }
      if (canEnterCab) {
        returnToCraneFromWalking()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [beginWalkingFromCab, canEnterCab, canLeaveCab, returnToCraneFromWalking])
  
  return (
    <div style={hudContainerStyle}>
      {isCraneMode && <OperatorCabinUI onOpenTraining={onOpenTraining} onOpenShop={() => setShopOpen(true)} />}
      
      {!isWalkingMode && <ModeToggle />}
      
      <TopBar currentShip={currentShip} ships={ships} />
      
      <TimeDisplay />
      
      <TugboatHUD />
      
      <TugboatConsole />
      
      <MissionHUD />

      {isCraneMode && <CraneObjectiveHUD />}
      {isCraneMode && <CraneWelcomeHandler />}

      <RewardAnimation />
      
      <WaveHeightDebug />
      
      {currentShip && !isWalkingMode && <ShipStatusPanel ship={currentShip} />}
      
      {isCraneMode && <CameraMultiviewControls />}
      
      {isCraneMode && <CraneControlIndicators />}
      
      {isCraneMode && <ShipSpawner />}
      {isCraneMode && <UpgradeMenu />}
      <SpectatorTitleCard />
      <LyricsDisplay />
      {!isWalkingMode && <ShipVersionDisplay />}
      {isCraneMode && <CraneControls />}
      
      {!isWalkingMode && <DynamicEventNotifier />}
      
      {!isWalkingMode && <ReputationPanel />}

      {isCraneMode && (
        <div style={shopButtonContainerStyle}>
          <HarborShopButton onClick={() => setShopOpen(true)} />
        </div>
      )}
      <HarborShop isOpen={shopOpen} onClose={() => setShopOpen(false)} />
      
      {!isWalkingMode && <CreditFeedback />}
      
      <TugboatWelcomeHandler />
      
      <HotkeyHints />

      {isWalkingMode && <DockWalkHUD />}

      {canLeaveCab && (
        <div style={transitionPromptStyle}>
          Press <kbd style={keyHintStyle}>F</kbd> to leave cab
        </div>
      )}

      {canEnterCab && (
        <div style={transitionPromptStyle}>
          Press <kbd style={keyHintStyle}>F</kbd> to enter cab
        </div>
      )}
    </div>
  )
}

const transitionPromptStyle: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: '28px',
  transform: 'translateX(-50%)',
  color: '#f2f6ff',
  background: 'rgba(12, 18, 28, 0.72)',
  border: '1px solid rgba(130, 192, 255, 0.45)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '0.3px',
  pointerEvents: 'none',
}

const keyHintStyle: React.CSSProperties = {
  display: 'inline-block',
  margin: '0 4px',
  padding: '1px 6px',
  borderRadius: '4px',
  border: '1px solid rgba(255,255,255,0.4)',
  background: 'rgba(255,255,255,0.12)',
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: '12px',
}

const shopButtonContainerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '24px',
  left: '24px',
  zIndex: 105,
  pointerEvents: 'auto',
}
