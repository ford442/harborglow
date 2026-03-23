import React from 'react'
import { JoystickState } from './useCranePhysics'

// =============================================================================
// JOYSTICK CONTROL — Reusable virtual joystick widget for Arctic controls
// =============================================================================

interface JoystickControlProps {
  side: 'left' | 'right'
  label: string
  stick: JoystickState
  gripHeat: number
  heaterActive: boolean
  onStart: (side: 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => void
  onMove: (side: 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => void
  onEnd: (side: 'left' | 'right') => void
}

export default function JoystickControl({
  side,
  label,
  stick,
  gripHeat,
  heaterActive,
  onStart,
  onMove,
  onEnd,
}: JoystickControlProps) {
  const positionClass = side === 'left' ? 'absolute bottom-8 left-8' : 'absolute bottom-8 right-8'

  return (
    <div
      className={`${positionClass} pointer-events-auto`}
      onMouseDown={(e) => onStart(side, e)}
      onMouseMove={(e) => stick.active && onMove(side, e)}
      onMouseUp={() => onEnd(side)}
      onMouseLeave={() => onEnd(side)}
      onTouchStart={(e) => onStart(side, e)}
      onTouchMove={(e) => onMove(side, e)}
      onTouchEnd={() => onEnd(side)}
    >
      <div className="relative w-32 h-32 rounded-full bg-gray-900/80 border-2 border-cyan-500/50 backdrop-blur-sm">
        {/* Heated grip glow */}
        <div
          className="absolute inset-0 rounded-full transition-opacity duration-100"
          style={{
            background: `radial-gradient(circle, rgba(255,100,0,${gripHeat * 0.5}) 0%, transparent 70%)`,
            opacity: gripHeat,
          }}
        />

        {/* Joystick handle */}
        <div
          className="absolute w-12 h-12 rounded-full bg-gradient-to-b from-gray-600 to-gray-800 border border-gray-500 transition-transform"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${stick.x * 30}px), calc(-50% - ${stick.y * 30}px))`,
            boxShadow: heaterActive
              ? `0 0 ${10 + stick.intensity * 20}px rgba(255,100,0,${gripHeat})`
              : 'none',
          }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-600/50 to-transparent opacity-50" />
        </div>

        {/* Axis label */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-cyan-400 uppercase tracking-wider">
          {label}
        </div>
      </div>
    </div>
  )
}
