import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../store/useGameStore'
import {
  type CraneAxes,
  quantizeCraneAxes,
  craneAxesEqual,
  getCraneAxes,
  setCraneAxes,
} from '../../systems/cranePhysics'
import { recordHostInput } from '../../systems/sim/hostInput'

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

function sampleFromControls(
  leftStick: JoystickState,
  rightStick: JoystickState,
  keys: Set<string>,
  twistlock: boolean,
): CraneAxes {
  return quantizeCraneAxes({
    leftX: leftStick.x,
    leftY: leftStick.y,
    leftActive: leftStick.active,
    rightX: rightStick.x,
    rightY: rightStick.y,
    rightActive: rightStick.active,
    arrowLeft: keys.has('ArrowLeft'),
    arrowRight: keys.has('ArrowRight'),
    arrowUp: keys.has('ArrowUp'),
    arrowDown: keys.has('ArrowDown'),
    winchIn: keys.has('w') || keys.has('W'),
    winchOut: keys.has('s') || keys.has('S'),
    twistlock,
  })
}

export function useCranePhysics(isArctic: boolean): UseCranePhysicsResult {
  const multiplayerRole = useGameStore(state => state.multiplayerRole)
  const isSpectator = multiplayerRole === 'spectator'
  const twistlockEngaged = useGameStore(state => state.twistlockEngaged)
  const loadTension = useGameStore(state => state.loadTension)

  const [leftStick, setLeftStick] = useState<JoystickState>({ active: false, x: 0, y: 0, intensity: 0 })
  const [rightStick, setRightStick] = useState<JoystickState>({ active: false, x: 0, y: 0, intensity: 0 })
  const [shake, setShake] = useState({ x: 0, y: 0 })

  const keysPressed = useRef<Set<string>>(new Set())
  const lastSentAxes = useRef<CraneAxes | null>(null)
  const twistlockRef = useRef(twistlockEngaged)
  twistlockRef.current = twistlockEngaged

  useEffect(() => {
    if (isSpectator) return

    let animationId: number

    const sampleAxes = () => {
      const next = sampleFromControls(
        leftStick,
        rightStick,
        keysPressed.current,
        twistlockRef.current,
      )
      setCraneAxes(next)
      const prev = lastSentAxes.current
      if (!prev || !craneAxesEqual(prev, next)) {
        lastSentAxes.current = next
        recordHostInput('crane.axes', next)
      }

      if (isArctic && loadTension > 30) {
        const intensity = (loadTension - 30) / 20
        setShake({
          x: (Math.random() - 0.5) * intensity * 4,
          y: (Math.random() - 0.5) * intensity * 4,
        })
      } else {
        setShake({ x: 0, y: 0 })
      }

      animationId = requestAnimationFrame(sampleAxes)
    }

    animationId = requestAnimationFrame(sampleAxes)
    return () => cancelAnimationFrame(animationId)
  }, [isSpectator, leftStick, rightStick, loadTension, isArctic])

  useEffect(() => {
    if (isSpectator) return
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.key)
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isSpectator])

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
    if (side === 'left') useGameStore.getState().setJoystickLeft({ x: 0, y: 0 })
    else useGameStore.getState().setJoystickRight({ x: 0, y: 0 })
  }

  const toggleTwistlock = () => {
    const next = !twistlockRef.current
    twistlockRef.current = next
    useGameStore.getState().setTwistlockEngaged(next)
    const axes = quantizeCraneAxes({ ...getCraneAxes(), twistlock: next })
    setCraneAxes(axes)
    lastSentAxes.current = axes
    recordHostInput('crane.axes', axes)
  }

  if (isSpectator) {
    return {
      leftStick: { active: false, x: 0, y: 0, intensity: 0 },
      rightStick: { active: false, x: 0, y: 0, intensity: 0 },
      shake: { x: 0, y: 0 },
      handleJoystickStart: () => {},
      handleJoystickMove: () => {},
      handleJoystickEnd: () => {},
      toggleTwistlock: () => {},
    }
  }

  return { leftStick, rightStick, shake, handleJoystickStart, handleJoystickMove, handleJoystickEnd, toggleTwistlock }
}
