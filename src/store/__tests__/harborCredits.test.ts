import { beforeEach, describe, expect, it, vi } from 'vitest'

const { saveGameState, loadGameState, clearSave } = vi.hoisted(() => ({
  saveGameState: vi.fn(),
  loadGameState: vi.fn(),
  clearSave: vi.fn(),
}))

vi.mock('../../utils/storage_manager', () => ({
  saveGameState,
  loadGameState,
  clearSave,
}))

// Purchases play SFX; Tone has no audio context under vitest's node env.
vi.mock('../../systems/soundEffects', () => ({
  playSound: vi.fn(),
  playInstallationCelebration: vi.fn(),
}))

vi.mock('../../systems/commsSystem', () => ({
  ACOUSTIC_NOTE_LAYOUT: [
    'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1',
    'G1', 'G#1', 'A1', 'A#1', 'B1', 'C2',
  ],
}))

import { useGameStore } from '../useGameStore'
import { SHOP_CATALOG, economySystem, getShopItem } from '../../systems/economySystem'

function setCredits(amount: number) {
  useGameStore.setState({ harborCredits: amount })
}

describe('harbor credits wallet', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
    setCredits(0)
    useGameStore.setState({ unlockedShopItems: [] })
  })

  it('credits the wallet and ignores non-positive amounts', () => {
    const { addHarborCredits } = useGameStore.getState()

    addHarborCredits(120, 'test')
    expect(useGameStore.getState().harborCredits).toBe(120)

    addHarborCredits(0, 'test')
    addHarborCredits(-50, 'test')
    addHarborCredits(Number.NaN, 'test')
    expect(useGameStore.getState().harborCredits).toBe(120)
  })

  it('spends when funded and refuses when short, without partial debits', () => {
    setCredits(100)
    const { spendHarborCredits } = useGameStore.getState()

    expect(spendHarborCredits(40, 'test')).toBe(true)
    expect(useGameStore.getState().harborCredits).toBe(60)

    expect(spendHarborCredits(61, 'test')).toBe(false)
    expect(useGameStore.getState().harborCredits).toBe(60)

    // Exact balance is affordable.
    expect(spendHarborCredits(60, 'test')).toBe(true)
    expect(useGameStore.getState().harborCredits).toBe(0)
  })

  it('routes economySystem earnings into the store wallet', () => {
    economySystem.recordInstallation({
      rigType: 'rgb_matrix',
      timeSeconds: 20,
      targetTimeSeconds: 30,
      swayPercent: 0.05,
      syncAccuracy: 0.8,
      weather: 'clear',
      isEventActive: false,
    })

    const credits = useGameStore.getState().harborCredits
    expect(credits).toBeGreaterThan(0)
    // The singleton reports the same number it just paid into the store.
    expect(economySystem.getCredits()).toBe(credits)
  })

  it('routes ship-completion bonuses into the same wallet', () => {
    economySystem.recordShipCompletion('cruise', 1)
    expect(useGameStore.getState().harborCredits).toBeGreaterThan(0)
  })

  it('shares one afford/spend path with tugboat upgrades', () => {
    setCredits(1000)
    useGameStore.setState({ reputation: 600 })

    expect(useGameStore.getState().purchaseTugboatUpgrade('searchlight_rig')).toBe(true)
    expect(useGameStore.getState().harborCredits).toBe(400)
    expect(useGameStore.getState().tugboatUpgrades.searchlight_rig).toBe(true)

    // Second, unaffordable purchase leaves both wallet and flags untouched.
    setCredits(100)
    useGameStore.setState({ reputation: 1200, boothTier: 2 })
    expect(useGameStore.getState().purchaseTugboatUpgrade('dynamic_positioning_assist')).toBe(false)
    expect(useGameStore.getState().harborCredits).toBe(100)
    expect(useGameStore.getState().tugboatUpgrades.dynamic_positioning_assist).toBe(false)
  })
})

describe('shop catalog', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
    setCredits(0)
    useGameStore.setState({ unlockedShopItems: [], reputation: 0 })
    economySystem.reset()
  })

  it('exposes dock upgrades and specialists through one typed surface', () => {
    expect(SHOP_CATALOG.length).toBeGreaterThan(0)
    expect(SHOP_CATALOG.some((i) => i.category === 'dock_upgrade')).toBe(true)
    expect(SHOP_CATALOG.some((i) => i.category === 'specialist')).toBe(true)
    expect(SHOP_CATALOG.every((i) => i.cost > 0 && i.id && i.name)).toBe(true)
  })

  it('purchases an item, debits the wallet and records the unlock', () => {
    const item = SHOP_CATALOG.find((i) => i.category === 'dock_upgrade')!
    setCredits(item.cost + 10)

    expect(useGameStore.getState().purchaseShopItem(item.id)).toBe(true)
    expect(useGameStore.getState().harborCredits).toBe(10)
    expect(useGameStore.getState().unlockedShopItems).toContain(item.id)
    expect(economySystem.getUpgradeLevel(item.id)).toBe(1)
  })

  it('refuses an unaffordable purchase without side effects', () => {
    const item = SHOP_CATALOG.find((i) => i.category === 'dock_upgrade')!
    setCredits(item.cost - 1)

    expect(useGameStore.getState().purchaseShopItem(item.id)).toBe(false)
    expect(useGameStore.getState().harborCredits).toBe(item.cost - 1)
    expect(useGameStore.getState().unlockedShopItems).not.toContain(item.id)
    expect(economySystem.getUpgradeLevel(item.id)).toBe(0)
  })

  it('refuses unknown items', () => {
    setCredits(99999)
    expect(useGameStore.getState().purchaseShopItem('not-a-real-item')).toBe(false)
    expect(useGameStore.getState().harborCredits).toBe(99999)
  })

  it('looks items up by id', () => {
    expect(getShopItem(SHOP_CATALOG[0].id)?.id).toBe(SHOP_CATALOG[0].id)
    expect(getShopItem('nope')).toBeUndefined()
  })
})
