import * as styles from './trainingHUD/trainingHUDStyles';
import { TimerDisplay, ObjectiveCounter, TutorialPanel, ObjectivePanel, MetricsPanel, CrosshairOverlay, ObjectivePopup, PauseMenu, CompletionScreen } from './trainingHUD/SubComponents';
// =============================================================================
// TRAINING HUD - Real-time Guidance Overlays
// Provides subtle instruction, voice lines, and performance feedback during training
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTrainingSystem, TRAINING_MODULES, type TrainingModuleId } from '../systems/trainingSystem'
import { useGameStore } from '../store/useGameStore'
import { swaySystem } from '../systems/swaySystem'

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
    recordEmergencyStop,
    recordLoadSecured,
    recordCraneBCoordinated,
    recordOperationModeSwitch,
    recordSyncTestPassed,
    getCompletedObjectiveIds,
    completeModule
  } = useTrainingSystem()
  
  const [showTutorial, setShowTutorial] = useState(true)
  const [showPauseMenu, setShowPauseMenu] = useState(false)
  const [completedObjectives, setCompletedObjectives] = useState<string[]>([])
  const [showObjectivePopup, setShowObjectivePopup] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const prevOperationMode = useRef(useGameStore.getState().operationMode)
  const secureHoldStart = useRef<number | null>(null)
  const emergencyAlarmTriggered = useRef(false)
  
  const module = TRAINING_MODULES.find(m => m.id === moduleId)
  const currentStep = getCurrentStep()
  const metrics = getCurrentMetrics()

  const operationMode = useGameStore(s => s.operationMode)
  const currentShipId = useGameStore(s => s.currentShipId)
  const installedUpgrades = useGameStore(s => s.installedUpgrades)
  const musicPlaying = useGameStore(s => s.musicPlaying)
  
  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const completeObjective = useCallback((objectiveId: string) => {
    setCompletedObjectives(prev => {
      if (prev.includes(objectiveId)) return prev
      return [...prev, objectiveId]
    })
    setShowObjectivePopup(objectiveId)
    setTimeout(() => setShowObjectivePopup(null), 3000)
  }, [])

  // Poll objective completion from training system evaluator
  useEffect(() => {
    if (!module) return
    const interval = setInterval(() => {
      const newlyComplete = getCompletedObjectiveIds()
      newlyComplete.forEach(id => {
        if (!completedObjectives.includes(id)) {
          completeObjective(id)
        }
      })
    }, 500)
    return () => clearInterval(interval)
  }, [module, completedObjectives, getCompletedObjectiveIds, completeObjective])

  // Track sway from sway system
  useEffect(() => {
    const interval = setInterval(() => {
      const sway = swaySystem.getState().magnitude
      recordSway(sway)
    }, 250)
    return () => clearInterval(interval)
  }, [recordSway])

  // Module 6: emergency alarm after 10s
  useEffect(() => {
    if (moduleId !== 'emergency') return
    const timer = setTimeout(() => {
      if (!emergencyAlarmTriggered.current) {
        emergencyAlarmTriggered.current = true
      }
    }, 10000)
    return () => clearTimeout(timer)
  }, [moduleId])

  // Module 6: secure load when sway held low after emergency stop
  useEffect(() => {
    if (moduleId !== 'emergency') return
    const interval = setInterval(() => {
      const completed = getCompletedObjectiveIds()
      const sway = swaySystem.getState().magnitude
      if (completed.includes('emergency-stop') && sway < 0.2) {
        if (secureHoldStart.current === null) {
          secureHoldStart.current = Date.now()
        } else if (Date.now() - secureHoldStart.current >= 5000) {
          recordLoadSecured()
        }
      } else {
        secureHoldStart.current = null
      }
    }, 250)
    return () => clearInterval(interval)
  }, [moduleId, getCompletedObjectiveIds, recordLoadSecured])

  // Track operation mode switches for emergency module
  useEffect(() => {
    if (operationMode !== prevOperationMode.current) {
      recordOperationModeSwitch(operationMode)
      prevOperationMode.current = operationMode
    }
  }, [operationMode, recordOperationModeSwitch])

  // Module 5: acknowledge Crane B when multiview is active or after 30s
  useEffect(() => {
    if (moduleId !== 'multi-crane') return
    const timer = setTimeout(() => recordCraneBCoordinated(), 30000)
    return () => clearTimeout(timer)
  }, [moduleId, recordCraneBCoordinated])

  // Module 7: sync test when all rigs installed and music playing
  useEffect(() => {
    if (moduleId !== 'light-show' || !currentShipId) return
    const installed = installedUpgrades.filter(u => u.shipId === currentShipId).length
    const ship = useGameStore.getState().ships.find(s => s.id === currentShipId)
    const target = ship?.attachmentPoints.length ?? 6
    if (installed >= target && musicPlaying.get(currentShipId)) {
      recordSyncTestPassed()
    }
  }, [moduleId, currentShipId, installedUpgrades, musicPlaying, recordSyncTestPassed])

  // Emergency stop via Space key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && moduleId === 'emergency') {
        recordEmergencyStop()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [moduleId, recordEmergencyStop])

  const handleSkipTutorial = () => {
    setShowTutorial(false)
  }

  const handleNextStep = () => {
    nextStep()
  }

  const handleComplete = () => {
    completeModule()
    onComplete()
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
        {showTutorial && currentStep && module.tutorial.length > 0 && (
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
