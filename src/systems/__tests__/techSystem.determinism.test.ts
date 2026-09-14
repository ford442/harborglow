import { describe, expect, it, afterEach } from 'vitest'
import { experimentalTechSystem } from '../techSystem'
import { setSim, createSimContext } from '../sim/SimContext'

/**
 * activateTech()'s id is drawn from simNowMs() because it is only ever called
 * from checkAutoActivation(), invoked by update(dt), which is registered in
 * the fixed-tick systemRegistry ('experimental-tech', harbor-events group —
 * see src/systems/bootstrap/mainSceneSystems.ts). The id keys `activeTech`,
 * live simulation state that must replay identically for the same seed.
 */
describe('ExperimentalTechSystem determinism', () => {
  afterEach(() => {
    for (const tech of experimentalTechSystem.getActiveTech()) {
      experimentalTechSystem.deactivateTech(tech.id)
    }
  })

  it('same sim time produces an identical activated-tech id', () => {
    setSim(createSimContext(42))
    const a = experimentalTechSystem.activateTech('ai_smart_cranes')
    expect(a).not.toBeNull()
    experimentalTechSystem.deactivateTech(a!.id)

    setSim(createSimContext(42))
    const b = experimentalTechSystem.activateTech('ai_smart_cranes')
    expect(b).not.toBeNull()

    expect(b!.id).toBe(a!.id)
  })

  it('a different sim time diverges', () => {
    setSim(createSimContext(0))
    const a = experimentalTechSystem.activateTech('ai_smart_cranes')
    expect(a).not.toBeNull()
    experimentalTechSystem.deactivateTech(a!.id)

    const later = createSimContext(0)
    later.simTime = 5
    setSim(later)
    const b = experimentalTechSystem.activateTech('ai_smart_cranes')
    expect(b).not.toBeNull()

    expect(b!.id).not.toBe(a!.id)
  })
})
