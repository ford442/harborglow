import { describe, expect, it } from 'vitest'
import { parseLightShow } from '../../schemas/lightShow'
import { getLightShowV2 } from './index'
import {
  BAR_BEATS,
  QUANTIZE_BEATS,
  copyCueByBar,
  easedIntensity,
  forkFactoryShow,
  placeCue,
  quantizeBeat,
  quantizeCue,
  resolveActiveCue,
  rowsForShip,
  stretchCue,
} from './cueEdit'
import { hitCue, xToBeat, yToRow, type RollMetrics } from './cueRoll'
import { acceptAuthoredShows } from './authoredShows'

describe('cue editor', () => {
  it('forks a factory show with stable ids and the same schedule', () => {
    const preset = getLightShowV2('cruise')!
    const fork = forkFactoryShow('cruise')!
    expect(fork.id).toBe('cruise')
    expect(fork.cues.map((cue) => cue.beat)).toEqual(preset.cues.map((cue) => cue.beat))
    expect(fork.cues.map((cue) => cue.id)).toEqual(preset.cues.map((_, i) => `cruise:fork:${i}`))
    expect(parseLightShow(fork).ok).toBe(true)
  })

  it('places, stretches, copies by a bar, and quantizes on the grid', () => {
    const fork = forkFactoryShow('cruise')!
    const placed = placeCue(fork, {
      target: 'funnel',
      beat: 1.2,
      quantum: QUANTIZE_BEATS['1/4'],
      pattern: 'snap',
      color: '#ff6b9d',
      intensity: 0.5,
      easing: 'linear',
    })
    const added = placed.cues.find((cue) => cue.target === 'funnel')!
    expect(added.beat).toBe(1)
    expect(added.lengthBeats).toBe(1)
    const stretched = stretchCue(placed, added.id, 3.2)
    expect(stretched.cues.find((cue) => cue.id === added.id)?.lengthBeats).toBe(3.2)
    const copied = copyCueByBar(stretched, added.id)
    const copy = copied.cues.find((cue) => cue.id !== added.id && cue.target === 'funnel')!
    expect(copy.beat).toBe(added.beat + BAR_BEATS)
    const snapped = quantizeCue(copied, added.id, QUANTIZE_BEATS['1/16'])
    expect(snapped.cues.find((cue) => cue.id === added.id)?.beat).toBe(1)
    expect(parseLightShow(snapped).ok).toBe(true)
    expect(quantizeBeat(1.2, 0.25)).toBe(1.25)
  })

  it('resolves factory cues by their length window', () => {
    const lng = getLightShowV2('lng')!
    expect(resolveActiveCue(lng, 0)?.pattern).toBe('breathe')
    expect(resolveActiveCue(lng, 24)?.pattern).toBe('strobe')
    expect(resolveActiveCue(lng, 24)?.color).toBe('#eafcff')
    const step = lng.cues[0]
    expect(easedIntensity(step, 0, lng.loopBeats)).toBe(step.intensity)
    const linear = { ...step, easing: 'linear' as const, lengthBeats: 8 }
    expect(easedIntensity(linear, 0, lng.loopBeats)).toBe(0)
    expect(easedIntensity(linear, 8, lng.loopBeats)).toBeCloseTo(linear.intensity)
  })

  it('rows follow the hull, and the roll hits the cue under the pointer', () => {
    expect(rowsForShip('cruise')).toContain('funnel')
    expect(rowsForShip('cruise')[0]).toBe('all')
    const show = forkFactoryShow('cruise')!
    const metrics: RollMetrics = {
      width: 400,
      height: 120,
      labelWidth: 40,
      rulerHeight: 20,
      rows: ['all', 'funnel'],
      loopBeats: show.loopBeats,
    }
    const cue = show.cues[0]
    const x = 40 + ((cue.beat + 0.1) / show.loopBeats) * 360
    expect(yToRow(metrics, 10)).toBeNull()
    expect(hitCue(show, metrics, x, 30)?.cue.id).toBe(cue.id)
    expect(xToBeat(metrics, x)).toBeGreaterThan(cue.beat)
  })

  it('drops authored saves that fail the schema or name the wrong ship', () => {
    const fork = forkFactoryShow('tanker')!
    const accepted = acceptAuthoredShows(
      { tanker: fork, cruise: { ...fork, id: 'tanker' }, nope: fork },
      parseLightShow,
    )
    expect(accepted.tanker?.id).toBe('tanker')
    expect(accepted.cruise).toBeUndefined()
    expect(Object.keys(accepted)).toEqual(['tanker'])
  })
})
