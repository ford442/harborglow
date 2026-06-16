import React from 'react';
import * as styles from './trainingHUDStyles';

export function CrosshairOverlay() {
  return (
    <div style={styles.crosshairContainerStyle}>
      <div style={styles.crosshairStyle}>
        <div style={styles.crosshairHStyle} />
        <div style={styles.crosshairVStyle} />
        <div style={styles.crosshairCenterStyle} />
      </div>
      <div style={styles.alignmentGuidesStyle}>
        <div style={styles.guideTopStyle} />
        <div style={styles.guideBottomStyle} />
        <div style={styles.guideLeftStyle} />
        <div style={styles.guideRightStyle} />
      </div>
    </div>
  )
}

// =============================================================================
// OBJECTIVE POPUP
// =============================================================================
