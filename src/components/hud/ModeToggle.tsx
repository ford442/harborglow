// =============================================================================
// MODE TOGGLE - Switch between Crane and Tugboat modes
// =============================================================================

import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { createButtonStyles, GLASSMORPHISM } from '../DesignSystem'

export default function ModeToggle() {
  const operationMode = useGameStore((s) => s.operationMode)
  const setOperationMode = useGameStore((s) => s.setOperationMode)
  const [transitioning, setTransitioning] = useState(false)

  const handleClick = () => {
    if (transitioning) return
    const nextMode = operationMode === 'crane' ? 'tugboat' : 'crane'
    setTransitioning(true)
    setOperationMode(nextMode)
    setTimeout(() => setTransitioning(false), 1500)
  }

  const isTugboat = operationMode === 'tugboat'

  return (
    <button
      onClick={handleClick}
      disabled={transitioning}
      style={{
        ...createButtonStyles({ variant: 'secondary', size: 'sm', fullWidth: false }),
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 110,
        opacity: transitioning ? 0.5 : 1,
        cursor: transitioning ? 'wait' : 'pointer',
        border: isTugboat
          ? '1px solid rgba(0, 212, 255, 0.5)'
          : GLASSMORPHISM.border,
        boxShadow: isTugboat
          ? '0 0 20px rgba(0, 212, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
          : GLASSMORPHISM.boxShadow,
      }}
    >
      <span style={{ fontSize: '16px' }}>{isTugboat ? '🚤' : '🪝'}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
        {isTugboat ? 'Tugboat' : 'Crane'}
      </span>
      <span
        style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.5)',
          marginLeft: '4px',
          transition: 'transform 0.3s ease',
          transform: isTugboat ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      >
        ⇄
      </span>
    </button>
  )
}
