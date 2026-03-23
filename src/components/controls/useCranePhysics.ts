import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../store/useGameStore'

// =============================================================================
// USE CRANE PHYSICS — Custom hook encapsulating the 60fps physics update loop,
// keyboard input handling, joystick state, and screen shake logic.
// =============================================================================

export interface JoystickState {
  active: boolean
  x: number
  y: number
  intensity: number
}

interface UseCranePhysicsResult {
  leftStick: JoystickState
  rightStick: JoystickState
  shake: { x: number; y: number }
  handleJoystickStart: (side: 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => void
  handleJoystickMove: (side: 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => void
  handleJoystickEnd: (side: 'left' | 'right') => void
  toggleTwistlock: () => void
}

export function useCranePhysics(isArctic: boolean): UseCranePhysicsResult {
  const {
    spreaderPos,
    spreaderRotation,
    cableDepth,
    loadTension,
    trolleyPosition,
    twistlockEngaged,
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
    spreaderPos: state.spreaderPos,
    spreaderRotation: state.spreaderRotation,
    cableDepth: state.cableDepth,
    loadTension: state.loadTension,
    trolleyPosition: state.trolleyPosition,
    twistlockEngaged: state.twistlockEngaged,
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

  const [leftStick, setLeftStick] = useState<JoystickState>({ active: false, x: 0, y: 0, intensity: 0 })
  const [rightStick, setRightStick] = useState<JoystickState>({ active: false, x: 0, y: 0, intensity: 0 })
  const [shake, setShake] = useState({ x: 0, y: 0 })

  const lastTimeRef = useRef(Date.now())
  const keysPressed = useRef<Set<string>>(new Set())

  // Physics update loop (60fps)
  useEffect(() => {
    let animationId: number

    const updatePhysics = () => {
      const now = Date.now()
      const delta = Math.min((now - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = now

      const moveSpeed = 10 * delta
      const rotSpeed = 2 * delta
      const cableSpeed = 8 * delta

      let moved = false
      let newTension = loadTension

      if (leftStick.active) {
        const newX = spreaderPos.x + leftStick.x * moveSpeed
        const newZ = spreaderPos.z + leftStick.y * moveSpeed
        setSpreaderPos({ ...spreaderPos, x: newX, z: newZ })
        setTrolleyPosition(Math.max(0, Math.min(1, 0.5 + newX / 40)))
        moved = true
        newTension = Math.min(50, loadTension + Math.abs(leftStick.x) * 0.1)
      }

      if (rightStick.active) {
        const newDepth = Math.max(0, Math.min(50, cableDepth - rightStick.y * cableSpeed))
        setCableDepth(newDepth)
        setSpreaderPos({ ...spreaderPos, y: 20 - newDepth })
        if (rightStick.x !== 0) {
          setSpreaderRotation(spreaderRotation + rightStick.x * rotSpeed)
        }
        moved = true
        newTension = Math.min(50, newTension + Math.abs(rightStick.y) * 0.15)
      }

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

      if (newTension !== loadTension) setLoadTension(newTension)
      if (!moved && loadTension > 0) setLoadTension(Math.max(0, loadTension - 0.5 * delta))

      setIsMoving(moved)

      if (isArctic && loadTension > 30) {
        const intensity = (loadTension - 30) / 20
        setShake({
          x: (Math.random() - 0.5) * intensity * 4,
          y: (Math.random() - 0.5) * intensity * 4,
        })
      } else {
        setShake({ x: 0, y: 0 })
      }

      if (leftStick.active) setJoystickLeft({ x: leftStick.x, y: leftStick.y })
      if (rightStick.active) setJoystickRight({ x: rightStick.x, y: rightStick.y })

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
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.key)
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

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

    let clientX: number, clientY: number
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

  const toggleTwistlock = () => setTwistlockEngaged(!twistlockEngaged)

  return { leftStick, rightStick, shake, handleJoystickStart, handleJoystickMove, handleJoystickEnd, toggleTwistlock }
}
