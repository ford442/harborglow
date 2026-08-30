import { describe, expect, it, beforeEach } from 'vitest'
import { ShipSpawner } from '../shipSpawner'
import { useGameStore } from '../../store/useGameStore'
import { setSim, createSimContext } from '../sim/SimContext'

/**
 * ShipSpawner ids and spawn positions are drawn from the seeded sim RNG/clock
 * (see docs/systems/DETERMINISM.md) because spawned ships are added to the
 * core `ships` array — simulation state that must replay identically for the
 * same seed and input log (e.g. HarborEventSystem's fireboat response, which
 * runs inside the fixed-tick harbor-events group).
 */
function resetForRun(seed: number): void {
  setSim(createSimContext(seed))
  useGameStore.setState({ ships: [], currentShipId: null })
  ShipSpawner.resetCounters()
}

describe('ShipSpawner determinism', () => {
  beforeEach(() => {
    resetForRun(1)
  })

  it('same seed produces identical ship id and position', () => {
    resetForRun(42)
    const a = ShipSpawner.spawnShip('cruise')

    resetForRun(42)
    const b = ShipSpawner.spawnShip('cruise')

    expect(b.id).toBe(a.id)
    expect(b.position).toEqual(a.position)
  })

  it('different seeds diverge', () => {
    resetForRun(1)
    const a = ShipSpawner.spawnShip('cruise')

    resetForRun(2)
    const b = ShipSpawner.spawnShip('cruise')

    expect(b.id).not.toBe(a.id)
  })

  it('same seed produces identical output across multiple spawns in sequence', () => {
    resetForRun(7)
    const runOne = [
      ShipSpawner.spawnShip('cruise'),
      ShipSpawner.spawnShip('container'),
      ShipSpawner.spawnShip('tanker'),
    ]

    resetForRun(7)
    const runTwo = [
      ShipSpawner.spawnShip('cruise'),
      ShipSpawner.spawnShip('container'),
      ShipSpawner.spawnShip('tanker'),
    ]

    expect(runTwo.map((s) => s.id)).toEqual(runOne.map((s) => s.id))
    expect(runTwo.map((s) => s.position)).toEqual(runOne.map((s) => s.position))
  })
})
