import React from 'react';
import { TrainingMetrics } from '../../systems/trainingSystem';
import * as styles from './trainingHUDStyles';

// =============================================================================
// METRICS PANEL
// =============================================================================

export function MetricsPanel({ metrics }: { metrics: TrainingMetrics }) {
  return (
    <div style={styles.metricsPanelStyle}>
      <h4 style={styles.panelTitleStyle}>📊 Performance</h4>

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

      <div style={styles.installProgressStyle}>
        <span style={{ fontSize: '11px', color: '#888' }}>Installations</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#00d4aa' }}>
          {metrics.installationsCompleted}/{metrics.installationsTarget}
        </span>
      </div>
    </div>
  )
}

export function MetricItem({ label, value, color, barValue, invert }: {
  label: string
  value: string
  color: string
  barValue: number
  invert?: boolean
}) {
  return (
    <div style={styles.metricItemStyle}>
      <div style={styles.metricHeaderStyle}>
        <span style={{ fontSize: '11px', color: '#888' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={styles.metricBarBgStyle}>
        <div style={{
          ...styles.metricBarFillStyle,
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

export function TimerDisplay({ elapsed }: { elapsed: number }) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div style={styles.timerStyle}>
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

export function ObjectiveCounter({ completed, total }: { completed: number; total: number }) {
  const percentage = total > 0 ? (completed / total) * 100 : 0

  return (
    <div style={styles.counterStyle}>
      <span style={{ fontSize: '10px', color: '#666' }}>PROGRESS</span>
      <div style={styles.counterBarStyle}>
        <div style={{ ...styles.counterFillStyle, width: `${percentage}%` }} />
      </div>
      <span style={{ fontSize: '12px', color: '#00d4aa' }}>{completed}/{total}</span>
    </div>
  )
}

// =============================================================================
// CROSSHAIR OVERLAY
// =============================================================================
