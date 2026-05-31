// =============================================================================
// MODE TOGGLE - Switch between Crane and Tugboat modes
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { createButtonStyles, GLASSMORPHISM } from '../DesignSystem'

export default function ModeToggle() {
  const operationMode = useGameStore((s) => s.operationMode)
  const setOperationMode = useGameStore((s) => s.setOperationMode)
  const [transitioning, setTransitioning] = useState(false)

  const handleToggle = useCallback(() => {
    if (transitioning) return
    if (operationMode === 'walking') return
    const nextMode = operationMode === 'crane' ? 'tugboat' : 'crane'
    setTransitioning(true)
    setOperationMode(nextMode)
    setTimeout(() => setTransitioning(false), 1500)
  }, [operationMode, transitioning, setOperationMode])

  // Keyboard shortcut: 'M' to toggle mode (only in crane mode; Q handles return)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        if (operationMode === 'walking') return
        // Don't steal focus from inputs
        const tag = document.activeElement?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        handleToggle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleToggle, operationMode])

  if (operationMode === 'walking') return null

  const isTugboat = operationMode === 'tugboat'

  return (
    <button
      onClick={handleToggle}
      disabled={transitioning}
      title={isTugboat ? 'Return to Crane (Q or M)' : 'Switch to Tugboat Captain (M)'}
      style={{
        ...createButtonStyles({ variant: 'secondary', size: 'sm', fullWidth: false }),
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 110,
        opacity: transitioning ? 0.5 : 1,
        cursor: transitioning ? 'wait' : 'pointer',
        padding: '10px 16px',
        fontSize: '14px',
        border: isTugboat
          ? '1px solid rgba(0, 212, 255, 0.5)'
          : '1px solid rgba(0, 212, 170, 0.4)',
        boxShadow: isTugboat
          ? '0 0 20px rgba(0, 212, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 0 12px rgba(0, 212, 170, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
        animation: !transitioning ? 'none' : undefined,
      }}
    >
      <span style={{ fontSize: '18px' }}>{isTugboat ? '🚤' : '🪝'}</span>
      <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
        {isTugboat ? 'Tugboat' : 'Crane'}
      </span>
      <span
        style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)',
          marginLeft: '6px',
          padding: '2px 5px',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '3px',
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        M
      </span>
    </button>
  )
}
