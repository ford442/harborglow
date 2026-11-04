// =============================================================================
// PERFORM LOG — cue triggers applied from the sim input log.
// Beat and score come from sim time plus the recorded payload, never from
// the audio clock or the wall clock.
// =============================================================================

import { getSim } from '../sim/SimContext'
import { economySystem } from '../economySystem'
import type { LightCuePattern, LightCueV2, RigGroupId } from './types'
import {
  PERFORM_QUANTUM,
  nextQuantizedBeat,
  scoreHit,
  type PerformQuantize,
  type PerformSource,
} from './perform'

const PATTERNS: readonly LightCuePattern[] = ['breathe', 'sweep', 'strobe', 'snap', 'blackout']
const TARGETS: readonly (RigGroupId | 'all')[] = ['all', 'funnel', 'bridge', 'hullStrip', 'gantry', 'mast', 'deck', 'accent']

const PATTERN_COLOR: Record<LightCuePattern, string> = {
  breathe: '#7af0ff',
  sweep: '#ffd27a',
  strobe: '#ffffff',
  snap: '#ff6b9d',
  blackout: '#1a2030',
}

export interface ShowCuePayload {
  pattern: LightCuePattern
  target: RigGroupId | 'all'
  quantize: PerformQuantize
  source: PerformSource
  bpm: number
  accuracyWeight: number
  varietyWeight: number
  creditScale: number
  reputationScale: number
}

interface FiredCue {
  id: string
  beat: number
  startSim: number
  lengthBeats: number
  bpm: number
  pattern: LightCuePattern
  target: RigGroupId | 'all'
  source: PerformSource
  color: string
  intensity: number
}

let fired: FiredCue[] = []
let seen = new Set<string>()
let awardedCredits = 0
let awardedReputation = 0

export function resetPerformance(): void {
  fired = []
  seen = new Set()
  awardedCredits = 0
  awardedReputation = 0
}

export function performanceSnapshot(): { cues: string[]; credits: number; reputation: number } {
  return {
    cues: fired.map((cue) => `${cue.beat}:${cue.pattern}:${cue.target}:${cue.source}`),
    credits: awardedCredits,
    reputation: awardedReputation,
  }
}

export function activeFiredCue(simTime: number): LightCueV2 | null {
  let active: FiredCue | null = null
  for (const cue of fired) {
    const seconds = cue.lengthBeats * (60 / cue.bpm)
    if (simTime >= cue.startSim && simTime < cue.startSim + seconds) active = cue
  }
  if (!active) return null
  return {
    id: active.id,
    beat: active.beat,
    lengthBeats: active.lengthBeats,
    target: active.target,
    pattern: active.pattern,
    color: active.color,
    intensity: active.intensity,
    easing: 'step',
  }
}

export function applyShowCue(payload: unknown, tick: number): void {
  const cue = parsePayload(payload)
  if (!cue) return
  const quantum = PERFORM_QUANTUM[cue.quantize]
  const rawBeat = getSim().simTime * (cue.bpm / 60)
  const beat = nextQuantizedBeat(rawBeat, quantum)
  const award = scoreHit({
    rawBeat,
    quantizedBeat: beat,
    quantum,
    pattern: cue.pattern,
    seen,
    tuning: cue,
  })
  seen.add(cue.pattern)
  awardedCredits += award.credits
  awardedReputation += award.reputation
  fired.push({
    id: `perform:${tick}:${cue.pattern}:${cue.target}`,
    beat,
    startSim: beat * (60 / cue.bpm),
    lengthBeats: quantum,
    bpm: cue.bpm,
    pattern: cue.pattern,
    target: cue.target,
    source: cue.source,
    color: PATTERN_COLOR[cue.pattern],
    intensity: cue.pattern === 'blackout' ? 0.05 : 0.85,
  })
  economySystem.grantPerformanceBonus(award.credits, award.reputation)
}

function parsePayload(payload: unknown): ShowCuePayload | null {
  if (!payload || typeof payload !== 'object') return null
  const raw = payload as Partial<ShowCuePayload>
  if (!raw.pattern || !PATTERNS.includes(raw.pattern)) return null
  if (!raw.target || !TARGETS.includes(raw.target)) return null
  if (raw.quantize !== '1/8' && raw.quantize !== '1/16') return null
  if (raw.source !== 'pad' && raw.source !== 'joystick' && raw.source !== 'throttle') return null
  const bpm = typeof raw.bpm === 'number' && raw.bpm > 0 ? raw.bpm : 120
  return {
    pattern: raw.pattern,
    target: raw.target,
    quantize: raw.quantize,
    source: raw.source,
    bpm,
    accuracyWeight: finiteOr(raw.accuracyWeight, 1),
    varietyWeight: finiteOr(raw.varietyWeight, 1),
    creditScale: finiteOr(raw.creditScale, 40),
    reputationScale: finiteOr(raw.reputationScale, 8),
  }
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
