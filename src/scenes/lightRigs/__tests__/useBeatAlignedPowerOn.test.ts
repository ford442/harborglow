import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('tone', () => {
  const transport = {
    state: 'stopped',
    scheduleRepeat: vi.fn(),
    seconds: 0,
    bpm: { value: 120 }
  }

  return {
    getTransport: () => transport
  }
})

import { advanceBeatAlignedPowerOn, startBeatAlignedPowerOn } from '../useBeatAlignedPowerOn'

describe('beat-aligned power-on', () => {
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('falls back to the timeout path and advances the ramp ref', () => {
    vi.useFakeTimers()

    const progressRef = { current: 0 }
    const onStart = vi.fn(() => {
      progressRef.current = 0.1
    })
    const cleanup = startBeatAlignedPowerOn({
      transportStarted: false,
      beatOffset: 0.5,
      onStart,
      scheduleCue: vi.fn(),
      cancelCue: vi.fn()
    })

    expect(onStart).not.toHaveBeenCalled()
    vi.advanceTimersByTime(499)
    expect(onStart).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(progressRef.current).toBe(0.1)

    const next = advanceBeatAlignedPowerOn(progressRef, 0.5, 1)
    expect(next).toBeGreaterThan(0.1)

    cleanup()
  })

  it('cancels a pending fallback timeout on cleanup', () => {
    vi.useFakeTimers()

    const onStart = vi.fn()
    const cleanup = startBeatAlignedPowerOn({
      transportStarted: false,
      beatOffset: 1,
      onStart,
      scheduleCue: vi.fn(),
      cancelCue: vi.fn()
    })

    cleanup()
    vi.advanceTimersByTime(500)

    expect(onStart).not.toHaveBeenCalled()
  })
})
