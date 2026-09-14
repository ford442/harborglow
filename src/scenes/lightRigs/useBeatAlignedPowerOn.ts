import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { transport } from '../../systems/audio/transport'
import { sequencerSystem } from '../../systems/sequencerSystem'

const POWER_ON_START_LEVEL = 0.1
const FALLBACK_START_DELAY_MS = 500

type ScheduleCue = (beatOffset: number, fn: () => void) => number
type CancelCue = (id: number) => void

export interface BeatAlignedPowerOnResult {
  progressRef: MutableRefObject<number>
  isPoweredOn: boolean
}

interface StartBeatAlignedPowerOnArgs {
  transportStarted: boolean
  beatOffset: number
  onStart: () => void
  scheduleCue: ScheduleCue
  cancelCue: CancelCue
  setTimeoutFn?: typeof setTimeout
  clearTimeoutFn?: typeof clearTimeout
}

export function startBeatAlignedPowerOn({
  transportStarted,
  beatOffset,
  onStart,
  scheduleCue,
  cancelCue,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout
}: StartBeatAlignedPowerOnArgs): () => void {
  if (transportStarted) {
    // Sequencer cues already fire on the main thread, so no draw scheduling is needed.
    const cueId = scheduleCue(beatOffset, onStart)

    return () => cancelCue(cueId)
  }

  const timeoutId = setTimeoutFn(onStart, FALLBACK_START_DELAY_MS)
  return () => clearTimeoutFn(timeoutId)
}

export function advanceBeatAlignedPowerOn(
  progressRef: MutableRefObject<number>,
  delta: number,
  rampDurationSec: number
): number {
  if (progressRef.current <= 0 || progressRef.current >= 1) {
    return progressRef.current
  }

  const rampSpan = 1 - POWER_ON_START_LEVEL
  const next = Math.min(
    1,
    progressRef.current + (delta / Math.max(rampDurationSec, 0.0001)) * rampSpan
  )
  progressRef.current = next
  return next
}

export function useBeatAlignedPowerOn(
  installProgress: number,
  installed: boolean,
  beatOffset: number,
  rampDurationSec: number
): BeatAlignedPowerOnResult {
  const progressRef = useRef<number>(installed || installProgress >= 1 ? 1 : 0)
  const [isPoweredOn, setIsPoweredOn] = useState(installed || installProgress >= 1)
  const powerStartedRef = useRef(isPoweredOn)
  const rampActiveRef = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const powerReady = installed || installProgress >= 1

    if (!powerReady) {
      cleanupRef.current?.()
      cleanupRef.current = null
      powerStartedRef.current = false
      rampActiveRef.current = false
      progressRef.current = 0
      setIsPoweredOn(false)
      return
    }

    if (powerStartedRef.current) return

    const beginRamp = () => {
      if (powerStartedRef.current) return

      powerStartedRef.current = true
      rampActiveRef.current = true
      progressRef.current = POWER_ON_START_LEVEL
      setIsPoweredOn(true)
    }

    cleanupRef.current = startBeatAlignedPowerOn({
      transportStarted: transport.state === 'started',
      beatOffset,
      onStart: beginRamp,
      scheduleCue: (offset, fn) => sequencerSystem.schedule(offset, fn),
      cancelCue: id => sequencerSystem.cancel(id)
    })
  }, [beatOffset, installProgress, installed])

  useFrame((_, delta) => {
    if (!rampActiveRef.current) return

    const next = advanceBeatAlignedPowerOn(progressRef, delta, rampDurationSec)
    if (next >= 1) {
      rampActiveRef.current = false
    }
  })

  useEffect(() => {
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [])

  return { progressRef, isPoweredOn }
}
