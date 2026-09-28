import { beforeEach, describe, expect, it } from 'vitest'
import { loadGameState } from '../storage_manager'

// Regression guard: loadGameState() returns null on any version mismatch, so
// bumping the save VERSION would silently wipe every player's save. A v4 save
// written today must keep loading.
const FIXTURE = {
  harborCredits: 1234,
  unlockedShopItems: ['neonPack'],
  _meta: { version: '4.0', savedAt: '2026-09-27T00:00:00.000Z', type: 'game' },
}

describe('harborglow-save-v4 fixture', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    ;(globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, val: string) => void store.set(k, val),
      removeItem: (k: string) => void store.delete(k),
    }
  })

  it('still loads through loadGameState()', () => {
    localStorage.setItem('harborglow-save-v4', JSON.stringify(FIXTURE))
    const state = loadGameState()
    expect(state).not.toBeNull()
    expect(state?.harborCredits).toBe(1234)
  })
})
