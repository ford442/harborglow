import React from 'react';
import { TrainingStep } from '../../systems/trainingSystem';
import * as styles from './trainingHUDStyles';

// =============================================================================
// OBJECTIVE PANEL
// =============================================================================

interface ObjectivePanelProps {
  objectives: Array<{ id: string; title: string; description: string }>
  completed: string[]
}

export function ObjectivePanel({ objectives, completed }: ObjectivePanelProps) {
  return (
    <div style={styles.objectivePanelStyle}>
      <h4 style={styles.panelTitleStyle}>🎯 Objectives</h4>
      <div style={styles.objectivesListStyle}>
        {objectives.map((obj, index) => {
          const isCompleted = completed.includes(obj.id)
          return (
            <div
              key={obj.id}
              style={{
                ...styles.objectiveRowStyle,
                opacity: isCompleted ? 0.6 : 1,
                background: isCompleted ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.03)'
              }}
            >
              <span style={{
                ...styles.objectiveCheckStyle,
                background: isCompleted ? '#00d4aa' : '#333',
                color: isCompleted ? '#000' : '#666'
              }}>
                {isCompleted ? '✓' : index + 1}
              </span>
              <div style={styles.objectiveTextStyle}>
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
