import { describe, expect, it } from 'vitest'
import type { LightCueV2 } from '../types'
import { TARGET_ROWS } from './editorModel'
import {
  barAtBeat, barLines, beatToX, createLayout, cueRect, hitTest, nearestRow, pxPerBeat, rowAtY, rowHeight, rowTop, xToBeat,
} from './timelineGeometry'

const L = createLayout(84 + 640, 22 + 8 * 30, 32) // 20 px/beat, 30 px rows
const cue = (id: string, beat: number, len: number, target: LightCueV2['target']): LightCueV2 => ({
  id, beat, lengthBeats: len, target, pattern: 'snap', color: '#ffffff', intensity: 1, easing: 'step',
})

describe('timelineGeometry', () => {
  it('maps beats <-> pixels and rows <-> y', () => {
    expect(pxPerBeat(L)).toBe(20)
    expect(rowHeight(L)).toBe(30)
    expect(beatToX(L, 4)).toBe(164)
    expect(xToBeat(L, 164)).toBe(4)
    expect(rowTop(L, 2)).toBe(82)
    expect(rowAtY(L, 10)).toBe(-1) // ruler
    expect(rowAtY(L, 22)).toBe(0)
    expect(rowAtY(L, 22 + 30 * 8 - 1)).toBe(7)
    expect(rowAtY(L, 22 + 30 * 8 + 5)).toBe(-1)
    expect(nearestRow(L, -50)).toBe(0)
    expect(nearestRow(L, 9999)).toBe(7)
    expect(TARGET_ROWS[7]).toBe('all')
  })

  it('places a cue rectangle on its row', () => {
    const r = cueRect(L, cue('a', 2, 3, 'bridge'))!
    expect(r).toEqual({ x: 124, y: 22 + 30 + 2, w: 60, h: 26 })
    expect(cueRect({ ...L, rows: ['funnel'] }, cue('a', 0, 1, 'mast'))).toBeNull()
  })

  it('hit-tests body and the two edges, topmost cue first', () => {
    const cues = [cue('under', 2, 6, 'funnel'), cue('over', 4, 2, 'funnel')]
    const y = 22 + 15
    expect(hitTest(L, cues, beatToX(L, 3), y)).toEqual({ cueId: 'under', zone: 'body' })
    expect(hitTest(L, cues, beatToX(L, 2) + 2, y)).toEqual({ cueId: 'under', zone: 'start' })
    expect(hitTest(L, cues, beatToX(L, 8) - 2, y)).toEqual({ cueId: 'under', zone: 'end' })
    expect(hitTest(L, cues, beatToX(L, 5), y)).toEqual({ cueId: 'over', zone: 'body' }) // overlap: later wins
    expect(hitTest(L, cues, beatToX(L, 12), y)).toBeNull()
    expect(hitTest(L, cues, beatToX(L, 3), 22 + 30 * 3 + 5)).toBeNull() // wrong row
  })

  it('splits a very narrow cue into thirds instead of an unreachable body', () => {
    const tiny = [cue('t', 10, 0.25, 'deck')] // 5 px wide
    const y = 22 + 30 * 5 + 15
    const x0 = beatToX(L, 10)
    expect(hitTest(L, tiny, x0 + 0.5, y)?.zone).toBe('start')
    expect(hitTest(L, tiny, x0 + 2.5, y)?.zone).toBe('body')
    expect(hitTest(L, tiny, x0 + 4.7, y)?.zone).toBe('end')
  })

  it('bar helpers', () => {
    expect(barLines(32)).toEqual([0, 4, 8, 12, 16, 20, 24, 28])
    expect(barAtBeat(13.9, 32)).toBe(3)
    expect(barAtBeat(99, 32)).toBe(7)
    expect(barAtBeat(-3, 32)).toBe(0)
  })
})
