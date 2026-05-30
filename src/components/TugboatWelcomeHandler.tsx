// =============================================================================
// TUGBOAT WELCOME HANDLER - Shows welcome modal on first tugboat mode
// =============================================================================

import { useState, useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'
import TugboatWelcomeModal from './MainMenu/TugboatWelcomeModal'

export default function TugboatWelcomeHandler() {
  const operationMode = useGameStore((s) => s.operationMode)
  const gameMode = useGameStore((s) => s.gameMode)
  const tugboatFirstTimeViewed = useGameStore((s) => s.tugboatFirstTimeViewed)
  const markTugboatFirstTimeViewed = useGameStore((s) => s.markTugboatFirstTimeViewed)
  const startTrainingModule = useGameStore((s) => s.startTrainingModule)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    // Show welcome modal if switching to tugboat mode for the first time
    if (operationMode === 'tugboat' && !tugboatFirstTimeViewed) {
      setShowWelcome(true)
      markTugboatFirstTimeViewed()
    }
  }, [operationMode, tugboatFirstTimeViewed, markTugboatFirstTimeViewed])

  const handleClose = () => {
    setShowWelcome(false)
  }

  const handleQuickTutorial = () => {
    startTrainingModule('tugboat-basics')
    setShowWelcome(false)
  }

  if (!showWelcome) return null

  return <TugboatWelcomeModal onClose={handleClose} onQuickTutorial={gameMode === 'sandbox' ? handleQuickTutorial : undefined} />
}
