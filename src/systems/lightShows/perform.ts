// =============================================================================
// PERFORM — map pads, joystick, and throttle to cue triggers.
// Quantize is "the next 1/8 or 1/16" on the sim beat clock. Scoring is a
// pure function of that clock so a replay awards the same bonus.
// =============================================================================

import type { LightCuePattern, RigGroupId } from './types'

export type PerformQuantize = '1/8' | '1/16'
export type PerformSource = 'pad' | 'joystick' | 'throttle'

export const PERFORM_QUANTUM: Record<PerformQuantize, number> = {
  '1/8': 0.5,
  '1/16': 0.25,
}

export interface PerformTuning {
  quantize: PerformQuantize
  accuracyWeight: number
  varietyWeight: number
  creditScale: number
  reputationScale: number
}

export const DEFAULT_PERFORM_TUNING: PerformTuning = {
  quantize: '1/8',
  accuracyWeight: 1,
  varietyWeight: 1,
  creditScale: 40,
  reputationScale: 8,
}

let tuning: PerformTuning = { ...DEFAULT_PERFORM_TUNING }

export function getPerformTuning(): PerformTuning {
  return tuning
}

export function setPerformTuning(partial: Partial<PerformTuning>): void {
  tuning = { ...tuning, ...partial }
}

export function resetPerformTuning(): void {
  tuning = { ...DEFAULT_PERFORM_TUNING }
}

const PAD_CUES: Record<string, { pattern: LightCuePattern; target: RigGroupId | 'all' }> = {
  '1': { pattern: 'breathe', target: 'funnel' },
  '2': { pattern: 'sweep', target: 'hullStrip' },
  '3': { pattern: 'strobe', target: 'mast' },
  '4': { pattern: 'snap', target: 'deck' },
  '5': { pattern: 'blackout', target: 'all' },
}

export function cueFromPad(key: string): { pattern: LightCuePattern; target: RigGroupId | 'all' } | null {
  return PAD_CUES[key] ?? null
}

const AXIS_THRESHOLD = 0.6

export function cueFromJoystick(
  prev: { x: number; y: number },
  next: { x: number; y: number },
): { pattern: LightCuePattern; target: RigGroupId | 'all' } | null {
  if (prev.y < AXIS_THRESHOLD && next.y >= AXIS_THRESHOLD) return { pattern: 'strobe', target: 'mast' }
  if (prev.y > -AXIS_THRESHOLD && next.y <= -AXIS_THRESHOLD) return { pattern: 'snap', target: 'deck' }
  if (prev.x < AXIS_THRESHOLD && next.x >= AXIS_THRESHOLD) return { pattern: 'sweep', target: 'hullStrip' }
  if (prev.x > -AXIS_THRESHOLD && next.x <= -AXIS_THRESHOLD) return { pattern: 'breathe', target: 'funnel' }
  return null
}

const THROTTLE_GATES: readonly { at: number; pattern: LightCuePattern; target: RigGroupId | 'all' }[] = [
  { at: 0.34, pattern: 'sweep', target: 'all' },
  { at: 0.67, pattern: 'strobe', target: 'gantry' },
  { at: 0.9, pattern: 'snap', target: 'bridge' },
]

export function cuesFromThrottle(
  prev: number,
  next: number,
): { pattern: LightCuePattern; target: RigGroupId | 'all' }[] {
  const hits: { pattern: LightCuePattern; target: RigGroupId | 'all' }[] = []
  if (next <= prev) return hits
  for (const gate of THROTTLE_GATES) {
    if (prev < gate.at && next >= gate.at) hits.push({ pattern: gate.pattern, target: gate.target })
  }
  return hits
}

/** Next grid line at or after `beat`. An exact hit stays on that line. */
export function nextQuantizedBeat(beat: number, quantum: number): number {
  if (!(quantum > 0) || !Number.isFinite(beat)) return 0
  const steps = Math.ceil(beat / quantum - 1e-9)
  return Math.round(Math.max(0, steps) * quantum * 1000) / 1000
}

export function scoreHit(args: {
  rawBeat: number
  quantizedBeat: number
  quantum: number
  pattern: LightCuePattern
  seen: ReadonlySet<string>
  tuning: Pick<PerformTuning, 'accuracyWeight' | 'varietyWeight' | 'creditScale' | 'reputationScale'>
}): { credits: number; reputation: number; accuracy: number } {
  const error = Math.max(0, args.quantizedBeat - args.rawBeat)
  const accuracy = args.quantum > 0 ? Math.max(0, 1 - error / args.quantum) : 1
  const novel = args.seen.has(args.pattern) ? 0 : 1
  const points = accuracy * args.tuning.accuracyWeight + novel * args.tuning.varietyWeight
  return {
    accuracy,
    credits: Math.max(0, Math.floor(points * args.tuning.creditScale)),
    reputation: Math.max(0, Math.floor(points * args.tuning.reputationScale)),
  }
}
