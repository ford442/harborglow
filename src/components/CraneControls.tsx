import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// INTERACTIVE CRANE CONTROLS - HarborGlow Arctic Edition
// Real-time joystick control with heated grip feedback
// =============================================================================

interface JoystickState {
  active: boolean
  x: number
  y: number
  intensity: number
}

export default function InteractiveCraneControls() {
  const boothTier = useGameStore(state => state.boothTier)
  const isArctic = boothTier === 3
  
  // Crane state from store
  const {
    spreaderPos,
    spreaderRotation,
    cableDepth,
    loadTension,
    trolleyPosition,
    twistlockEngaged,
    isMoving,
    heaterActive,
    iceBuildup,
    weather,
  } = useGameStore(state => ({
    spreaderPos: state.spreaderPos,
    spreaderRotation: state.spreaderRotation,
    cableDepth: state.cableDepth,
    loadTension: state.loadTension,
    trolleyPosition: state.trolleyPosition,
    twistlockEngaged: state.twistlockEngaged,
    isMoving: state.isMoving,
    heaterActive: state.heaterActive,
    iceBuildup: state.iceBuildup,
    weather: state.weather,
  }))
  
  // Actions
  const {
    setSpreaderPos,
    setSpreaderRotation,
    setCableDepth,
    setLoadTension,
    setTrolleyPosition,
    setJoystickLeft,
    setJoystickRight,
    setTwistlockEngaged,
    setIsMoving,
  } = useGameStore(state => ({
    setSpreaderPos: state.setSpreaderPos,
    setSpreaderRotation: state.setSpreaderRotation,
    setCableDepth: state.setCableDepth,
    setLoadTension: state.setLoadTension,
    setTrolleyPosition: state.setTrolleyPosition,
    setJoystickLeft: state.setJoystickLeft,
    setJoystickRight: state.setJoystickRight,
    setTwistlockEngaged: state.setTwistlockEngaged,
    setIsMoving: state.setIsMoving,
  }))
  
  // Local joystick tracking
  const [leftStick, setLeftStick] = useState<JoystickState>({ active: false, x: 0, y: 0, intensity: 0 })
  const [rightStick, setRightStick] = useState<JoystickState>({ active: false, x: 0, y: 0, intensity: 0 })
  
  // Refs for animation loop
  const lastTimeRef = useRef(Date.now())
  const keysPressed = useRef<Set<string>>(new Set())
  
  // Screen shake effect for heavy loads
  const [shake, setShake] = useState({ x: 0, y: 0 })
  
  // Physics update loop (60fps)
  useEffect(() => {
    let animationId: number
    
    const updatePhysics = () => {
      const now = Date.now()
      const delta = Math.min((now - lastTimeRef.current) / 1000, 0.1) // Cap at 100ms
      lastTimeRef.current = now
      
      // Movement speed based on joystick input
      const moveSpeed = 10 * delta
      const rotSpeed = 2 * delta
      const cableSpeed = 8 * delta
      
      let moved = false
      let newTension = loadTension
      
      // Left joystick: X/Z movement (trolley + spreader swing)
      if (leftStick.active) {
        const newX = spreaderPos.x + leftStick.x * moveSpeed
        const newZ = spreaderPos.z + leftStick.y * moveSpeed
        setSpreaderPos({ ...spreaderPos, x: newX, z: newZ })
        setTrolleyPosition(Math.max(0, Math.min(1, 0.5 + newX / 40)))
        moved = true
        
        // Tension increases with movement
        newTension = Math.min(50, loadTension + Math.abs(leftStick.x) * 0.1)
      }
      
      // Right joystick: Y movement (cable) + rotation
      if (rightStick.active) {
        // Y axis controls cable depth
        const newDepth = Math.max(0, Math.min(50, cableDepth - rightStick.y * cableSpeed))
        setCableDepth(newDepth)
        setSpreaderPos({ ...spreaderPos, y: 20 - newDepth })
        
        // X axis controls spreader rotation
        if (rightStick.x !== 0) {
          setSpreaderRotation(spreaderRotation + rightStick.x * rotSpeed)
        }
        
        moved = true
        newTension = Math.min(50, newTension + Math.abs(rightStick.y) * 0.15)
      }
      
      // Keyboard fallback
      if (keysPressed.current.has('ArrowLeft')) {
        setSpreaderRotation(spreaderRotation - rotSpeed)
        moved = true
      }
      if (keysPressed.current.has('ArrowRight')) {
        setSpreaderRotation(spreaderRotation + rotSpeed)
        moved = true
      }
      if (keysPressed.current.has('ArrowUp')) {
        const newPos = Math.min(1, trolleyPosition + 0.02)
        setTrolleyPosition(newPos)
        setSpreaderPos({ ...spreaderPos, x: (newPos - 0.5) * 40 })
        moved = true
      }
      if (keysPressed.current.has('ArrowDown')) {
        const newPos = Math.max(0, trolleyPosition - 0.02)
        setTrolleyPosition(newPos)
        setSpreaderPos({ ...spreaderPos, x: (newPos - 0.5) * 40 })
        moved = true
      }
      if (keysPressed.current.has('w') || keysPressed.current.has('W')) {
        const newDepth = Math.max(0, cableDepth - cableSpeed)
        setCableDepth(newDepth)
        setSpreaderPos({ ...spreaderPos, y: 20 - newDepth })
        moved = true
        newTension = Math.min(50, newTension + 0.1)
      }
      if (keysPressed.current.has('s') || keysPressed.current.has('S')) {
        const newDepth = Math.min(50, cableDepth + cableSpeed)
        setCableDepth(newDepth)
        setSpreaderPos({ ...spreaderPos, y: 20 - newDepth })
        moved = true
        newTension = Math.max(0, newTension - 0.05)
      }
      
      // Apply tension changes
      if (newTension !== loadTension) {
        setLoadTension(newTension)
      }
      
      // Decay tension when not moving
      if (!moved && loadTension > 0) {
        setLoadTension(Math.max(0, loadTension - 0.5 * delta))
      }
      
      setIsMoving(moved)
      
      // Arctic haptic feedback: screen shake on heavy loads
      if (isArctic && loadTension > 30) {
        const shakeIntensity = (loadTension - 30) / 20
        setShake({
          x: (Math.random() - 0.5) * shakeIntensity * 4,
          y: (Math.random() - 0.5) * shakeIntensity * 4,
        })
      } else {
        setShake({ x: 0, y: 0 })
      }
      
      // Sync joystick state to store for dashboard
      if (leftStick.active) {
        setJoystickLeft({ x: leftStick.x, y: leftStick.y })
      }
      if (rightStick.active) {
        setJoystickRight({ x: rightStick.x, y: rightStick.y })
      }
      
      animationId = requestAnimationFrame(updatePhysics)
    }
    
    animationId = requestAnimationFrame(updatePhysics)
    return () => cancelAnimationFrame(animationId)
  }, [
    leftStick, rightStick, spreaderPos, spreaderRotation, cableDepth, loadTension,
    trolleyPosition, isArctic, setSpreaderPos, setSpreaderRotation, setCableDepth,
    setLoadTension, setTrolleyPosition, setJoystickLeft, setJoystickRight, setIsMoving,
  ])
  
  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key)
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  // Mouse/touch joystick handlers
  const handleJoystickStart = (side: 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const setStick = side === 'left' ? setLeftStick : setRightStick
    setStick(prev => ({ ...prev, active: true }))
  }
  
  const handleJoystickMove = (side: 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as React.MouseEvent).clientX
      clientY = (e as React.MouseEvent).clientY
    }
    
    const x = Math.max(-1, Math.min(1, (clientX - centerX) / (rect.width / 2)))
    const y = Math.max(-1, Math.min(1, -(clientY - centerY) / (rect.height / 2)))
    const intensity = Math.min(1, Math.sqrt(x * x + y * y))
    
    const setStick = side === 'left' ? setLeftStick : setRightStick
    setStick({ active: true, x, y, intensity })
  }
  
  const handleJoystickEnd = (side: 'left' | 'right') => {
    const setStick = side === 'left' ? setLeftStick : setRightStick
    setStick({ active: false, x: 0, y: 0, intensity: 0 })
    if (side === 'left') setJoystickLeft({ x: 0, y: 0 })
    else setJoystickRight({ x: 0, y: 0 })
  }
  
  // Toggle twistlock
  const toggleTwistlock = () => {
    setTwistlockEngaged(!twistlockEngaged)
  }
  
  // Calculate heated grip glow intensity
  const leftGripHeat = heaterActive ? 0.6 + leftStick.intensity * 0.4 : 0
  const rightGripHeat = heaterActive ? 0.6 + rightStick.intensity * 0.4 : 0
  
  // Ice buildup based on weather and heater state
  const currentIceBuildup = weather === 'storm' && !heaterActive ? 0.5 : 
                            weather === 'rain' && !heaterActive ? 0.3 : 
                            heaterActive ? Math.max(0, iceBuildup - 0.1) : iceBuildup
  
  if (!isArctic) {
    // Standard non-Arctic control panel
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
            <span className={`${loadTension > 30 ? 'text-red-400' : 'text-cyan-300'}`}>{loadTension.toFixed(1)}t</span>
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
  
  // Arctic Tier 3 Command Booth Interface
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50"
      style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}
    >
      {/* Left Joystick (Virtual) */}
      <div 
        className="absolute bottom-8 left-8 pointer-events-auto"
        onMouseDown={(e) => handleJoystickStart('left', e)}
        onMouseMove={(e) => leftStick.active && handleJoystickMove('left', e)}
        onMouseUp={() => handleJoystickEnd('left')}
        onMouseLeave={() => handleJoystickEnd('left')}
        onTouchStart={(e) => handleJoystickStart('left', e)}
        onTouchMove={(e) => handleJoystickMove('left', e)}
        onTouchEnd={() => handleJoystickEnd('left')}
      >
        <div className="relative w-32 h-32 rounded-full bg-gray-900/80 border-2 border-cyan-500/50 backdrop-blur-sm">
          {/* Heated grip glow */}
          <div 
            className="absolute inset-0 rounded-full transition-opacity duration-100"
            style={{ 
              background: `radial-gradient(circle, rgba(255,100,0,${leftGripHeat * 0.5}) 0%, transparent 70%)`,
              opacity: leftGripHeat 
            }}
          />
          {/* Joystick handle */}
          <div 
            className="absolute w-12 h-12 rounded-full bg-gradient-to-b from-gray-600 to-gray-800 border border-gray-500 transition-transform"
            style={{ 
              left: '50%', 
              top: '50%', 
              transform: `translate(calc(-50% + ${leftStick.x * 30}px), calc(-50% - ${leftStick.y * 30}px))`,
              boxShadow: heaterActive ? `0 0 ${10 + leftStick.intensity * 20}px rgba(255,100,0,${leftGripHeat})` : 'none'
            }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-600/50 to-transparent opacity-50" />
          </div>
          {/* Labels */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-cyan-400 uppercase tracking-wider">X/Z Move</div>
        </div>
      </div>
      
      {/* Right Joystick (Virtual) */}
      <div 
        className="absolute bottom-8 right-8 pointer-events-auto"
        onMouseDown={(e) => handleJoystickStart('right', e)}
        onMouseMove={(e) => rightStick.active && handleJoystickMove('right', e)}
        onMouseUp={() => handleJoystickEnd('right')}
        onMouseLeave={() => handleJoystickEnd('right')}
        onTouchStart={(e) => handleJoystickStart('right', e)}
        onTouchMove={(e) => handleJoystickMove('right', e)}
        onTouchEnd={() => handleJoystickEnd('right')}
      >
        <div className="relative w-32 h-32 rounded-full bg-gray-900/80 border-2 border-cyan-500/50 backdrop-blur-sm">
          {/* Heated grip glow */}
          <div 
            className="absolute inset-0 rounded-full transition-opacity duration-100"
            style={{ 
              background: `radial-gradient(circle, rgba(255,100,0,${rightGripHeat * 0.5}) 0%, transparent 70%)`,
              opacity: rightGripHeat 
            }}
          />
          {/* Joystick handle */}
          <div 
            className="absolute w-12 h-12 rounded-full bg-gradient-to-b from-gray-600 to-gray-800 border border-gray-500 transition-transform"
            style={{ 
              left: '50%', 
              top: '50%', 
              transform: `translate(calc(-50% + ${rightStick.x * 30}px), calc(-50% - ${rightStick.y * 30}px))`,
              boxShadow: heaterActive ? `0 0 ${10 + rightStick.intensity * 20}px rgba(255,100,0,${rightGripHeat})` : 'none'
            }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-600/50 to-transparent opacity-50" />
          </div>
          {/* Labels */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-cyan-400 uppercase tracking-wider">Y/Rot</div>
        </div>
      </div>
      
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
            {/* Ice buildup overlay */}
            {currentIceBuildup > 0.1 && (
              <div 
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{ 
                  background: `linear-gradient(135deg, rgba(255,255,255,${currentIceBuildup * 0.3}) 0%, transparent 50%)`,
                  backdropFilter: `blur(${currentIceBuildup * 2}px)`
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
          
          {/* Movement indicator */}
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
            backdropFilter: `blur(${currentIceBuildup}px)`
          }}
        />
      )}
    </div>
  )
}
