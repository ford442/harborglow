import React from 'react';
import * as styles from './trainingHUDStyles';

export function PauseMenu({ onResume, onRestart, onExit }: { onResume: () => void; onRestart: () => void; onExit: () => void }) {
  return (
    <div style={styles.pauseOverlayStyle}>
      <div style={styles.pauseMenuStyle}>
        <h2 style={styles.pauseTitleStyle}>⏸️ Paused</h2>
        <div style={styles.pauseButtonsStyle}>
          <button style={styles.resumeButtonStyle} onClick={onResume}>Resume Training</button>
          <button style={styles.restartButtonStyle} onClick={onRestart}>Restart Module</button>
          <button style={styles.exitTrainingStyle} onClick={onExit}>Exit to Hub</button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// COMPLETION SCREEN
// =============================================================================
