import React from 'react'
import { useGameStore } from '../store/useGameStore'

/**
 * HUD — top-left status panel showing current phase, ship info, and camera mode.
 * Also includes ship spawn buttons.
 */
export default function HUD() {
  const phase = useGameStore((s) => s.phase)
  const currentShip = useGameStore((s) => s.currentShip)
  const cameraMode = useGameStore((s) => s.cameraMode)
  const musicPlaying = useGameStore((s) => s.musicPlaying)
  const spawnShip = useGameStore((s) => s.spawnShip)
  const setCameraMode = useGameStore((s) => s.setCameraMode)

  const phaseColors: Record<string, string> = {
    IDLE: 'text-gray-400',
    SHIP_ARRIVING: 'text-yellow-400',
    SHIP_DOCKED: 'text-green-400',
    UPGRADING: 'text-blue-400',
    LIGHT_SHOW: 'text-pink-400',
  }

  return (
    <div className="absolute top-4 left-4 pointer-events-none select-none z-10">
      {/* Title */}
      <div className="glass p-3 mb-3">
        <h1 className="text-xl font-bold neon-text tracking-widest uppercase">
          ⚓ HarborGlow
        </h1>
        <p className="text-xs text-cyan-400 opacity-70 mt-0.5">Crane &amp; Light Show Simulator</p>
      </div>

      {/* Status */}
      <div className="glass p-3 mb-3 min-w-[220px]">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</div>
        <div className={`font-bold text-sm ${phaseColors[phase] ?? 'text-white'}`}>
          {phase.replace('_', ' ')}
        </div>
        {currentShip && (
          <div className="text-xs text-cyan-300 mt-1 truncate max-w-[200px]">
            {currentShip.label}
          </div>
        )}
        {musicPlaying && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-pink-400 animate-pulse">♪ Playing</span>
          </div>
        )}
      </div>

      {/* Camera selector */}
      <div className="glass p-3 mb-3 pointer-events-auto">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Camera</div>
        <div className="flex gap-1 flex-col">
          {(['GOD_MODE', 'CRANE_CAB', 'HOOK_CAM'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setCameraMode(m)}
              className={`text-xs px-2 py-1 rounded border transition-all ${
                cameraMode === m
                  ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                  : 'border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-500'
              }`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Spawn buttons */}
      {phase === 'IDLE' && (
        <div className="glass p-3 pointer-events-auto">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Spawn Ship</div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => spawnShip('CRUISE_LINER')}
              className="text-xs px-3 py-1.5 rounded bg-blue-900/60 border border-blue-500/40 text-blue-300 hover:bg-blue-800/60 transition-all"
            >
              🚢 Cruise Liner
            </button>
            <button
              onClick={() => spawnShip('CONTAINER_VESSEL')}
              className="text-xs px-3 py-1.5 rounded bg-yellow-900/60 border border-yellow-600/40 text-yellow-300 hover:bg-yellow-800/60 transition-all"
            >
              📦 Container Vessel
            </button>
            <button
              onClick={() => spawnShip('OIL_TANKER')}
              className="text-xs px-3 py-1.5 rounded bg-gray-900/60 border border-gray-600/40 text-gray-300 hover:bg-gray-800/60 transition-all"
            >
              🛢️ Oil Tanker
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
