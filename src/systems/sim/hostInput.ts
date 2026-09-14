import { simScheduler } from './FixedStepScheduler'
import { applyReplayInput } from './applyInput'

type HostInputSink = (tick: number, action: string, payload: unknown) => void

let sink: HostInputSink | null = null

export function setHostInputBroadcast(fn: HostInputSink | null): void {
  sink = fn
}

export interface RecordHostInputOptions {
  /** Caller already applied the side effect (e.g. host install). Only log + broadcast. */
  alreadyApplied?: boolean
}

/**
 * Record into the input log. When recording (shared-harbor host), apply on the
 * tagged tick and broadcast. When not recording, apply immediately (solo).
 */
export function recordHostInput(
  action: string,
  payload: unknown = null,
  opts: RecordHostInputOptions = {},
): void {
  const tick = simScheduler.record(action, payload)
  if (tick == null) {
    if (!opts.alreadyApplied) {
      applyReplayInput({ tick: simScheduler.tick, action, payload })
    }
    return
  }
  if (!opts.alreadyApplied) {
    simScheduler.enqueueInput({ tick, action, payload })
  }
  sink?.(tick, action, payload)
}
