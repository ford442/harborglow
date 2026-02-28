import React, { useEffect, useCallback } from 'react'
import { useGameStore } from '../store/useGameStore'
import { useControls } from 'leva'

/**
 * CraneControls — bottom-right panel for controlling the quay crane.
 * Keyboard shortcuts: Arrow keys = rotate/trolley, W/S = rope up/down.
 * Also exposes a Leva sub-panel for fine-tuning.
 */
export default function CraneControls() {
  const crane = useGameStore((s) => s.crane)
  const setCraneRotation = useGameStore((s) => s.setCraneRotation)
  const setCraneTrolley = useGameStore((s) => s.setCraneTrolley)
  const setCraneRope = useGameStore((s) => s.setCraneRope)
  const craneSpeed = useGameStore((s) => s.craneSpeed)

  // Leva panel
  useControls('Crane', {
    windStrength: { value: 3, min: 0, max: 20, step: 0.5 },
    lightSyncStrength: { value: 0.8, min: 0, max: 1, step: 0.05 },
  })

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const step = 0.02 * craneSpeed
      switch (e.key) {
        case 'ArrowLeft':
          setCraneRotation(crane.rotation - step * 0.5)
          break
        case 'ArrowRight':
          setCraneRotation(crane.rotation + step * 0.5)
          break
        case 'ArrowUp':
          setCraneTrolley(Math.min(1, crane.trolleyPos + step))
          break
        case 'ArrowDown':
          setCraneTrolley(Math.max(0, crane.trolleyPos - step))
          break
        case 'w':
        case 'W':
          setCraneRope(Math.min(1, crane.ropeLength + step))
          break
        case 's':
        case 'S':
          setCraneRope(Math.max(0, crane.ropeLength - step))
          break
      }
    },
    [crane, craneSpeed, setCraneRotation, setCraneTrolley, setCraneRope]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <div className="absolute bottom-4 right-4 glass p-3 min-w-[200px] z-10 select-none">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">🏗️ Crane Controls</div>

      {/* Visual indicators */}
      <div className="space-y-1.5">
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-0.5">
            <span>Rotation</span>
            <span className="text-cyan-300">{((crane.rotation * 180) / Math.PI).toFixed(1)}°</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all"
              style={{ width: `${((crane.rotation / (Math.PI * 2) + 1) % 1) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-0.5">
            <span>Trolley</span>
            <span className="text-cyan-300">{(crane.trolleyPos * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${crane.trolleyPos * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-0.5">
            <span>Rope</span>
            <span className="text-cyan-300">{(crane.ropeLength * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${crane.ropeLength * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="mt-2 pt-2 border-t border-gray-800 text-[10px] text-gray-600 grid grid-cols-2 gap-x-2">
        <span>← → Rotate</span>
        <span>↑ ↓ Trolley</span>
        <span>W/S Rope</span>
      </div>
    </div>
  )
}
