import { useGameStore } from '../store/useGameStore'

export interface CraneAxes {
  leftX: number
  leftY: number
  leftActive: boolean
  rightX: number
  rightY: number
  rightActive: boolean
  arrowLeft: boolean
  arrowRight: boolean
  arrowUp: boolean
  arrowDown: boolean
  winchIn: boolean
  winchOut: boolean
  twistlock: boolean
}

export const IDLE_CRANE_AXES: CraneAxes = {
  leftX: 0,
  leftY: 0,
  leftActive: false,
  rightX: 0,
  rightY: 0,
  rightActive: false,
  arrowLeft: false,
  arrowRight: false,
  arrowUp: false,
  arrowDown: false,
  winchIn: false,
  winchOut: false,
  twistlock: false,
}

let currentAxes: CraneAxes = { ...IDLE_CRANE_AXES }

export function getCraneAxes(): CraneAxes {
  return currentAxes
}

export function setCraneAxes(axes: CraneAxes): void {
  currentAxes = axes
}

export function resetCraneAxes(): void {
  currentAxes = { ...IDLE_CRANE_AXES }
}

export function quantizeCraneAxes(axes: CraneAxes): CraneAxes {
  const q = (n: number) => Math.round(n * 1000) / 1000
  return {
    ...axes,
    leftX: q(axes.leftX),
    leftY: q(axes.leftY),
    rightX: q(axes.rightX),
    rightY: q(axes.rightY),
  }
}

export function craneAxesEqual(a: CraneAxes, b: CraneAxes): boolean {
  return (
    a.leftX === b.leftX &&
    a.leftY === b.leftY &&
    a.leftActive === b.leftActive &&
    a.rightX === b.rightX &&
    a.rightY === b.rightY &&
    a.rightActive === b.rightActive &&
    a.arrowLeft === b.arrowLeft &&
    a.arrowRight === b.arrowRight &&
    a.arrowUp === b.arrowUp &&
    a.arrowDown === b.arrowDown &&
    a.winchIn === b.winchIn &&
    a.winchOut === b.winchOut &&
    a.twistlock === b.twistlock
  )
}

/** Integrate crane kinematics at SIM_DT. Cosmetic shake stays in the React hook. */
export function stepCrane(dt: number, axes: CraneAxes = currentAxes): void {
  const store = useGameStore.getState()
  const {
    spreaderPos,
    spreaderRotation,
    cableDepth,
    loadTension,
    trolleyPosition,
    winchSpeed,
    setSpreaderPos,
    setSpreaderRotation,
    setCableDepth,
    setLoadTension,
    setTrolleyPosition,
    setJoystickLeft,
    setJoystickRight,
    setTwistlockEngaged,
    setIsMoving,
  } = store

  const moveSpeed = 10 * dt
  const rotSpeed = 2 * dt
  const cableSpeed = 8 * dt * winchSpeed

  let moved = false
  let newTension = loadTension
  let pos = { ...spreaderPos }
  let rotation = spreaderRotation
  let depth = cableDepth
  let trolley = trolleyPosition

  if (axes.leftActive) {
    pos = {
      ...pos,
      x: pos.x + axes.leftX * moveSpeed,
      z: pos.z + axes.leftY * moveSpeed,
    }
    trolley = Math.max(0, Math.min(1, 0.5 + pos.x / 40))
    moved = true
    newTension = Math.min(50, loadTension + Math.abs(axes.leftX) * 0.1)
  }

  if (axes.rightActive) {
    depth = Math.max(0, Math.min(50, depth - axes.rightY * cableSpeed))
    pos = { ...pos, y: 20 - depth }
    if (axes.rightX !== 0) {
      rotation += axes.rightX * rotSpeed
    }
    moved = true
    newTension = Math.min(50, newTension + Math.abs(axes.rightY) * 0.15)
  }

  if (axes.arrowLeft) {
    rotation -= rotSpeed
    moved = true
  }
  if (axes.arrowRight) {
    rotation += rotSpeed
    moved = true
  }
  if (axes.arrowUp) {
    trolley = Math.min(1, trolley + 0.02)
    pos = { ...pos, x: (trolley - 0.5) * 40 }
    moved = true
  }
  if (axes.arrowDown) {
    trolley = Math.max(0, trolley - 0.02)
    pos = { ...pos, x: (trolley - 0.5) * 40 }
    moved = true
  }
  if (axes.winchIn) {
    depth = Math.max(0, depth - cableSpeed)
    pos = { ...pos, y: 20 - depth }
    moved = true
    newTension = Math.min(50, newTension + 0.1)
  }
  if (axes.winchOut) {
    depth = Math.min(50, depth + cableSpeed)
    pos = { ...pos, y: 20 - depth }
    moved = true
    newTension = Math.max(0, newTension - 0.05)
  }

  if (!moved && loadTension > 0) {
    newTension = Math.max(0, loadTension - 0.5 * dt)
  }

  if (pos.x !== spreaderPos.x || pos.y !== spreaderPos.y || pos.z !== spreaderPos.z) {
    setSpreaderPos(pos)
  }
  if (rotation !== spreaderRotation) setSpreaderRotation(rotation)
  if (depth !== cableDepth) setCableDepth(depth)
  if (trolley !== trolleyPosition) setTrolleyPosition(trolley)
  if (newTension !== loadTension) setLoadTension(newTension)
  setIsMoving(moved)
  setTwistlockEngaged(axes.twistlock)

  if (axes.leftActive) setJoystickLeft({ x: axes.leftX, y: axes.leftY })
  else setJoystickLeft({ x: 0, y: 0 })
  if (axes.rightActive) setJoystickRight({ x: axes.rightX, y: axes.rightY })
  else setJoystickRight({ x: 0, y: 0 })
}
