import React, { useState, useEffect } from 'react';
import { TrainingStep, TrainingMetrics } from '../../systems/trainingSystem';
import * as styles from './trainingHUDStyles';



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

export function TutorialPanel({ step, currentStep, totalSteps, onNext, onSkip }: TutorialPanelProps) {
  const [voiceLinePlayed, setVoiceLinePlayed] = useState(false)

  useEffect(() => {
    // In real implementation, this would trigger text-to-speech or audio playback
    if (step.voiceLine && !voiceLinePlayed) {
      console.log(`[Voice] ${step.voiceLine}`)
      setVoiceLinePlayed(true)
    }
  }, [step, voiceLinePlayed])

  return (
    <div style={styles.tutorialPanelStyle}>
      <div style={styles.tutorialHeaderStyle}>
        <div style={styles.instructorIconStyle}>👨‍🏭</div>
        <div style={styles.instructorInfoStyle}>
          <span style={styles.instructorNameStyle}>Instructor</span>
          <span style={styles.stepCounterStyle}>Step {currentStep + 1} of {totalSteps}</span>
        </div>
      </div>

      <div style={styles.tutorialContentStyle}>
        <h4 style={styles.stepTitleStyle}>{step.title}</h4>
        <p style={styles.stepMessageStyle}>{step.message}</p>

        {step.waitForAction && (
          <div style={styles.actionHintStyle}>
            <span style={styles.actionIconStyle}>⌛</span>
            <span>Waiting for action...</span>
          </div>
        )}
      </div>

      <div style={styles.tutorialActionsStyle}>
        <button style={styles.skipTutorialStyle} onClick={onSkip}>
          Skip Tutorial
        </button>
        {!step.waitForAction && (
          <button style={styles.nextStepStyle} onClick={onNext}>
            Continue →
          </button>
        )}
      </div>

      {/* Progress Dots */}
      <div style={styles.progressDotsStyle}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.progressDotStyle,
              background: i === currentStep ? '#00d4aa' : i < currentStep ? '#00d4aa60' : '#333'
            }}
          />
        ))}
      </div>
    </div>
  )
}
