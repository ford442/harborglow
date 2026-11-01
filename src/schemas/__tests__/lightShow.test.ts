import { describe, it, expect } from 'vitest'
import { parseLightShow } from '../lightShow'
import { lightShowRegistryV2 } from '../../systems/lightShows'
import type { LightShowV2 } from '../../systems/lightShows'

function base(): LightShowV2 {
  return structuredClone(lightShowRegistryV2.cruise)
}

describe('parseLightShow', () => {
  it.each(Object.entries(lightShowRegistryV2))('accepts migrated preset %s', (_id, show) => {
    const result = parseLightShow(show)
    expect(result.ok).toBe(true)
  })

  it('accepts a target group the hull may not have', () => {
    const show = base()
    show.cues[0].target = 'gantry'
    expect(parseLightShow(show).ok).toBe(true)
  })

  it('never throws on garbage', () => {
    for (const input of [null, undefined, 42, 'x', [], {}]) {
      expect(parseLightShow(input).ok).toBe(false)
    }
  })

  const cases: Array<[string, (s: any) => void, Array<string | number>]> = [
    ['unknown v', (s) => (s.v = 3), ['v']],
    ['bad pattern', (s) => (s.cues[1].pattern = 'disco'), ['cues', 1, 'pattern']],
    ['bad target', (s) => (s.cues[1].target = 'keel'), ['cues', 1, 'target']],
    ['bad color', (s) => (s.cues[1].color = 'red'), ['cues', 1, 'color']],
    ['intensity > 1', (s) => (s.cues[1].intensity = 1.5), ['cues', 1, 'intensity']],
    ['intensity < 0', (s) => (s.cues[1].intensity = -0.1), ['cues', 1, 'intensity']],
    ['lengthBeats <= 0', (s) => (s.cues[1].lengthBeats = 0), ['cues', 1, 'lengthBeats']],
    ['beat < 0', (s) => (s.cues[0].beat = -1), ['cues', 0, 'beat']],
    ['beat >= loopBeats', (s) => (s.cues[s.cues.length - 1].beat = s.loopBeats), ['cues', -1, 'beat']],
    ['unsorted cues', (s) => (s.cues[1].beat = 0.5, s.cues[0].beat = 1), ['cues', 1, 'beat']],
    ['duplicate ids', (s) => (s.cues[1].id = s.cues[0].id), ['cues', 1, 'id']],
  ]

  it.each(cases)('rejects %s with a typed path', (_name, mutate, expected) => {
    const show = base()
    mutate(show)
    const path = expected.map((p) => (p === -1 ? show.cues.length - 1 : p))
    const result = parseLightShow(show)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.path).toEqual(path)
      expect(typeof result.error.message).toBe('string')
    }
  })

  it('formats cue errors for display', () => {
    const show = base()
    show.cues[1].color = 'red'
    const result = parseLightShow(show)
    expect(!result.ok && result.error.message).toBe('cue 1: color must be #rrggbb')
  })
})
