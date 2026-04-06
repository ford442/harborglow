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
      <div style={hudContainerStyle}>
        {/* Top Bar - Module Info */}
        <div style={topBarStyle}>
          <div style={moduleInfoStyle}>
            <span style={trainingBadgeStyle}>TRAINING</span>
            <span style={moduleTitleStyle}>{module.title}</span>
          </div>
          
          <div style={centerInfoStyle}>
            <TimerDisplay elapsed={elapsedTime} />
            <ObjectiveCounter completed={completedObjectives.length} total={module.objectives.length} />
          </div>
          
          <div style={rightControlsStyle}>
            <button style={pauseButtonStyle} onClick={() => setShowPauseMenu(true)}>
              ⏸️
            </button>
            <button style={exitButtonStyle} onClick={onExit}>
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

// =============================================================================
// TUTORIAL PANEL
// =============================================================================

interface TutorialPanelProps {
  step: TrainingStep
  currentStep: number
  totalSteps: number
  onNext: () => void
  onSkip: () => void
}

function TutorialPanel({ step, currentStep, totalSteps, onNext, onSkip }: TutorialPanelProps) {
  const [voiceLinePlayed, setVoiceLinePlayed] = useState(false)

  useEffect(() => {
    // In real implementation, this would trigger text-to-speech or audio playback
    if (step.voiceLine && !voiceLinePlayed) {
      console.log(`[Voice] ${step.voiceLine}`)
      setVoiceLinePlayed(true)
    }
  }, [step, voiceLinePlayed])

  return (
    <div style={tutorialPanelStyle}>
      <div style={tutorialHeaderStyle}>
        <div style={instructorIconStyle}>👨‍🏭</div>
        <div style={instructorInfoStyle}>
          <span style={instructorNameStyle}>Instructor</span>
          <span style={stepCounterStyle}>Step {currentStep + 1} of {totalSteps}</span>
        </div>
      </div>
      
      <div style={tutorialContentStyle}>
        <h4 style={stepTitleStyle}>{step.title}</h4>
        <p style={stepMessageStyle}>{step.message}</p>
        
        {step.waitForAction && (
          <div style={actionHintStyle}>
            <span style={actionIconStyle}>⌛</span>
            <span>Waiting for action...</span>
          </div>
        )}
      </div>
      
      <div style={tutorialActionsStyle}>
        <button style={skipTutorialStyle} onClick={onSkip}>
          Skip Tutorial
        </button>
        {!step.waitForAction && (
          <button style={nextStepStyle} onClick={onNext}>
            Continue →
          </button>
        )}
      </div>
      
      {/* Progress Dots */}
      <div style={progressDotsStyle}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div 
            key={i} 
            style={{
              ...progressDotStyle,
              background: i === currentStep ? '#00d4aa' : i < currentStep ? '#00d4aa60' : '#333'
            }}
          />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// OBJECTIVE PANEL
// =============================================================================

interface ObjectivePanelProps {
  objectives: Array<{ id: string; title: string; description: string }>
  completed: string[]
}

function ObjectivePanel({ objectives, completed }: ObjectivePanelProps) {
  return (
    <div style={objectivePanelStyle}>
      <h4 style={panelTitleStyle}>🎯 Objectives</h4>
      <div style={objectivesListStyle}>
        {objectives.map((obj, index) => {
          const isCompleted = completed.includes(obj.id)
          return (
            <div 
              key={obj.id} 
              style={{
                ...objectiveRowStyle,
                opacity: isCompleted ? 0.6 : 1,
                background: isCompleted ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.03)'
              }}
            >
              <span style={{
                ...objectiveCheckStyle,
                background: isCompleted ? '#00d4aa' : '#333',
                color: isCompleted ? '#000' : '#666'
              }}>
                {isCompleted ? '✓' : index + 1}
              </span>
              <div style={objectiveTextStyle}>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: 500,
                  textDecoration: isCompleted ? 'line-through' : 'none'
                }}>
                  {obj.title}
                </span>
                {!isCompleted && (
                  <span style={{ fontSize: '10px', color: '#888' }}>{obj.description}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// METRICS PANEL
// =============================================================================

function MetricsPanel({ metrics }: { metrics: TrainingMetrics }) {
  return (
    <div style={metricsPanelStyle}>
      <h4 style={panelTitleStyle}>📊 Performance</h4>
      
      <MetricItem 
        label="Sway"
        value={`${Math.round(metrics.maxSway * 100)}%`}
        color={metrics.maxSway > 0.5 ? '#ff4757' : metrics.maxSway > 0.3 ? '#ff9500' : '#00d4aa'}
        barValue={metrics.maxSway}
      />
      
      <MetricItem 
        label="Accuracy"
        value={`${Math.round(metrics.accuracyScore)}%`}
        color={metrics.accuracyScore > 90 ? '#00d4aa' : metrics.accuracyScore > 70 ? '#ff9500' : '#ff4757'}
        barValue={metrics.accuracyScore / 100}
      />
      
      <MetricItem 
        label="Damage"
        value={metrics.totalDamage.toString()}
        color={metrics.totalDamage === 0 ? '#00d4aa' : metrics.totalDamage < 20 ? '#ff9500' : '#ff4757'}
        barValue={Math.min(metrics.totalDamage / 50, 1)}
        invert
      />
      
      <div style={installProgressStyle}>
        <span style={{ fontSize: '11px', color: '#888' }}>Installations</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#00d4aa' }}>
          {metrics.installationsCompleted}/{metrics.installationsTarget}
        </span>
      </div>
    </div>
  )
}

function MetricItem({ label, value, color, barValue, invert }: { 
  label: string
  value: string
  color: string
  barValue: number
  invert?: boolean
}) {
  return (
    <div style={metricItemStyle}>
      <div style={metricHeaderStyle}>
        <span style={{ fontSize: '11px', color: '#888' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={metricBarBgStyle}>
        <div style={{
          ...metricBarFillStyle,
          width: `${Math.min(barValue * 100, 100)}%`,
          background: color,
          marginLeft: invert ? 'auto' : 0,
          marginRight: invert ? 0 : 'auto'
        }} />
      </div>
    </div>
  )
}

// =============================================================================
// TIMER DISPLAY
// =============================================================================

function TimerDisplay({ elapsed }: { elapsed: number }) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div style={timerStyle}>
      <span style={{ fontSize: '10px', color: '#666' }}>TIME</span>
      <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: '#fff' }}>
        {formatTime(elapsed)}
      </span>
    </div>
  )
}

// =============================================================================
// OBJECTIVE COUNTER
// =============================================================================

function ObjectiveCounter({ completed, total }: { completed: number; total: number }) {
  const percentage = total > 0 ? (completed / total) * 100 : 0
  
  return (
    <div style={counterStyle}>
      <span style={{ fontSize: '10px', color: '#666' }}>PROGRESS</span>
      <div style={counterBarStyle}>
        <div style={{ ...counterFillStyle, width: `${percentage}%` }} />
      </div>
      <span style={{ fontSize: '12px', color: '#00d4aa' }}>{completed}/{total}</span>
    </div>
  )
}

// =============================================================================
// CROSSHAIR OVERLAY
// =============================================================================

function CrosshairOverlay() {
  return (
    <div style={crosshairContainerStyle}>
      <div style={crosshairStyle}>
        <div style={crosshairHStyle} />
        <div style={crosshairVStyle} />
        <div style={crosshairCenterStyle} />
      </div>
      <div style={alignmentGuidesStyle}>
        <div style={guideTopStyle} />
        <div style={guideBottomStyle} />
        <div style={guideLeftStyle} />
        <div style={guideRightStyle} />
      </div>
    </div>
  )
}

// =============================================================================
// OBJECTIVE POPUP
// =============================================================================

function ObjectivePopup({ objective }: { objective?: { title: string; description: string } }) {
  if (!objective) return null

  return (
    <div style={popupOverlayStyle}>
      <div style={popupStyle}>
        <div style={popupIconStyle}>✓</div>
        <h4 style={popupTitleStyle}>Objective Complete!</h4>
        <p style={popupTextStyle}>{objective.title}</p>
      </div>
    </div>
  )
}

// =============================================================================
// PAUSE MENU
// =============================================================================

function PauseMenu({ onResume, onRestart, onExit }: { onResume: () => void; onRestart: () => void; onExit: () => void }) {
  return (
    <div style={pauseOverlayStyle}>
      <div style={pauseMenuStyle}>
        <h2 style={pauseTitleStyle}>⏸️ Paused</h2>
        <div style={pauseButtonsStyle}>
          <button style={resumeButtonStyle} onClick={onResume}>Resume Training</button>
          <button style={restartButtonStyle} onClick={onRestart}>Restart Module</button>
          <button style={exitTrainingStyle} onClick={onExit}>Exit to Hub</button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// COMPLETION SCREEN
// =============================================================================

function CompletionScreen({ metrics, onComplete, onRetry }: { metrics: TrainingMetrics; onComplete: () => void; onRetry: () => void }) {
  // Calculate rank based on final metrics
  const rank = calculateRank(metrics)
  const score = calculateScore(metrics)
  
  return (
    <div style={completionOverlayStyle}>
      <div style={completionScreenStyle}>
        <div style={{
          ...rankDisplayStyle,
          color: getRankColor(rank),
          textShadow: `0 0 40px ${getRankColor(rank)}60`
        }}>
          {rank}
        </div>
        <h2 style={completionTitleStyle}>Module Complete!</h2>
        <p style={completionScoreStyle}>Score: {score.toLocaleString()}</p>
        
        <div style={completionStatsStyle}>
          <StatBox label="Time" value={`${Math.floor(metrics.timeElapsed / 60)}:${String(metrics.timeElapsed % 60).padStart(2, '0')}`} />
          <StatBox label="Max Sway" value={`${Math.round(metrics.maxSway * 100)}%`} />
          <StatBox label="Accuracy" value={`${Math.round(metrics.accuracyScore)}%`} />
          <StatBox label="Damage" value={metrics.totalDamage.toString()} />
        </div>
        
        <div style={completionActionsStyle}>
          <button style={completeButtonStyle} onClick={onComplete}>Continue</button>
          <button style={retryButtonStyle} onClick={onRetry}>Retry for Better Rank</button>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={statBoxStyle}>
      <span style={{ fontSize: '11px', color: '#888' }}>{label}</span>
      <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{value}</span>
    </div>
  )
}

// =============================================================================
// STYLES
// =============================================================================

const hudContainerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 150,
  display: 'flex',
  flexDirection: 'column',
  padding: '20px',
  fontFamily: 'Inter, system-ui, sans-serif'
}

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 20px',
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  pointerEvents: 'auto'
}

const moduleInfoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}

const trainingBadgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: 'linear-gradient(135deg, #00d4aa30, #00a88430)',
  border: '1px solid rgba(0,212,170,0.4)',
  borderRadius: '6px',
  fontSize: '10px',
  fontWeight: 700,
  color: '#00d4aa',
  letterSpacing: '1px'
}

const moduleTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#fff'
}

const centerInfoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '24px'
}

const timerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px'
}

const counterStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  minWidth: '80px'
}

const counterBarStyle: React.CSSProperties = {
  width: '100%',
  height: '4px',
  background: '#333',
  borderRadius: '2px',
  overflow: 'hidden'
}

const counterFillStyle: React.CSSProperties = {
  height: '100%',
  background: 'linear-gradient(90deg, #00d4aa, #00a884)',
  borderRadius: '2px',
  transition: 'width 0.3s'
}

const rightControlsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px'
}

const pauseButtonStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px',
  fontSize: '16px',
  cursor: 'pointer',
  pointerEvents: 'auto',
  transition: 'all 0.2s',
  ':hover': {
    background: 'rgba(255,255,255,0.2)'
  }
} as React.CSSProperties

const exitButtonStyle: React.CSSProperties = {
  ...pauseButtonStyle,
  color: '#ff4757',
  borderColor: 'rgba(255,71,87,0.3)',
  ':hover': {
    background: 'rgba(255,71,87,0.2)'
  }
} as React.CSSProperties

const objectivePanelStyle: React.CSSProperties = {
  position: 'absolute',
  left: '20px',
  top: '80px',
  width: '260px',
  padding: '16px',
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  pointerEvents: 'auto'
}

const panelTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: '12px',
  fontWeight: 600,
  color: '#fff',
  textTransform: 'uppercase',
  letterSpacing: '1px'
}

const objectivesListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const objectiveRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '10px',
  borderRadius: '8px',
  transition: 'all 0.2s'
}

const objectiveCheckStyle: React.CSSProperties = {
  width: '22px',
  height: '22px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 700,
  flexShrink: 0
}

const objectiveTextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
}

const metricsPanelStyle: React.CSSProperties = {
  position: 'absolute',
  right: '20px',
  top: '80px',
  width: '200px',
  padding: '16px',
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  pointerEvents: 'auto'
}

const metricItemStyle: React.CSSProperties = {
  marginBottom: '12px'
}

const metricHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '4px'
}

const metricBarBgStyle: React.CSSProperties = {
  height: '4px',
  background: '#333',
  borderRadius: '2px',
  overflow: 'hidden'
}

const metricBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.3s'
}

const installProgressStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '12px',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  marginTop: '8px'
}

const tutorialPanelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '500px',
  padding: '20px',
  background: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0,212,170,0.3)',
  borderRadius: '16px',
  pointerEvents: 'auto',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
}

const tutorialHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '12px'
}

const instructorIconStyle: React.CSSProperties = {
  fontSize: '32px'
}

const instructorInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
}

const instructorNameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#fff'
}

const stepCounterStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#888'
}

const tutorialContentStyle: React.CSSProperties = {
  marginBottom: '16px'
}

const stepTitleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '16px',
  fontWeight: 600,
  color: '#00d4aa'
}

const stepMessageStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#ccc',
  lineHeight: 1.5
}

const actionHintStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '12px',
  padding: '10px',
  background: 'rgba(0,212,170,0.1)',
  border: '1px solid rgba(0,212,170,0.3)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#00d4aa'
}

const actionIconStyle: React.CSSProperties = {
  fontSize: '16px',
  animation: 'pulse 1s infinite'
}

const tutorialActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const skipTutorialStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px',
  color: '#888',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    color: '#fff',
    borderColor: 'rgba(255,255,255,0.4)'
  }
} as React.CSSProperties

const nextStepStyle: React.CSSProperties = {
  padding: '10px 24px',
  background: 'linear-gradient(135deg, #00d4aa, #00a884)',
  border: 'none',
  borderRadius: '8px',
  color: '#000',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0,212,170,0.4)'
  }
} as React.CSSProperties

const progressDotsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '6px',
  marginTop: '16px'
}

const progressDotStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  transition: 'all 0.3s'
}

const crosshairContainerStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none'
}

const crosshairStyle: React.CSSProperties = {
  position: 'relative',
  width: '40px',
  height: '40px'
}

const crosshairHStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: '1px',
  background: 'rgba(0,212,170,0.5)',
  transform: 'translateY(-50%)'
}

const crosshairVStyle: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: 0,
  bottom: 0,
  width: '1px',
  background: 'rgba(0,212,170,0.5)',
  transform: 'translateX(-50%)'
}

const crosshairCenterStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '4px',
  height: '4px',
  background: '#00d4aa',
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)'
}

const alignmentGuidesStyle: React.CSSProperties = {
  position: 'absolute',
  width: '200px',
  height: '200px'
}

const guideBaseStyle: React.CSSProperties = {
  position: 'absolute',
  width: '20px',
  height: '2px',
  background: 'rgba(255,255,255,0.2)'
}

const guideTopStyle: React.CSSProperties = { ...guideBaseStyle, top: 0, left: '50%', transform: 'translateX(-50%)' }
const guideBottomStyle: React.CSSProperties = { ...guideBaseStyle, bottom: 0, left: '50%', transform: 'translateX(-50%)' }
const guideLeftStyle: React.CSSProperties = { ...guideBaseStyle, left: 0, top: '50%', transform: 'rotate(90deg) translateX(-50%)', transformOrigin: 'left center' }
const guideRightStyle: React.CSSProperties = { ...guideBaseStyle, right: 0, top: '50%', transform: 'rotate(90deg) translateX(50%)', transformOrigin: 'right center' }

const popupOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.5)',
  zIndex: 200,
  animation: 'fadeIn 0.3s'
}

const popupStyle: React.CSSProperties = {
  padding: '32px 48px',
  background: 'rgba(0,0,0,0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0,212,170,0.4)',
  borderRadius: '16px',
  textAlign: 'center',
  animation: 'slideUp 0.3s'
}

const popupIconStyle: React.CSSProperties = {
  fontSize: '48px',
  marginBottom: '12px'
}

const popupTitleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '20px',
  fontWeight: 700,
  color: '#00d4aa'
}

const popupTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#ccc'
}

const pauseOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(5px)',
  zIndex: 300
}

const pauseMenuStyle: React.CSSProperties = {
  padding: '40px 60px',
  background: 'rgba(10,15,26,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '20px',
  textAlign: 'center'
}

const pauseTitleStyle: React.CSSProperties = {
  margin: '0 0 24px 0',
  fontSize: '28px',
  fontWeight: 700,
  color: '#fff'
}

const pauseButtonsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}

const resumeButtonStyle: React.CSSProperties = {
  padding: '14px 40px',
  background: 'linear-gradient(135deg, #00d4aa, #00a884)',
  border: 'none',
  borderRadius: '10px',
  color: '#000',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,212,170,0.4)'
  }
} as React.CSSProperties

const restartButtonStyle: React.CSSProperties = {
  ...resumeButtonStyle,
  background: 'rgba(255,255,255,0.1)',
  color: '#fff'
} as React.CSSProperties

const exitTrainingStyle: React.CSSProperties = {
  ...resumeButtonStyle,
  background: 'rgba(255,71,87,0.2)',
  border: '1px solid rgba(255,71,87,0.4)',
  color: '#ff4757'
} as React.CSSProperties

const completionOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(10px)',
  zIndex: 300
}

const completionScreenStyle: React.CSSProperties = {
  padding: '48px 64px',
  background: 'rgba(10,15,26,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '24px',
  textAlign: 'center',
  animation: 'scaleIn 0.3s'
}

const rankDisplayStyle: React.CSSProperties = {
  fontSize: '120px',
  fontWeight: 800,
  lineHeight: 1,
  marginBottom: '16px'
}

const completionTitleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '28px',
  fontWeight: 700,
  color: '#fff'
}

const completionScoreStyle: React.CSSProperties = {
  margin: '0 0 24px 0',
  fontSize: '18px',
  color: '#00d4aa'
}

const completionStatsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '16px',
  marginBottom: '32px'
}

const statBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '16px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '12px'
}

const completionActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  justifyContent: 'center'
}

const completeButtonStyle: React.CSSProperties = {
  padding: '14px 32px',
  background: 'linear-gradient(135deg, #00d4aa, #00a884)',
  border: 'none',
  borderRadius: '10px',
  color: '#000',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s'
} as React.CSSProperties

const retryButtonStyle: React.CSSProperties = {
  ...completeButtonStyle,
  background: 'rgba(255,255,255,0.1)',
  color: '#fff'
} as React.CSSProperties
