import { useGameStore } from '../store/useGameStore'
import { useCranePhysics } from './controls/useCranePhysics'
import JoystickControl from './controls/JoystickControl'

// =============================================================================
// INTERACTIVE CRANE CONTROLS — HarborGlow Arctic Edition
// Real-time joystick control with heated grip feedback.
// Physics loop and input logic live in useCranePhysics.
// =============================================================================

export default function InteractiveCraneControls() {
  const boothTier = useGameStore(state => state.boothTier)
  const isArctic = boothTier === 3

  const {
    cableDepth,
    loadTension,
    trolleyPosition,
    twistlockEngaged,
    isMoving,
    heaterActive,
    iceBuildup,
    weather,
  } = useGameStore(state => ({
    cableDepth: state.cableDepth,
    loadTension: state.loadTension,
    trolleyPosition: state.trolleyPosition,
    twistlockEngaged: state.twistlockEngaged,
    isMoving: state.isMoving,
    heaterActive: state.heaterActive,
    iceBuildup: state.iceBuildup,
    weather: state.weather,
  }))

  const {
    leftStick,
    rightStick,
    shake,
    handleJoystickStart,
    handleJoystickMove,
    handleJoystickEnd,
    toggleTwistlock,
  } = useCranePhysics(isArctic)

  const leftGripHeat = heaterActive ? 0.6 + leftStick.intensity * 0.4 : 0
  const rightGripHeat = heaterActive ? 0.6 + rightStick.intensity * 0.4 : 0

  // Ice level factoring in heater and weather
  const currentIceBuildup =
    weather === 'storm' && !heaterActive ? 0.5 :
    weather === 'rain' && !heaterActive ? 0.3 :
    heaterActive ? Math.max(0, iceBuildup - 0.1) :
    iceBuildup

  // ─── Standard (non-Arctic) control panel ────────────────────────────────────
  if (!isArctic) {
    return (
      <div className="absolute bottom-4 right-4 glass p-4 min-w-[240px] z-10 select-none">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">🏗️ Crane Controls</div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span>Trolley</span>
            <span className="text-cyan-300">{(trolleyPosition * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${trolleyPosition * 100}%` }} />
          </div>

          <div className="flex justify-between text-xs">
            <span>Cable</span>
            <span className="text-cyan-300">{cableDepth.toFixed(1)}m</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(cableDepth / 50) * 100}%` }} />
          </div>

          <div className="flex justify-between text-xs">
            <span>Load</span>
            <span className={loadTension > 30 ? 'text-red-400' : 'text-cyan-300'}>
              {loadTension.toFixed(1)}t
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${loadTension > 30 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${(loadTension / 50) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={toggleTwistlock}
          className={`w-full py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all ${
            twistlockEngaged ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
          }`}
        >
          {twistlockEngaged ? '🔒 Twistlock Engaged' : '🔓 Twistlock Disengaged'}
        </button>

        <div className="mt-3 pt-2 border-t border-gray-700 text-[10px] text-gray-500 grid grid-cols-2 gap-x-2">
          <span>← → Rotate</span>
          <span>↑ ↓ Trolley</span>
          <span>W/S Cable</span>
          <span>Click twistlock</span>
        </div>
      </div>
    )
  }

  // ─── Arctic Tier 3 Command Booth Interface ───────────────────────────────────
  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}
    >
      <JoystickControl
        side="left"
        label="X/Z Move"
        stick={leftStick}
        gripHeat={leftGripHeat}
        heaterActive={heaterActive}
        onStart={handleJoystickStart}
        onMove={handleJoystickMove}
        onEnd={handleJoystickEnd}
      />

      <JoystickControl
        side="right"
        label="Y/Rot"
        stick={rightStick}
        gripHeat={rightGripHeat}
        heaterActive={heaterActive}
        onStart={handleJoystickStart}
        onMove={handleJoystickMove}
        onEnd={handleJoystickEnd}
      />

      {/* Center Control Panel */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center gap-4 bg-gray-900/90 backdrop-blur-md border border-cyan-500/30 rounded-xl px-6 py-3">
          {/* Twistlock Button */}
          <button
            onClick={toggleTwistlock}
            className={`relative px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              twistlockEngaged
                ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(0,255,0,0.5)]'
                : 'bg-red-600 text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]'
            }`}
          >
            <span className="relative z-10">{twistlockEngaged ? '🔒 LOCKED' : '🔓 UNLOCKED'}</span>
            {currentIceBuildup > 0.1 && (
              <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,${currentIceBuildup * 0.3}) 0%, transparent 50%)`,
                  backdropFilter: `blur(${currentIceBuildup * 2}px)`,
                }}
              />
            )}
          </button>

          {/* Load Indicator */}
          <div className="w-32">
            <div className="flex justify-between text-[10px] text-cyan-400 mb-1">
              <span>LOAD</span>
              <span className={loadTension > 30 ? 'text-red-400' : ''}>{loadTension.toFixed(1)}t</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  loadTension > 30 ? 'bg-red-500 animate-pulse' : loadTension > 20 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${(loadTension / 50) * 100}%` }}
              />
            </div>
          </div>

          {/* Cable Depth */}
          <div className="w-24">
            <div className="flex justify-between text-[10px] text-cyan-400 mb-1">
              <span>DEPTH</span>
              <span>{cableDepth.toFixed(0)}m</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${(cableDepth / 50) * 100}%` }}
              />
            </div>
          </div>

          {isMoving && (
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#00ff00]" />
          )}
        </div>
      </div>

      {/* Frost overlay for Arctic feel */}
      {currentIceBuildup > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, rgba(200,220,255,${currentIceBuildup * 0.1}) 0%, transparent 50%)`,
            backdropFilter: `blur(${currentIceBuildup}px)`,
          }}
        />
      )}
    </div>
  )
}
