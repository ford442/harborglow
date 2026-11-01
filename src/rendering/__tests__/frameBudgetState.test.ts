import { describe, it, expect, beforeEach } from 'vitest'
import { createHeapChurnTracker, getCommitCounts, recordCommit, resetCommitCounts } from '../frameBudgetState'

describe('createHeapChurnTracker', () => {
  it('counts growth as allocation and large drops as GC', () => {
    const t = createHeapChurnTracker(1000)
    t.sample(10_000)
    t.sample(12_500) // +2500
    t.sample(13_000) // +500
    t.sample(9_000) // -4000 -> gc
    t.sample(9_100) // +100
    expect(t.drain()).toEqual({ allocatedBytes: 3100, gcEvents: 1 })
    expect(t.drain()).toEqual({ allocatedBytes: 0, gcEvents: 0 })
  })

  it('ignores small drops and missing samples', () => {
    const t = createHeapChurnTracker(1000)
    t.sample(undefined)
    t.sample(5000)
    t.sample(4900)
    expect(t.drain()).toEqual({ allocatedBytes: 0, gcEvents: 0 })
  })
})

describe('commit counter', () => {
  beforeEach(resetCommitCounts)
  it('accumulates per id', () => {
    recordCommit('HUD'); recordCommit('HUD'); recordCommit('ASM')
    expect(getCommitCounts().get('HUD')).toBe(2)
    expect(getCommitCounts().get('ASM')).toBe(1)
  })
})
