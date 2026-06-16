import React from 'react';
import { TrainingMetrics } from '../../systems/trainingSystem';
import * as styles from './trainingHUDStyles';
import { calculateRank, calculateScore, getRankColor } from './utils';

export function CompletionScreen({ metrics, onComplete, onRetry }: { metrics: TrainingMetrics; onComplete: () => void; onRetry: () => void }) {
  // Calculate rank based on final metrics
  const rank = calculateRank(calculateScore(metrics))
  const score = calculateScore(metrics)

  return (
    <div style={styles.completionOverlayStyle}>
      <div style={styles.completionScreenStyle}>
        <div style={{
          ...styles.rankDisplayStyle,
          color: getRankColor(rank),
          textShadow: `0 0 40px ${getRankColor(rank)}60`
        }}>
          {rank}
        </div>
        <h2 style={styles.completionTitleStyle}>Module Complete!</h2>
        <p style={styles.completionScoreStyle}>Score: {score.toLocaleString()}</p>

        <div style={styles.completionStatsStyle}>
          <StatBox label="Time" value={`${Math.floor(metrics.timeElapsed / 60)}:${String(metrics.timeElapsed % 60).padStart(2, '0')}`} />
          <StatBox label="Max Sway" value={`${Math.round(metrics.maxSway * 100)}%`} />
          <StatBox label="Accuracy" value={`${Math.round(metrics.accuracyScore)}%`} />
          <StatBox label="Damage" value={metrics.totalDamage.toString()} />
        </div>

        <div style={styles.completionActionsStyle}>
          <button style={styles.completeButtonStyle} onClick={onComplete}>Continue</button>
          <button style={styles.retryButtonStyle} onClick={onRetry}>Retry for Better Rank</button>
        </div>
      </div>
    </div>
  )
}

export function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statBoxStyle}>
      <span style={{ fontSize: '11px', color: '#888' }}>{label}</span>
      <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{value}</span>
    </div>
  )
}
