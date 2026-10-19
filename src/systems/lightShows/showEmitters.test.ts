import { describe, expect, it } from 'vitest'
import type { ShipType } from '../../store/gameStoreTypes'
import {
  collectActiveShowEmitters,
  FACTORY_SHOW_EMITTERS,
  getActiveShowEmitters,
  type ShowEmitterBinding,
} from './showEmitters'

describe('collectActiveShowEmitters', () => {
  const ships = [...Object.keys(FACTORY_SHOW_EMITTERS), 'tanker'] as ShipType[]

  it('agrees with getActiveShowEmitters for every ship at every quarter beat of the loop', () => {
    const a: ShowEmitterBinding[] = []
    const b: ShowEmitterBinding[] = []
    for (const ship of ships) {
      for (let beat = 0; beat < 32; beat += 0.25) {
        expect(collectActiveShowEmitters(ship, beat, a), `${ship} @ ${beat}`).toEqual(getActiveShowEmitters(ship, beat, b))
      }
    }
  })

  it('returns the array it was given, trimmed to the live bindings', () => {
    const out: ShowEmitterBinding[] = []
    expect(collectActiveShowEmitters('cruise', 28, out)).toBe(out)
    expect(out).toHaveLength(4)
    collectActiveShowEmitters('cruise', 3, out)
    expect(out).toEqual([])
    collectActiveShowEmitters('tanker', 28, out)
    expect(out).toEqual([])
  })
})
