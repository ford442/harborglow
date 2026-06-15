import React from 'react';
import * as styles from './trainingHUDStyles';

export function ObjectivePopup({ objective }: { objective?: { title: string; description: string } }) {
  if (!objective) return null

  return (
    <div style={styles.popupOverlayStyle}>
      <div style={styles.popupStyle}>
        <div style={styles.popupIconStyle}>✓</div>
        <h4 style={styles.popupTitleStyle}>Objective Complete!</h4>
        <p style={styles.popupTextStyle}>{objective.title}</p>
      </div>
    </div>
  )
}

// =============================================================================
// PAUSE MENU
// =============================================================================
