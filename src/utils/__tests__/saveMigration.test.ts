import { beforeEach, describe, expect, it } from 'vitest'
import { clearSave, loadGameState, migrateV3, saveGameState } from '../storage_manager'
import type { GameState } from '../storage_manager'

const V4_KEY = 'harborglow-save-v4'
const V3_KEY = 'harborglow-save-v3'

/** Minimal localStorage stand-in — vitest runs in the node environment. */
function installLocalStorage() {
  const store = new Map<string, string>()
  const mock = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size
    },
  }
  ;(globalThis as { localStorage?: unknown }).localStorage = mock
  return store
}

function writeV3(payload: Partial<GameState> & { economyData?: string }) {
  localStorage.setItem(
    V3_KEY,
    JSON.stringify({ ...payload, _meta: { version: '3.0', savedAt: '2026-01-01', type: 'game' } }),
  )
}

describe('save v3 → v4 migration', () => {
  beforeEach(() => {
    installLocalStorage()
  })

  it('writes new saves under the v4 key and version', () => {
    saveGameState({ harborCredits: 10 } as GameState)

    const raw = localStorage.getItem(V4_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)._meta.version).toBe('4.0')
  })

  it('sums the two old ledgers into one wallet', () => {
    const migrated = migrateV3({
      money: 300,
      economyData: JSON.stringify({ state: { harborCredits: 450 }, upgradeLevels: [] }),
    } as GameState)

    expect(migrated.harborCredits).toBe(750)
    expect(migrated.money).toBeUndefined()
  })

  it('handles a v3 save with only the money ledger', () => {
    expect(migrateV3({ money: 120 } as GameState).harborCredits).toBe(120)
  })

  it('handles a v3 save with neither ledger', () => {
    expect(migrateV3({} as GameState).harborCredits).toBe(0)
  })

  it('survives an unreadable economy blob', () => {
    const migrated = migrateV3({ money: 90, economyData: 'not json' } as GameState)
    expect(migrated.harborCredits).toBe(90)
  })

  it('loads and migrates a v3 save when no v4 save exists', () => {
    writeV3({
      money: 200,
      economyData: JSON.stringify({ state: { harborCredits: 50 }, upgradeLevels: [] }),
    })

    const loaded = loadGameState()
    expect(loaded?.harborCredits).toBe(250)
  })

  it('prefers an existing v4 save over the legacy one', () => {
    writeV3({ money: 9999 })
    saveGameState({ harborCredits: 7 } as GameState)

    expect(loadGameState()?.harborCredits).toBe(7)
  })

  it('returns null when nothing is stored', () => {
    expect(loadGameState()).toBeNull()
  })

  it('clears both the v4 and legacy v3 keys', () => {
    writeV3({ money: 1 })
    saveGameState({ harborCredits: 2 } as GameState)

    clearSave()

    expect(localStorage.getItem(V4_KEY)).toBeNull()
    expect(localStorage.getItem(V3_KEY)).toBeNull()
  })
})
