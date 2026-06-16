import * as styles from './trainingHUD/trainingHUDStyles';
import { TimerDisplay, ObjectiveCounter, TutorialPanel, ObjectivePanel, MetricsPanel, CrosshairOverlay, ObjectivePopup, PauseMenu, CompletionScreen } from './trainingHUD/SubComponents';
// =============================================================================
// TRAINING HUD - Real-time Guidance Overlays
// Provides subtle instruction, voice lines, and performance feedback during training
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { useTrainingSystem, TrainingStep, TrainingModuleId, TRAINING_MODULES, TrainingMetrics, getRankColor, calculateRank, calculateScore } from '../systems/trainingSystem'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// TRAINING HUD PROPS
// =============================================================================

export interface TrainingHUDProps {
  moduleId: TrainingModuleId
  onExit: () => void
  onComplete: () => void
}

// =============================================================================
// MAIN TRAINING HUD COMPONENT
// =============================================================================

export default function TrainingHUD({ moduleId, onExit, onComplete }: TrainingHUDProps) {
  const { 
    progress, 
    getCurrentStep, 
    nextStep, 
    getCurrentMetrics,
    recordSway,
    recordInstallation,
    completeModule
  } = useTrainingSystem()
  
  const [showTutorial, setShowTutorial] = useState(true)
  const [showPauseMenu, setShowPauseMenu] = useState(false)
  const [completedObjectives, setCompletedObjectives] = useState<string[]>([])
  const [showObjectivePopup, setShowObjectivePopup] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  
  const module = TRAINING_MODULES.find(m => m.id === moduleId)
  const currentStep = getCurrentStep()
  const metrics = getCurrentMetrics()
  
  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Listen for objective completion (simulated - real implementation would hook into game events)
  const checkObjectives = useCallback(() => {
    if (!module) return
    
    module.objectives.forEach(obj => {
      if (!completedObjectives.includes(obj.id)) {
        // Simulate objective completion based on metrics
        // In real implementation, this would be triggered by actual game events
        if (obj.id === 'install-funnel' && metrics.installationsCompleted >= 1) {
          completeObjective(obj.id)
        } else if (obj.id === 'install-bridge' && metrics.installationsCompleted >= 2) {
          completeObjective(obj.id)
        } else if (obj.id === 'install-rails' && metrics.installationsCompleted >= 3) {
          completeObjective(obj.id)
        }
      }
    })
  }, [module, completedObjectives, metrics])

  const completeObjective = (objectiveId: string) => {
    setCompletedObjectives(prev => [...prev, objectiveId])
    setShowObjectivePopup(objectiveId)
    setTimeout(() => setShowObjectivePopup(null), 3000)
  }

  // Track sway from game store
  const gameStore = useGameStore()
  useEffect(() => {
    // In real implementation, this would subscribe to sway system
    // For now, placeholder
    const swayInterval = setInterval(() => {
      const simulatedSway = Math.random() * 0.3 // Placeholder
      recordSway(simulatedSway)
    }, 500)
    return () => clearInterval(swayInterval)
  }, [recordSway])

  const handleSkipTutorial = () => {
    setShowTutorial(false)
  }

  const handleNextStep = () => {
    nextStep()
  }

  const handleComplete = () => {
    const result = completeModule()
    onComplete()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!module) return null

  return (
    <>
      {/* Main HUD */}
      <div style={styles.hudContainerStyle}>
        {/* Top Bar - Module Info */}
        <div style={styles.topBarStyle}>
          <div style={styles.moduleInfoStyle}>
            <span style={styles.trainingBadgeStyle}>TRAINING</span>
            <span style={styles.moduleTitleStyle}>{module.title}</span>
          </div>
          
          <div style={styles.centerInfoStyle}>
            <TimerDisplay elapsed={elapsedTime} />
            <ObjectiveCounter completed={completedObjectives.length} total={module.objectives.length} />
          </div>
          
          <div style={styles.rightControlsStyle}>
            <button style={styles.pauseButtonStyle} onClick={() => setShowPauseMenu(true)}>
              ⏸️
            </button>
            <button style={styles.exitButtonStyle} onClick={onExit}>
              ✕
            </button>
          </div>
        </div>

        {/* Left Panel - Objectives */}
        <ObjectivePanel 
          objectives={module.objectives}
          completed={completedObjectives}
        />

        {/* Right Panel - Metrics */}
        <MetricsPanel metrics={metrics} />

        {/* Bottom Panel - Guidance */}
        {showTutorial && currentStep && (
          <TutorialPanel 
            step={currentStep}
            currentStep={progress.currentStep}
            totalSteps={module.tutorial.length}
            onNext={handleNextStep}
            onSkip={handleSkipTutorial}
          />
        )}

        {/* Center Crosshair */}
        <CrosshairOverlay />

        {/* Objective Complete Popup */}
        {showObjectivePopup && (
          <ObjectivePopup 
            objective={module.objectives.find(o => o.id === showObjectivePopup)}
          />
        )}
      </div>

      {/* Pause Menu */}
      {showPauseMenu && (
        <PauseMenu 
          onResume={() => setShowPauseMenu(false)}
          onRestart={() => {
            setShowPauseMenu(false)
            setElapsedTime(0)
            setCompletedObjectives([])
          }}
          onExit={onExit}
        />
      )}

      {/* Completion Screen */}
      {completedObjectives.length === module.objectives.length && (
        <CompletionScreen 
          metrics={metrics}
          onComplete={handleComplete}
          onRetry={() => {
            setCompletedObjectives([])
            setElapsedTime(0)
          }}
        />
      )}
    </>
  )
}

