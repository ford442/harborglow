import { describe, it, expect } from 'vitest'
import { lightShowRegistry, lightShowRegistryV2, getLightShowV2, SHIP_BPM, PRESET_LOOP_BEATS } from './index'
import { migrateShowV1toV2 } from './migrate'
import type { LightCue, LightShowV2 } from './types'
import type { ShipType } from '../../store/gameStoreTypes'

const shipTypes = Object.keys(SHIP_BPM) as ShipType[]

/** Verbatim copy of the pre-V2 `resolveCue` in lightingSystem.ts. */
function resolveCueV1(schedule: LightCue[], elapsedBeats: number): LightCue {
  const beatInLoop = elapsedBeats % 32
  let active = schedule[0]
  for (const cue of schedule) {
    if (cue.beat <= beatInLoop) active = cue
    else break
  }
  return active
}

/** The V2 step resolver as lightingSystem.ts now runs it. */
function resolveCueV2(show: LightShowV2, elapsedBeats: number) {
  const beatInLoop = elapsedBeats % show.loopBeats
  let active = show.cues[0]
  for (const cue of show.cues) {
    if (cue.beat <= beatInLoop) active = cue
    else break
  }
  return active
}

describe('V1 → V2 playback equivalence', () => {
  it.each(shipTypes)('%s resolves identically at every 1/16 beat and cue boundary', (shipType) => {
    const v1 = lightShowRegistry[shipType]
    const v2 = getLightShowV2(shipType)!
    const samples = new Set<number>()
    for (let i = 0; i <= v2.loopBeats * 16; i++) samples.add(i / 16)
    for (const cue of v1) {
      samples.add(cue.beat)
      samples.add(cue.beat + v2.loopBeats)
    }
    for (const t of samples) {
      const a = resolveCueV1(v1, t)
      const b = resolveCueV2(v2, t)
      expect({ t, pattern: b.pattern, color: b.color, intensity: b.intensity }).toEqual({
        t,
        pattern: a.pattern,
        color: a.color,
        intensity: a.intensity,
      })
    }
  })
})

describe('migrateShowV1toV2', () => {
  it('fills lengths to the next cue and the last to the loop end', () => {
    const show = migrateShowV1toV2('x', [
      { beat: 0, pattern: 'breathe', color: '#112233', intensity: 0.5 },
      { beat: 8, pattern: 'strobe', color: '#445566', intensity: 1 },
    ])
    expect(show.cues.map((c) => [c.id, c.lengthBeats, c.target, c.easing])).toEqual([
      ['x:0', 8, 'all', 'step'],
      ['x:1', 24, 'all', 'step'],
    ])
    expect(show.seed).toBeUndefined()
  })

  it('is deterministic', () => {
    const cues = lightShowRegistry.cruise
    expect(migrateShowV1toV2('cruise', cues)).toEqual(migrateShowV1toV2('cruise', cues))
  })

  it('every preset loops on PRESET_LOOP_BEATS with positive lengths', () => {
    for (const shipType of shipTypes) {
      const show = lightShowRegistryV2[shipType]
      expect(show.loopBeats).toBe(PRESET_LOOP_BEATS)
      for (const cue of show.cues) expect(cue.lengthBeats).toBeGreaterThan(0)
    }
  })

  it('matches the snapshot of all migrated presets', () => {
    expect(lightShowRegistryV2).toMatchSnapshot()
  })
})
