import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'

// =============================================================================
// USE MUSIC PULSE — Beat-reactive pulse value for UI animations
// Returns 0-1 that pulses to the beat when Tone.Transport is running,
// or a gentle ambient sine wave when stopped.
// =============================================================================

export function useMusicPulse(bpm: number = 120): number {
  const [pulse, setPulse] = useState(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    let animationId: number

    const updatePulse = () => {
      const now = performance.now() / 1000

      if (Tone.Transport.state === 'started') {
        // Sync to transport beat
        const transportSeconds = Tone.Transport.seconds
        const beatDuration = 60 / bpm
        const phase = (transportSeconds % beatDuration) / beatDuration
        // Sharp attack, exponential decay — feels like a kick drum
        const beatPulse = Math.exp(-phase * 4) * Math.cos(phase * Math.PI * 0.5)
        setPulse(Math.max(0, Math.min(1, beatPulse)))
      } else {
        // Gentle ambient sine wave ~1Hz when stopped
        if (startTimeRef.current === 0) startTimeRef.current = now
        const ambient = Math.sin((now - startTimeRef.current) * Math.PI * 2) * 0.5 + 0.5
        setPulse(ambient * 0.3) // subdued 0-0.3 range
      }

      animationId = requestAnimationFrame(updatePulse)
    }

    animationId = requestAnimationFrame(updatePulse)
    return () => cancelAnimationFrame(animationId)
  }, [bpm])

  return pulse
}
